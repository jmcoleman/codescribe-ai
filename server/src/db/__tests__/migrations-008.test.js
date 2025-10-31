/**
 * Migration 008 Tests: Name and Origin Tracking
 * Tests database schema changes for name fields and origin tracking
 * Run against Docker test database: npm run test:db -- migrations-008
 */

const { sql } = require('./helpers/setup.js');

describe('Migration 008: Name and Origin Tracking', () => {
  // Cleanup any test users from previous runs
  beforeEach(async () => {
    await sql`
      DELETE FROM users
      WHERE email LIKE 'test-%@example.com'
      OR email LIKE '%@example.com'
    `;
  });

  describe('Users Table - Name Columns', () => {
    it('should have first_name column with VARCHAR(100)', async () => {
      const result = await sql`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'first_name'
      `;

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].data_type).toBe('character varying');
      expect(result.rows[0].character_maximum_length).toBe(100);
      expect(result.rows[0].is_nullable).toBe('YES');
    });

    it('should have last_name column with VARCHAR(150)', async () => {
      const result = await sql`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'last_name'
      `;

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].data_type).toBe('character varying');
      expect(result.rows[0].character_maximum_length).toBe(150);
      expect(result.rows[0].is_nullable).toBe('YES');
    });

    it('should have customer_created_via column with origin_enum type', async () => {
      const result = await sql`
        SELECT
          column_name,
          udt_name,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'customer_created_via'
      `;

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].udt_name).toBe('origin_enum');
      expect(result.rows[0].is_nullable).toBe('YES');
    });
  });

  describe('Subscriptions Table - Origin Column', () => {
    it('should have created_via column with origin_enum type', async () => {
      const result = await sql`
        SELECT
          column_name,
          udt_name,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'subscriptions'
        AND column_name = 'created_via'
      `;

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].udt_name).toBe('origin_enum');
      expect(result.rows[0].is_nullable).toBe('YES');
    });
  });

  describe('Origin Enum Type', () => {
    it('should have created origin_enum type', async () => {
      const result = await sql`
        SELECT
          t.typname,
          t.typtype
        FROM pg_type t
        WHERE t.typname = 'origin_enum'
      `;

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].typtype).toBe('e'); // 'e' = enum type
    });

    it('should have correct enum values (app, stripe_dashboard, api, migration)', async () => {
      const result = await sql`
        SELECT
          e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'origin_enum'
        ORDER BY e.enumsortorder
      `;

      expect(result.rows.length).toBe(4);
      const enumValues = result.rows.map(row => row.enumlabel);
      expect(enumValues).toEqual(['app', 'stripe_dashboard', 'api', 'migration']);
    });
  });

  describe('Indexes', () => {
    it('should have idx_users_last_name index on users table', async () => {
      const result = await sql`
        SELECT
          indexname,
          tablename,
          indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
        AND indexname = 'idx_users_last_name'
      `;

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].indexdef).toContain('last_name');
    });

    it('should have idx_users_customer_created_via index on users table', async () => {
      const result = await sql`
        SELECT
          indexname,
          tablename,
          indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
        AND indexname = 'idx_users_customer_created_via'
      `;

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].indexdef).toContain('customer_created_via');
    });

    it('should have idx_subscriptions_created_via index on subscriptions table', async () => {
      const result = await sql`
        SELECT
          indexname,
          tablename,
          indexdef
        FROM pg_indexes
        WHERE tablename = 'subscriptions'
        AND indexname = 'idx_subscriptions_created_via'
      `;

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].indexdef).toContain('created_via');
    });
  });

  describe('Data Insertion and Retrieval', () => {
    it('should allow inserting user with name fields', async () => {
      const result = await sql`
        INSERT INTO users (email, first_name, last_name, customer_created_via)
        VALUES ('test-migration-008@example.com', 'John', 'Doe', 'app')
        RETURNING id, email, first_name, last_name, customer_created_via
      `;

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].first_name).toBe('John');
      expect(result.rows[0].last_name).toBe('Doe');
      expect(result.rows[0].customer_created_via).toBe('app');

      // Cleanup
      await sql`DELETE FROM users WHERE email = 'test-migration-008@example.com'`;
    });

    it('should allow NULL values for name fields', async () => {
      const result = await sql`
        INSERT INTO users (email)
        VALUES ('test-null-names@example.com')
        RETURNING id, email, first_name, last_name, customer_created_via
      `;

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].first_name).toBeNull();
      expect(result.rows[0].last_name).toBeNull();
      expect(result.rows[0].customer_created_via).toBeNull();

      // Cleanup
      await sql`DELETE FROM users WHERE email = 'test-null-names@example.com'`;
    });

    it('should enforce origin_enum values', async () => {
      // Valid enum value should succeed
      const validResult = await sql`
        INSERT INTO users (email, customer_created_via)
        VALUES ('test-valid-enum@example.com', 'stripe_dashboard')
        RETURNING id, customer_created_via
      `;

      expect(validResult.rows[0].customer_created_via).toBe('stripe_dashboard');

      // Invalid enum value should fail
      await expect(async () => {
        await sql`
          INSERT INTO users (email, customer_created_via)
          VALUES ('test-invalid-enum@example.com', 'invalid_origin')
        `;
      }).rejects.toThrow();

      // Cleanup
      await sql`DELETE FROM users WHERE email = 'test-valid-enum@example.com'`;
    });

    it('should respect VARCHAR length limits', async () => {
      const firstName100 = 'A'.repeat(100);
      const lastName150 = 'B'.repeat(150);

      const result = await sql`
        INSERT INTO users (email, first_name, last_name)
        VALUES ('test-length-limits@example.com', ${firstName100}, ${lastName150})
        RETURNING id, first_name, last_name
      `;

      expect(result.rows[0].first_name.length).toBe(100);
      expect(result.rows[0].last_name.length).toBe(150);

      // Values exceeding limits should be rejected by PostgreSQL
      const firstName101 = 'C'.repeat(101);
      const lastName151 = 'D'.repeat(151);

      // first_name exceeding 100 characters should fail
      await expect(async () => {
        await sql`
          INSERT INTO users (email, first_name, last_name)
          VALUES ('test-truncate-firstname@example.com', ${firstName101}, ${lastName150})
        `;
      }).rejects.toThrow(/value too long for type character varying\(100\)/);

      // last_name exceeding 150 characters should fail
      await expect(async () => {
        await sql`
          INSERT INTO users (email, first_name, last_name)
          VALUES ('test-truncate-lastname@example.com', ${firstName100}, ${lastName151})
        `;
      }).rejects.toThrow(/value too long for type character varying\(150\)/);

      // Cleanup
      await sql`DELETE FROM users WHERE email = 'test-length-limits@example.com'`;
    });
  });

  describe('Backward Compatibility', () => {
    it('should not break existing user records', async () => {
      // Create user without new fields
      const createResult = await sql`
        INSERT INTO users (email, password_hash, tier)
        VALUES ('test-backward-compat@example.com', 'hashed-password', 'free')
        RETURNING id, email, tier, first_name, last_name, customer_created_via
      `;

      expect(createResult.rows[0].tier).toBe('free');
      expect(createResult.rows[0].first_name).toBeNull();
      expect(createResult.rows[0].last_name).toBeNull();
      expect(createResult.rows[0].customer_created_via).toBeNull();

      // Update with name fields
      const updateResult = await sql`
        UPDATE users
        SET first_name = 'Jane',
            last_name = 'Smith',
            customer_created_via = 'api'
        WHERE email = 'test-backward-compat@example.com'
        RETURNING first_name, last_name, customer_created_via
      `;

      expect(updateResult.rows[0].first_name).toBe('Jane');
      expect(updateResult.rows[0].last_name).toBe('Smith');
      expect(updateResult.rows[0].customer_created_via).toBe('api');

      // Cleanup
      await sql`DELETE FROM users WHERE email = 'test-backward-compat@example.com'`;
    });
  });
});
