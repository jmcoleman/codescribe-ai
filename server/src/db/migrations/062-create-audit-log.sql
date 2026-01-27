-- Migration: Create HIPAA audit log table
-- Version: v3.6.0
-- Date: 2026-01-26
-- Description: Creates comprehensive audit logging for all user actions with PHI tracking
--              Supports HIPAA compliance requirements for 7-year retention

-- =============================================================================
-- Create audit_logs table
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255), -- Denormalized for retention after user deletion
  action VARCHAR(100) NOT NULL, -- 'code_generation', 'code_upload', 'api_call', etc.
  resource_type VARCHAR(50), -- 'documentation', 'file', 'api_request', etc.
  resource_id VARCHAR(255), -- Optional identifier for the resource
  input_hash VARCHAR(64), -- SHA-256 hash of input code (not the actual code)
  contains_potential_phi BOOLEAN DEFAULT FALSE, -- PHI detection flag
  phi_score INTEGER DEFAULT 0, -- PHI confidence score (0-100)
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT, -- Sanitized error message (no PHI)
  ip_address INET, -- Client IP address
  user_agent TEXT, -- Browser/client user agent
  duration_ms INTEGER, -- Request duration in milliseconds
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context (doc_type, language, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'HIPAA-compliant audit log for all user actions (7-year retention)';
COMMENT ON COLUMN audit_logs.user_id IS 'User ID (nullable if user is deleted, FK set to NULL)';
COMMENT ON COLUMN audit_logs.user_email IS 'Email at time of action (denormalized for retention)';
COMMENT ON COLUMN audit_logs.action IS 'Action type: code_generation, code_upload, file_download, api_call, etc.';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource: documentation, file, batch, etc.';
COMMENT ON COLUMN audit_logs.resource_id IS 'Optional identifier for the specific resource';
COMMENT ON COLUMN audit_logs.input_hash IS 'SHA-256 hash of input (enables duplicate detection without storing code)';
COMMENT ON COLUMN audit_logs.contains_potential_phi IS 'True if PHI detection found potential PHI in input';
COMMENT ON COLUMN audit_logs.phi_score IS 'PHI confidence score: 0=none, 1-5=low, 6-15=medium, 16+=high';
COMMENT ON COLUMN audit_logs.success IS 'True if action completed successfully, false if error occurred';
COMMENT ON COLUMN audit_logs.error_message IS 'Sanitized error message (must not contain PHI)';
COMMENT ON COLUMN audit_logs.ip_address IS 'Client IP address for security tracking';
COMMENT ON COLUMN audit_logs.user_agent IS 'Client user agent string';
COMMENT ON COLUMN audit_logs.duration_ms IS 'Action duration in milliseconds for performance monitoring';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context: doc_type, language, file_count, etc.';
COMMENT ON COLUMN audit_logs.created_at IS 'Timestamp when action occurred (indexed for retention queries)';

-- =============================================================================
-- Create indexes for efficient queries
-- =============================================================================

-- Most common query: filter by user and date range
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);

-- PHI risk queries: find all high-risk activities
CREATE INDEX idx_audit_logs_phi ON audit_logs(contains_potential_phi, phi_score DESC, created_at DESC);

-- Time-based queries for compliance reports (date range, retention)
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Action-specific queries (what actions are users taking?)
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- Email lookup (for orphaned records after user deletion)
CREATE INDEX idx_audit_logs_email ON audit_logs(user_email);

-- Performance monitoring queries
CREATE INDEX idx_audit_logs_duration ON audit_logs(duration_ms DESC) WHERE duration_ms IS NOT NULL;

-- Error investigation queries
CREATE INDEX idx_audit_logs_errors ON audit_logs(success, created_at DESC) WHERE success = FALSE;

-- =============================================================================
-- Add constraint for valid actions
-- =============================================================================

