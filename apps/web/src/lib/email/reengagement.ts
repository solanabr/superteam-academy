/**
 * Re-engagement selection + render (#870, uiux-R17).
 *
 * SCOPE OF THIS MODULE — deliberately pure. It answers exactly one question:
 * "given what we know about a lapsed learner, which re-engagement email (if
 * any) should they get, and what does it render to?" It performs no I/O, imports
 * nothing server-only, and is therefore unit-testable and reusable by whatever
 * drives the send.
 *
 * NOT IN THIS MODULE — the send pipeline (DB + cron). It shipped separately in
 * #899; see the pointer at the bottom of this file.
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
 * are the contract `20260731170000_reengagement_pipeline.sql` uses in its
 * widened `chk_email_reminder_log_kind` CHECK and in its claim RPCs.
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
 * FREQUENCY CAP (#899) — at most one re-engagement-class email per learner per
 * N days, across BOTH kinds. R17's no-repeat rule; the owner default is 14.
 *
 * This constant is the caller's default, but it is NOT where the rule lives:
 * `claim_due_reengagement` enforces it in SQL (a NOT EXISTS over
 * `email_reminder_log` on the two kinds above), so a second caller, a manual
 * trigger or a future route cannot forget it. The #869 per-day PK alone is not
 * enough — a permanently lapsed learner satisfies "inactive ≥ 7 days" every day
 * forever and would be nudged DAILY.
 *
 * Session-plan reminders are deliberately OUTSIDE this cap in both directions:
 * they are a self-scheduled appointment the learner set up, so they neither
 * consume the re-engagement budget nor get suppressed by it.
 */
export const REENGAGEMENT_CAP_DAYS = 14;

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
 * SEND PIPELINE — SHIPPED in #899, not here.
 *
 * This module stays pure (no I/O, no server-only imports). The trigger is DB +
 * cron and lives in:
 *   * supabase/migrations/20260731170000_reengagement_pipeline.sql
 *     — widens `chk_email_reminder_log_kind` to the two kinds above, and adds
 *       `claim_due_reengagement` / `release_reengagement_claims`. The consent
 *       gate, the once-per-day claim and the {@link REENGAGEMENT_CAP_DAYS}
 *       frequency cap are all DATABASE invariants there, not app conventions.
 *   * lib/email/reengagement-send.ts — `sendReengagementEmails`, which renders
 *     via {@link selectReengagementEmail} and {@link reengagementHeaders}.
 *   * app/api/cron/reengagement/route.ts — the single daily trigger, running
 *     the course nudge pass BEFORE the generic one so the cap gives
 *     course_nudge precedence for free.
 * ─────────────────────────────────────────────────────────────────────────────
 */
