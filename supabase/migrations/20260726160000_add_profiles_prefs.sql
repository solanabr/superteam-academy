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
-- WRITE PATH + WHY IT IS BOUNDED: prefs is written self-service via the existing
-- own-row profiles UPDATE RLS policy (auth.uid() = id) — no new policy, no
-- service_role. No column on profiles is privilege-bearing (prefs is
-- non-sensitive UI state, not in the public_profiles view, carries no PII), so
-- the ONLY thing standing between a self-write and abuse is the shape+size CHECK
-- below — mirroring how #695 bounds its self-writable segment/goal/daily_goal
-- columns. Without the bound, an authenticated user could stuff arbitrary
-- unbounded JSON into their own row; with it, prefs must be a JSON OBJECT of at
-- most 2 KB.
--
-- Bounds (F3 — bound self-writable columns on both shape and size):
--   * chk_profiles_prefs_object — jsonb_typeof(prefs) = 'object' (no arrays,
--     scalars, or JSON null; a namespaced object is the only valid container).
--   * chk_profiles_prefs_size   — pg_column_size(prefs) <= 2048 bytes (headroom
--     for a handful of small preference keys; not a document store).
-- If a future Postgres rejects pg_column_size in a CHECK, a BEFORE INSERT/UPDATE
-- trigger raising on oversize is the drop-in replacement; the bound, not the
-- mechanism, is the invariant.
--
-- Idempotent (repo convention): ADD COLUMN IF NOT EXISTS + pg_constraint-guarded
-- CHECK adds (Postgres has no ADD CONSTRAINT IF NOT EXISTS for CHECKs). Re-
-- applying is a no-op. This migration touches no role or privilege machinery —
-- prefs is non-privileged UI state. Mirrored into supabase/schema.sql.
-- ============================================================================

BEGIN;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS prefs JSONB NOT NULL DEFAULT '{}';

-- Shape+size bounds. Guarded adds: no ADD CONSTRAINT IF NOT EXISTS for CHECKs.
-- Every existing row is the default '{}' (a 2-byte object), so both CHECKs
-- validate cleanly against current data.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_profiles_prefs_object'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT chk_profiles_prefs_object CHECK (jsonb_typeof(prefs) = 'object');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_profiles_prefs_size'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT chk_profiles_prefs_size CHECK (pg_column_size(prefs) <= 2048);
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK (tested) — drops exactly what this migration added. The column and
-- its two CHECKs are all new (nothing referenced them before), and DROP COLUMN
-- removes the CHECKs with it, so the rollback is an unconditional column drop.
-- It touches no role or privilege machinery.
-- Run as one transaction:
-- ----------------------------------------------------------------------------
-- BEGIN;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS prefs;  -- drops both prefs CHECKs
-- COMMIT;
-- ============================================================================
