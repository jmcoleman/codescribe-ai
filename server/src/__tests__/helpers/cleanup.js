/**
 * Test Cleanup Utilities
 * Centralized cleanup functions for test data
 */

import { sql } from '@vercel/postgres';

/**
 * Clean up test users and related data by email pattern
 * @param {string|string[]} emailPatterns - Email pattern(s) to match (e.g., 'test-%', 'audit-test%')
 * @returns {Promise<Object>} Cleanup statistics
 */
export async function cleanupTestUsers(emailPatterns) {
  const patterns = Array.isArray(emailPatterns) ? emailPatterns : [emailPatterns];

  try {
    // Find all test users matching any pattern
    let allUserIds = [];

    for (const pattern of patterns) {
      const result = await sql`
        SELECT id FROM users WHERE email LIKE ${pattern}
      `;
      allUserIds.push(...result.rows.map(r => r.id));
    }

    // Remove duplicates
    const userIds = [...new Set(allUserIds)];

    if (userIds.length === 0) {
      return {
        usersDeleted: 0,
        auditLogsDeleted: 0,
        quotasDeleted: 0,
        subscriptionsDeleted: 0
      };
    }

    // Delete in correct order (respecting foreign key constraints)
    // Must delete children before parents due to ON DELETE RESTRICT on user_audit_log
    const auditResult = await sql`
      DELETE FROM user_audit_log WHERE user_id = ANY(${userIds}::int[])
    `;

    const quotasResult = await sql`
      DELETE FROM user_quotas WHERE user_id = ANY(${userIds}::int[])
    `;

    const subscriptionsResult = await sql`
      DELETE FROM subscriptions WHERE user_id = ANY(${userIds}::int[])
    `;

    const usersResult = await sql`
      DELETE FROM users WHERE id = ANY(${userIds}::int[])
    `;

    return {
      usersDeleted: usersResult.rowCount,
      auditLogsDeleted: auditResult.rowCount,
      quotasDeleted: quotasResult.rowCount,
      subscriptionsDeleted: subscriptionsResult.rowCount
    };
  } catch (error) {
    console.error('Error in cleanupTestUsers:', error);
    throw error;
  }
}

/**
 * Clean up all test data patterns
 * Removes common test patterns used across the test suite
 * @returns {Promise<Object>} Cleanup statistics
 */
export async function cleanupAllTestData() {
  const patterns = [
    'test-%',                    // test-payment-%, test-webhook-%, etc.
    '%test%@example.com',        // any test emails at example.com
    'audit-test%',               // migration test users
    'cascade-test%'              // cascade test users
  ];

  return cleanupTestUsers(patterns);
}

/**
 * Wrap afterAll cleanup with error handling
 * Usage: afterAll(wrapCleanup(() => cleanupTestUsers('test-mytest-%')))
 */
export function wrapCleanup(cleanupFn) {
  return async () => {
    try {
      await cleanupFn();
    } catch (error) {
      // Log but don't fail tests on cleanup errors
      console.warn('Test cleanup warning:', error.message);
    }
  };
}
