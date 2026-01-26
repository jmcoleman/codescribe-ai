/**
 * Migration 057 Tests: Rename campaigns to trial_programs
 *
 * Tests renaming campaigns table to trial_programs and updating all references.
 *
 * Pattern 11: ES Modules (see TEST-PATTERNS-GUIDE.md)
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import pkg from 'pg';
const { Pool } = pkg;

// Test database configuration
const testDb = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://test_user:test_password@localhost:5433/codescribe_test',
  max: 1,
});

describe('Migration 057: Rename campaigns to trial_programs', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await testDb.query('DROP TABLE IF EXISTS trial_programs CASCADE');
    await testDb.query('DROP TABLE IF EXISTS campaigns CASCADE');
    await testDb.query('DROP TABLE IF EXISTS user_trials CASCADE');
    await testDb.query('DROP TABLE IF EXISTS invite_codes CASCADE');
    await testDb.query('DROP TABLE IF EXISTS users CASCADE');

    // Create minimal users table for foreign keys
    await testDb.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create campaigns table (pre-migration state)
    await testDb.query(`
      CREATE TABLE campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        trial_tier VARCHAR(50) NOT NULL DEFAULT 'pro',
        trial_days INTEGER NOT NULL DEFAULT 14,
        starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ends_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT FALSE,
        created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        allow_previous_trial_users BOOLEAN DEFAULT FALSE,
        cooldown_days INTEGER DEFAULT 0,
        signups_count INTEGER DEFAULT 0,
        conversions_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT campaigns_cooldown_days_check CHECK (cooldown_days >= 0 AND cooldown_days <= 365)
      )
    `);

    await testDb.query(`
      CREATE INDEX idx_campaigns_eligibility ON campaigns(allow_previous_trial_users, cooldown_days)
    `);

    // Create invite_codes table (pre-migration state with campaign string)
    await testDb.query(`
      CREATE TABLE invite_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(32) UNIQUE NOT NULL,
        trial_tier VARCHAR(50) NOT NULL DEFAULT 'pro',
        duration_days INTEGER NOT NULL DEFAULT 14,
        max_uses INTEGER,
        current_uses INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        campaign VARCHAR(100),
        created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create user_trials table (pre-migration state with trial_program_id)
    await testDb.query(`
      CREATE TABLE user_trials (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invite_code_id INTEGER REFERENCES invite_codes(id) ON DELETE SET NULL,
        trial_program_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
        trial_tier VARCHAR(50) NOT NULL DEFAULT 'pro',
        duration_days INTEGER NOT NULL DEFAULT 14,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        ends_at TIMESTAMPTZ NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        source VARCHAR(50) DEFAULT 'invite',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await testDb.query(`
      CREATE INDEX idx_user_trials_campaign ON user_trials(trial_program_id)
    `);

    // Insert test data
    const userResult = await testDb.query(`
      INSERT INTO users (email) VALUES ('test@example.com') RETURNING id
    `);
    const userId = userResult.rows[0].id;

    // Insert test campaigns
    await testDb.query(`
      INSERT INTO trial_programs (name, description, trial_tier, trial_days, is_active, allow_previous_trial_users, cooldown_days)
      VALUES
        ('January 2026 Promo', 'New year campaign', 'pro', 14, true, false, 0),
        ('Re-engagement Trial Program', 'For lapsed users', 'team', 30, false, true, 90)
    `);

    // Insert test invite codes with campaign linkage
    await testDb.query(`
      INSERT INTO invite_codes (code, trial_tier, duration_days, campaign)
      VALUES
        ('PROMO2026', 'pro', 14, 'January 2026 Promo'),
        ('COMEBACK', 'team', 30, 'Re-engagement Trial Program'),
        ('STANDALONE', 'pro', 7, NULL)
    `);

    // Insert test trials
    const campaignResult = await testDb.query(`
      SELECT id FROM trial_programs WHERE name = 'January 2026 Promo'
    `);
    const trialProgramId = campaignResult.rows[0].id;

    await testDb.query(`
      INSERT INTO user_trials (user_id, trial_program_id, trial_tier, duration_days, ends_at, source)
      VALUES ($1, $2, 'pro', 14, NOW() + INTERVAL '14 days', 'auto_campaign')
    `, [userId, trialProgramId]);
  });

  afterAll(async () => {
    await testDb.end();
  });

  test('should rename campaigns table to trial_programs', async () => {
    // Run migration
    const migration = await import('fs').then(fs =>
      fs.promises.readFile('src/db/migrations/057-rename-campaigns-to-trial-programs.sql', 'utf8')
    );
    await testDb.query(migration);

    // Check table exists
    const result = await testDb.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'trial_programs'
    `);
    expect(result.rows.length).toBe(1);

    // Check old table doesn't exist
    const oldResult = await testDb.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'campaigns'
    `);
    expect(oldResult.rows.length).toBe(0);
  });

  test('should preserve all data during table rename', async () => {
    const result = await testDb.query(`
      SELECT * FROM trial_programs ORDER BY id
    `);

    expect(result.rows.length).toBe(2);
    expect(result.rows[0].name).toBe('January 2026 Promo');
    expect(result.rows[1].name).toBe('Re-engagement Trial Program');
  });

  test('should rename cooldown_days_check constraint', async () => {
    const result = await testDb.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'trial_programs'
        AND constraint_type = 'CHECK'
        AND constraint_name = 'trial_programs_cooldown_days_check'
    `);
    expect(result.rows.length).toBe(1);
  });

  test('should rename eligibility index', async () => {
    const result = await testDb.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'trial_programs'
        AND indexname = 'idx_trial_programs_eligibility'
    `);
    expect(result.rows.length).toBe(1);
  });

  test('should rename trial_program_id to trial_program_id in user_trials', async () => {
    const result = await testDb.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_trials'
        AND column_name = 'trial_program_id'
    `);
    expect(result.rows.length).toBe(1);

    // Check old column doesn't exist
    const oldResult = await testDb.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_trials'
        AND column_name = 'trial_program_id'
    `);
    expect(oldResult.rows.length).toBe(0);
  });

  test('should rename user_trials index', async () => {
    const result = await testDb.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'user_trials'
        AND indexname = 'idx_user_trials_program'
    `);
    expect(result.rows.length).toBe(1);
  });

  test('should preserve trial_program_id relationship in user_trials', async () => {
    const result = await testDb.query(`
      SELECT ut.*, tp.name as program_name
      FROM user_trials ut
      JOIN trial_programs tp ON ut.trial_program_id = tp.id
    `);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].program_name).toBe('January 2026 Promo');
    expect(result.rows[0].source).toBe('auto_campaign');
  });

  test('should add trial_program_id column to invite_codes', async () => {
    const result = await testDb.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'invite_codes'
        AND column_name = 'trial_program_id'
    `);
    expect(result.rows.length).toBe(1);
  });

  test('should backfill trial_program_id from campaign string', async () => {
    const result = await testDb.query(`
      SELECT ic.code, ic.campaign, ic.trial_program_id, tp.name as program_name
      FROM invite_codes ic
      LEFT JOIN trial_programs tp ON ic.trial_program_id = tp.id
      WHERE ic.code IN ('PROMO2026', 'COMEBACK', 'STANDALONE')
      ORDER BY ic.code
    `);

    expect(result.rows.length).toBe(3);

    // COMEBACK should be linked to Re-engagement Trial Program
    const comeback = result.rows.find(r => r.code === 'COMEBACK');
    expect(comeback.program_name).toBe('Re-engagement Trial Program');
    expect(comeback.trial_program_id).not.toBeNull();

    // PROMO2026 should be linked to January 2026 Promo
    const promo = result.rows.find(r => r.code === 'PROMO2026');
    expect(promo.program_name).toBe('January 2026 Promo');
    expect(promo.trial_program_id).not.toBeNull();

    // STANDALONE should have NULL trial_program_id
    const standalone = result.rows.find(r => r.code === 'STANDALONE');
    expect(standalone.trial_program_id).toBeNull();
    expect(standalone.program_name).toBeNull();
  });

  test('should create index on invite_codes.trial_program_id', async () => {
    const result = await testDb.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'invite_codes'
        AND indexname = 'idx_invite_codes_trial_program'
    `);
    expect(result.rows.length).toBe(1);
  });

  test('should maintain foreign key constraint from invite_codes to trial_programs', async () => {
    const result = await testDb.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'invite_codes'
        AND kcu.column_name = 'trial_program_id'
    `);

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].foreign_table_name).toBe('trial_programs');
    expect(result.rows[0].foreign_column_name).toBe('id');
  });

  test('should allow CRUD operations on trial_programs table', async () => {
    // Create
    const insertResult = await testDb.query(`
      INSERT INTO trial_programs (name, trial_tier, trial_days, is_active)
      VALUES ('Test Program', 'pro', 7, false)
      RETURNING id, name
    `);
    expect(insertResult.rows[0].name).toBe('Test Program');
    const programId = insertResult.rows[0].id;

    // Read
    const selectResult = await testDb.query(`
      SELECT * FROM trial_programs WHERE id = $1
    `, [programId]);
    expect(selectResult.rows[0].trial_tier).toBe('pro');

    // Update
    await testDb.query(`
      UPDATE trial_programs SET is_active = true WHERE id = $1
    `, [programId]);
    const updatedResult = await testDb.query(`
      SELECT is_active FROM trial_programs WHERE id = $1
    `, [programId]);
    expect(updatedResult.rows[0].is_active).toBe(true);

    // Delete
    await testDb.query(`DELETE FROM trial_programs WHERE id = $1`, [programId]);
    const deletedResult = await testDb.query(`
      SELECT * FROM trial_programs WHERE id = $1
    `, [programId]);
    expect(deletedResult.rows.length).toBe(0);
  });

  test('should still have deprecated campaign column in invite_codes', async () => {
    // Migration intentionally keeps the old campaign string column for rollback safety
    const result = await testDb.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'invite_codes'
        AND column_name = 'campaign'
    `);
    expect(result.rows.length).toBe(1);
  });
});
