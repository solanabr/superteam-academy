-- On-chain integration: add columns for tx signatures and on-chain references.
-- All columns are nullable — existing rows (pre-migration) get NULL.
-- A NULL tx_signature means the record was created via Supabase-only flow.

ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS tx_signature TEXT,
  ADD COLUMN IF NOT EXISTS wallet_address TEXT;

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS tx_signature TEXT,
  ADD COLUMN IF NOT EXISTS lesson_index SMALLINT;

ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS tx_signature TEXT,
  ADD COLUMN IF NOT EXISTS credential_type TEXT DEFAULT 'legacy';

ALTER TABLE user_achievements
  ADD COLUMN IF NOT EXISTS tx_signature TEXT,
  ADD COLUMN IF NOT EXISTS asset_address TEXT;

ALTER TABLE xp_transactions
  ADD COLUMN IF NOT EXISTS tx_signature TEXT;
