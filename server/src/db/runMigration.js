/**
 * Migration Runner for Neon Database
 * Runs SQL migrations without requiring psql locally
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

// Load environment variables from server/.env
config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration(migrationFileName) {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`\n📦 Running migration: ${migrationFileName}\n`);

    // Read migration file
    const migrationPath = join(__dirname, 'migrations', migrationFileName);
    const sql = readFileSync(migrationPath, 'utf-8');

    // Execute migration
    const result = await pool.query(sql);

    console.log('✅ Migration completed successfully!\n');

    // Show verification results (last query result)
    if (result.rows && result.rows.length > 0) {
      console.log('📋 Verification Results:');
      console.table(result.rows);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get migration file from command line or use default
const migrationFile = process.argv[2] || 'add-reset-token-fields.sql';

// Validate POSTGRES_URL exists
if (!process.env.POSTGRES_URL) {
  console.error('❌ Error: POSTGRES_URL environment variable not set');
  console.error('Please ensure server/.env contains POSTGRES_URL');
  process.exit(1);
}

runMigration(migrationFile);
