-- ============================================================================
-- Migration: profiles.prefs — per-learner UI preferences JSONB (LX-A6, #582)
--
-- Adds a single JSONB `prefs` column to profiles for lightweight, learner-owned
-- UI preferences. First consumer is the LX-A6 session-end if-then plan
-- ("when's your next lesson?"), stored as:
--   prefs = { "nextLesson": { "day": "tue", "time": "19:00" } }
-- `day` is a closed-set weekday id (mon..sun); `time` is a "HH:MM" string. v1 is
-- display-only (no notification channel) — nothing reads this server-side, it is
-- surfaced back on the dashboard on the learner's next visit.
--
-- WRITE PATH: the existing self-service profiles RLS UPDATE policy
-- (auth.uid() = id) already permits a learner to write their own row, and the
-- enforce_profile_role_write() trigger guards ONLY the `role` column — so a
-- `prefs` write needs no new policy and no service_role. The column is
-- non-sensitive (UI prefs, no PII), so no column-grant change is required; the
-- existing authenticated own-row grant covers it, and anon is unaffected.
--
-- Idempotent (repo convention): ADD COLUMN IF NOT EXISTS. Safe to re-apply.
-- Mirrored into supabase/schema.sql (the full-schema snapshot).
-- ============================================================================

BEGIN;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS prefs JSONB NOT NULL DEFAULT '{}';

COMMIT;

-- ============================================================================
-- ROLLBACK (tested) — drops exactly the column this migration added. The column
-- is new (no prior data), so the drop is unconditional. Run as one transaction:
-- ----------------------------------------------------------------------------
-- BEGIN;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS prefs;
-- COMMIT;
-- ============================================================================
