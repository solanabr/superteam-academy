-- Leaderboard: XP transactions from on-chain sync + system config for tracking
DROP TABLE IF EXISTS xp_transactions CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;

-- XP Transaction Log (on-chain sourced)
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  course_pda TEXT,
  tx_signature TEXT,
  transaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tx_signature, user_id)
);

CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_transaction_at ON xp_transactions(transaction_at);
CREATE INDEX idx_xp_transactions_course_pda ON xp_transactions(course_pda);

-- System config for sync tracking
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY xp_read ON xp_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY system_config_read ON system_config FOR SELECT USING (true);

-- Triggers
CREATE OR REPLACE TRIGGER system_config_updated_at BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Initialize sync markers
INSERT INTO system_config (key, value, description)
VALUES
  ('leaderboard_last_synced_signature', NULL, 'Last Solana tx signature processed by leaderboard sync.'),
  ('leaderboard_last_synced_at', NULL, 'Timestamp of last successful leaderboard sync.')
ON CONFLICT (key) DO NOTHING;
