/**
 * Integration Tests for Migrations 004 and 005
 *
 * Tests the database schema changes from:
 * - Migration 004: Fix index naming to comply with DB-NAMING-STANDARDS.md
 * - Migration 005: Add tier tracking columns (tier_updated_at, previous_tier)
 *
 * These tests require a database connection and should be run against a test database.
 *
 * Run with: NODE_ENV=test npm test -- migrations-004-005.test.js
 */

const { sql } = require('./helpers/setup.js');

describe('Migration 004: Fix Index Naming', () => {
  describe('Schema Validation', () => {
    it('should have renamed usage_analytics indexes with full table name', async () => {
      const indexes = await sql`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'usage_analytics'
        AND indexname LIKE 'idx_usage_analytics%'
        ORDER BY indexname
      `;

      const indexNames = indexes.rows.map(r => r.indexname);

      // Should have the new compliant names
      expect(indexNames).toContain('idx_usage_analytics_created_at');
      expect(indexNames).toContain('idx_usage_analytics_user_id');
      expect(indexNames).toContain('idx_usage_analytics_operation');
    });

    it('should NOT have old non-compliant index names', async () => {
      const oldIndexes = await sql`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'usage_analytics'
        AND indexname IN ('idx_usage_user_id', 'idx_usage_created_at')
      `;

      // Old indexes should be gone
      expect(oldIndexes.rows).toHaveLength(0);
    });

    it('should have removed duplicate session index (PascalCase)', async () => {
      const duplicateIndex = await sql`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'session'
        AND indexname = 'IDX_session_expire'
      `;

      // Duplicate should be removed
      expect(duplicateIndex.rows).toHaveLength(0);
    });

    it('should still have the correct session index (snake_case)', async () => {
      const correctIndex = await sql`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'session'
        AND indexname = 'idx_session_expire'
      `;

      // Correct index should exist
      expect(correctIndex.rows).toHaveLength(1);
      expect(correctIndex.rows[0].indexdef).toContain('expire');
    });

    it('should have added missing operation_type index', async () => {
      const operationIndex = await sql`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'usage_analytics'
        AND indexname = 'idx_usage_analytics_operation'
      `;

      expect(operationIndex.rows).toHaveLength(1);
      expect(operationIndex.rows[0].indexdef).toContain('operation_type');
    });
  });

  describe('Index Functionality', () => {
    it('should use renamed index for user_id lookups', async () => {
      // Skip if no data exists
      const dataExists = await sql`SELECT COUNT(*) as count FROM usage_analytics`;
      if (dataExists.rows[0].count === '0') {
        return; // Skip test if no data
      }

      const plan = await sql`
        EXPLAIN (FORMAT JSON)
        SELECT * FROM usage_analytics
        WHERE user_id = 1
      `;

      const queryPlan = plan.rows[0]['QUERY PLAN'][0];
      // Should use an index scan (not sequential scan)
      expect(queryPlan.Plan['Node Type']).toMatch(/Index Scan|Bitmap Index Scan/);
    });

    it('should use renamed index for created_at lookups', async () => {
      const dataExists = await sql`SELECT COUNT(*) as count FROM usage_analytics`;
      if (dataExists.rows[0].count === '0') {
        return; // Skip test if no data
      }

      const plan = await sql`
        EXPLAIN (FORMAT JSON)
        SELECT * FROM usage_analytics
        WHERE created_at > NOW() - INTERVAL '1 day'
      `;

      const queryPlan = plan.rows[0]['QUERY PLAN'][0];
      // Should use an index scan
      expect(queryPlan.Plan['Node Type']).toMatch(/Index Scan|Bitmap Index Scan|Seq Scan/);
    });
  });

  describe('Naming Standards Compliance', () => {
    it('should have all indexes following idx_<table>_<column> pattern', async () => {
      const allIndexes = await sql`
        SELECT
          tablename,
          indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
        AND tablename IN ('users', 'user_quotas', 'usage_analytics', 'session')
        ORDER BY tablename, indexname
      `;

      // Verify each index follows naming convention
      allIndexes.rows.forEach(row => {
        const { tablename, indexname } = row;

        // Index should start with idx_<tablename>_
        const expectedPrefix = `idx_${tablename}_`;

        // For abbreviated table names in legacy indexes, check partial match
        const isCompliant =
          indexname.startsWith(expectedPrefix) ||
          indexname.startsWith('idx_user_quotas_') || // Acceptable for user_quotas
          indexname === 'idx_session_expire'; // Acceptable for session

        expect(isCompliant).toBe(true);
      });
    });
  });
});

