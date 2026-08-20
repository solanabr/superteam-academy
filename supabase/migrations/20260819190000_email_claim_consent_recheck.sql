-- ============================================================================
-- Migration: email_claim_consent_recheck — case-insensitive placeholder
--            exclusion + pinned claim-time consent gate in the claim RPCs
--            (#1075, part 2 of #921; part 1 = #1074's shared TS predicate)
--
-- The email claim RPCs — `claim_due_session_reminders` (#869/#896/#980 lineage)
-- and `claim_due_reengagement` (#899) — are the ONLY consent gate the send
-- pipelines trust (`lib/email/reminders.ts`, `lib/email/reengagement-send.ts`
-- take recipients exclusively from them). Two problems, one fix each:
--
--   (a) The wallet-placeholder exclusion was a byte-wise
--       `u.email NOT LIKE '%@wallet.superteam-lms.local'` — CASE-SENSITIVE
--       (#921's F5). GoTrue lowercases stored emails today, but that is a
--       GoTrue implementation detail, not an invariant this gate may lean on:
--       a differently-cased placeholder would sail through and be "mailed".
--       #1074 made the TS predicate case-insensitive
--       (`isWalletPlaceholderEmail`, apps/web/src/lib/auth/wallet-placeholder.ts);
--       this migration is its SQL mirror:
--         lower(u.email) NOT LIKE '%@wallet.superteam-lms.local'
--       The domain literal lives in the claim-RPC bodies here (and their
--       supabase/schema.sql mirror) and in WALLET_PLACEHOLDER_EMAIL_DOMAIN on
--       the TS side — one canonical predicate per language, cross-referenced
--       both ways. Change one, change the other.
--
--   (b) Consent must hold AT CLAIM TIME, not merely when the learner scheduled
--       a plan or became due. Both bodies already assert
--       `es.reminder_opt_in = true` inside the claim's WHERE — the claim CTE
--       and the ledger INSERT are ONE statement, so a learner who flipped
--       consent off between scheduling and the cron's claim is excluded and no
--       ledger row is written for them. This migration does not need to add
--       that predicate; it RE-ASSERTS it: the line is now marked as the #1075
--       claim-time consent gate so a future body rewrite cannot silently drop
--       it, and the PGlite suite pins it behaviourally
--       (email-claim-consent-recheck-execution.test.ts). The residual window
--       is claim→Resend inside ONE pipeline invocation (seconds) — the shape
--       #1075 accepts by choosing claim-time enforcement over a send-time
--       re-read.
--
-- SCOPE. Exactly the two CLAIM RPCs. `list_marketing_recipients` (#769,
-- marketing campaigns) is not a claim RPC and stays as-is.
--
-- NOT CHANGED (re-stated because CREATE OR REPLACE silently carries a body
-- forward while a reviewer assumes otherwise): both SIGNATURES and OUT-column
-- lists (app reads + the #731 schema-expectation probe), the idempotency
-- claims (one `email_reminder_log` row per user/kind/São Paulo day, INSERT …
-- ON CONFLICT DO NOTHING in the same statement), the #899 N = 14 frequency cap
-- and its advisory-lock serialisation, the #980 `days[]` eligibility read, the
-- #896 REMINDER-scoped token, `ORDER BY d.uid`, and the SECURITY MODEL —
-- SECURITY DEFINER, `SET search_path = ''`, REVOKEd from
-- PUBLIC/anon/authenticated, GRANTed to service_role ALONE (grants re-stated
-- below per house pattern; nothing widens). Each body below is byte-identical
-- to its current definition (§2 of 20260804120000_recurring_lesson_plan.sql,
-- §3 of 20260731170000_reengagement_pipeline.sql) except the lines marked
-- "#1074"/"#1075".
--
-- Idempotent: CREATE OR REPLACE only, no data change. Explicit BEGIN/COMMIT.
-- Post-apply checks and a tested ROLLBACK in the trailer. Mirrored into
-- supabase/schema.sql.
--
-- Replays cleanly on the PROD lineage: replaces the bodies applied as
-- 20260804190632 (recurring_lesson_plan) and 20260731154032
-- (reengagement_pipeline); depends on nothing newer.
-- ============================================================================

BEGIN;

-- ── 1. claim_due_session_reminders — lower() the placeholder gate ────────────
-- Byte-for-byte the #980 body except the lines marked #1074/#1075.
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
    -- #1075: consent is asserted HERE, at claim time — the claim and the ledger
    -- INSERT are one statement, so a flip between the learner scheduling and
    -- the cron claiming excludes the row.
    WHERE es.reminder_opt_in = true
      AND u.email IS NOT NULL
      AND u.email <> ''
      -- Synthetic wallet-auth addresses are not inboxes (see #779). lower():
      -- SQL mirror of isWalletPlaceholderEmail (#1074,
      -- apps/web/src/lib/auth/wallet-placeholder.ts) — a differently-cased
      -- placeholder must not slip past a byte-wise LIKE. Keep the two in step.
      AND lower(u.email) NOT LIKE '%@wallet.superteam-lms.local'
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

-- ── 2. claim_due_reengagement — lower() the placeholder gate ─────────────────
-- Byte-for-byte the #899 body except the lines marked #1074/#1075.
CREATE OR REPLACE FUNCTION claim_due_reengagement(
  p_kind          TEXT,
  p_inactive_days INTEGER DEFAULT 7,
  p_cap_days      INTEGER DEFAULT 14,
  p_max_remaining INTEGER DEFAULT 1,
  p_course_totals JSONB   DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  user_id              UUID,
  email                TEXT,
  unsubscribe_token    UUID,
  locale               TEXT,
  streak_days          INTEGER,
  days_inactive        INTEGER,
  course_id            TEXT,
  completed_lesson_ids TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
#variable_conflict use_column
DECLARE
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  -- Kinds that CONSUME and are BLOCKED BY the cap. 'session_plan' is absent on
  -- purpose — see the header. One place to widen if the policy ever changes.
  v_capped_kinds TEXT[] := ARRAY['reengagement_7d', 'course_nudge'];
BEGIN
  -- Reject anything outside the re-engagement family, so this RPC can never be
  -- used to mint (or, via the release twin, delete) a session_plan ledger row.
  IF p_kind IS NULL OR NOT (p_kind = ANY(v_capped_kinds)) THEN
    RAISE EXCEPTION 'unsupported re-engagement kind: %', p_kind;
  END IF;
  -- A zero/negative window would make the gate vacuous — fail loudly rather
  -- than quietly nudge everyone daily.
  IF p_inactive_days IS NULL OR p_inactive_days < 1 THEN
    RAISE EXCEPTION 'p_inactive_days must be >= 1';
  END IF;
  IF p_cap_days IS NULL OR p_cap_days < 1 THEN
    RAISE EXCEPTION 'p_cap_days must be >= 1';
  END IF;
  IF p_max_remaining IS NULL OR p_max_remaining < 1 THEN
    RAISE EXCEPTION 'p_max_remaining must be >= 1';
  END IF;

  -- Serialise re-engagement claims so the CROSS-KIND cap holds under
  -- concurrency (see the header). Transaction-scoped: released on commit.
  --
  -- ISOLATION-LEVEL CAVEAT (gate F2, informational). This is correct under READ
  -- COMMITTED — the default, and what PostgREST/Supabase uses: the RETURN QUERY
  -- below takes a FRESH snapshot after the lock is granted, so it sees the rows
  -- the previous holder committed. Under REPEATABLE READ (or SERIALIZABLE) the
  -- snapshot is fixed at the transaction's first statement, i.e. BEFORE the lock
  -- is acquired, so a waiter would read a pre-lock view of email_reminder_log and
  -- the cap could be evaluated against stale rows. Re-evaluate this lock (and
  -- prefer a serialization-failure retry) if this function is ever called on a
  -- connection that raises the isolation level.

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('claim_due_reengagement')
  );

  RETURN QUERY
  WITH consenting AS (
    SELECT
      es.user_id                        AS uid,
      u.email::text                     AS mail,
      -- #896: the REMINDER-scoped secret. Re-engagement rides on reminder
      -- consent, so it must never carry the marketing token.
      es.reminder_unsubscribe_token     AS tok,
      es.reminder_locale                AS loc,
      COALESCE(ux.longest_streak, 0)::int AS streak,
      GREATEST(
        ux.last_activity_date,
        (SELECT max(up.completed_at)
           FROM public.user_progress up
          WHERE up.user_id = es.user_id AND up.completed)::date,
        (SELECT max(e.enrolled_at)
           FROM public.enrollments e
          WHERE e.user_id = es.user_id)::date,
        p.created_at::date
      ) AS last_seen
    FROM public.email_subscriptions es
    JOIN auth.users u      ON u.id = es.user_id
    JOIN public.profiles p ON p.id = es.user_id
    LEFT JOIN public.user_xp ux ON ux.user_id = es.user_id
    -- #1075: consent is asserted HERE, at claim time — the claim and the ledger
    -- INSERT are one statement, so a flip between the learner becoming due and
    -- the cron claiming excludes the row.
    WHERE es.reminder_opt_in = true
      AND u.email IS NOT NULL
      AND u.email <> ''
      -- Synthetic wallet-auth addresses are not inboxes (see #779). lower():
      -- SQL mirror of isWalletPlaceholderEmail (#1074,
      -- apps/web/src/lib/auth/wallet-placeholder.ts) — a differently-cased
      -- placeholder must not slip past a byte-wise LIKE. Keep the two in step.
      AND lower(u.email) NOT LIKE '%@wallet.superteam-lms.local'
  ),
  lapsed AS (
    SELECT c.*, (v_today - c.last_seen)::int AS inactive_days
    FROM consenting c
    WHERE c.last_seen IS NOT NULL
      AND c.last_seen <= v_today - p_inactive_days
      -- THE FREQUENCY CAP. `sent_on > v_today - p_cap_days` is a half-open
      -- window that INCLUDES today, so the row a sibling pass wrote minutes ago
      -- blocks this one, and tomorrow's run is blocked by today's row.
      AND NOT EXISTS (
        SELECT 1 FROM public.email_reminder_log l
        WHERE l.user_id = c.uid
          AND l.kind = ANY(v_capped_kinds)
          AND l.sent_on > v_today - p_cap_days
      )
  ),
  -- Nearest-to-done enrolled course per lapsed learner. DISTINCT ON keeps one
  -- course per learner, deterministically (fewest remaining, then course id).
  nearly AS (
    SELECT DISTINCT ON (e.user_id)
      e.user_id   AS uid,
      e.course_id AS cid
    FROM public.enrollments e
    JOIN lapsed l ON l.uid = e.user_id
    CROSS JOIN LATERAL (
      SELECT (p_course_totals ->> e.course_id)::int AS total
    ) t
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS done
      FROM public.user_progress up
      WHERE up.user_id = e.user_id
        AND up.course_id = e.course_id
        AND up.completed
    ) pr ON true
    WHERE p_kind = 'course_nudge'
      -- A course the bundle does not list (unsynced/retired) is never nudged.
      AND t.total IS NOT NULL
      AND e.completed_at IS NULL
      -- Already credentialed ⇒ nothing to finish.
      AND NOT EXISTS (
        SELECT 1 FROM public.certificates ct
        WHERE ct.user_id = e.user_id AND ct.course_id = e.course_id
      )
      AND (t.total - COALESCE(pr.done, 0)) BETWEEN 1 AND p_max_remaining
    ORDER BY e.user_id, (t.total - COALESCE(pr.done, 0)), e.course_id
  ),
  due AS (
    -- course_nudge: only learners with a nearly-done course, carrying it.
    SELECT
      l.uid, l.mail, l.tok, l.loc, l.streak, l.inactive_days,
      n.cid AS cid,
      COALESCE(
        (SELECT array_agg(up.lesson_id ORDER BY up.lesson_id)
           FROM public.user_progress up
          WHERE up.user_id = l.uid
            AND up.course_id = n.cid
            AND up.completed),
        ARRAY[]::text[]
      ) AS done_ids
    FROM lapsed l
    JOIN nearly n ON n.uid = l.uid
    WHERE p_kind = 'course_nudge'
    UNION ALL
    -- reengagement_7d: no course context AT ALL. Not merely unused — returning
    -- one would let the caller render a course nudge under the generic ledger
    -- kind, breaking the template→return instrumentation.
    SELECT
      l.uid, l.mail, l.tok, l.loc, l.streak, l.inactive_days,
      NULL::text, ARRAY[]::text[]
    FROM lapsed l
    WHERE p_kind = 'reengagement_7d'
  ),
  claimed AS (
    INSERT INTO public.email_reminder_log (user_id, kind, sent_on)
    SELECT due.uid, p_kind, v_today FROM due
    ON CONFLICT (user_id, kind, sent_on) DO NOTHING
    RETURNING email_reminder_log.user_id AS uid
  )
  SELECT d.uid, d.mail, d.tok, d.loc, d.streak, d.inactive_days, d.cid, d.done_ids
  FROM due d
  JOIN claimed c ON c.uid = d.uid
  -- Deterministic order so the pipeline's chunk boundaries — and therefore its
  -- Resend idempotency keys — are reproducible across a retry.
  ORDER BY d.uid;
END;
$$;

REVOKE ALL ON FUNCTION claim_due_reengagement(TEXT, INTEGER, INTEGER, INTEGER, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_due_reengagement(TEXT, INTEGER, INTEGER, INTEGER, JSONB)
  TO service_role;

COMMIT;

-- ============================================================================
-- POST-APPLY INVARIANT CHECKS (run as the gate after applying; all must hold)
-- ----------------------------------------------------------------------------
-- 1. Both bodies gate on the LOWERED address, and no byte-wise gate remains:
--    SELECT proname,
--           prosrc LIKE '%lower(u.email) NOT LIKE ''%@wallet.superteam-lms.local''%' AS lowered,
--           prosrc NOT LIKE '%AND u.email NOT LIKE%'                                 AS bytewise_gone
--    FROM pg_proc
--    WHERE proname IN ('claim_due_session_reminders', 'claim_due_reengagement');
--    ⇒ lowered = true, bytewise_gone = true for both rows.
--
-- 2. Consent is still asserted at claim time in both bodies:
--    SELECT proname, prosrc LIKE '%WHERE es.reminder_opt_in = true%' AS consent_gate
--    FROM pg_proc
--    WHERE proname IN ('claim_due_session_reminders', 'claim_due_reengagement');
--    ⇒ consent_gate = true for both rows.
--
-- 3. Signatures unchanged (the app reads + the #731 probe depend on them):
--    SELECT proname, pg_get_function_identity_arguments(oid) AS args,
--           pg_get_function_result(oid)                      AS result
--    FROM pg_proc
--    WHERE proname IN ('claim_due_session_reminders', 'claim_due_reengagement');
--    ⇒ 'text' → TABLE(user_id uuid, email text, unsubscribe_token uuid,
--      locale text, plan_time text); and
--      'text, integer, integer, integer, jsonb' → TABLE(user_id uuid,
--      email text, unsubscribe_token uuid, locale text, streak_days integer,
--      days_inactive integer, course_id text, completed_lesson_ids text[]).
--
-- 4. Grants unchanged — service_role ONLY:
--    SELECT p.proname, r.rolname, has_function_privilege(r.rolname, p.oid, 'EXECUTE') ex
--    FROM pg_proc p CROSS JOIN (VALUES ('anon'),('authenticated'),('service_role')) r(rolname)
--    WHERE p.proname IN ('claim_due_session_reminders', 'claim_due_reengagement');
--    ⇒ ex = true ONLY for service_role.
--
-- 5. #899 cap and #896 token not regressed:
--    SELECT prosrc LIKE '%ARRAY[''reengagement_7d'', ''course_nudge'']%' AS capped,
--           prosrc LIKE '%es.reminder_unsubscribe_token%'                AS reminder_token
--    FROM pg_proc WHERE proname = 'claim_due_reengagement';  ⇒ both true.
--
-- 6. SECURITY DEFINER + pinned empty search_path:
--    SELECT proname, prosecdef, proconfig FROM pg_proc
--    WHERE proname IN ('claim_due_session_reminders', 'claim_due_reengagement');
--    ⇒ prosecdef = true, proconfig = {search_path=""} for both.
-- ============================================================================

-- ============================================================================
-- ROLLBACK (tested; not executed by the migration runner)
-- ----------------------------------------------------------------------------
-- Function bodies only, no data change: re-run §2 of
-- 20260804120000_recurring_lesson_plan.sql (claim_due_session_reminders) and
-- §3 of 20260731170000_reengagement_pipeline.sql (claim_due_reengagement) to
-- restore the byte-wise placeholder gates. Grants and signatures are identical
-- in both directions.
-- ============================================================================
