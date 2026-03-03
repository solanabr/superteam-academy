-- Migration: 006_rbac
-- Adds role-based access control: profile roles, admin whitelist, role change audit log

-- Role + onboarding on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student'
  CHECK (role IN ('student', 'instructor'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS session_version INT DEFAULT 1;

-- Mark existing users as onboarded so they are NOT forced into /onboarding
UPDATE profiles SET onboarding_complete = true WHERE created_at < now();

-- Admin whitelist — managed by existing admins only
-- Wallet column stores Solana base58 addresses (case-sensitive by design)
CREATE TABLE IF NOT EXISTS admin_whitelist (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT,
    wallet     TEXT,
    added_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
    added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    removed_at TIMESTAMPTZ,
    CONSTRAINT admin_whitelist_has_identifier CHECK (email IS NOT NULL OR wallet IS NOT NULL)
);

-- Partial unique indexes: only one active entry per email/wallet
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_wl_email ON admin_whitelist (email) WHERE email IS NOT NULL AND removed_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_wl_wallet ON admin_whitelist (wallet) WHERE wallet IS NOT NULL AND removed_at IS NULL;

-- Index for count queries filtering on removed_at IS NULL
CREATE INDEX IF NOT EXISTS idx_admin_wl_active ON admin_whitelist (id) WHERE removed_at IS NULL;

-- Role change audit log (consider archiving rows older than 1 year)
CREATE TABLE IF NOT EXISTS role_change_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    old_role    TEXT,
    new_role    TEXT NOT NULL,
    changed_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reason      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_log_profile ON role_change_log (profile_id);