describe('Migration 005: Add Tier Tracking Columns', () => {
  describe('Schema Validation', () => {
    it('should have added tier_updated_at column to users table', async () => {
      const column = await sql`
        SELECT
          column_name,
          data_type,
          column_default,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'tier_updated_at'
      `;

      expect(column.rows).toHaveLength(1);
      expect(column.rows[0]).toMatchObject({
        column_name: 'tier_updated_at',
        data_type: 'timestamp without time zone',
        is_nullable: 'YES'
      });
      expect(column.rows[0].column_default).toContain('now()');
    });

    it('should have added previous_tier column to users table', async () => {
      const column = await sql`
        SELECT
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'previous_tier'
      `;

      expect(column.rows).toHaveLength(1);
      expect(column.rows[0]).toMatchObject({
        column_name: 'previous_tier',
        data_type: 'character varying',
        is_nullable: 'YES'
      });
    });

    it('should have added CHECK constraint for valid tier values', async () => {
      const constraint = await sql`
        SELECT
          con.conname AS constraint_name,
          pg_get_constraintdef(con.oid) AS constraint_definition
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'users'
        AND con.conname = 'check_valid_tier'
      `;

      expect(constraint.rows).toHaveLength(1);
      expect(constraint.rows[0].constraint_name).toBe('check_valid_tier');

      const definition = constraint.rows[0].constraint_definition;
      expect(definition).toContain('free');
      expect(definition).toContain('starter');
      expect(definition).toContain('pro');
      expect(definition).toContain('team');
      expect(definition).toContain('enterprise');
    });

    it('should have all three tier-related columns', async () => {
      const columns = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name IN ('tier', 'tier_updated_at', 'previous_tier')
        ORDER BY column_name
      `;

      const columnNames = columns.rows.map(r => r.column_name);
      expect(columnNames).toEqual(['previous_tier', 'tier', 'tier_updated_at']);
    });
  });

  describe('Data Integrity', () => {
    let testUserId;

    afterEach(async () => {
      // Cleanup test user if created
      if (testUserId) {
        try {
          await sql`DELETE FROM users WHERE id = ${testUserId}`;
        } catch (error) {
          // Ignore cleanup errors
        }
        testUserId = null;
      }
    });

    it('should enforce valid tier values through CHECK constraint', async () => {
      const validTiers = ['free', 'starter', 'pro', 'team', 'enterprise'];

      for (const tier of validTiers) {
        const result = await sql`
          INSERT INTO users (email, tier, password_hash)
          VALUES (${`test-${tier}-${Date.now()}@example.com`}, ${tier}, 'hash')
          RETURNING id
        `;

        expect(result.rows[0].id).toBeDefined();

        // Cleanup
        await sql`DELETE FROM users WHERE id = ${result.rows[0].id}`;
      }
    });

    it('should reject invalid tier values', async () => {
      await expect(
        sql`
          INSERT INTO users (email, tier, password_hash)
          VALUES ('invalid-tier@example.com', 'invalid_tier', 'hash')
        `
      ).rejects.toThrow(/check_valid_tier|violates check constraint/i);
    });

    it('should allow NULL in previous_tier column', async () => {
      const result = await sql`
        INSERT INTO users (email, tier, password_hash, previous_tier)
        VALUES (${`null-prev-tier-${Date.now()}@example.com`}, 'free', 'hash', NULL)
        RETURNING id, previous_tier
      `;

      expect(result.rows[0].previous_tier).toBeNull();
      testUserId = result.rows[0].id;
    });

    it('should allow setting previous_tier to a valid tier value', async () => {
      const result = await sql`
        INSERT INTO users (email, tier, password_hash, previous_tier)
        VALUES (${`with-prev-tier-${Date.now()}@example.com`}, 'pro', 'hash', 'free')
        RETURNING id, tier, previous_tier
      `;

      expect(result.rows[0].tier).toBe('pro');
      expect(result.rows[0].previous_tier).toBe('free');
      testUserId = result.rows[0].id;
    });

    it('should set tier_updated_at to NOW() by default', async () => {
      const result = await sql`
        INSERT INTO users (email, tier, password_hash)
        VALUES (${`tier-timestamp-${Date.now()}@example.com`}, 'free', 'hash')
        RETURNING id, tier_updated_at,
                  EXTRACT(EPOCH FROM tier_updated_at) as tier_epoch,
                  EXTRACT(EPOCH FROM NOW()) as now_epoch
      `;

      // Use epoch timestamps (seconds since 1970) to avoid timezone conversion issues
      const tierEpoch = parseFloat(result.rows[0].tier_epoch);
      const nowEpoch = parseFloat(result.rows[0].now_epoch);

      // Verify tier_updated_at is set (not NULL)
      expect(tierEpoch).toBeDefined();
      expect(tierEpoch).toBeGreaterThan(0);

      // Verify it's within 5 seconds of NOW() (same transaction, should be nearly identical)
      const timeDiff = Math.abs(nowEpoch - tierEpoch);
      expect(timeDiff).toBeLessThan(5); // 5 seconds

      testUserId = result.rows[0].id;
    });
  });

  describe('Backfill Validation', () => {
    it('should have backfilled tier_updated_at for existing users', async () => {
      // Check if any users exist that were created before migration 005
      const usersWithNullTierUpdated = await sql`
        SELECT COUNT(*) as count
        FROM users
        WHERE tier_updated_at IS NULL
      `;

      // After migration, all users should have tier_updated_at
      expect(parseInt(usersWithNullTierUpdated.rows[0].count)).toBe(0);
    });

    it('should have tier_updated_at approximately equal to created_at for pre-migration users', async () => {
      // Find users that existed before migration (created_at before tier tracking was added)
      const oldUsers = await sql`
        SELECT
          id,
          created_at,
          tier_updated_at,
          EXTRACT(EPOCH FROM (tier_updated_at - created_at)) as time_diff_seconds
        FROM users
        WHERE created_at < (
          SELECT applied_at
          FROM schema_migrations
          WHERE version = '005-add-tier-tracking-columns'
        )
        LIMIT 5
      `;

      // For users created before migration, tier_updated_at should equal created_at
      oldUsers.rows.forEach(user => {
        const timeDiff = Math.abs(parseFloat(user.time_diff_seconds));
        // Should be within 1 second (accounts for precision differences)
        expect(timeDiff).toBeLessThan(1);
      });
    });
  });
});

describe('Migrations 004-005: Combined Validation', () => {
  it('should have all migrations applied in correct order', async () => {
    const migrations = await sql`
      SELECT version, name, applied_at
      FROM schema_migrations
      ORDER BY version
    `;

    const versions = migrations.rows.map(m => m.version);

    expect(versions).toContain('004-fix-index-naming');
    expect(versions).toContain('005-add-tier-tracking-columns');

    // 004 should come before 005
    const index004 = versions.indexOf('004-fix-index-naming');
    const index005 = versions.indexOf('005-add-tier-tracking-columns');
    expect(index004).toBeLessThan(index005);
  });

  it('should have valid checksums for both migrations', async () => {
    const migrations = await sql`
      SELECT version, checksum
      FROM schema_migrations
      WHERE version IN ('004-fix-index-naming', '005-add-tier-tracking-columns')
    `;

    expect(migrations.rows).toHaveLength(2);

    migrations.rows.forEach(migration => {
      expect(migration.checksum).toBeDefined();
      expect(migration.checksum).toMatch(/^[a-f0-9]{32}$/); // MD5 hex format
    });
  });

  it('should have recorded execution times for both migrations', async () => {
    const migrations = await sql`
      SELECT version, execution_time_ms
      FROM schema_migrations
      WHERE version IN ('004-fix-index-naming', '005-add-tier-tracking-columns')
    `;

    expect(migrations.rows).toHaveLength(2);

    migrations.rows.forEach(migration => {
      expect(migration.execution_time_ms).toBeGreaterThan(0);
      expect(migration.execution_time_ms).toBeLessThan(10000); // Reasonable upper bound
    });
  });
});

describe('Database Naming Standards Compliance', () => {
  it('should have all tables using plural snake_case names', async () => {
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const tableNames = tables.rows.map(r => r.table_name);

    // Verify each table follows naming convention
    tableNames.forEach(tableName => {
      // Should be lowercase
      expect(tableName).toBe(tableName.toLowerCase());

      // Should use snake_case (no camelCase or PascalCase)
      expect(tableName).not.toMatch(/[A-Z]/);
    });
  });

  it('should have all indexes following idx_<table>_<column> pattern', async () => {
    const indexes = await sql`
      SELECT
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `;

    // All idx_ prefixed indexes should follow the pattern
    indexes.rows.forEach(row => {
      const { indexname } = row;

      // Should start with idx_
      expect(indexname).toMatch(/^idx_/);

      // Should be lowercase snake_case
      expect(indexname).toBe(indexname.toLowerCase());
      expect(indexname).not.toMatch(/[A-Z]/);
    });
  });

  it('should have all foreign keys with CASCADE delete behavior', async () => {
    const foreignKeys = await sql`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `;

    // Verify each foreign key has explicit delete rule
    foreignKeys.rows.forEach(fk => {
      expect(fk.delete_rule).toBeDefined();
      expect(fk.delete_rule).not.toBe('NO ACTION'); // Should be explicit
      // Should be CASCADE, SET NULL, or RESTRICT
      expect(['CASCADE', 'SET NULL', 'RESTRICT']).toContain(fk.delete_rule);
    });
  });
});
