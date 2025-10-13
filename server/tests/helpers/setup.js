/**
 * Global test setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.CLAUDE_API_KEY = 'test-api-key-12345';
process.env.PORT = '3001'; // Different port to avoid conflicts

// Global test timeout
jest.setTimeout(10000);

// Add custom matchers if needed
expect.extend({
  toBeValidQualityScore(received) {
    const pass =
      typeof received === 'object' &&
      typeof received.score === 'number' &&
      received.score >= 0 &&
      received.score <= 100 &&
      typeof received.grade === 'string' &&
      ['A', 'B', 'C', 'D', 'F'].includes(received.grade) &&
      typeof received.breakdown === 'object' &&
      typeof received.summary === 'object';

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid quality score`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid quality score`,
        pass: false,
      };
    }
  },
});

// Suppress console logs during tests (uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Global test utilities
global.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cleanup after all tests
afterAll(() => {
  // Cleanup code here if needed
});
