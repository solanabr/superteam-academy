-- ============================================================================
-- Migration: review_items — spaced-repetition substrate (LX-B3, #569)
--
-- The review spine (1/3 — this migration only) records, per learner and per
-- lesson, WHEN that lesson's retrieval item is next due and which spacing box
-- it sits in. The feed (#570 / LX-B4) and the /review page (#571 / LX-B5) build
-- ON this substrate; neither is in scope here.
--
-- WRITE-SIDE HARDENING — copies the challenge_assists pattern EXACTLY:
--   * RLS on; NO write policies. Every write goes through a SECURITY DEFINER
--     RPC, search_path-pinned to '', REVOKEd from PUBLIC/anon/authenticated and
--     GRANTed only to service_role. Clients never mutate the table directly.
-- READ-SIDE — one addition over challenge_assists, prescribed by LX-B3:
--   * own-row SELECT policy. Learners read their OWN review queue client-side
--     (the /review page is a client surface), so authenticated may SELECT rows
--     where user_id = auth.uid() and nothing else. anon gets no read.
--
-- SCHEDULE-AS-DATA (PED-04, unified spec §2.1) — the 1/3/7/21-day box expansion
-- is CONVENTION, not evidence. It is stored as ROWS in review_schedule, never
-- hardcoded as magic numbers in the transition RPCs, precisely so it can be
-- re-tuned by a data change (a weekly-dominant spacing is the preferred
-- direction if it is ever tuned) without touching any function body. A
-- spaced-repetition scheduler that LEARNS intervals (per-item ML) is explicitly
-- out of scope forever: HLR-style models buy ~0.54 AUC over fixed boxes
-- (pedagogy note), not worth the complexity or the content-drift risk.
--
-- SKILLS RESOLVE FROM THE BUNDLE AT READ TIME — there is deliberately no skill
-- column on review_items. The item_key is the RAW lesson _id (PDA-seed
-- convention: never strip or transform ids); skill tags are looked up from the
-- committed content bundle when the feed renders, so re-tagging content never
-- leaves stale rows here.
--
-- Idempotent (repo convention): CREATE TABLE/INDEX IF NOT EXISTS, ON CONFLICT
-- DO NOTHING seeds, CREATE OR REPLACE functions, DROP POLICY IF EXISTS before
-- CREATE POLICY. Safe to re-apply. Explicit BEGIN/COMMIT so the whole file is
-- one transaction even under a manual psql apply (not only the Supabase CLI's
-- per-file wrap).
--
-- A tested ROLLBACK block is at the very bottom of this file.
-- Mirrored into supabase/schema.sql (the full-schema snapshot).
-- ============================================================================

BEGIN;

-- ── Schedule (reference data) ───────────────────────────────────────────────
-- box → interval_days. Public-read reference data (mirrors forum_categories:
-- non-sensitive global config, readable by everyone, writable only by DDL /
-- service_role). The transition RPCs read interval_days from here; they never
-- embed the day counts. The highest box row is the terminal box (advance caps
-- there). Re-tuning spacing = UPDATE/INSERT rows, no function change.
CREATE TABLE IF NOT EXISTS review_schedule (
  box           SMALLINT PRIMARY KEY,
  interval_days INTEGER  NOT NULL CHECK (interval_days > 0)
);

ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Review schedule is viewable by everyone" ON review_schedule;
CREATE POLICY "Review schedule is viewable by everyone"
  ON review_schedule FOR SELECT USING (true);
-- No write policy: seeded here, mutated only by service_role / future DDL.

-- CONVENTION, NOT EVIDENCE (PED-04): 1 / 3 / 7 / 21 days. Encoded as data so a
-- future tuning pass edits these rows, not a function body.
INSERT INTO review_schedule (box, interval_days) VALUES
  (1, 1),
  (2, 3),
  (3, 7),
  (4, 21)
ON CONFLICT (box) DO NOTHING;

-- ── review_items ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_items (
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Raw lesson _id. PDA-seed convention: NEVER strip/transform ids. Skill tags
  -- resolve from the content bundle at read time — no skill column here.
  item_key       TEXT NOT NULL,
  -- Current spacing box; FK into review_schedule so a box always has an
  -- interval. New items start at box 1.
  box            SMALLINT NOT NULL DEFAULT 1 REFERENCES review_schedule(box),
  -- When this item next surfaces in the review feed.
  due_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Last graded review: true = cleared (box advanced), false = lapsed (reset to
  -- box 1). NULL until first reviewed. last_result / lapse metadata per LX-B3.
  last_result    BOOLEAN,
  last_reviewed_at TIMESTAMPTZ,
  -- Lapse metadata: how many times this item has been reset to box 1 after a
  -- miss. Signal for the feed (chronically-lapsing items) — never feeds XP.
  lapses         INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- UNIQUE(user_id, item_key): one review row per learner per lesson.
  PRIMARY KEY (user_id, item_key)
);

-- Feed's hot path: a learner's due items, soonest first.
CREATE INDEX IF NOT EXISTS idx_review_items_user_due
  ON review_items (user_id, due_at);

ALTER TABLE review_items ENABLE ROW LEVEL SECURITY;

-- Own-row SELECT only (LX-B3): learners read their own queue client-side.
DROP POLICY IF EXISTS "Users can view their own review items" ON review_items;
CREATE POLICY "Users can view their own review items"
  ON review_items FOR SELECT USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policy: writes go through the SECURITY DEFINER RPCs.

-- ── RPCs ────────────────────────────────────────────────────────────────────

-- Enqueue a lesson's retrieval item at box 1 if the learner has none yet.
-- Idempotent: an existing item is left untouched (DO NOTHING) so re-capturing a
-- lesson never resets a learner's hard-won box progress. This is the entry
-- point the failure-capture feed (LX-B4) and the seed below both use. due_at is
-- computed from the box-1 interval in review_schedule — no hardcoded days.
CREATE OR REPLACE FUNCTION schedule_review_item(
  p_user_id  UUID,
  p_item_key TEXT
) RETURNS TABLE (box SMALLINT, due_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_interval INT;
BEGIN
  SELECT interval_days INTO v_interval
    FROM public.review_schedule WHERE box = 1;

  INSERT INTO public.review_items (user_id, item_key, box, due_at)
  VALUES (p_user_id, p_item_key, 1, now() + make_interval(days => v_interval))
  ON CONFLICT (user_id, item_key) DO NOTHING;

  RETURN QUERY
    SELECT ri.box, ri.due_at
    FROM public.review_items ri
    WHERE ri.user_id = p_user_id AND ri.item_key = p_item_key;
END;
$$;

REVOKE ALL ON FUNCTION schedule_review_item(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION schedule_review_item(UUID, TEXT) TO service_role;

-- Record a graded review and advance/reset the box (LX-B5's transition, owned
-- here as the substrate primitive):
--   passed  → box := LEAST(box + 1, max box), due_at := now() + interval(new box)
--   missed  → box := 1, lapses += 1, due_at := now() + interval(box 1)
-- The terminal box is whatever the highest review_schedule row is — advance
-- clamps there instead of walking off the end. No day counts in this body.
-- No-op (returns nothing) if the item does not exist: the caller must have
-- scheduled it first, and this must never silently resurrect a deleted row.
CREATE OR REPLACE FUNCTION record_review_result(
  p_user_id  UUID,
  p_item_key TEXT,
  p_passed   BOOLEAN
) RETURNS TABLE (box SMALLINT, due_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_max_box  SMALLINT;
  v_new_box  SMALLINT;
  v_interval INT;
BEGIN
  SELECT max(rs.box) INTO v_max_box FROM public.review_schedule rs;

  IF p_passed THEN
    v_new_box := LEAST(
      (SELECT ri.box FROM public.review_items ri
        WHERE ri.user_id = p_user_id AND ri.item_key = p_item_key) + 1,
      v_max_box
    );
  ELSE
    v_new_box := 1;
  END IF;

  SELECT interval_days INTO v_interval
    FROM public.review_schedule WHERE box = v_new_box;

  UPDATE public.review_items ri
     SET box              = v_new_box,
         due_at           = now() + make_interval(days => v_interval),
         last_result      = p_passed,
         last_reviewed_at = now(),
         lapses           = ri.lapses + CASE WHEN p_passed THEN 0 ELSE 1 END,
         updated_at       = now()
   WHERE ri.user_id = p_user_id AND ri.item_key = p_item_key;

  RETURN QUERY
    SELECT ri.box, ri.due_at
    FROM public.review_items ri
    WHERE ri.user_id = p_user_id AND ri.item_key = p_item_key;
END;
$$;

REVOKE ALL ON FUNCTION record_review_result(UUID, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_review_result(UUID, TEXT, BOOLEAN) TO service_role;

-- ── Seed for existing learners (pure SQL, LX-B3 accept) ──────────────────────
-- One box-1 review item per already-completed lesson. ON CONFLICT DO NOTHING so
-- re-applying the migration, or a lesson already captured, is a no-op. due_at is
-- the box-1 interval out from now(); per-session flood-shaping (a learner with
-- many completions) is the feed's job (LX-B4/B5 cap items per session), not the
-- substrate's.
INSERT INTO review_items (user_id, item_key, box, due_at)
SELECT up.user_id,
       up.lesson_id,
       1,
       now() + make_interval(days => (SELECT interval_days FROM review_schedule WHERE box = 1))
FROM user_progress up
WHERE up.completed = true
ON CONFLICT (user_id, item_key) DO NOTHING;

COMMIT;

-- ============================================================================
-- ROLLBACK (tested) — restores the exact pre-migration state (no review spine).
-- Everything this migration created is new (no table/function existed before),
-- so the rollback is an unconditional drop of exactly those objects. Run as one
-- transaction:
-- ----------------------------------------------------------------------------
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.record_review_result(UUID, TEXT, BOOLEAN);
-- DROP FUNCTION IF EXISTS public.schedule_review_item(UUID, TEXT);
-- DROP TABLE IF EXISTS public.review_items;      -- drops idx + own-row policy
-- DROP TABLE IF EXISTS public.review_schedule;   -- drops the read policy
-- COMMIT;
-- ============================================================================
