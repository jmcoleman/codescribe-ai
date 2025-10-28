/**
 * Jest Setup for Database Tests
 * Runs before each test file
 */

const { startTestDatabase, runTestMigrations } = require('./setup.js');

// Global setup - runs once before all tests
beforeAll(async () => {
  console.log('\n🚀 Setting up test database environment...\n');

  try {
    // Start Docker PostgreSQL container
    await startTestDatabase();

    // Run migrations to set up schema
    await runTestMigrations();

    console.log('\n✅ Test environment ready\n');
  } catch (error) {
    console.error('\n❌ Test setup failed:', error.message);
    throw error;
  }
}, 60000); // 60 second timeout for setup

// Global teardown - close database connections
afterAll(async () => {
  const { pool } = require('./setup.js');
  await pool.end();
});
