-- ============================================================================
-- Superteam Academy — RLS Policies, Audit Fields, and Audit Logs
-- ============================================================================

-- =========================
-- RLS Policies
-- =========================

-- Service role can do everything on profiles
CREATE POLICY "Service role has full access to profiles" ON profiles
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- Service role can do everything on linked_accounts
CREATE POLICY "Service role has full access to linked_accounts" ON linked_accounts
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- =========================
-- Audit columns on profiles
-- =========================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- =========================
-- Audit columns on linked_accounts
-- =========================
ALTER TABLE linked_accounts ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
ALTER TABLE linked_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- =========================
-- Audit logs table
-- =========================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to audit_logs" ON audit_logs
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );
