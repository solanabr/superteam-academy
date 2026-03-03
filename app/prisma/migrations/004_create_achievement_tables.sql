-- ============================================================================
-- Migration 004: Achievement tracking table
-- Stores awarded achievements with optional on-chain references.
-- ============================================================================

-- Achievement awards
CREATE TABLE IF NOT EXISTS achievements (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,                   -- e.g. 'first-steps', 'week-warrior'
    awarded_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    asset_address TEXT,                             -- on-chain NFT address (nullable until minted)
    tx_hash       TEXT,                             -- Solana tx hash (nullable)
    UNIQUE(user_id, achievement_id)                 -- one award per user per achievement
);

-- Indexes
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_achievement_id ON achievements(achievement_id);

-- RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Users can read their own achievements
CREATE POLICY "Users can view own achievements"
    ON achievements FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can manage all achievements
CREATE POLICY "Service role full access on achievements"
    ON achievements FOR ALL
    USING (auth.role() = 'service_role');
