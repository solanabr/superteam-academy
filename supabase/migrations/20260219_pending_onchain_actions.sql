CREATE TABLE pending_onchain_actions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type    TEXT NOT NULL CHECK (action_type IN ('achievement', 'certificate', 'course_finalize', 'xp')),
  reference_id   TEXT NOT NULL,
  payload        JSONB NOT NULL,
  failed_at      TIMESTAMPTZ DEFAULT NOW(),
  retry_count    INT DEFAULT 0,
  last_error     TEXT,
  resolved_at    TIMESTAMPTZ,
  UNIQUE(user_id, action_type, reference_id)
);

CREATE INDEX idx_pending_onchain_actions_user_id
  ON pending_onchain_actions(user_id)
  WHERE resolved_at IS NULL;

ALTER TABLE pending_onchain_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_pending_actions"
  ON pending_onchain_actions
  FOR SELECT USING (auth.uid() = user_id);
