/**
 * Re-engagement selection + render (#870, uiux-R17).
 *
 * SCOPE OF THIS MODULE — deliberately pure. It answers exactly one question:
 * "given what we know about a lapsed learner, which re-engagement email (if
 * any) should they get, and what does it render to?" It performs no I/O, imports
 * nothing server-only, and is therefore unit-testable and reusable by whatever
 * drives the send.
 *
 * NOT IN THIS MODULE (and not in this PR) — the send pipeline. See the
 * SEND-PIPELINE TODO at the bottom: the trigger needs new ledger kinds and claim
 * RPCs, i.e. a migration, and splitting it out keeps this change migration-free.
 *
 * CONSENT — reminder, not marketing. Both templates here are gated on
 * `email_subscriptions.reminder_opt_in` (unsubscribe `kind=reminders`), the
 * consent introduced in #869, NOT on the marketing opt-in from #779. Reasoning:
 * LGPD consent is purpose-bound. These emails are about the learner's OWN study
 * progress in a course they enrolled in themselves — the same "nudge me about my
 * studying" purpose they consented to for session reminders. They contain no
 * promotion, no cross-sell and no product news, which is what the marketing
 * opt-in covers. So: reminder consent governs, and it FAILS CLOSED — an absent
 * or false `reminderOptIn` yields `null` here, on top of the SQL-side gate the
 * eventual claim RPC will enforce (defense in depth, mirroring
 * `lib/email/reminders.ts`).
 */

import {
  reengagementNudgeEmail,
  courseNudgeEmail,
  type RenderedEmail,
} from "./templates";

/**
 * Ledger kinds for `email_reminder_log.kind`. The #869 ledger was built to take
 * more families ("Extensible … each family gets its own once-per-day slot"), so
 * re-engagement adds two kinds rather than a second table. These exact strings
 * are the contract the follow-up migration must use in its
 * `chk_email_reminder_log_kind` CHECK and in its claim RPCs.
 */
export const REENGAGEMENT_LEDGER_KINDS = {
  /** (a) N days with no activity anywhere on the platform. */
  inactive: "reengagement_7d",
  /** (b) A course sitting one lesson from completion. */
  courseNudge: "course_nudge",
} as const;

export type ReengagementKind =
  (typeof REENGAGEMENT_LEDGER_KINDS)[keyof typeof REENGAGEMENT_LEDGER_KINDS];

/**
 * Days of inactivity before a learner is eligible. uiux-R17's ~23.5h cadence
 * governs the timing of a streak reminder; this is the deeper-lapse nudge, and
 * a week is the shortest gap that reads as "a break" rather than "yesterday".
 */
export const INACTIVITY_THRESHOLD_DAYS = 7;

/**
 * How many incomplete lessons still counts as "you were close". v1 is strictly
 * the last lesson, per the issue's scope; the template already renders the
 * plural variant, so widening this is a one-constant change.
 */
export const COURSE_NUDGE_MAX_REMAINING = 1;

/** The course a learner is nearly finished with, if any. */
export interface NearlyDoneCourse {
  courseTitle: string;
  courseSlug: string;
  /** Next incomplete lesson — from `lib/courses/continue-learning.ts`. */
  lessonTitle: string;
  lessonSlug: string;
  /** Lessons still incomplete in that course (>= 1). */
  lessonsRemaining: number;
}

/** Everything the selection needs about one candidate learner. */
export interface ReengagementCandidate {
  /** REMINDER consent. False/absent ⇒ no email, no exceptions. */
  reminderOptIn: boolean;
  /** Days since the learner's last recorded activity. */
  daysInactive: number;
  /** Recorded consent locale; unknown/null falls back to `en` copy. */
  locale: string | null;
  /** Best recorded streak, purely as a reminder of what they built. 0 = none. */
  streakDays: number;
  /** Nearest-to-done enrolled course, or null when there isn't one. */
  nearlyDone: NearlyDoneCourse | null;
  /** Absolute app origin — emails need absolute links. No trailing slash. */
  appUrl: string;
  /**
   * Per-recipient REMINDER unsubscribe token
   * (`email_subscriptions.reminder_unsubscribe_token`, #896). Must NOT be the
   * marketing token: re-engagement rides on reminder consent, and a
   * marketing-scoped token no longer matches the reminder RPC at all.
   */
  unsubscribeToken: string;
}

export interface ReengagementSelection {
  /** Ledger kind to claim under, and to log for the R17 template→return metric. */
  kind: ReengagementKind;
  email: RenderedEmail;
  /** The `List-Unsubscribe` target — reminder consent only. */
  unsubscribeUrl: string;
}

/** Locale used for link paths (not for copy — the templates fall back on their own). */
function linkLocale(locale: string | null): string {
  return locale === "pt-BR" || locale === "es" || locale === "en"
    ? locale
    : "en";
}

/**
 * One-click unsubscribe target. `kind=reminders` clears REMINDER consent ONLY —
 * a learner who stops study nudges keeps their product-news preference.
 */
export function reengagementUnsubscribeUrl(
  appUrl: string,
  token: string
): string {
  return `${appUrl}/api/email/unsubscribe?token=${encodeURIComponent(token)}&kind=reminders`;
}

/**
 * Pick and render the re-engagement email for one candidate, or `null` when the
 * learner should not be emailed at all.
 *
 * Order matters: the course nudge wins over the generic one because it is the
 * strictly more specific, more actionable message — a learner one lesson from a
 * credential should hear about that lesson, not about their dashboard. A learner
 * never receives both from a single run; the caller claims the returned `kind`.
 */
