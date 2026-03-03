-- Rollback: 006_rbac
-- role_change_log has FK to profiles (ON DELETE CASCADE) — safe to drop first
-- admin_whitelist has FK to profiles (ON DELETE SET NULL) — safe to drop first
DROP TABLE IF EXISTS role_change_log;
DROP TABLE IF EXISTS admin_whitelist;
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
ALTER TABLE profiles DROP COLUMN IF EXISTS onboarding_complete;
ALTER TABLE profiles DROP COLUMN IF EXISTS session_version;
