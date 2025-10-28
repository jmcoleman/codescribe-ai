/**
 * DEV ONLY: Fix Migration 003 Checksum
 *
 * This script updates the checksum for migration 003 in the dev database
 * to match the current file content after manual fixes were applied.
 *
 * ⚠️  DEV ONLY - Do not run in production (prod DB already correct)
 */

import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import fs from 'fs/promises';

async function fixChecksum() {
  try {
    console.log('🔧 DEV ONLY: Fixing migration 003 checksum...\n');

    // Calculate current file checksum
    const fileContent = await fs.readFile('src/db/migrations/003-create-usage-table.sql', 'utf8');
    const currentChecksum = crypto.createHash('md5').update(fileContent).digest('hex');

    console.log('📝 Current file checksum:', currentChecksum);

    // Get existing checksum from database
    const existing = await sql`
      SELECT name, checksum, applied_at
      FROM schema_migrations
      WHERE name = '003-create-usage-table'
    `;

    if (existing.rows.length === 0) {
      console.log('❌ Migration 003 not found in database');
      console.log('   Run migrations first to create the entry');
      process.exit(1);
    }

    console.log('📝 Database checksum (before):', existing.rows[0].checksum);
    console.log('📝 Applied at:', existing.rows[0].applied_at);

    if (existing.rows[0].checksum === currentChecksum) {
      console.log('\n✅ Checksums already match! No update needed.');
      process.exit(0);
    }

    // Update checksum in database
    const updateResult = await sql`
      UPDATE schema_migrations
      SET checksum = ${currentChecksum}
      WHERE name = '003-create-usage-table'
      RETURNING name, checksum
    `;

    if (updateResult.rowCount === 0) {
      console.log('❌ No rows updated - something went wrong');
      process.exit(1);
    }

    console.log('\n✅ Updated checksum in database');

    // Verify update
    const verified = await sql`
      SELECT name, checksum, applied_at
      FROM schema_migrations
      WHERE name = '003-create-usage-table'
    `;

    console.log('📝 Database checksum (after):', verified.rows[0].checksum);

    if (verified.rows[0].checksum === currentChecksum) {
      console.log('\n✅ SUCCESS: Checksum verified and matches file!');
      console.log('   You can now run: npm run migrate');
    } else {
      console.log('\n❌ FAILED: Checksum still does not match');
      console.log('   Expected:', currentChecksum);
      console.log('   Got:', verified.rows[0].checksum);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing checksum:');
    console.error('   Message:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

fixChecksum();
