/**
 * Migration Endpoints Tests
 *
 * Tests for database migration API endpoints:
 * - GET /api/migrate/status (public, no auth)
 * - POST /api/migrate/run (admin, Bearer auth)
 * - Authentication middleware
 * - Database connectivity
 */

import request from 'supertest';
import express from 'express';
import migrateRoutes from '../migrate.js';

// Mock the database migration functions
jest.mock('../../db/migrate.js', () => ({
  getMigrationFiles: jest.fn(),
  getAppliedMigrations: jest.fn(),
  migrate: jest.fn()
}));

// Mock @vercel/postgres
const mockSql = Object.assign(
  function (strings) {
    // Handle both direct calls and tagged template usage
    if (typeof strings === 'string' || Array.isArray(strings)) {
      return Promise.resolve({
        rows: [{
          database: 'neondb',
          pg_version: 'PostgreSQL 17.5 on x86_64'
        }]
      });
    }
    // Handle non-template usage
    return Promise.resolve({
      rows: [{
        database: 'neondb',
        pg_version: 'PostgreSQL 17.5 on x86_64'
      }]
    });
  },
  {
    // Add any additional sql methods if needed
    connect: jest.fn(),
    query: jest.fn()
  }
);

jest.mock('@vercel/postgres', () => ({
  sql: mockSql
}));

// Import mocked functions for manipulation in tests
import { getMigrationFiles, getAppliedMigrations, migrate } from '../../db/migrate.js';

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/migrate', migrateRoutes);
  return app;
}

// Sample migration data
const mockMigrations = [
  {
    version: '000-create-migration-table',
    name: 'Create Migration Table',
    versionNum: '000',
    checksum: 'abc123'
  },
  {
    version: '001-create-users-table',
    name: 'Create Users Table',
    versionNum: '001',
    checksum: 'def456'
  },
  {
    version: '002-add-reset-token-fields',
    name: 'Add Reset Token Fields',
    versionNum: '002',
    checksum: 'ghi789'
  }
];

const mockAppliedMigrations = [
  {
    version: '000-create-migration-table',
    name: 'Create Migration Table',
    applied_at: '2025-10-25T18:00:17.102Z',
    execution_time: 25,
    checksum: 'abc123'
  },
  {
    version: '001-create-users-table',
    name: 'Create Users Table',
    applied_at: '2025-10-25T18:01:28.312Z',
    execution_time: 46,
    checksum: 'def456'
  }
];

const describeOrSkip = skipIfNoDb();

