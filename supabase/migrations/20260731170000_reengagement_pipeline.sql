-- ============================================================================
-- Migration: reengagement_pipeline — claim RPCs + frequency cap for the
--            re-engagement email set (#899, follow-up scoped by #898/#870)
--
-- #898 shipped the TEMPLATES and the pure selection layer
-- (`lib/email/reengagement.ts`) and deliberately stopped there: the trigger is
-- DB + cron. This is that trigger.
--
-- WHAT THIS ADDS
--   1. `chk_email_reminder_log_kind` widened from ('session_plan') to
--      ('session_plan','reengagement_7d','course_nudge'). The #869 ledger was
--      built to take more families; its PK (user_id, kind, sent_on) then gives
--      each family its own once-per-São-Paulo-day slot for free.
--   2. `claim_due_reengagement(...)`   — service_role: the atomic claim-then-send
--      read for BOTH re-engagement kinds, carrying the frequency cap.
--   3. `release_reengagement_claims(...)` — service_role: release a claim whose
--      batch was PROVABLY not transmitted, so the day is retryable.
--   4. Three supporting indexes.
--
-- ── WHY THE PER-DAY PK IS NOT ENOUGH (the reason this migration exists) ──────
-- The #869 PK makes "at most one send per learner per kind per day" a database
-- invariant. That is exactly right for the session-plan reminder, which the
-- learner ASKED to receive on a schedule they picked. It is WRONG for
-- re-engagement: a permanently lapsed learner satisfies "inactive ≥ 7 days"
-- every single day forever, so the per-day PK would nudge them DAILY. R17's
-- rule is no-repeat-within-N-days, and #899 records the owner default N = 14.
--
-- The cap is enforced INSIDE the claim (a NOT EXISTS over `email_reminder_log`
-- on the two re-engagement kinds within the last N days), not in the pipeline,
-- for the same reason the per-day claim lives in SQL: app-side frequency logic
-- is a convention that a second caller, a manual curl, or a future route can
-- forget. In SQL it is an invariant.
--
-- ── WHAT COUNTS AGAINST THE CAP (deliberate scope) ──────────────────────────
-- ONLY the two re-engagement kinds. `session_plan` is EXCLUDED from the cap
-- window, in both directions:
--   * a daily session reminder never consumes the re-engagement budget, and
--   * a re-engagement send never suppresses a session reminder
--     (`claim_due_session_reminders` is untouched by this migration).
-- Rationale: they are different products of the same consent. The session
-- reminder is a self-scheduled appointment the learner set up and can retime or
-- switch off in Settings; suppressing it because we also sent one lapse nudge
-- would break the thing they explicitly asked for. Conversely a learner who
-- opted into daily reminders and then stopped studying is PRECISELY the person
-- R17 wants to reach — letting their own reminders eat the cap would mute the
-- nudge for exactly the audience it targets. If the owner later wants a single
-- global mail budget, widen `v_capped_kinds` in one place.
--
-- ── PRECEDENCE (course_nudge over reengagement_7d), for free ────────────────
-- #898: "a learner one lesson from a credential should hear about that lesson,
-- not about their dashboard." The cron runs the `course_nudge` pass FIRST; that
-- pass writes today's ledger row, and the generic pass's own cap NOT EXISTS
-- then excludes the learner. So "never both in one window" falls out of the cap
-- rather than needing a second mechanism. (One benign exception: if a
-- course_nudge batch is PROVABLY rejected its claim is released, and the
-- generic pass may then pick the learner up the same day — still exactly one
-- email, and the more useful failure mode than silence.)
--
-- ── CONCURRENCY ─────────────────────────────────────────────────────────────
-- Within ONE claim call, read-and-claim is one statement (CTE with
-- INSERT … ON CONFLICT DO NOTHING RETURNING) exactly as in #869, so two
-- overlapping runs of the SAME kind cannot both claim a learner. That alone
-- does NOT protect the CROSS-KIND cap: two concurrent calls for DIFFERENT kinds
-- would each read the ledger before the other's INSERT is visible and both
-- claim. A transaction-level advisory lock therefore serialises every
-- re-engagement claim; a caller waits, then observes the other call's committed
-- rows and is capped correctly. The lock is re-engagement-specific, so it never
-- delays the session-plan claim.
--
-- ── INACTIVITY SIGNAL (enumerated, per #899) ────────────────────────────────
-- "Last seen" is the GREATEST of the four signals the schema already carries
-- (GREATEST ignores NULLs):
--   * `user_xp.last_activity_date`   — stamped by `award_xp()`, so it covers
--     EVERY xp-earning action: lessons, challenges, quests, streaks, community.
--     This is the broad signal.
--   * `max(user_progress.completed_at)` for completed rows — belt-and-braces if
--     a completion path ever lands without an XP award.
--   * `max(enrollments.enrolled_at)`  — enrolling is activity even before any
--     lesson is finished.
--   * `profiles.created_at`           — a FLOOR, so an account created three
--     days ago with zero activity is "inactive 3 days", not "inactive since the
--     epoch". Without it a brand-new signup would be nudged on day one.
--
-- ── COURSE TOTALS COME FROM THE CALLER, NOT THE DATABASE ────────────────────
-- "One lesson from done" needs each course's lesson COUNT, and lesson counts
-- live in the committed content bundle (`content.lock`), never in Postgres.
-- Duplicating them into a table would create a second source of truth that goes
-- stale on every content bump. So the caller passes `p_course_totals` —
-- `{"<course_id>": <totalLessons>}` from `getAllCourseLessonCounts()`, which is
-- already gated on synced+active deployments. A course absent from the map is
-- simply never nudged (fail-closed).
--
-- SECURITY MODEL (house pattern, unchanged): every function is SECURITY
-- DEFINER, `SET search_path = ''`, REVOKEd from PUBLIC/anon/authenticated and
-- GRANTed to service_role ALONE. No new table, no new RLS policy, no new column
-- on `profiles`, and `auth.users` is read-joined for the address only — exactly
-- what `claim_due_session_reminders` already does. `email_reminder_log` keeps
-- RLS on with NO policies (service-role-only bookkeeping).
--
-- Idempotent: guarded constraint swap, CREATE INDEX IF NOT EXISTS, CREATE OR
-- REPLACE FUNCTION. Explicit BEGIN/COMMIT. Post-apply invariant checks and a
-- tested ROLLBACK in the trailer. Mirrored into supabase/schema.sql.
--
-- Replays cleanly on the PROD lineage: it depends on nothing beyond
-- 20260728120000_email_subscriptions.sql (prod 20260727200924),
-- 20260731120000_reminder_consent.sql (prod 20260731120914) and
-- 20260731150000_kind_scoped_unsubscribe.sql (prod 20260731142948) — the last
-- applied migration. `enrollments`, `user_progress`, `user_xp`, `certificates`
-- and `profiles` are all baseline tables.
-- ============================================================================

BEGIN;

-- ── 1. Widen the ledger's kind CHECK ────────────────────────────────────────
-- Drop-then-add rather than a new constraint name, so re-running the migration
-- converges on exactly one CHECK instead of accumulating aliases.
ALTER TABLE email_reminder_log
  DROP CONSTRAINT IF EXISTS chk_email_reminder_log_kind;

ALTER TABLE email_reminder_log
  ADD CONSTRAINT chk_email_reminder_log_kind
  CHECK (kind IN ('session_plan', 'reengagement_7d', 'course_nudge'));

-- ── 2. Supporting indexes ───────────────────────────────────────────────────
-- The last-activity clause scans a learner's completed lessons.
CREATE INDEX IF NOT EXISTS idx_user_progress_user_completed_at
  ON user_progress (user_id, completed_at DESC);

-- The course-nudge "lessons still incomplete" count is per (user, course) over
-- completed rows only.
CREATE INDEX IF NOT EXISTS idx_user_progress_user_course_completed
  ON user_progress (user_id, course_id) WHERE completed;

-- The frequency cap probes recent rows per learner. The PK (user_id, kind,
-- sent_on) can serve this, but the cap filters on a SET of kinds over a date
-- RANGE, which this index answers directly.
CREATE INDEX IF NOT EXISTS idx_email_reminder_log_user_sent_on
  ON email_reminder_log (user_id, sent_on DESC);

-- ── 3. claim_due_reengagement — atomic claim + cap + recipient read ─────────
-- Returns a learner iff ALL of these hold:
--   * reminder_opt_in = true          (REMINDER consent — never the marketing
--                                      opt-in; LGPD consent is purpose-bound)
--   * a real email on file            (never a wallet-auth placeholder)
--   * last seen ≥ p_inactive_days ago (see the header's signal enumeration)
--   * NO re-engagement-kind row in the last p_cap_days   ← THE FREQUENCY CAP
--   * for 'course_nudge': an enrolled, uncertified, incomplete course with
--     between 1 and p_max_remaining lessons left
--   * no row for (user, p_kind, today) — and the claim row is INSERTed in the
--     SAME statement, so a concurrent run gets nothing back.
--
-- `completed_lesson_ids` is returned for the course-nudge kind so the caller can
-- resolve the next incomplete lesson against the content bundle
-- (`findNextIncompleteLesson`) without an N+1 read per recipient. It is empty
-- for the generic kind, whose CTA is the dashboard.
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
    WHERE es.reminder_opt_in = true
      AND u.email IS NOT NULL
      AND u.email <> ''
      -- Synthetic wallet-auth addresses are not inboxes (see #779).
      AND u.email NOT LIKE '%@wallet.superteam-lms.local'
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

-- ── 4. release_reengagement_claims — undo a failed batch (service_role) ─────
-- Deletes TODAY's claim rows of ONE re-engagement kind for the given users, so a
-- send that PROVABLY never left the building can be retried. Restricted to the
-- re-engagement kinds: a session-plan claim is not this pipeline's to release.
CREATE OR REPLACE FUNCTION release_reengagement_claims(
  p_kind     TEXT,
  p_user_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today   DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_deleted INTEGER;
BEGIN
  IF p_kind IS NULL OR p_kind NOT IN ('reengagement_7d', 'course_nudge') THEN
    RAISE EXCEPTION 'unsupported re-engagement kind: %', p_kind;
  END IF;

  DELETE FROM public.email_reminder_log
  WHERE kind = p_kind
    AND sent_on = v_today
    AND user_id = ANY(p_user_ids);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION release_reengagement_claims(TEXT, UUID[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION release_reengagement_claims(TEXT, UUID[]) TO service_role;

COMMIT;

-- ============================================================================
-- POST-APPLY INVARIANT CHECKS (run as the gate after applying; all must hold)
-- ----------------------------------------------------------------------------
-- 1. The ledger accepts exactly three kinds:
--    SELECT pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conname = 'chk_email_reminder_log_kind';
--    ⇒ CHECK (kind = ANY (ARRAY['session_plan','reengagement_7d','course_nudge']))
--    and a forged kind is rejected:
--    -- INSERT INTO email_reminder_log(user_id, kind, sent_on)
--    --   SELECT id, 'marketing', CURRENT_DATE FROM profiles LIMIT 1;  ⇒ ERROR
--
-- 2. Grants are service_role ONLY:
--    SELECT p.proname, r.rolname, has_function_privilege(r.rolname, p.oid, 'EXECUTE') ex
--    FROM pg_proc p CROSS JOIN (VALUES ('anon'),('authenticated'),('service_role')) r(rolname)
--    WHERE p.proname IN ('claim_due_reengagement','release_reengagement_claims');
--    ⇒ ex = true ONLY for service_role.
--
-- 3. Both functions are SECURITY DEFINER with a pinned empty search_path:
--    SELECT proname, prosecdef, proconfig FROM pg_proc
--    WHERE proname IN ('claim_due_reengagement','release_reengagement_claims');
--    ⇒ prosecdef = true, proconfig = {search_path=""} for both.
--
-- 4. The claim hands out the REMINDER token, and the capped set is exactly the
--    two re-engagement kinds (session_plan is NOT a member — it appears in the
--    body only as prose, so match the ARRAY literal, not the bare word):
--    SELECT prosrc LIKE '%es.reminder_unsubscribe_token%'                      AS reminder_token,
--           prosrc LIKE '%ARRAY[''reengagement_7d'', ''course_nudge'']%'       AS capped_kinds,
--           prosrc NOT LIKE '%v_capped_kinds TEXT[] :=%session_plan%'          AS session_plan_excluded
--    FROM pg_proc WHERE proname = 'claim_due_reengagement';  ⇒ all true.
--
-- 5. Session-plan behaviour is untouched (the #869/#896 RPC is not redefined):
--    SELECT count(*) FROM pg_proc WHERE proname = 'claim_due_session_reminders'; ⇒ 1
--
-- 6. Indexes exist:
--    SELECT indexname FROM pg_indexes WHERE indexname IN
--      ('idx_user_progress_user_completed_at',
--       'idx_user_progress_user_course_completed',
--       'idx_email_reminder_log_user_sent_on');  ⇒ 3 rows.
--
-- 7. Live smoke (read-only intent — NOTE it DOES claim, so run it only when the
--    day's cron has not yet fired, or accept that it consumes today's slot):
--    SELECT count(*) FROM claim_due_reengagement('reengagement_7d', 7, 14);
--    ⇒ a number; no error.
-- ============================================================================

-- ============================================================================
-- ROLLBACK (tested; not executed by the migration runner)
-- ----------------------------------------------------------------------------
-- Narrows the ledger back to session_plan; delete the re-engagement rows first
-- or the CHECK will not validate.
-- BEGIN;
--   DROP FUNCTION IF EXISTS release_reengagement_claims(TEXT, UUID[]);
--   DROP FUNCTION IF EXISTS claim_due_reengagement(TEXT, INTEGER, INTEGER, INTEGER, JSONB);
--   DROP INDEX IF EXISTS idx_email_reminder_log_user_sent_on;
--   DROP INDEX IF EXISTS idx_user_progress_user_course_completed;
--   DROP INDEX IF EXISTS idx_user_progress_user_completed_at;
--   DELETE FROM email_reminder_log WHERE kind IN ('reengagement_7d','course_nudge');
--   ALTER TABLE email_reminder_log DROP CONSTRAINT IF EXISTS chk_email_reminder_log_kind;
--   ALTER TABLE email_reminder_log ADD CONSTRAINT chk_email_reminder_log_kind
--     CHECK (kind IN ('session_plan'));
-- COMMIT;
-- ============================================================================