ALTER TABLE audit_logs
  ADD CONSTRAINT check_valid_action
    CHECK (action IN (
      'code_generation',
      'code_generation_stream',
      'code_upload',
      'file_download',
      'batch_generation',
      'api_call',
      'workspace_save',
      'workspace_load',
      'graph_generation',
      'project_creation',
      'export'
    ));

-- =============================================================================
-- Add constraint for valid resource types
-- =============================================================================

ALTER TABLE audit_logs
  ADD CONSTRAINT check_valid_resource_type
    CHECK (resource_type IS NULL OR resource_type IN (
      'documentation',
      'file',
      'batch',
      'workspace',
      'graph',
      'project',
      'export'
    ));

-- =============================================================================
-- Add constraint for PHI score range
-- =============================================================================

ALTER TABLE audit_logs
  ADD CONSTRAINT check_phi_score_range
    CHECK (phi_score >= 0 AND phi_score <= 100);

-- =============================================================================
-- Test the migration
-- =============================================================================

DO $$
DECLARE
  test_user_id INTEGER;
  test_audit_id INTEGER;
BEGIN
  -- Create test user
  INSERT INTO users (email, first_name, last_name, password_hash, email_verified)
  VALUES ('audit-test@example.com', 'Audit', 'Test', 'hash', true)
  RETURNING id INTO test_user_id;

  -- Insert test audit log entry
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    resource_type,
    input_hash,
    contains_potential_phi,
    phi_score,
    success,
    ip_address,
    user_agent,
    duration_ms,
    metadata
  ) VALUES (
    test_user_id,
    'audit-test@example.com',
    'code_generation',
    'documentation',
    'abc123def456789012345678901234567890123456789012345678901234',
    true,
    18,
    true,
    '127.0.0.1',
    'Mozilla/5.0',
    1250,
    '{"doc_type": "README", "language": "javascript"}'::jsonb
  )
  RETURNING id INTO test_audit_id;

  -- Verify audit entry was created
  IF (SELECT COUNT(*) FROM audit_logs WHERE id = test_audit_id) = 1 THEN
    RAISE NOTICE 'Migration test PASSED: Audit entry created successfully';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Audit entry not found';
  END IF;

  -- Verify PHI score constraint
  BEGIN
    INSERT INTO audit_logs (
      user_id,
      user_email,
      action,
      success,
      phi_score
    ) VALUES (
      test_user_id,
      'audit-test@example.com',
      'code_generation',
      true,
      150 -- Invalid: over 100
    );
    RAISE EXCEPTION 'Migration test FAILED: PHI score constraint not enforced';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Migration test PASSED: PHI score constraint enforced';
  END;

  -- Verify action constraint
  BEGIN
    INSERT INTO audit_logs (
      user_id,
      user_email,
      action,
      success
    ) VALUES (
      test_user_id,
      'audit-test@example.com',
      'invalid_action',
      true
    );
    RAISE EXCEPTION 'Migration test FAILED: Action constraint not enforced';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'Migration test PASSED: Action constraint enforced';
  END;

  -- Test user deletion sets FK to NULL
  DELETE FROM users WHERE id = test_user_id;

  IF (SELECT user_id FROM audit_logs WHERE id = test_audit_id) IS NULL THEN
    RAISE NOTICE 'Migration test PASSED: User deletion sets audit_logs.user_id to NULL';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: User deletion did not set FK to NULL';
  END IF;

  -- Verify email is retained after user deletion
  IF (SELECT user_email FROM audit_logs WHERE id = test_audit_id) = 'audit-test@example.com' THEN
    RAISE NOTICE 'Migration test PASSED: Email retained after user deletion';
  ELSE
    RAISE EXCEPTION 'Migration test FAILED: Email not retained';
  END IF;

  -- Clean up test data
  DELETE FROM audit_logs WHERE id = test_audit_id;

  RAISE NOTICE 'Migration 062 completed successfully';
END $$;

-- =============================================================================
-- Rollback (if needed):
-- =============================================================================
-- DROP TABLE IF EXISTS audit_logs CASCADE;
