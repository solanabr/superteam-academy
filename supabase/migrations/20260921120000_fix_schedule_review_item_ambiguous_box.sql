-- Fix `column reference "box" is ambiguous` in schedule_review_item.
--
-- The function is declared `RETURNS TABLE (box SMALLINT, due_at TIMESTAMPTZ)`,
-- which makes `box` an implicit plpgsql OUT variable for the whole body. The
-- interval lookup then wrote an UNQUALIFIED `WHERE box = 1`, so Postgres had
-- both that variable and `review_schedule.box` in scope and — under the default
-- `plpgsql.variable_conflict = error` — raised at runtime every single call.
--
-- The function has therefore NEVER succeeded on prod. Every review capture
-- since the table shipped (2026-07-26) has failed: `review_items` holds only
-- the 63 rows written by the original migration's own backfill, all stamped at
-- that one instant, and nothing since. The app swallowed it by design —
-- `captureReviewFailure` is best-effort and logs rather than throws — so the
-- only symptom was a `[LESSON_COMPLETE_001] column reference "box" is
-- ambiguous` line per graded miss (4 learners, lesson-ssr-por-que-solana).
--
-- The fix is to qualify the reference. The OUT column names stay `box` /
-- `due_at` — they are the RPC's response contract — so every other column
-- reference in the body is table-qualified too, which is what kept
-- `record_review_result` (same RETURNS TABLE shape) working all along.
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
  -- `rs.` is load-bearing: bare `box` here collides with the OUT column.
  SELECT rs.interval_days INTO v_interval
    FROM public.review_schedule rs WHERE rs.box = 1;

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

-- MANUAL VERIFICATION (no pgTAP harness in this repo; a unit test cannot
-- execute plpgsql, so the app-side guard is the static check in
-- apps/web/src/lib/review/__tests__/review-rpc-sql.test.ts).
--
-- After applying, against prod as service_role:
--
--   -- 1. Fails BEFORE this migration, returns a row after it.
--   SELECT * FROM schedule_review_item(
--     '<a real profiles.id>'::uuid, 'lesson-ssr-por-que-solana');
--   -- expect: box = 1, due_at = now() + 1 day
--
--   -- 2. Idempotent — a second call must not reset the box.
--   SELECT * FROM schedule_review_item(
--     '<same id>'::uuid, 'lesson-ssr-por-que-solana');
--   -- expect: the SAME box/due_at as above
--
--   -- 3. New app-written rows now exist (was 0 for the whole outage).
--   SELECT count(*) FROM review_items WHERE created_at > '2026-07-26 16:22'::timestamptz;
--
-- End-to-end: fail a quiz on lesson-ssr-por-que-solana and confirm no
-- `[LESSON_COMPLETE_001] column reference "box" is ambiguous` line appears.
