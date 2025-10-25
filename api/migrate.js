/**
 * Production database migration endpoint (Admin only)
 * Uses the automated migration system from server/src/db/migrate.js
 *
 * Security: POST request with Authorization header (Bearer token)
 *
 * Usage:
 *   curl -X POST \
 *     -H "Authorization: Bearer YOUR_MIGRATION_SECRET" \
 *     https://codescribeai.com/api/migrate
 *
 *   # Or for status check only:
 *   curl -X POST \
 *     -H "Authorization: Bearer YOUR_MIGRATION_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"action":"status"}' \
 *     https://codescribeai.com/api/migrate
 *
 * Features:
 * - Runs all pending migrations from server/src/db/migrations/
 * - Tracks applied migrations in schema_migrations table
 * - Validates migration integrity with checksums
 * - Returns detailed status and results
 *
 * Note: For read-only status checks, use /api/migration-status (no auth required)
 *
 * Based on: docs/database/DB-MIGRATION-MANAGEMENT.MD
 */

import { migrate, getAppliedMigrations } from '../server/src/db/migrate.js';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Only allow POST requests (more secure than GET with secrets)
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Use POST request with Authorization header. For read-only status, use /api/migration-status'
    });
  }

  // Security: Require Authorization header with Bearer token
  const authHeader = req.headers.authorization;
  const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'change-me-in-production';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected: "Authorization: Bearer YOUR_SECRET"'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (token !== MIGRATION_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get action from request body (default to 'migrate')
  const { action = 'migrate' } = req.body || {};

  try {
    // Get database info
    const dbResult = await sql`SELECT current_database() as db, version() as pg_version`;
    const database = dbResult.rows[0]?.db || 'unknown';
    const pgVersion = dbResult.rows[0]?.pg_version || 'unknown';

    // Handle different actions
    if (action === 'status') {
      // Show migration status without running migrations
      const applied = await getAppliedMigrations();

      return res.status(200).json({
        success: true,
        action: 'status',
        environment: process.env.VERCEL_ENV || 'unknown',
        database,
        pgVersion: pgVersion.split(' ')[0], // Just version number
        appliedMigrations: applied.length,
        migrations: applied.map(m => ({
          version: m.version,
          name: m.name,
          appliedAt: m.applied_at,
          executionTime: m.execution_time_ms
        }))
      });
    }

    // Default: Run migrations
    console.log('Starting automated database migration...');
    console.log(`Environment: ${process.env.VERCEL_ENV || 'unknown'}`);
    console.log(`Database: ${database}\n`);

    // Run the automated migration system
    await migrate();

    // Get final status
    const applied = await getAppliedMigrations();
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    return res.status(200).json({
      success: true,
      action: 'migrate',
      message: 'Migration completed successfully',
      environment: process.env.VERCEL_ENV || 'unknown',
      database,
      pgVersion: pgVersion.split(' ')[0],
      appliedMigrations: applied.length,
      tables: tables.rows.map(r => r.table_name),
      migrations: applied.map(m => ({
        version: m.version,
        name: m.name,
        appliedAt: m.applied_at,
        executionTime: m.execution_time_ms
      }))
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
