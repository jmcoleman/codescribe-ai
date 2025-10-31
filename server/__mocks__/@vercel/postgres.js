/**
 * Mock for @vercel/postgres
 * Prevents actual database connections during tests
 *
 * Note: Individual test files override this with their own specific mocks.
 * This is a fallback for any imports that don't have explicit mocks.
 */

// Create a mock function with a default implementation
const mockSql = jest.fn();

// Set default implementation (will be overridden by individual tests)
mockSql.mockImplementation(() => {
  return Promise.resolve({
    rows: [],
    rowCount: 0,
    command: 'SELECT',
    fields: [],
  });
});

export const sql = mockSql;
export default { sql };
