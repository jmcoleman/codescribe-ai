/**
 * Database Connection Configuration
 * Sets up PostgreSQL connection using Vercel Postgres SDK
 */

import { sql } from '@vercel/postgres';

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Initialize database schema (create tables if they don't exist)
 * @returns {Promise<void>}
 */
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database schema...');

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        github_id VARCHAR(255) UNIQUE,
        tier VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id)`;

    // Create sessions table for express-session with connect-pg-simple
    await sql`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire)`;

    // Create usage tracking table
    await sql`
      CREATE TABLE IF NOT EXISTS usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        operation_type VARCHAR(50) NOT NULL,
        file_size INTEGER,
        tokens_used INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_usage_created_at ON usage(created_at)`;

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

/**
 * Clean up expired sessions (run periodically)
 * @returns {Promise<number>} Number of sessions deleted
 */
async function cleanupSessions() {
  try {
    const result = await sql`
      DELETE FROM session
      WHERE expire < NOW()
    `;
    return result.rowCount;
  } catch (error) {
    console.error('❌ Session cleanup failed:', error.message);
    return 0;
  }
}

export {
  sql,
  testConnection,
  initializeDatabase,
  cleanupSessions
};
