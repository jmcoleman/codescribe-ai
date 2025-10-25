import express from 'express';

const router = express.Router();

/**
 * Middleware to authenticate admin requests
 * Requires Authorization: Bearer <MIGRATION_SECRET> header
 */
function requireMigrationSecret(req, res, next) {
  const authHeader = req.headers.authorization;
  const secret = process.env.MIGRATION_SECRET;

  if (!secret) {
    return res.status(500).json({
      success: false,
      error: 'Migration endpoint not configured',
      message: 'MIGRATION_SECRET environment variable is not set'
    });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected: Bearer <token>'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (token !== secret) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid migration secret'
    });
  }

  next();
}

/**
 * GET /api/migrate/status
 * Public endpoint - Returns migration status (read-only, no auth required)
 */
router.get('/status', async (req, res) => {
  try {
    const { getMigrationFiles, getAppliedMigrations } = await import('../db/migrate.js');
    const { sql } = await import('@vercel/postgres');

    // Get migration data
    const allMigrations = await getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations();

    // Get database info
    const dbResult = await sql`SELECT current_database() as database, version() as pg_version`;
    const { database, pg_version } = dbResult.rows[0];

    // Build response
    const appliedSet = new Set(appliedMigrations.map(m => m.version));
    const pendingMigrations = allMigrations.filter(m => !appliedSet.has(m.version));

    const migrations = allMigrations.map(m => {
      const applied = appliedMigrations.find(am => am.version === m.version);
      return {
        version: m.version,
        name: m.name,
        status: applied ? 'applied' : 'pending',
        appliedAt: applied?.applied_at || null,
        checksum: m.checksum
      };
    });

    res.json({
      success: true,
      environment: process.env.NODE_ENV || 'development',
      database,
      pgVersion: pg_version,
      appliedMigrations: appliedMigrations.length,
      pendingMigrations: pendingMigrations.length,
      lastMigration: appliedMigrations.length > 0 ? {
        version: appliedMigrations[appliedMigrations.length - 1].version,
        name: appliedMigrations[appliedMigrations.length - 1].name,
        appliedAt: appliedMigrations[appliedMigrations.length - 1].applied_at
      } : null,
      migrations
    });
  } catch (error) {
    console.error('Migration status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get migration status',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

/**
 * POST /api/migrate/run
 * Admin endpoint - Runs pending migrations or returns detailed status
 * Requires: Authorization: Bearer <MIGRATION_SECRET>
 * Optional body: { action: "status" } for detailed status without running migrations
 */
router.post('/run', requireMigrationSecret, async (req, res) => {
  try {
    const { migrate, getMigrationFiles, getAppliedMigrations } = await import('../db/migrate.js');
    const { sql } = await import('@vercel/postgres');
    const { action } = req.body || {};

    // If action is "status", just return detailed status
    if (action === 'status') {
      const allMigrations = await getMigrationFiles();
      const appliedMigrations = await getAppliedMigrations();
      const dbResult = await sql`SELECT current_database() as database, version() as pg_version`;
      const { database, pg_version } = dbResult.rows[0];

      const appliedSet = new Set(appliedMigrations.map(m => m.version));
      const pendingMigrations = allMigrations.filter(m => !appliedSet.has(m.version));

      const migrations = allMigrations.map(m => {
        const applied = appliedMigrations.find(am => am.version === m.version);
        return {
          version: m.version,
          name: m.name,
          status: applied ? 'applied' : 'pending',
          appliedAt: applied?.applied_at || null,
          executionTime: applied?.execution_time || null,
          checksum: m.checksum
        };
      });

      return res.json({
        success: true,
        action: 'status',
        environment: process.env.NODE_ENV || 'development',
        database,
        pgVersion: pg_version,
        appliedMigrations: appliedMigrations.length,
        pendingMigrations: pendingMigrations.length,
        migrations
      });
    }

    // Run pending migrations
    console.log('🔄 Running migrations via API...');

    // Get pending migrations before running
    const allMigrationsBefore = await getMigrationFiles();
    const appliedMigrationsBefore = await getAppliedMigrations();
    const appliedSetBefore = new Set(appliedMigrationsBefore.map(m => m.version));
    const pendingBefore = allMigrationsBefore.filter(m => !appliedSetBefore.has(m.version));

    if (pendingBefore.length === 0) {
      return res.json({
        success: true,
        action: 'migrate',
        message: 'No pending migrations. Database is up to date.',
        appliedCount: 0,
        migrations: []
      });
    }

    // Run migrations (this doesn't return a value, just executes)
    await migrate();

    // Get applied migrations after running to see what was applied
    const appliedMigrationsAfter = await getAppliedMigrations();
    const newlyApplied = appliedMigrationsAfter.filter(
      m => !appliedSetBefore.has(m.version)
    );

    res.json({
      success: true,
      action: 'migrate',
      message: `Successfully applied ${newlyApplied.length} migration(s)`,
      appliedCount: newlyApplied.length,
      migrations: newlyApplied.map(m => ({
        version: m.version,
        name: m.name,
        appliedAt: m.applied_at
      }))
    });
  } catch (error) {
    console.error('Migration run error:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

export default router;
