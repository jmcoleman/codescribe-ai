/**
 * Jest setup file
 * Configures custom matchers and global test utilities
 */

// Custom matcher for quality score validation
expect.extend({
  toBeValidQualityScore(received) {
    const pass =
      received &&
      typeof received.score === 'number' &&
      received.score >= 0 &&
      received.score <= 100 &&
      typeof received.grade === 'string' &&
      ['A', 'B', 'C', 'D', 'F'].includes(received.grade) &&
      received.breakdown &&
      received.summary;

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid quality score`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid quality score with score (0-100), grade (A-F), breakdown, and summary`,
        pass: false,
      };
    }
  },
});

// Set longer timeout for integration tests
jest.setTimeout(10000);
