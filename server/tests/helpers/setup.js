/**
 * Global test setup file
 * Runs before all tests
 */

// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || 'test-api-key-12345';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key-12345';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-gemini-key-12345';
process.env.PORT = '3001'; // Different port to avoid conflicts

// Database priority: Docker test DB → Dev DB from .env → fallback
// Docker: postgresql://test:test@localhost:5432/test_db
// Dev: Read from .env file (POSTGRES_URL)
if (!process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = 'postgresql://test:test@localhost:5432/test_db';
}

// Load environment variables from .env (after setting defaults)
import 'dotenv/config';

// CRITICAL: Remove RESEND_API_KEY to force email mocking in tests
// This prevents tests from sending real emails via Resend API
delete process.env.RESEND_API_KEY;

// Detect if we're in CI environment (GitHub Actions)
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Global test timeout
jest.setTimeout(10000);

// Helper to skip database-dependent tests in CI
global.skipIfNoDb = () => {
  if (isCI) {
    return describe.skip;
  }
  return describe;
};

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

// Suppress console logs during tests to prevent noise in CI/CD
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cleanup after all tests
afterAll(() => {
  // Cleanup code here if needed
});
