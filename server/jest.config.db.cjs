/**
 * Jest Configuration for Database Integration Tests
 *
 * This config is specifically for tests that require a database connection.
 * Use: npm run test:db
 *
 * Key differences from main jest.config.cjs:
 * - Longer timeout for DB operations
 * - Sequential test execution (avoid conflicts)
 * - Loads .env.test for test database connection
 */

module.exports = {
  // Use the base config as foundation
  ...require('./jest.config.cjs'),

  // Override test match to only run DB tests
  testMatch: [
    '**/__tests__/**/migrations-*.test.js',
    '**/__tests__/**/db-*.test.js',
    '**/__tests__/**/schema-*.test.js'
  ],

  // Override testPathIgnorePatterns to allow database tests
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Display name for this test suite
  displayName: {
    name: 'DATABASE',
    color: 'blue'
  },

  // Increase timeout for database operations
  testTimeout: 30000, // 30 seconds

  // Run tests sequentially (not in parallel) to avoid database conflicts
  maxWorkers: 1,

  // Setup file to load before tests
  setupFilesAfterEnv: ['<rootDir>/src/db/__tests__/helpers/jest-setup.js'],

  // Environment variables for test database
  testEnvironment: 'node',

  // Load .env.test file
  setupFiles: ['<rootDir>/src/db/__tests__/helpers/load-env.js']
};
