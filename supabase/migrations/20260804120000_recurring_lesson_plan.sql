-- ============================================================================
-- Migration: recurring_lesson_plan — session plans on MORE THAN ONE weekday
--
-- BEFORE, the plan picker (#582) committed exactly one weekday:
--   prefs = { "nextLesson": { "day": "tue", "time": "19:00" } }
-- and `claim_due_session_reminders` (#869, re-scoped by #896) gated on that one
-- string. A learner who studies Tuesdays AND Thursdays could only be reminded on
-- one of them.
--
-- AFTER, there is exactly ONE plan shape — a LIST of weekdays, up to all seven
-- (which IS "daily"; no separate flag):
--   prefs = { "nextLesson": { "days": ["tue","thu"], "time": "19:00" } }
--
-- TWO HALVES, both in this migration and in this order:
--   1. CONVERT every stored `{day: "tue"}` into `{days: ["tue"]}` — same single
--      weekday, new shape. Prod holds 2 such rows.
--   2. NARROW the claim's eligibility to that one shape:
--        (p.prefs -> 'nextLesson' -> 'days') ? v_weekday
--      The legacy `->> 'day'` comparison is GONE, deliberately: one shape means
--      one code path, and a `day` key that reappears later is a bug to surface,
--      not a shape to keep honouring.
--
-- ⚠️ DEPLOY ORDER. Because the legacy read is removed, a UI that still WRITES
-- `{day}` would silently stop being reminded — the conversion runs once, at
-- apply time, and does not chase later writes. The day-chips UI (which writes
-- `days`) ships in the SAME release window as this migration; nothing that
-- writes `{day}` may deploy after it applies.
--
-- WHY THE `?` OPERATOR. `jsonb ? text` is "does this key/element exist", and on
-- a jsonb ARRAY it tests membership of a STRING element — exactly what the
-- picker writes. It uses the array as-is: no unnest, no lateral join, no
-- ordering assumption. `?` yields NULL when the left side is NULL (no
-- `nextLesson`, or no `days` inside it) and FALSE for an empty array or an array
-- of non-strings, so a malformed/absent plan is never due — the same fail-closed
-- direction the single-day gate had. (One lenient case: Postgres's `?` also
-- matches a top-level scalar string, so a stray `"days": "tue"` behaves like the
-- one day it names. Bounded to a single day, still capped by the per-day claim,
-- so it is left alone rather than rejected.)
--
-- NOT CHANGED (re-stated because CREATE OR REPLACE silently carries a body
-- forward while a reviewer assumes otherwise):
--   * the SIGNATURE — `claim_due_session_reminders(TEXT)` returning the same
--     five OUT columns, so the app read, the generated types and the #731
--     schema-expectation probe are all untouched;
--   * the CLAIM/idempotency half — one `email_reminder_log` row per
--     (user, 'session_plan', São Paulo day), INSERT … ON CONFLICT DO NOTHING in
--     the same statement. A learner planned for all seven days is still
--     reminded at most ONCE per day, and a second/overlapping run still claims
--     zero rows. Multi-day widens WHICH days a learner is due, never how many
--     reminders one day can produce;
--   * the consent gates (`reminder_opt_in`, real address, no wallet-auth
--     placeholder), the REMINDER-scoped unsubscribe token (#896), the
--     `ORDER BY d.uid` the pipeline's idempotency keys depend on, and the São
--     Paulo day/weekday keying (`to_char(..., 'dy')`, lc_time-independent);
--   * `time` — one time-of-day per learner, in both shapes, read the same way;
--   * the SECURITY MODEL — SECURITY DEFINER, `SET search_path = ''`, REVOKEd
--     from PUBLIC/anon/authenticated, GRANTed to service_role ALONE. Re-stated
--     below per house pattern; nothing here widens a grant.
--
-- Idempotent: the conversion is guarded on `? 'day'`, so a re-run converts
-- nothing (the key is gone); the function is CREATE OR REPLACE. Explicit
-- BEGIN/COMMIT — a failed conversion takes the new function body with it.
-- Tested ROLLBACK + post-apply checks at the bottom. Mirrored into
-- supabase/schema.sql.
--
-- Replays cleanly on the PROD lineage: it depends only on
-- 20260726160000_add_profiles_prefs.sql (ledger 20260726212137),
-- 20260731120000_reminder_consent.sql (20260731120914) and
-- 20260731150000_kind_scoped_unsubscribe.sql (20260731142948), whose function
-- body this replaces.
-- ============================================================================

BEGIN;

-- ── 1. Convert stored single-day plans to the list shape ────────────────────
-- `{day: "tue", time: "19:00"}` → `{days: ["tue"], time: "19:00"}`.
--
-- Surgical by construction: it rewrites the `nextLesson` object ONLY, keeping
-- every other key of `prefs` and every other key inside `nextLesson` (`time`,
-- and anything a later feature adds). A row that somehow carries BOTH keys keeps
-- its existing `days` and just loses the redundant `day` — the array is the
-- authority once it exists. Guarded on `? 'day'` and on `nextLesson` actually
-- being an object, so a re-run — and a row with no plan, or a malformed one —
-- is untouched.
--
-- Size: the rewrite adds ~5 bytes to a plan object; `chk_profiles_prefs_size`
-- (2048B, #582) has orders of magnitude of headroom.
UPDATE public.profiles
SET prefs = jsonb_set(
      prefs,
      '{nextLesson}',
      (prefs -> 'nextLesson') - 'day'
        || jsonb_build_object(
             'days',
             COALESCE(
               prefs -> 'nextLesson' -> 'days',
               jsonb_build_array(prefs -> 'nextLesson' -> 'day')
             )
           )
    )
WHERE jsonb_typeof(prefs -> 'nextLesson') = 'object'
  AND prefs -> 'nextLesson' ? 'day';

-- ── 2. claim_due_session_reminders — `days[]` is the only shape ──────────────
-- Byte-for-byte the #896 body except the one WHERE clause marked below.
CREATE OR REPLACE FUNCTION claim_due_session_reminders(p_weekday TEXT DEFAULT NULL)
RETURNS TABLE (user_id UUID, email TEXT, unsubscribe_token UUID, locale TEXT, plan_time TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
#variable_conflict use_column
DECLARE
  v_today   DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  -- Lowercase English abbreviation (mon…sun) — the token the plan picker stores
  -- in every element of `days`. No TM prefix ⇒ lc_time-independent.
  v_weekday TEXT := COALESCE(
    p_weekday,
    trim(to_char((now() AT TIME ZONE 'America/Sao_Paulo'), 'dy'))
  );
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT
      es.user_id                                     AS uid,
      u.email::text                                  AS mail,
      -- #896: the reminder-scoped secret. A reminder email must never carry the
      -- marketing token (the OUT column keeps its name — signature unchanged).
      es.reminder_unsubscribe_token                  AS tok,
      es.reminder_locale                             AS loc,
      COALESCE(p.prefs -> 'nextLesson' ->> 'time', '') AS ptime
    FROM public.email_subscriptions es
    JOIN auth.users u ON u.id = es.user_id
    JOIN public.profiles p ON p.id = es.user_id
    WHERE es.reminder_opt_in = true
      AND u.email IS NOT NULL
      AND u.email <> ''
      -- Synthetic wallet-auth addresses are not inboxes (see #779).
      AND u.email NOT LIKE '%@wallet.superteam-lms.local'
      -- THE multi-day change: membership of the committed list. Deliberately no
      -- OR on a legacy `->> 'day'` — §1 converted every stored one, and a `day`
      -- that reappears afterwards means a stale writer is live, which must be
      -- visible rather than papered over.
      AND (p.prefs -> 'nextLesson' -> 'days') ? v_weekday
  ),
  claimed AS (
    INSERT INTO public.email_reminder_log (user_id, kind, sent_on)
    SELECT due.uid, 'session_plan', v_today FROM due
    ON CONFLICT (user_id, kind, sent_on) DO NOTHING
    RETURNING email_reminder_log.user_id AS uid
  )
  SELECT d.uid, d.mail, d.tok, d.loc, d.ptime
  FROM due d
  JOIN claimed c ON c.uid = d.uid
  -- Deterministic order so the pipeline's chunk boundaries (and therefore its
  -- Resend idempotency keys) are reproducible across a retry.
  ORDER BY d.uid;
END;
$$;

REVOKE ALL ON FUNCTION claim_due_session_reminders(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_due_session_reminders(TEXT) TO service_role;

COMMIT;

-- ============================================================================
-- POST-APPLY INVARIANT CHECKS (run as the gate after applying; all must hold)
-- ----------------------------------------------------------------------------
-- 1. No stored plan carries the legacy key any more, and every plan that exists
--    has a `days` array:
--    SELECT count(*) FILTER (WHERE prefs -> 'nextLesson' ? 'day')  AS legacy_left,
--           count(*) FILTER (WHERE prefs -> 'nextLesson' ? 'days') AS converted,
--           count(*) FILTER (WHERE prefs ? 'nextLesson')           AS plans
--    FROM public.profiles;
--    ⇒ legacy_left = 0, converted = plans (expected: plans = 2 at apply time).
--
-- 2. Each converted plan kept its time and named the same single weekday:
--    SELECT id, prefs -> 'nextLesson' FROM public.profiles WHERE prefs ? 'nextLesson';
--    ⇒ every value is {"days": ["<the old day>"], "time": "<the old time>"}.
--    (Capture the same SELECT BEFORE applying, to diff against.)
--
-- 3. The body gates on `days` and NOTHING else:
--    SELECT prosrc LIKE '%-> ''days'') ? v_weekday%' AS multi_ok,
--           prosrc LIKE '%->> ''day'' = v_weekday%'  AS legacy_gone
--    FROM pg_proc WHERE proname = 'claim_due_session_reminders';
--    ⇒ multi_ok = true, legacy_gone = FALSE.
--
-- 4. Signature unchanged (the app read + #731 probe depend on it):
--    SELECT pg_get_function_identity_arguments(oid) AS args,
--           pg_get_function_result(oid)             AS result
--    FROM pg_proc WHERE proname = 'claim_due_session_reminders';
--    ⇒ args = 'text', result = 'TABLE(user_id uuid, email text,
--      unsubscribe_token uuid, locale text, plan_time text)'.
--
-- 5. Grants unchanged — service_role ONLY:
--    SELECT r.rolname, has_function_privilege(r.rolname, p.oid, 'EXECUTE') ex
--    FROM pg_proc p CROSS JOIN (VALUES ('anon'),('authenticated'),('service_role')) r(rolname)
--    WHERE p.proname = 'claim_due_session_reminders';
--    ⇒ ex = true ONLY for service_role.
--
-- 6. Still hands out the REMINDER token (#896 not regressed):
--    SELECT prosrc LIKE '%es.reminder_unsubscribe_token%' AS ok
--    FROM pg_proc WHERE proname = 'claim_due_session_reminders';  ⇒ true.
-- ============================================================================

-- ============================================================================
-- ROLLBACK (tested; not executed by the migration runner)
-- ----------------------------------------------------------------------------
-- Restores the single-day gate AND the single-day data. Only meaningful in the
-- same release window: any learner who saves a multi-day plan afterwards loses
-- every day but the first.
-- BEGIN;
--   UPDATE public.profiles
--   SET prefs = jsonb_set(
--         prefs, '{nextLesson}',
--         (prefs -> 'nextLesson') - 'days'
--           || jsonb_build_object('day', prefs -> 'nextLesson' -> 'days' ->> 0))
--   WHERE jsonb_typeof(prefs -> 'nextLesson') = 'object'
--     AND prefs -> 'nextLesson' ? 'days';
--   -- then re-run §4 of 20260731150000_kind_scoped_unsubscribe.sql
-- COMMIT;
-- ============================================================================
