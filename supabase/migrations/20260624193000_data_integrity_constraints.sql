-- ============================================
-- Data-integrity constraints (P1-9)
-- ============================================
-- Three classes of hardening, all idempotent so re-running this migration (or
-- applying it on top of a partially-migrated DB) is a no-op:
--
--   1. NOT NULL on ownership user_id FK columns that were nullable. A NULL
--      user_id makes a row un-ownable (RLS "auth.uid() = user_id" can never
--      match it, and it survives the ON DELETE CASCADE from profiles), so such
--      a row is orphan-able. Every legitimate writer (Helius webhook handlers,
--      retry queue, admin resync, SECURITY DEFINER RPCs) resolves a concrete
--      user_id and returns early when it is null, so these columns are always
--      set in practice.
--
--   2. A partial UNIQUE index on certificates.tx_signature so the same mint
--      transaction can never be recorded as two certificate rows. Partial
--      (WHERE tx_signature IS NOT NULL) because off-chain/legacy and resync rows
--      legitimately have no signature (multiple NULLs must stay allowed).
--
--   3. FK indexes on thread_views.thread_id and on flags.thread_id / answer_id /
--      resolved_by so their ON DELETE CASCADE / SET NULL paths and reverse
--      lookups use an index instead of a sequential scan.
--
-- ── Migration safety ──────────────────────────────────────────────────────
-- ALTER ... SET NOT NULL and CREATE UNIQUE INDEX both FAIL (and roll back) if
-- existing data violates them. That is the safe failure mode: it aborts loudly
-- rather than corrupting. If an apply fails here it means a row already holds a
-- NULL user_id or a duplicate non-null tx_signature that must be cleaned first;
-- find offenders with, e.g.:
--   SELECT id FROM <table> WHERE user_id IS NULL;
--   SELECT tx_signature FROM certificates WHERE tx_signature IS NOT NULL
--     GROUP BY tx_signature HAVING count(*) > 1;
--
-- Why tx_signature UNIQUE is added ONLY to certificates and NOT to enrollments,
-- user_progress, user_achievements, or xp_transactions:
--   The Helius webhook decodes EVERY Anchor event from a transaction and
--   dispatches each with that transaction's single signature (see
--   lib/helius/event-decoder.ts + the per-event loop in the webhook route).
--   So one transaction can legitimately write the SAME tx_signature to several
--   rows of those tables:
--     * xp_transactions  — a CourseFinalized tx awards both a learner bonus and
--       a creator reward (two award_xp calls, same signature). xp_transactions
--       is instead de-duplicated by the existing unique (user_id,
--       idempotency_key) index.
--     * user_achievements — a tx can award more than one achievement.
--     * enrollments / user_progress — a tx can batch multiple enroll /
--       complete_lesson instructions.
--   A per-row UNIQUE on tx_signature would reject those legitimate rows. Only
--   certificates has a clean one-mint = one-signature = one-(user,course)
--   invariant (every non-null writer uses a freshly generated mint signature;
--   the resync writer inserts NULL), so it is the only table where the
--   constraint is both safe and meaningful.

-- ─────────────────────────────────────────────
-- 1. NOT NULL on ownership user_id FK columns
-- ─────────────────────────────────────────────
-- SET NOT NULL is itself idempotent (no-op when the column is already NOT NULL),
-- so no guard is required. thread_views.user_id / votes.user_id /
-- flags.reporter_id / threads.author_id / answers.author_id are already NOT NULL
-- (PK or explicit) and are intentionally omitted.

ALTER TABLE public.enrollments             ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_progress           ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_xp                 ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.xp_transactions         ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_achievements       ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.certificates            ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.deployed_programs       ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.pending_onchain_actions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_daily_quests       ALTER COLUMN user_id SET NOT NULL;

-- ─────────────────────────────────────────────
-- 2. Unique tx_signature (duplicate on-chain tx guard)
-- ─────────────────────────────────────────────
-- Partial: multiple NULLs (off-chain / resync rows) stay allowed; no two real
-- mint signatures can collide. See header for why this is certificates-only.
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_tx_signature_unique
  ON public.certificates (tx_signature)
  WHERE tx_signature IS NOT NULL;

-- ─────────────────────────────────────────────
-- 3. FK indexes for ON DELETE CASCADE / SET NULL paths
-- ─────────────────────────────────────────────
-- thread_views: PK is (user_id, thread_id), so user_id lookups are already
-- indexed but a delete of a thread (cascade on thread_id) would seq-scan.
CREATE INDEX IF NOT EXISTS idx_thread_views_thread_id
  ON public.thread_views (thread_id);

-- threads.accepted_answer_id → answers (ON DELETE SET NULL): deleting an answer
-- would otherwise seq-scan threads to null out the back-reference. Partial:
-- only threads with an accepted answer need indexing.
CREATE INDEX IF NOT EXISTS idx_threads_accepted_answer_id
  ON public.threads (accepted_answer_id) WHERE accepted_answer_id IS NOT NULL;

-- flags: the existing partial unique indexes lead with reporter_id, so they do
-- not serve standalone thread_id / answer_id cascade lookups; resolved_by has
-- no index at all.
CREATE INDEX IF NOT EXISTS idx_flags_thread_id
  ON public.flags (thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_flags_answer_id
  ON public.flags (answer_id) WHERE answer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_flags_reporter_id
  ON public.flags (reporter_id);
CREATE INDEX IF NOT EXISTS idx_flags_resolved_by
  ON public.flags (resolved_by) WHERE resolved_by IS NOT NULL;
