-- Migration: Add encrypted GitHub access token column
-- Purpose: Store OAuth access tokens (encrypted) for private repository access
-- Date: 2025-12-11

ALTER TABLE users ADD COLUMN github_access_token_encrypted TEXT;

-- Add a comment explaining the column purpose
COMMENT ON COLUMN users.github_access_token_encrypted IS 'Encrypted GitHub OAuth access token for private repo access (AES-256-GCM)';
