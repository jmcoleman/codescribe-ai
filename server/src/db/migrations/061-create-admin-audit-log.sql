-- Migration: Create admin audit log table
-- Version: v3.5.0
-- Date: 2026-01-14
-- Description: Creates comprehensive audit logging for all admin actions including
--              trial programs, invite codes, user management, tier overrides, etc.

-- =============================================================================
-- Create admin_audit_log table
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  admin_email VARCHAR(255) NOT NULL, -- Denormalized for retention
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'activate', 'deactivate', 'grant', 'revoke', etc.
  resource_type VARCHAR(50) NOT NULL, -- 'trial_program', 'invite_code', 'user', 'tier_override', etc.
  resource_id INTEGER, -- ID of the resource (nullable for bulk operations)
  resource_name VARCHAR(255), -- Denormalized name/identifier for clarity
  old_values JSONB, -- Snapshot before change
  new_values JSONB, -- Snapshot after change
  reason TEXT, -- Admin-provided reason for the action
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context (IP, user agent, request ID, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE admin_audit_log IS 'Comprehensive audit log for all admin actions across the application';
COMMENT ON COLUMN admin_audit_log.admin_user_id IS 'User ID of the admin who performed the action';
COMMENT ON COLUMN admin_audit_log.admin_email IS 'Email of admin (denormalized for retention after account deletion)';
COMMENT ON COLUMN admin_audit_log.action IS 'Type of action: create, update, delete, activate, deactivate, grant, revoke, etc.';
COMMENT ON COLUMN admin_audit_log.resource_type IS 'Type of resource being modified: trial_program, invite_code, user, tier_override, etc.';
COMMENT ON COLUMN admin_audit_log.resource_id IS 'ID of the specific resource (null for bulk operations)';
COMMENT ON COLUMN admin_audit_log.resource_name IS 'Human-readable name/identifier of the resource for easier reporting';
COMMENT ON COLUMN admin_audit_log.old_values IS 'JSON snapshot of values before the change';
COMMENT ON COLUMN admin_audit_log.new_values IS 'JSON snapshot of values after the change';
COMMENT ON COLUMN admin_audit_log.reason IS 'Admin-provided reason for the action (for accountability)';
COMMENT ON COLUMN admin_audit_log.metadata IS 'Additional context: IP address, user agent, request ID, affected user IDs, etc.';

-- =============================================================================
-- Create indexes for efficient queries
-- =============================================================================

-- Most common query: filter by resource type and ID
CREATE INDEX idx_admin_audit_resource ON admin_audit_log(resource_type, resource_id, created_at DESC);

-- Admin activity tracking
CREATE INDEX idx_admin_audit_admin_user ON admin_audit_log(admin_user_id, created_at DESC);

-- Time-based queries (recent actions, date ranges)
CREATE INDEX idx_admin_audit_created_at ON admin_audit_log(created_at DESC);

-- Action-specific queries
CREATE INDEX idx_admin_audit_action ON admin_audit_log(action, resource_type);

-- Full-text search on resource names
CREATE INDEX idx_admin_audit_resource_name ON admin_audit_log(resource_name);

-- Email lookup (for orphaned records after admin deletion)
CREATE INDEX idx_admin_audit_admin_email ON admin_audit_log(admin_email);

-- =============================================================================
-- Add constraint for valid actions
-- =============================================================================

ALTER TABLE admin_audit_log
  ADD CONSTRAINT check_valid_action
    CHECK (action IN (
      'create',
      'update',
      'delete',
      'activate',
      'deactivate',
      'grant',
      'revoke',
      'suspend',
      'unsuspend',
      'extend',
      'cancel',
      'export',
      'toggle',
      'restore'
    ));

-- =============================================================================
-- Add constraint for valid resource types
-- =============================================================================

ALTER TABLE admin_audit_log
  ADD CONSTRAINT check_valid_resource_type
    CHECK (resource_type IN (
      'trial_program',
      'invite_code',
      'user',
      'user_role',
      'tier_override',
      'trial',
      'subscription',
      'analytics'
    ));

-- =============================================================================
-- Test the migration
-- =============================================================================

DO $$
DECLARE
  test_admin_id INTEGER;
  test_audit_id INTEGER;
BEGIN
  -- Create test admin user
  INSERT INTO users (email, first_name, last_name, password_hash, email_verified, role)
  VALUES ('audit-admin@example.com', 'Audit', 'Admin', 'hash', true, 'admin')
  RETURNING id INTO test_admin_id;

  -- Insert test audit log entry
  INSERT INTO admin_audit_log (
    admin_user_id,
    admin_email,
    action,
    resource_type,
    resource_id,
    resource_name,
    old_values,
    new_values,
    reason,
    metadata
  ) VALUES (
    test_admin_id,
    'audit-admin@example.com',
    'create',
    'trial_program',
    123,
    'Test Trial Program',
    NULL,
    '{"name": "Test Trial Program", "trial_tier": "pro", "trial_days": 14}'::jsonb,
    'Testing audit log',
    '{"ip": "127.0.0.1", "user_agent": "test"}'::jsonb
  )
  RETURNING id INTO test_audit_id;

  -- Verify audit entry was created
  IF (SELECT COUNT(*) FROM admin_audit_log WHERE id = test_audit_id) = 1 THEN
    RAISE NOTICE 'Migration test PASSED: Audit entry created successfully';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Audit entry not found';
  END IF;

  -- Verify constraints work
  BEGIN
    INSERT INTO admin_audit_log (
      admin_user_id,
      admin_email,
      action,
      resource_type
    ) VALUES (
      test_admin_id,
      'audit-admin@example.com',
      'invalid_action',
      'trial_program'
    );
    RAISE EXCEPTION 'Migration test FAILED: Invalid action constraint not enforced';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Migration test PASSED: Invalid action constraint enforced';
  END;

  -- Clean up test data
  DELETE FROM admin_audit_log WHERE admin_user_id = test_admin_id;
  DELETE FROM users WHERE id = test_admin_id;

  RAISE NOTICE 'Migration 061 completed successfully';
END $$;

-- =============================================================================
-- Rollback (if needed):
-- =============================================================================
-- DROP TABLE IF EXISTS admin_audit_log CASCADE;
