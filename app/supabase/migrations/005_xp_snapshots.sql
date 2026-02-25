-- XP balance snapshots for time-windowed leaderboard filtering.
-- Populated periodically by /api/leaderboard/snapshot (cron or manual).
CREATE TABLE IF NOT EXISTS xp_snapshots (
  wallet TEXT NOT NULL,
  xp_balance BIGINT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (wallet, recorded_at)
);

-- Index for time-range queries (weekly/monthly lookups)
CREATE INDEX idx_xp_snapshots_recorded_at ON xp_snapshots (recorded_at DESC);

-- RLS
ALTER TABLE xp_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access for leaderboard queries
CREATE POLICY "XP snapshots readable" ON xp_snapshots
  FOR SELECT USING (true);

-- Service role has full access (snapshot API uses service role key)
CREATE POLICY "Service role xp_snapshots" ON xp_snapshots
  FOR ALL USING (true) WITH CHECK (true);
