/**
 * Automated Database Migration Runner
 *
 * Features:
 * - Discovers all .sql files in migrations/
 * - Checks schema_migrations table for applied migrations
 * - Runs only pending migrations in order
 * - Records each successful migration with checksum
 * - Atomic transactions (rollback on failure)
 * - Checksum validation to detect modified migrations
 *
 * Usage:
 *   npm run migrate              # Run all pending migrations
 *   npm run migrate:status       # Show migration status
 *   npm run migrate:validate     # Validate migration integrity
 *
 * Based on: docs/database/DB-MIGRATION-MANAGEMENT.MD
 */

import { sql } from '@vercel/postgres';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Calculate MD5 checksum for SQL content
 */
function calculateChecksum(sqlContent) {
  return crypto.createHash('md5').update(sqlContent).digest('hex');
}

/**
 * Parse migration filename to extract version and name
 * Format: {version}-{description}.sql
 * Example: "001-create-users-table.sql" → { version: "001-create-users-table", name: "Create users table" }
 */
function parseMigrationFilename(filename) {
  const match = filename.match(/^(\d{3})-(.+)\.sql$/);
  if (!match) {
    throw new Error(`Invalid migration filename: ${filename}. Expected format: NNN-description.sql`);
  }

  const [, versionNum, description] = match;
  const version = `${versionNum}-${description}`;
  const name = description
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return { version, name, versionNum };
}

/**
 * Get all migration files from the migrations directory
 */
async function getMigrationFiles() {
  try {
    const files = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    const migrations = await Promise.all(
      sqlFiles.map(async (filename) => {
        const { version, name, versionNum } = parseMigrationFilename(filename);
        const filepath = path.join(MIGRATIONS_DIR, filename);
        const sqlContent = await fs.readFile(filepath, 'utf8');
        const checksum = calculateChecksum(sqlContent);

        return {
          version,
          versionNum,
          name,
          filename,
          filepath,
          sql: sqlContent,
          checksum
        };
      })
    );

    return migrations;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`❌ Migrations directory not found: ${MIGRATIONS_DIR}`);
      return [];
    }
    throw error;
  }
}

/**
 * Ensure schema_migrations table exists
 */
async function ensureMigrationTableExists() {
  // Read and execute the migration table creation SQL
  const migrationTableFile = path.join(MIGRATIONS_DIR, '000-create-migration-table.sql');

  try {
    const migrationTableSQL = await fs.readFile(migrationTableFile, 'utf8');
    await sql.query(migrationTableSQL);
  } catch (error) {
    // If file doesn't exist, create table inline
    if (error.code === 'ENOENT') {
      await sql`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP DEFAULT NOW(),
          execution_time_ms INTEGER,
          checksum VARCHAR(64)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version)`;
    } else {
      throw error;
    }
  }
}

/**
 * Get list of applied migrations from database
 */
async function getAppliedMigrations() {
  try {
    const result = await sql`
      SELECT version, name, applied_at, execution_time_ms, checksum
      FROM schema_migrations
      ORDER BY version
    `;
    return result.rows;
  } catch (error) {
    // Table might not exist yet
    if (error.code === '42P01') { // undefined_table
      return [];
    }
    throw error;
  }
}

/**
 * Run a single migration in a transaction
 */
