-- Migration 012: Add user roles and generic audit logging system
-- Created: 2025-11-13
-- Description: Adds role-based access control with automatic audit logging for all user field changes

-- Add role column to users table
ALTER TABLE users
  ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user';

-- Add constraint for valid roles
ALTER TABLE users
  ADD CONSTRAINT check_valid_role
    CHECK (role IN ('user', 'support', 'admin', 'super_admin'));

-- Index for role-based queries
CREATE INDEX idx_users_role ON users(role);

-- Create generic user audit table
-- Tracks ALL user field changes (role, email, first_name, last_name, tier, etc.)
-- IMPORTANT: ON DELETE RESTRICT prevents accidental deletion of users with audit history
CREATE TABLE IF NOT EXISTS user_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  user_email VARCHAR(255), -- Denormalized for retention after user deletion
  changed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  field_name VARCHAR(100) NOT NULL, -- 'role', 'email', 'first_name', 'last_name', 'tier', etc.
  old_value TEXT, -- Previous value (stored as text)
  new_value TEXT, -- New value (stored as text)
  change_type VARCHAR(50) DEFAULT 'update', -- 'update', 'delete', 'restore'
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb -- Additional context (IP, user agent, etc.)
);

-- Indexes for efficient queries
CREATE INDEX idx_user_audit_user_id ON user_audit_log(user_id);
CREATE INDEX idx_user_audit_field_name ON user_audit_log(field_name);
CREATE INDEX idx_user_audit_user_field ON user_audit_log(user_id, field_name, changed_at DESC);
CREATE INDEX idx_user_audit_changed_by_id ON user_audit_log(changed_by_id);
CREATE INDEX idx_user_audit_changed_at ON user_audit_log(changed_at DESC);
CREATE INDEX idx_user_audit_user_email ON user_audit_log(user_email); -- For orphaned records after deletion

-- Create trigger function for automatic audit logging
-- NOTE: Does NOT fire on INSERT (only on UPDATE) to avoid auditing initial values
-- Tracks specific fields only (excludes password_hash, updated_at, etc.)
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
DECLARE
  audit_fields TEXT[] := ARRAY['role', 'email', 'first_name', 'last_name', 'tier', 'email_verified', 'deleted_at'];
  field TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Loop through each field we want to audit
  FOREACH field IN ARRAY audit_fields
  LOOP
    -- Get old and new values as text
    EXECUTE format('SELECT ($1).%I::TEXT', field) INTO old_val USING OLD;
    EXECUTE format('SELECT ($1).%I::TEXT', field) INTO new_val USING NEW;

    -- Only log if the field actually changed
    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO user_audit_log (
        user_id,
        user_email,
        field_name,
        old_value,
        new_value,
        change_type,
        reason,
        metadata
      ) VALUES (
        NEW.id,
        NEW.email, -- Denormalized for retention
        field,
        old_val,
        new_val,
        CASE
          WHEN field = 'deleted_at' AND new_val IS NOT NULL THEN 'delete'
          WHEN field = 'deleted_at' AND old_val IS NOT NULL AND new_val IS NULL THEN 'restore'
          ELSE 'update'
        END,
        'Automatic audit log via trigger',
        jsonb_build_object(
          'changed_via', 'database_trigger',
          'timestamp', NOW()
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to users table
CREATE TRIGGER trigger_audit_user_changes
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_changes();

-- Verify migration
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

SELECT table_name FROM information_schema.tables
WHERE table_name = 'user_audit_log';

SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_audit_user_changes';

-- Test trigger with sample data (will be cleaned up in test)
DO $$
DECLARE
  test_user_id INTEGER;
BEGIN
  -- Insert test user
  INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
  VALUES ('audit-test@example.com', 'Test', 'User', 'hash', true)
  RETURNING id INTO test_user_id;

  -- Update role (should create audit entry)
  UPDATE users SET role = 'admin' WHERE id = test_user_id;

  -- Update email (should create audit entry)
  UPDATE users SET email = 'audit-test-updated@example.com' WHERE id = test_user_id;

  -- Verify 2 audit entries created
  IF (SELECT COUNT(*) FROM user_audit_log WHERE user_id = test_user_id) = 2 THEN
    RAISE NOTICE 'Migration test PASSED: 2 audit entries created (role + email)';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Expected 2 audit entries, got %',
      (SELECT COUNT(*) FROM user_audit_log WHERE user_id = test_user_id);
  END IF;

  -- Verify field names are correct
  IF (SELECT COUNT(*) FROM user_audit_log WHERE user_id = test_user_id AND field_name IN ('role', 'email')) = 2 THEN
    RAISE NOTICE 'Migration test PASSED: Field names are correct (role, email)';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Incorrect field names';
  END IF;

  -- Clean up test data
  DELETE FROM user_audit_log WHERE user_id = test_user_id;
  DELETE FROM users WHERE id = test_user_id;

  RAISE NOTICE 'Migration 012 completed successfully';
END $$;
