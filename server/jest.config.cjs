module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/server.js',
    '!src/**/index.js',
    // Exclude files without tests (for now)
    '!src/middleware/**',
    '!src/routes/**',
    '!src/test-parser.js',
  ],

  // Coverage thresholds (fail if below)
  // Only enforce thresholds on tested services directory
  coverageThreshold: {
    './src/services/': {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/tests/**/*.test.js',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup.js'],

  // Module path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Verbose output
  verbose: true,

  // Timeout for tests
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Transform ESM to CommonJS for Jest
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(acorn)/)'],
};
