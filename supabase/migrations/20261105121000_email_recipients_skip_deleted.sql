-- Stop mail to deleted accounts (#1129) and match wallet placeholders in
-- list_marketing_recipients whatever their case (#1118).
--
-- The three recipient RPCs read consent rows and auth.users without looking at
-- profiles.deleted_at, and deletion left the consent rows live. Each RPC now
-- skips tombstoned profiles, /api/account/delete opts the account out, and the
-- backfill below opts out accounts deleted before this change. Bodies are the
-- last applied ones (20260728120000 for marketing, 20260819190000 for the two
-- claims) plus the lines marked #1129/#1118. Signatures and grants are unchanged.
--
-- Idempotent: CREATE OR REPLACE, and the backfill only touches rows still holding
-- a live consent.

BEGIN;

CREATE OR REPLACE FUNCTION public.list_marketing_recipients()
RETURNS TABLE (user_id UUID, email TEXT, unsubscribe_token UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT es.user_id, u.email::text, es.unsubscribe_token
  FROM public.email_subscriptions es
  JOIN auth.users u ON u.id = es.user_id
  JOIN public.profiles p ON p.id = es.user_id -- #1129
  WHERE es.opt_in = true
    AND p.deleted_at IS NULL -- #1129
    AND u.email IS NOT NULL
    AND u.email <> ''
    -- Synthetic wallet-auth addresses are not inboxes. lower(): SQL mirror of
    -- isWalletPlaceholderEmail, same as the two claim RPCs (#1118).
    AND lower(u.email) NOT LIKE '%@wallet.superteam-lms.local'
  -- The campaign chunks this list by position and derives idempotency keys from
  -- each chunk's members, so the order has to be stable across a retry.
  ORDER BY es.user_id;
$$;

REVOKE ALL ON FUNCTION public.list_marketing_recipients() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_marketing_recipients() TO service_role;

CREATE OR REPLACE FUNCTION public.claim_due_session_reminders(p_weekday TEXT DEFAULT NULL)
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
      AND p.deleted_at IS NULL -- #1129
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

REVOKE ALL ON FUNCTION public.claim_due_session_reminders(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_session_reminders(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_due_reengagement(
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
      AND p.deleted_at IS NULL -- #1129
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

REVOKE ALL ON FUNCTION public.claim_due_reengagement(TEXT, INTEGER, INTEGER, INTEGER, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_reengagement(TEXT, INTEGER, INTEGER, INTEGER, JSONB)
  TO service_role;

-- Accounts already deleted: write the opt-out, keeping an earlier opt-out's date.
UPDATE public.email_subscriptions es
SET
  opt_in = false,
  reminder_opt_in = false,
  unsubscribed_at = CASE WHEN es.opt_in THEN now() ELSE es.unsubscribed_at END,
  reminder_unsubscribed_at = CASE WHEN es.reminder_opt_in THEN now() ELSE es.reminder_unsubscribed_at END,
  updated_at = now()
FROM public.profiles p
WHERE p.id = es.user_id
  AND p.deleted_at IS NOT NULL
  AND (es.opt_in OR es.reminder_opt_in);

COMMIT;