describeOrSkip('Migration Endpoints', () => {
  let app;
  const originalEnv = process.env;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();

    // Set up default environment
    process.env = {
      ...originalEnv,
      MIGRATION_SECRET: 'test-secret-key',
      NODE_ENV: 'test'
    };

    // Default mock implementations
    getMigrationFiles.mockResolvedValue(mockMigrations);
    getAppliedMigrations.mockResolvedValue(mockAppliedMigrations);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ============================================================================
  // GET /api/migrate/status (Public Endpoint)
  // ============================================================================
  describe('GET /api/migrate/status', () => {
    describe('Success Cases', () => {
      it('should return migration status with all migrations applied', async () => {
        getAppliedMigrations.mockResolvedValue(mockAppliedMigrations);

        const response = await request(app)
          .get('/api/migrate/status')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          environment: 'test',
          database: 'neondb',
          appliedMigrations: 2,
          pendingMigrations: 1
        });

        expect(response.body.migrations).toHaveLength(3);
        expect(response.body.lastMigration).toMatchObject({
          version: '001-create-users-table',
          name: 'Create Users Table'
        });
      });

      it('should show pending migrations correctly', async () => {
        const response = await request(app)
          .get('/api/migrate/status')
          .expect(200);

        const pendingMigration = response.body.migrations.find(
          m => m.version === '002-add-reset-token-fields'
        );

        expect(pendingMigration).toMatchObject({
          version: '002-add-reset-token-fields',
          name: 'Add Reset Token Fields',
          status: 'pending',
          appliedAt: null
        });
      });

      it('should show applied migrations with timestamps', async () => {
        const response = await request(app)
          .get('/api/migrate/status')
          .expect(200);

        const appliedMigration = response.body.migrations.find(
          m => m.version === '001-create-users-table'
        );

        expect(appliedMigration).toMatchObject({
          version: '001-create-users-table',
          name: 'Create Users Table',
          status: 'applied',
          appliedAt: '2025-10-25T18:01:28.312Z'
        });
      });

      it('should include database version information', async () => {
        const response = await request(app)
          .get('/api/migrate/status')
          .expect(200);

        expect(response.body.pgVersion).toContain('PostgreSQL');
        expect(response.body.database).toBe('neondb');
      });

      it('should work with no migrations', async () => {
        getMigrationFiles.mockResolvedValue([]);
        getAppliedMigrations.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/migrate/status')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          appliedMigrations: 0,
          pendingMigrations: 0,
          lastMigration: null,
          migrations: []
        });
      });

      it('should work with all migrations applied', async () => {
        const allApplied = [
          ...mockAppliedMigrations,
          {
            version: '002-add-reset-token-fields',
            name: 'Add Reset Token Fields',
            applied_at: '2025-10-25T18:02:00.000Z',
            execution_time: 27,
            checksum: 'ghi789'
          }
        ];
        getAppliedMigrations.mockResolvedValue(allApplied);

        const response = await request(app)
          .get('/api/migrate/status')
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          appliedMigrations: 3,
          pendingMigrations: 0
        });

        expect(response.body.migrations.every(m => m.status === 'applied')).toBe(true);
      });
    });

    describe('Error Cases', () => {
      it('should handle database connection errors gracefully', async () => {
        getMigrationFiles.mockRejectedValue(new Error('Connection failed'));

        const response = await request(app)
          .get('/api/migrate/status')
          .expect(500);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Failed to get migration status'
        });
      });

      it('should hide error details in production', async () => {
        process.env.NODE_ENV = 'production';
        getMigrationFiles.mockRejectedValue(new Error('Sensitive error'));

        const response = await request(app)
          .get('/api/migrate/status')
          .expect(500);

        expect(response.body.message).toBe('Internal server error');
        expect(response.body.message).not.toContain('Sensitive');
      });

      it('should show error details in development', async () => {
        process.env.NODE_ENV = 'development';
        getMigrationFiles.mockRejectedValue(new Error('Detailed error'));

        const response = await request(app)
          .get('/api/migrate/status')
          .expect(500);

        expect(response.body.message).toBe('Detailed error');
      });
    });
  });

  // ============================================================================
  // POST /api/migrate/run (Admin Endpoint - Authentication)
  // ============================================================================
  describe('POST /api/migrate/run - Authentication', () => {
    describe('Authentication Failures', () => {
      it('should reject requests without Authorization header', async () => {
        const response = await request(app)
          .post('/api/migrate/run')
          .send({})
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Unauthorized',
          message: 'Missing or invalid Authorization header. Expected: Bearer <token>'
        });
      });

      it('should reject requests with malformed Authorization header', async () => {
        const response = await request(app)
          .post('/api/migrate/run')
          .set('Authorization', 'InvalidFormat')
          .send({})
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Unauthorized'
        });
      });

      it('should reject requests with wrong secret', async () => {
        const response = await request(app)
          .post('/api/migrate/run')
          .set('Authorization', 'Bearer wrong-secret')
          .send({})
          .expect(403);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Forbidden',
          message: 'Invalid migration secret'
        });
      });

      it('should reject when MIGRATION_SECRET is not configured', async () => {
        delete process.env.MIGRATION_SECRET;

        const response = await request(app)
          .post('/api/migrate/run')
          .set('Authorization', 'Bearer any-secret')
          .send({})
          .expect(500);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Migration endpoint not configured',
          message: 'MIGRATION_SECRET environment variable is not set'
        });
      });

      it('should be case-sensitive for Bearer keyword', async () => {
        const response = await request(app)
          .post('/api/migrate/run')
          .set('Authorization', 'bearer test-secret-key') // lowercase
          .send({})
          .expect(401);

        expect(response.body.error).toBe('Unauthorized');
      });
    });

    describe('Authentication Success', () => {
      it('should accept requests with valid Bearer token', async () => {
        getAppliedMigrations
          .mockResolvedValueOnce(mockAppliedMigrations) // Before check
          .mockResolvedValueOnce(mockAppliedMigrations); // After check

        const response = await request(app)
          .post('/api/migrate/run')
          .set('Authorization', 'Bearer test-secret-key')
          .send({})
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should work with secrets containing special characters', async () => {
        process.env.MIGRATION_SECRET = 'abc/123+xyz=';
        getAppliedMigrations
          .mockResolvedValueOnce(mockAppliedMigrations)
          .mockResolvedValueOnce(mockAppliedMigrations);

        const response = await request(app)
          .post('/api/migrate/run')
          .set('Authorization', 'Bearer abc/123+xyz=')
          .send({})
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // POST /api/migrate/run - Status Action
  // ============================================================================
  describe('POST /api/migrate/run - Status Action', () => {
    const authHeader = { Authorization: 'Bearer test-secret-key' };

    it('should return detailed status when action is "status"', async () => {
      const response = await request(app)
        .post('/api/migrate/run')
        .set(authHeader)
        .send({ action: 'status' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        action: 'status',
        environment: 'test',
        appliedMigrations: 2,
        pendingMigrations: 1
      });

      expect(response.body.migrations).toHaveLength(3);
    });

    it('should include execution time in status action', async () => {
      const response = await request(app)
        .post('/api/migrate/run')
        .set(authHeader)
        .send({ action: 'status' })
        .expect(200);

      const appliedMigration = response.body.migrations.find(
        m => m.status === 'applied'
      );

      expect(appliedMigration).toHaveProperty('executionTime');
    });

    it('should not run migrations when action is "status"', async () => {
      await request(app)
        .post('/api/migrate/run')
        .set(authHeader)
        .send({ action: 'status' })
        .expect(200);

      expect(migrate).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // POST /api/migrate/run - Run Migrations
  // ============================================================================
  describe('POST /api/migrate/run - Run Migrations', () => {
    const authHeader = { Authorization: 'Bearer test-secret-key' };

    describe('Success Cases', () => {
      it('should run pending migrations successfully', async () => {
        // Mock before state (2 applied)
        getAppliedMigrations
          .mockResolvedValueOnce(mockAppliedMigrations)
          // Mock after state (3 applied)
          .mockResolvedValueOnce([
            ...mockAppliedMigrations,
            {
              version: '002-add-reset-token-fields',
              name: 'Add Reset Token Fields',
              applied_at: '2025-10-25T18:02:00.000Z',
              execution_time: 27,
              checksum: 'ghi789'
            }
          ]);

        migrate.mockResolvedValue(undefined);

        const response = await request(app)
          .post('/api/migrate/run')
          .set(authHeader)
          .send({})
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          action: 'migrate',
          message: 'Successfully applied 1 migration(s)',
          appliedCount: 1
        });

        expect(response.body.migrations).toHaveLength(1);
        expect(response.body.migrations[0]).toMatchObject({
          version: '002-add-reset-token-fields',
          name: 'Add Reset Token Fields'
        });

        expect(migrate).toHaveBeenCalledTimes(1);
      });

      it('should handle no pending migrations', async () => {
        // Mock all migrations already applied
        getAppliedMigrations.mockResolvedValue([
          ...mockAppliedMigrations,
          {
            version: '002-add-reset-token-fields',
            name: 'Add Reset Token Fields',
            applied_at: '2025-10-25T18:02:00.000Z',
            execution_time: 27,
            checksum: 'ghi789'
          }
        ]);

        const response = await request(app)
          .post('/api/migrate/run')
          .set(authHeader)
          .send({})
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          action: 'migrate',
          message: 'No pending migrations. Database is up to date.',
          appliedCount: 0,
          migrations: []
        });

        expect(migrate).not.toHaveBeenCalled();
      });

      it('should apply multiple pending migrations', async () => {
        // Mock no migrations applied initially
        getAppliedMigrations
          .mockResolvedValueOnce([])
          // Mock all migrations applied after
          .mockResolvedValueOnce([
            ...mockAppliedMigrations,
            {
              version: '002-add-reset-token-fields',
              name: 'Add Reset Token Fields',
              applied_at: '2025-10-25T18:02:00.000Z',
              execution_time: 27,
              checksum: 'ghi789'
            }
          ]);

        migrate.mockResolvedValue(undefined);

        const response = await request(app)
          .post('/api/migrate/run')
          .set(authHeader)
          .send({})
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          action: 'migrate',
          message: 'Successfully applied 3 migration(s)',
          appliedCount: 3
        });

        expect(response.body.migrations).toHaveLength(3);
      });
    });

    describe('Error Cases', () => {
      it('should handle migration execution errors', async () => {
        getAppliedMigrations.mockResolvedValue(mockAppliedMigrations);
        migrate.mockRejectedValue(new Error('Migration failed: SQL syntax error'));

        const response = await request(app)
          .post('/api/migrate/run')
          .set(authHeader)
          .send({})
          .expect(500);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Migration failed'
        });
      });

      it('should handle database connection errors during run', async () => {
        getAppliedMigrations.mockRejectedValue(new Error('Connection timeout'));

        const response = await request(app)
          .post('/api/migrate/run')
          .set(authHeader)
          .send({})
          .expect(500);

        expect(response.body).toMatchObject({
          success: false,
          error: 'Migration failed'
        });
      });

      it('should hide error details in production', async () => {
        process.env.NODE_ENV = 'production';
        getAppliedMigrations.mockRejectedValue(new Error('Sensitive database error'));

        const response = await request(app)
          .post('/api/migrate/run')
          .set(authHeader)
          .send({})
          .expect(500);

        expect(response.body.message).toBe('Internal server error');
        expect(response.body.message).not.toContain('Sensitive');
      });
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================
  describe('Integration Tests', () => {
    const authHeader = { Authorization: 'Bearer test-secret-key' };

    it('should have consistent migration counts between status endpoints', async () => {
      // Get public status
      const publicResponse = await request(app)
        .get('/api/migrate/status')
        .expect(200);

      // Get admin status
      const adminResponse = await request(app)
        .post('/api/migrate/run')
        .set(authHeader)
        .send({ action: 'status' })
        .expect(200);

      expect(publicResponse.body.appliedMigrations).toBe(
        adminResponse.body.appliedMigrations
      );
      expect(publicResponse.body.pendingMigrations).toBe(
        adminResponse.body.pendingMigrations
      );
    });

    it('should increment applied migrations count after running migrations', async () => {
      // Get initial status
      await request(app)
        .get('/api/migrate/status')
        .expect(200);

      // Mock migration run
      getAppliedMigrations
        .mockResolvedValueOnce(mockAppliedMigrations)
        .mockResolvedValueOnce([
          ...mockAppliedMigrations,
          {
            version: '002-add-reset-token-fields',
            name: 'Add Reset Token Fields',
            applied_at: '2025-10-25T18:02:00.000Z',
            execution_time: 27,
            checksum: 'ghi789'
          }
        ]);

      migrate.mockResolvedValue(undefined);

      // Run migrations
      const runResponse = await request(app)
        .post('/api/migrate/run')
        .set(authHeader)
        .send({})
        .expect(200);

      expect(runResponse.body.appliedCount).toBe(1);

      // Verify the newly applied migration
      expect(runResponse.body.migrations[0].version).toBe('002-add-reset-token-fields');
    });
  });
});
