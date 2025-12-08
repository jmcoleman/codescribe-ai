-- Migration: 042-migrate-theme-to-preferences
-- Description: Migrate existing theme preferences from users table to user_preferences
-- Date: 2025-12-08

-- Migrate existing theme preferences from users table
-- Creates user_preferences row for each user with their current theme setting
INSERT INTO user_preferences (user_id, theme, created_at, updated_at)
SELECT id, COALESCE(theme_preference, 'auto'), NOW(), NOW()
FROM users
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Note: Keep users.theme_preference column for backward compatibility
-- Can drop in future migration after frontend is fully updated
