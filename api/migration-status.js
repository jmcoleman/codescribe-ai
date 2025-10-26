/**
 * Public migration status endpoint (read-only, no authentication required)
 *
 * Shows applied migrations without exposing secrets or allowing modifications
 *
 * Usage: https://codescribeai.com/api/migration-status
 *
 * Security: Read-only operation, no sensitive data exposed
 */

import { getAppliedMigrations } from '../server/src/db/migrate.js';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get database info
    const dbResult = await sql`SELECT current_database() as db, version() as pg_version`;
    const database = dbResult.rows[0]?.db || 'unknown';
    const pgVersion = dbResult.rows[0]?.pg_version || 'unknown';

    // Get applied migrations
    const applied = await getAppliedMigrations();

    // Get pending migrations count (read migration files)
    const fs = await import('fs/promises');
    const path = await import('path');
    const migrationsDir = path.join(process.cwd(), 'server/src/db/migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files.filter(f => f.endsWith('.sql')).sort();

    const appliedVersions = new Set(applied.map(m => m.version));
    const pendingCount = migrationFiles.filter(f => !appliedVersions.has(f.replace('.sql', ''))).length;

    return res.status(200).json({
      success: true,
      environment: process.env.VERCEL_ENV || 'unknown',
      database,
      pgVersion: pgVersion.split(' ')[0], // Just version number
      appliedMigrations: applied.length,
      pendingMigrations: pendingCount,
      lastMigration: applied.length > 0 ? {
        version: applied[applied.length - 1].version,
        name: applied[applied.length - 1].name,
        appliedAt: applied[applied.length - 1].applied_at
      } : null,
      migrations: applied.map(m => ({
        version: m.version,
        name: m.name,
        appliedAt: m.applied_at,
        executionTime: m.execution_time_ms
      }))
    });

  } catch (error) {
    console.error('Failed to fetch migration status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch migration status',
      // Don't expose detailed error messages in production
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
