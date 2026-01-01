-- Migration 002: Add username_customized flag
-- This tracks whether users have chosen their own username

ALTER TABLE users ADD COLUMN IF NOT EXISTS username_customized BOOLEAN DEFAULT FALSE;

-- Existing users with custom usernames (not auto-generated from OAuth) should be marked as customized
-- For now, mark all existing non-guest users as needing to pick a username
UPDATE users SET username_customized = FALSE WHERE is_guest = FALSE;
