/**
 * Global Test Teardown
 * Runs once after all test suites complete
 * Cleans up any remaining test data from the database
 *
 * IMPORTANT: Only runs locally, NOT in CI
 * CI uses mocked database connections and should never touch real data
 */

import dotenv from 'dotenv';
import { cleanupAllTestData } from './helpers/cleanup.js';

// Load environment variables for database connection
dotenv.config();

export default async function globalTeardown() {
  // Skip cleanup in CI - tests use mocks, not real database
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  if (isCI) {
    console.log('\n🧹 Skipping test cleanup in CI (tests use mocks)\n');
    return;
  }

  console.log('\n🧹 Running global test cleanup...');

  try {
    const stats = await cleanupAllTestData();

    if (stats.usersDeleted > 0) {
      console.log(`  ✓ Cleaned up ${stats.usersDeleted} test users`);
      console.log(`  ✓ Removed ${stats.auditLogsDeleted} audit logs`);
      console.log(`  ✓ Removed ${stats.quotasDeleted} quota records`);
      console.log(`  ✓ Removed ${stats.subscriptionsDeleted} subscriptions`);
    } else {
      console.log('  ✓ No test data to clean up');
    }
  } catch (error) {
    console.warn('  ⚠️  Warning: Test cleanup failed:', error.message);
    // Don't fail the test run on cleanup errors
  }

  console.log('✅ Test suite cleanup complete\n');
}
