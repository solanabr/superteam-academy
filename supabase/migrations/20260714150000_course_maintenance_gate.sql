-- ============================================
-- Per-course maintenance gate (WS-2 #453 rail 3)
-- ============================================
-- close_course + create_course (the recreate server path, lib/admin/recreate-course.ts)
-- is NOT atomic: a closed 0-lamport account is not garbage-collected until the tx
-- ends, so `create_course`'s `init` must run in a LATER transaction. Between the
-- two, the Course PDA does not exist. `event-handlers.ts`'s `tryFinalizeCourse`
-- used to plain `return` (no `queueFailedAction`) when `fetchCourse` came back
-- null — so a learner who finished their last lesson during that window
-- permanently lost auto-finalize, with nothing queued to retry it.
--
-- This column is the durable signal the recreate path sets BEFORE closing and
-- clears AFTER the create lands, so on-chain write paths for that one course can
-- refuse/queue instead of racing the absent-PDA window:
--   - the webhook finalize path (event-handlers.ts:tryFinalizeCourse) — queues
--   - /api/lessons/complete — 503s (learner-facing, retriable)
--   - /api/certificates/mint — 503s (learner-facing, retriable)
--
-- Lives on `onchain_deployments` (one row per synced course, PK = content_id)
-- rather than a new table — this is exactly the "mutable on-chain sync state"
-- seam that table already owns (see 20260711120000_onchain_deployments.sql).
-- Reads/writes are service_role-only, same as every other column here: the base
-- table has RLS with no policies, and this column is intentionally NOT exposed
-- through `public_onchain_deployments` — it is an operational flag for the
-- server-side write paths, not a public catalog signal.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS. Re-running is a no-op.

ALTER TABLE public.onchain_deployments
  ADD COLUMN IF NOT EXISTS in_maintenance BOOLEAN NOT NULL DEFAULT false;
