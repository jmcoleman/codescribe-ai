/**
 * Test Database Setup Helpers
 *
 * Utilities for setting up and tearing down test databases
 * Used by integration tests that require a real PostgreSQL connection
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { Pool } = require('pg');

const execAsync = promisify(exec);

// Create PostgreSQL pool for test database
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Helper to query the database
async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// SQL template literal helper that mimics @vercel/postgres sql`` syntax
// This allows us to use template literals in tests while using pg under the hood
function sql(strings, ...values) {
  // Convert template literal to parameterized query
  let text = '';
  const params = [];

  strings.forEach((string, i) => {
    text += string;
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  });

  // Return a promise that resolves to { rows, rowCount } like @vercel/postgres
  return query(text, params);
}

// Wait for database to be ready
async function waitForPostgres(maxAttempts = 30, intervalMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await query('SELECT 1');
      console.log('✅ PostgreSQL is ready');
      return true;
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw new Error(`PostgreSQL not ready after ${maxAttempts} attempts`);
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
}

/**
 * Start test database container
 */
async function startTestDatabase() {
  console.log('🐳 Starting PostgreSQL test container...');

  try {
    // Check if container is already running
    const { stdout: psOutput } = await execAsync(
      'docker ps --filter name=codescribe-test-db --format "{{.Names}}"'
    );

    if (psOutput.trim() === 'codescribe-test-db') {
      console.log('ℹ️  Test database container already running');
      await waitForPostgres();
      return;
    }

    // Start container
    await execAsync('docker-compose -f docker-compose.test.yml up -d');
    console.log('⏳ Waiting for PostgreSQL to be ready...');

    // Wait for database to be ready
    await waitForPostgres();

    console.log('✅ Test database started successfully');
  } catch (error) {
    console.error('❌ Failed to start test database:', error.message);
    throw error;
  }
}

/**
 * Stop test database container
 */
async function stopTestDatabase() {
  console.log('🛑 Stopping PostgreSQL test container...');

  try {
    await execAsync('docker-compose -f docker-compose.test.yml down');
    console.log('✅ Test database stopped');
  } catch (error) {
    console.error('❌ Failed to stop test database:', error.message);
    throw error;
  }
}

/**
 * Reset test database (drop all data, keep container running)
 */
async function resetTestDatabase() {
  console.log('🔄 Resetting test database...');

  try {
    // Get all tables except schema_migrations
    const tables = await query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename != 'schema_migrations'
    `);

    // Truncate all tables (CASCADE to handle foreign keys)
    for (const { tablename } of tables.rows) {
      await query(`TRUNCATE TABLE ${tablename} CASCADE`);
    }

    console.log('✅ Test database reset');
  } catch (error) {
    console.error('❌ Failed to reset test database:', error.message);
    throw error;
  }
}

/**
 * Run migrations on test database
 */
async function runTestMigrations() {
  console.log('📦 Running migrations on test database...');

  try {
    const fs = require('fs').promises;
    const path = require('path');
    const crypto = require('crypto');

    // Create schema_migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW(),
        execution_time_ms INTEGER,
        checksum VARCHAR(32) NOT NULL
      )
    `);

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../../../db/migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(f => f.endsWith('.sql') && f.match(/^\d{3}-/))
      .sort();

    // Get already applied migrations
    const applied = await query('SELECT version FROM schema_migrations ORDER BY version');
    const appliedVersions = new Set(applied.rows.map(r => r.version));

    // Run pending migrations
    for (const file of migrationFiles) {
      const version = file.replace('.sql', '');

      if (appliedVersions.has(version)) {
        continue; // Skip already applied
      }

      console.log(`  📄 Applying: ${file}`);
      const startTime = Date.now();

      // Read and execute migration
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = await fs.readFile(migrationPath, 'utf8');

      // Calculate checksum
      const checksum = crypto.createHash('md5').update(migrationSQL).digest('hex');

      // Execute migration
      await query(migrationSQL);

      // Record migration
      const executionTime = Date.now() - startTime;
      const name = version
        .split('-')
        .slice(1)
        .join(' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      await query(
        'INSERT INTO schema_migrations (version, name, execution_time_ms, checksum) VALUES ($1, $2, $3, $4)',
        [version, name, executionTime, checksum]
      );

      console.log(`  ✅ Applied in ${executionTime}ms`);
    }

    console.log('✅ Migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

/**
 * Create a test user for testing
 */
async function createTestUser(options = {}) {
  const email = options.email || `test-${Date.now()}@example.com`;
  const tier = options.tier || 'free';
  const passwordHash = options.passwordHash || 'test_hash';

  const result = await query(
    'INSERT INTO users (email, tier, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [email, tier, passwordHash]
  );

  return result.rows[0];
}

/**
 * Create a test user quota
 */
async function createTestQuota(userId, options = {}) {
  const dailyCount = options.dailyCount ?? 0;
  const monthlyCount = options.monthlyCount ?? 0;
  const periodStartDate = options.periodStartDate || new Date().toISOString().split('T')[0];

  const result = await query(
    'INSERT INTO user_quotas (user_id, daily_count, monthly_count, period_start_date, last_reset_date) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
    [userId, dailyCount, monthlyCount, periodStartDate]
  );

  return result.rows[0];
}

/**
 * Delete test user (and related data via CASCADE)
 */
async function deleteTestUser(userId) {
  await query('DELETE FROM users WHERE id = $1', [userId]);
}

/**
 * Clean up all test data
 */
async function cleanupTestData() {
  // Delete all users that look like test users
  await query("DELETE FROM users WHERE email LIKE 'test-%@example.com'");
}

// Export all functions
module.exports = {
  pool,
  query,
  sql,
  startTestDatabase,
  stopTestDatabase,
  resetTestDatabase,
  runTestMigrations,
  createTestUser,
  createTestQuota,
  deleteTestUser,
  cleanupTestData
};