export function selectReengagementEmail(
  candidate: ReengagementCandidate
): ReengagementSelection | null {
  // Consent gate, fail-closed and first.
  if (!candidate.reminderOptIn) return null;
  if (
    !Number.isFinite(candidate.daysInactive) ||
    candidate.daysInactive < INACTIVITY_THRESHOLD_DAYS
  ) {
    return null;
  }

  const unsubscribeUrl = reengagementUnsubscribeUrl(
    candidate.appUrl,
    candidate.unsubscribeToken
  );
  const locale = linkLocale(candidate.locale);
  const near = candidate.nearlyDone;

  if (
    near &&
    near.lessonsRemaining >= 1 &&
    near.lessonsRemaining <= COURSE_NUDGE_MAX_REMAINING
  ) {
    return {
      kind: REENGAGEMENT_LEDGER_KINDS.courseNudge,
      unsubscribeUrl,
      email: courseNudgeEmail({
        locale: candidate.locale,
        courseTitle: near.courseTitle,
        lessonTitle: near.lessonTitle,
        lessonsRemaining: near.lessonsRemaining,
        lessonUrl: `${candidate.appUrl}/${locale}/courses/${near.courseSlug}/lessons/${near.lessonSlug}`,
        unsubscribeUrl,
      }),
    };
  }

  return {
    kind: REENGAGEMENT_LEDGER_KINDS.inactive,
    unsubscribeUrl,
    email: reengagementNudgeEmail({
      locale: candidate.locale,
      streakDays: candidate.streakDays,
      dashboardUrl: `${candidate.appUrl}/${locale}/dashboard`,
      unsubscribeUrl,
    }),
  };
}

/**
 * Headers every re-engagement send must carry (RFC 8058 one-click unsubscribe),
 * kept here so the future pipeline cannot ship a send without them.
 */
export function reengagementHeaders(
  unsubscribeUrl: string
): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/*
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO — SEND PIPELINE (follow-up issue; intentionally NOT in #870)
 *
 * Templates are pure code; the trigger is DB + cron. Shipping the trigger here
 * would drag a migration into a change that otherwise needs none, so #870 stops
 * at selection and the pipeline lands separately. The design below is
 * migration-ready — every name it uses is fixed by this file.
 *
 * 1. MIGRATION
 *    a. Widen `chk_email_reminder_log_kind` (20260731120000_reminder_consent.sql)
 *       to CHECK (kind IN ('session_plan', 'reengagement_7d', 'course_nudge')).
 *       The PK (user_id, kind, sent_on) then gives each family its own
 *       once-per-São-Paulo-day slot for free.
 *    b. `claim_due_reengagement(p_kind TEXT, p_days INT)` — SECURITY DEFINER,
 *       search_path '', service_role only, modeled exactly on
 *       claim_due_session_reminders: ONE statement that reads the recipient set
 *       and INSERTs its claim rows (ON CONFLICT DO NOTHING RETURNING), so two
 *       overlapping cron runs cannot both claim a learner. Gate clauses:
 *         * es.reminder_opt_in = true            ← the consent gate, in SQL
 *         * real email (NOT LIKE '%@wallet.superteam-lms.local')
 *         * last activity older than p_days (max(user_progress.completed_at),
 *           which needs an index on (user_id, completed_at DESC))
 *         * for 'course_nudge': exactly COURSE_NUDGE_MAX_REMAINING lessons
 *           incomplete in some enrolled, non-certified course
 *       ORDER BY user_id, so chunk boundaries — and therefore Resend idempotency
 *       keys — are reproducible across a retry.
 *       It MUST return `es.reminder_unsubscribe_token`, never
 *       `es.unsubscribe_token` (#896): the two consents have separate secrets,
 *       and a re-engagement mail rides on REMINDER consent.
 *    c. `release_reengagement_claims(p_kind TEXT, p_user_ids UUID[])`.
 *
 * 2. FREQUENCY CAP (R17's no-repeat-within-N-days). The per-day PK is not
 *    enough: a permanently lapsed learner would get a nudge every single day.
 *    The claim must additionally exclude anyone with a re-engagement row in the
 *    last N days (N ≈ 14) — a NOT EXISTS over email_reminder_log on the two
 *    re-engagement kinds. Decide N with the owner before building.
 *
 * 3. PIPELINE (`sendReengagementEmails`) — copy lib/email/reminders.ts
 *    wholesale: isEmailConfigured() fail-closed BEFORE the claim; batch by
 *    RESEND_MAX_BATCH; per-chunk idempotency key over the day + member ids;
 *    release a claim ONLY on a provably-rejected batch and HOLD it on an
 *    ambiguous 5xx/timeout (releasing an ambiguous claim is how a delivered
 *    email gets sent twice). Selection + render come from
 *    selectReengagementEmail(); headers from reengagementHeaders().
 *
 * 4. CRON — one daily route under app/api/cron/, CRON_SECRET-guarded like
 *    api/cron/session-reminders, running the course nudge first, then the
 *    generic one (a learner claimed by the nudge is skipped by the second pass
 *    via the §2 cap).
 *
 * 5. INSTRUMENTATION — R17 requires logging template → return from day one:
 *    persist the sent `kind` (already the ledger PK) and attribute a return
 *    visit within 72h, so the rotation can be evaluated rather than guessed.
 * ─────────────────────────────────────────────────────────────────────────────
 */
