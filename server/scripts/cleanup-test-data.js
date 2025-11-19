/**
 * Script to clean up test data from development database
 * Removes users created during test runs
 */

import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function cleanupTestData() {
  console.log('🔍 Scanning for test data...\n');

  try {
    // 1. Find ALL users except the production admin
    const testUsers = await sql`
      SELECT id, email, created_at, tier
      FROM users
      WHERE email != 'jenni.m.coleman@gmail.com'
      ORDER BY created_at DESC
    `;

    console.log(`Found ${testUsers.rows.length} non-production users:\n`);
    testUsers.rows.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}, Tier: ${user.tier || 'free'}, Created: ${user.created_at})`);
    });

    if (testUsers.rows.length === 0) {
      console.log('\n✅ No test data found. Database is clean!');
      process.exit(0);
    }

    console.log('\n🗑️  Cleaning up test data...\n');

    // 2. Delete in correct order (respecting foreign key constraints)
    const userIds = testUsers.rows.map(u => u.id);

    // Delete user_audit_log entries first
    const auditResult = await sql`
      DELETE FROM user_audit_log
      WHERE user_id = ANY(${userIds}::int[])
    `;
    console.log(`  ✓ Deleted ${auditResult.rowCount} audit log entries`);

    // Delete user_quotas entries
    const quotasResult = await sql`
      DELETE FROM user_quotas
      WHERE user_id = ANY(${userIds}::int[])
    `;
    console.log(`  ✓ Deleted ${quotasResult.rowCount} user quota entries`);

    // Delete subscriptions entries
    const subscriptionsResult = await sql`
      DELETE FROM subscriptions
      WHERE user_id = ANY(${userIds}::int[])
    `;
    console.log(`  ✓ Deleted ${subscriptionsResult.rowCount} subscription entries`);

    // Delete users
    const usersResult = await sql`
      DELETE FROM users
      WHERE id = ANY(${userIds}::int[])
    `;
    console.log(`  ✓ Deleted ${usersResult.rowCount} user entries\n`);

    console.log('✅ Test data cleanup complete!\n');

  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    process.exit(1);
  }

  process.exit(0);
}

// Run cleanup
cleanupTestData();
