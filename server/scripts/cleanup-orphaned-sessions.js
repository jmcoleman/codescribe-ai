#!/usr/bin/env node
/**
 * Cleanup Orphaned Sessions Script
 *
 * Removes sessions from the sessions table where the user no longer exists.
 * This fixes the "Failed to deserialize user" errors caused by deleted users.
 *
 * Usage:
 *   node scripts/cleanup-orphaned-sessions.js
 *
 * Environment:
 *   Requires POSTGRES_URL environment variable
 */

import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function cleanupOrphanedSessions() {
  console.log('🔍 Starting orphaned session cleanup...\n');

  try {
    // Step 1: Count orphaned sessions before cleanup
    const countResult = await sql`
      SELECT COUNT(*) as orphaned_count
      FROM sessions
      WHERE sess::jsonb->'passport'->>'user' IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM users
          WHERE id::text = sess::jsonb->'passport'->>'user'
            AND deleted_at IS NULL
        )
    `;

    const orphanedCount = parseInt(countResult.rows[0]?.orphaned_count || 0);
    console.log(`📊 Found ${orphanedCount} orphaned session(s)`);

    if (orphanedCount === 0) {
      console.log('✅ No orphaned sessions found. Database is clean!');
      process.exit(0);
    }

    // Step 2: Get sample of orphaned sessions for logging
    const sampleResult = await sql`
      SELECT
        sid,
        sess::jsonb->'passport'->>'user' as user_id,
        expire
      FROM sessions
      WHERE sess::jsonb->'passport'->>'user' IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM users
          WHERE id::text = sess::jsonb->'passport'->>'user'
            AND deleted_at IS NULL
        )
      LIMIT 5
    `;

    console.log('\n📝 Sample orphaned sessions:');
    sampleResult.rows.forEach((row, idx) => {
      console.log(`  ${idx + 1}. Session ID: ${row.sid.substring(0, 20)}...`);
      console.log(`     User ID: ${row.user_id}`);
      console.log(`     Expires: ${row.expire}`);
    });

    // Step 3: Delete orphaned sessions
    console.log('\n🗑️  Deleting orphaned sessions...');
    const deleteResult = await sql`
      DELETE FROM sessions
      WHERE sess::jsonb->'passport'->>'user' IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM users
          WHERE id::text = sess::jsonb->'passport'->>'user'
            AND deleted_at IS NULL
        )
    `;

    console.log(`✅ Deleted ${deleteResult.rowCount} orphaned session(s)`);

    // Step 4: Verify cleanup
    const verifyResult = await sql`
      SELECT COUNT(*) as remaining_orphaned
      FROM sessions
      WHERE sess::jsonb->'passport'->>'user' IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM users
          WHERE id::text = sess::jsonb->'passport'->>'user'
            AND deleted_at IS NULL
        )
    `;

    const remaining = parseInt(verifyResult.rows[0]?.remaining_orphaned || 0);
    if (remaining === 0) {
      console.log('\n✅ Cleanup successful! All orphaned sessions removed.');
    } else {
      console.log(`\n⚠️  Warning: ${remaining} orphaned session(s) still remain.`);
    }

    // Step 5: Show total sessions remaining
    const totalSessionsResult = await sql`
      SELECT COUNT(*) as total_sessions FROM sessions
    `;
    const totalSessions = parseInt(totalSessionsResult.rows[0]?.total_sessions || 0);
    console.log(`📊 Total sessions remaining: ${totalSessions}`);

  } catch (error) {
    console.error('\n❌ Error during cleanup:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    if (error.stack) {
      console.error('\n   Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }

  process.exit(0);
}

// Check if POSTGRES_URL is set
if (!process.env.POSTGRES_URL) {
  console.error('❌ Error: POSTGRES_URL environment variable not set');
  console.error('   Make sure to run this script from the server directory:');
  console.error('   cd server && node scripts/cleanup-orphaned-sessions.js');
  process.exit(1);
}

// Run cleanup
console.log('🚀 Orphaned Session Cleanup Script');
console.log('=' .repeat(50));
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Database: ${process.env.POSTGRES_URL.split('@')[1]?.split('/')[0] || 'unknown'}`);
console.log('=' .repeat(50) + '\n');

cleanupOrphanedSessions();
