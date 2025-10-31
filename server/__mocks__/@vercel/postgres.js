/**
 * Mock for @vercel/postgres
 * Prevents actual database connections during tests
 */

// Mock SQL query function
const mockSql = jest.fn().mockImplementation((strings, ...values) => {
  // Return a promise that resolves to a mock result
  return Promise.resolve({
    rows: [],
    rowCount: 0,
    command: 'SELECT',
    fields: [],
  });
});

// Add query method for template literals
mockSql.query = jest.fn().mockResolvedValue({
  rows: [],
  rowCount: 0,
});

export const sql = mockSql;
export default { sql };