async function runMigrationInTransaction(migration) {
  const client = await sql.connect();

  try {
    await client.query('BEGIN');

    const startTime = Date.now();

    // Execute migration SQL
    await client.query(migration.sql);

    const executionTime = Date.now() - startTime;

    // Record in schema_migrations
    await client.query(
      `INSERT INTO schema_migrations (version, name, execution_time_ms, checksum)
       VALUES ($1, $2, $3, $4)`,
      [migration.version, migration.name, executionTime, migration.checksum]
    );

    await client.query('COMMIT');

    console.log(`✅ Applied: ${migration.version} - ${migration.name} (${executionTime}ms)`);

    return { success: true, executionTime };

  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`Migration ${migration.version} failed: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Validate that applied migrations haven't been modified
 */
async function validateMigrationIntegrity() {
  const allMigrations = await getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();

  const errors = [];

  for (const applied of appliedMigrations) {
    const current = allMigrations.find(m => m.version === applied.version);

    if (!current) {
      errors.push(`❌ Applied migration ${applied.version} no longer exists in filesystem`);
      continue;
    }

    if (current.checksum !== applied.checksum) {
      errors.push(
        `❌ Migration ${applied.version} has been modified after being applied!\n` +
        `   Applied checksum: ${applied.checksum}\n` +
        `   Current checksum: ${current.checksum}\n` +
        `   This is dangerous and could cause inconsistencies.`
      );
    }
  }

  return errors;
}

/**
 * Show migration status
 */
async function showStatus() {
  await ensureMigrationTableExists();

  const allMigrations = await getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();
  const appliedVersions = new Set(appliedMigrations.map(m => m.version));

  const pending = allMigrations.filter(m => !appliedVersions.has(m.version));

  console.log('\n📊 Migration Status\n');

  // Database info
  const dbResult = await sql`SELECT current_database() as db`;
  const database = dbResult.rows[0]?.db || 'unknown';
  console.log(`Database: ${database}`);
  console.log(`Environment: ${process.env.VERCEL_ENV || process.env.NODE_ENV || 'local'}\n`);

  // Applied migrations
  if (appliedMigrations.length > 0) {
    console.log(`Applied Migrations (${appliedMigrations.length}):`);
    appliedMigrations.forEach(m => {
      const date = new Date(m.applied_at).toLocaleString();
      console.log(`✅ ${m.version.padEnd(35)} (${date}) - ${m.execution_time_ms}ms`);
    });
    console.log('');
  } else {
    console.log('Applied Migrations: None\n');
  }

  // Pending migrations
  if (pending.length > 0) {
    console.log(`Pending Migrations (${pending.length}):`);
    pending.forEach(m => {
      console.log(`⏳ ${m.version} - ${m.name}`);
    });
    console.log('');
  } else {
    console.log('Pending Migrations: None\n');
  }

  // Validation
  const errors = await validateMigrationIntegrity();
  if (errors.length > 0) {
    console.log('⚠️  Validation Errors:');
    errors.forEach(err => console.log(err));
    console.log('');
  }
}

/**
 * Run all pending migrations
 */
async function migrate() {
  console.log('🔄 Starting database migration...\n');

  // 1. Ensure migration table exists
  await ensureMigrationTableExists();

  // 2. Get all migrations
  const allMigrations = await getMigrationFiles();

  if (allMigrations.length === 0) {
    console.log('⚠️  No migration files found in', MIGRATIONS_DIR);
    return;
  }

  // 3. Get applied migrations
  const appliedMigrations = await getAppliedMigrations();
  const appliedVersions = new Set(appliedMigrations.map(m => m.version));

  // 4. Validate existing migrations
  const validationErrors = await validateMigrationIntegrity();
  if (validationErrors.length > 0) {
    console.error('\n❌ Migration validation failed:');
    validationErrors.forEach(err => console.error(err));
    process.exit(1);
  }

  // 5. Determine pending migrations
  const pending = allMigrations.filter(m => !appliedVersions.has(m.version));

  if (pending.length === 0) {
    console.log('✅ No pending migrations. Database is up to date.\n');
    return;
  }

  console.log(`Found ${pending.length} pending migration(s):\n`);
  pending.forEach(m => console.log(`  ⏳ ${m.version} - ${m.name}`));
  console.log('');

  // 6. Run each pending migration
  let successCount = 0;
  let totalTime = 0;

  for (const migration of pending) {
    try {
      const { executionTime } = await runMigrationInTransaction(migration);
      successCount++;
      totalTime += executionTime;
    } catch (error) {
      console.error(`\n❌ Migration failed: ${error.message}\n`);
      console.error('Stopping migration process. Fix the error and try again.');
      process.exit(1);
    }
  }

  console.log(`\n✅ Successfully applied ${successCount} migration(s) in ${totalTime}ms\n`);
}

/**
 * Main entry point
 */
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'status':
        await showStatus();
        break;

      case 'validate':
        console.log('🔍 Validating migration integrity...\n');
        await ensureMigrationTableExists();
        const errors = await validateMigrationIntegrity();
        if (errors.length === 0) {
          console.log('✅ All migrations validated successfully\n');
        } else {
          console.error('❌ Validation errors found:');
          errors.forEach(err => console.error(err));
          process.exit(1);
        }
        break;

      default:
        await migrate();
        break;
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  migrate,
  showStatus,
  validateMigrationIntegrity,
  getMigrationFiles,
  getAppliedMigrations
};
