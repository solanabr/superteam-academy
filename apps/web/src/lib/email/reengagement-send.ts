import "server-only";

import { createHash } from "node:crypto";
import {
  getAllCourseLessonCounts,
  getCourseLessonOrders,
  getCoursesByIds,
} from "@/lib/content/queries";
import { findNextIncompleteLesson } from "@/lib/courses/continue-learning";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  INACTIVITY_THRESHOLD_DAYS,
  REENGAGEMENT_CAP_DAYS,
  REENGAGEMENT_LEDGER_KINDS,
  COURSE_NUDGE_MAX_REMAINING,
  reengagementHeaders,
  selectReengagementEmail,
  type ReengagementKind,
} from "./reengagement";
import {
  isEmailConfigured,
  sendEmailBatch,
  RESEND_MAX_BATCH,
  type EmailMessage,
} from "./resend";

/**
 * Re-engagement send pipeline (#899) — the trigger #898 deliberately left out.
 *
 * SHAPE: a copy of `lib/email/reminders.ts`, for the same reasons. What differs
 * is that this runs TWO passes over one ledger, and that the recipient set is
 * bounded by a FREQUENCY CAP, not just by the per-day claim.
 *
 * CONSENT GATE: recipients come ONLY from `claim_due_reengagement`. Its SQL is
 * the single gate — REMINDER consent (never the marketing opt-in; LGPD consent
 * is purpose-bound), a real email on file, and a lapse of at least N days. This
 * module never scans a table, so a learner without reminder consent can never
 * enter the recipient set here. `selectReengagementEmail` re-checks consent
 * in-process as defense in depth.
 *
 * IDEMPOTENCY + CAP: the same RPC CLAIMS each recipient by inserting an
 * `email_reminder_log` row in the same statement. Two invariants come out of it:
 *   * once per (learner, kind, São Paulo day) — the #869 PK; and
 *   * at most one re-engagement-class email per learner per
 *     {@link REENGAGEMENT_CAP_DAYS} days ACROSS both kinds — the cap, which is
 *     what stops a permanently lapsed learner being nudged daily.
 * Neither lives in this file. A batch that fails is released ONLY when the
 * failure proves nothing was transmitted; an ambiguous failure (5xx, timeout)
 * HOLDS its claims, because a released claim plus a retry is how a delivered
 * email gets sent twice.
 *
 * PRECEDENCE: `course_nudge` runs FIRST. Its claim row then trips the generic
 * pass's own cap, so a learner one lesson from a credential hears about that
 * lesson and never also gets the dashboard nudge — no second mechanism needed.
 *
 * FAIL-CLOSED: with no Resend key the pipeline returns `unconfigured` and reads
 * (and therefore claims) nothing.
 */

const DELAY_BETWEEN_BATCHES_MS = 600;

export interface ReengagementPassResult {
  kind: ReengagementKind;
  status: "sent" | "unconfigured" | "no_recipients";
  /** Learners claimed by this pass. */
  recipients: number;
  /** Messages Resend accepted. */
  sent: number;
  /** Batches that failed (whether or not their claims were released). */
  failedBatches: number;
  /**
   * Claim rows released back for a same-day retry — from batches PROVABLY not
   * transmitted, plus recipients dropped before any send attempt. Ambiguous
   * failures are deliberately NOT counted here: their claims are still held.
   */
  released: number;
  /** Claimed rows dropped pre-send (bad address, unresolvable course/lesson). */
  skipped: number;
}

export interface ReengagementRunResult {
  status: "sent" | "unconfigured" | "no_recipients";
  passes: ReengagementPassResult[];
  sent: number;
}

/** One row of `claim_due_reengagement`. */
interface ClaimedRow {
  user_id: string;
  email: string;
  /**
   * REMINDER-scoped unsubscribe secret (#896) — sourced from
   * `email_subscriptions.reminder_unsubscribe_token`, never the marketing token.
   */
  unsubscribe_token: string;
  locale: string | null;
  streak_days: number;
  days_inactive: number;
  /** Nearly-done course; NULL for the generic kind. */
  course_id: string | null;
  /** Completed lesson ids in that course; empty for the generic kind. */
  completed_lesson_ids: string[] | null;
}

/** Rows the claim RPC returns, before the pipeline's own defensive checks. */
type ClaimResponse = ClaimedRow[] | null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Defensive sanity check on top of the RPC's NOT NULL / non-empty gate. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Today on the São Paulo calendar — the same day the claim RPC keys on. */
export function saoPauloDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Idempotency key over the KIND, the day and the chunk's member ids. Over the
 * RPC's deterministic `ORDER BY user_id` an unchanged chunk keys identically on
 * a same-day retry (Resend serves it from cache) while a chunk whose membership
 * actually changed gets a fresh key. The kind is in the key so the two passes
 * can never collide on one.
 */
function chunkIdempotencyKey(
  kind: ReengagementKind,
  day: string,
  userIds: string[]
): string {
  const digest = createHash("sha256")
    .update(userIds.join(","))
    .digest("hex")
    .slice(0, 16);
  return `${kind}:${day}:${digest}`;
}

/**
 * Course context for the nudge, resolved against the CONTENT BUNDLE (the only
 * source of truth for lesson order and titles — Postgres has neither).
 */
interface CourseContext {
  title: string;
  slug: string;
  totalLessons: number;
  lessons: { _id: string; title: string; slug: string }[];
}

async function loadCourseContext(
  courseIds: string[]
): Promise<Map<string, CourseContext>> {
  const out = new Map<string, CourseContext>();
  if (courseIds.length === 0) return out;
  const [summaries, orders] = await Promise.all([
    getCoursesByIds(courseIds),
    getCourseLessonOrders(courseIds),
  ]);
  const orderById = new Map(orders.map((o) => [o._id, o]));
  for (const s of summaries) {
    const order = orderById.get(s._id);
    if (!order) continue;
    out.set(s._id, {
      title: s.title,
      slug: s.slug,
      totalLessons: s.totalLessons,
      lessons: order.lessons,
    });
  }
  return out;
}

/**
 * Run one pass (one ledger kind) end to end.
 *
 * @param params.appUrl  absolute app origin (email needs absolute links)
 * @param params.locale  locale for the CTA link path when the recipient has none
 */
async function runPass(
  kind: ReengagementKind,
  params: {
    appUrl: string;
    locale: string;
    inactiveDays: number;
    capDays: number;
  }
): Promise<ReengagementPassResult> {
  const base = {
    kind,
    recipients: 0,
    sent: 0,
    failedBatches: 0,
    released: 0,
    skipped: 0,
  } as const;

  const admin = createAdminClient();

  // Lesson counts live in the committed content bundle, never in Postgres, so
  // "one lesson from done" is a caller-supplied map. Already gated on
  // synced+active deployments — an unlisted course is simply never nudged.
  const courseTotals: Record<string, number> = {};
  if (kind === REENGAGEMENT_LEDGER_KINDS.courseNudge) {
    for (const c of await getAllCourseLessonCounts()) {
      courseTotals[c._id] = c.totalLessons;
    }
  }

  const { data, error } = await admin.rpc("claim_due_reengagement", {
    p_kind: kind,
    p_inactive_days: params.inactiveDays,
    p_cap_days: params.capDays,
    p_max_remaining: COURSE_NUDGE_MAX_REMAINING,
    p_course_totals: courseTotals,
  });
  if (error) {
    console.error(
      `[email:reengagement:${kind}] claim failed: ${error.message}`
    );
    return { ...base, status: "no_recipients" };
  }

  const claimed = ((data as ClaimResponse) ?? []) satisfies ClaimedRow[];
  if (claimed.length === 0) return { ...base, status: "no_recipients" };

  let sent = 0;
  let failedBatches = 0;
  let released = 0;
  let skipped = 0;

  /**
   * Release claims we hold but will not send against. Best-effort: a failed
   * release only costs this cycle's nudge for those learners, never a duplicate.
   */
  const release = async (userIds: string[], why: string): Promise<void> => {
    if (userIds.length === 0) return;
    const { data: freed, error: releaseError } = await admin.rpc(
      "release_reengagement_claims",
      { p_kind: kind, p_user_ids: userIds }
    );
    if (releaseError) {
      console.error(
        `[email:reengagement:${kind}] claim release (${why}) failed: ${releaseError.message}`
      );
    } else if (typeof freed === "number") {
      released += freed;
    }
  };

  const courses = await loadCourseContext(
    kind === REENGAGEMENT_LEDGER_KINDS.courseNudge
      ? [
          ...new Set(
            claimed.map((r) => r.course_id).filter((c): c is string => !!c)
          ),
        ]
      : []
  );

  // Every row the RPC returned is ALREADY claimed. Anything dropped below is a
  // claim we will never send against — release it, or the learner is silently
  // muted for the whole cap window with nothing in the logs (#895 review F4).
  const dropped: { userId: string; why: string }[] = [];
  const messages: { userId: string; message: EmailMessage }[] = [];

  for (const row of claimed) {
    if (!isValidEmail(row.email)) {
      dropped.push({ userId: row.user_id, why: "invalid address" });
      continue;
    }

    let nearlyDone = null as Parameters<
      typeof selectReengagementEmail
    >[0]["nearlyDone"];

    if (kind === REENGAGEMENT_LEDGER_KINDS.courseNudge) {
      const course = row.course_id ? courses.get(row.course_id) : undefined;
      if (!course) {
        dropped.push({ userId: row.user_id, why: "course not in bundle" });
        continue;
      }
      const done = new Set(row.completed_lesson_ids ?? []);
      const next = findNextIncompleteLesson(course.lessons, done);
      if (!next) {
        // The bundle says the course is finished even though the SQL count said
        // otherwise (a lesson was renamed/removed between the two reads). Send
        // nothing rather than a wrong "one lesson left".
        dropped.push({ userId: row.user_id, why: "no incomplete lesson" });
        continue;
      }
      nearlyDone = {
        courseTitle: course.title,
        courseSlug: course.slug,
        lessonTitle: next.title,
        lessonSlug: next.slug,
        // Measured against the BUNDLE, so a stale progress row for a removed
        // lesson cannot inflate it past the template's singular/plural copy.
        lessonsRemaining: course.lessons.filter((l) => !done.has(l._id)).length,
      };
    }

    const selection = selectReengagementEmail({
      reminderOptIn: true, // the RPC's SQL gate is the authority; re-asserted here
      daysInactive: row.days_inactive,
      locale: row.locale,
      streakDays: row.streak_days,
      nearlyDone,
      appUrl: params.appUrl,
      unsubscribeToken: row.unsubscribe_token,
    });

    // Fail closed on any disagreement between the SQL selection and the pure
    // one: sending under the wrong ledger kind would corrupt the R17
    // template→return attribution the whole rotation is evaluated on.
    if (!selection || selection.kind !== kind) {
      dropped.push({
        userId: row.user_id,
        why: selection
          ? `kind mismatch (${selection.kind})`
          : "selection declined",
      });
      continue;
    }

    messages.push({
      userId: row.user_id,
      message: {
        to: row.email,
        subject: selection.email.subject,
        html: selection.email.html,
        text: selection.email.text,
        // RFC 8058 one-click unsubscribe — mandatory on every send.
        headers: reengagementHeaders(selection.unsubscribeUrl),
      },
    });
  }

  if (dropped.length > 0) {
    skipped = dropped.length;
    console.error(
      `[email:reengagement:${kind}] releasing ${dropped.length} claim(s) dropped pre-send: ${[
        ...new Set(dropped.map((d) => d.why)),
      ].join(", ")}`
    );
    await release(
      dropped.map((d) => d.userId),
      "dropped pre-send"
    );
  }

  if (messages.length === 0) {
    return { ...base, status: "no_recipients", released, skipped };
  }

  const day = saoPauloDay();
  for (let i = 0; i < messages.length; i += RESEND_MAX_BATCH) {
    const chunk = messages.slice(i, i + RESEND_MAX_BATCH);
    const result = await sendEmailBatch(
      chunk.map((c) => c.message),
      {
        idempotencyKey: chunkIdempotencyKey(
          kind,
          day,
          chunk.map((c) => c.userId)
        ),
      }
    );

    if (result.ok) {
      sent += result.sent;
    } else {
      failedBatches += 1;
      console.error(
        `[email:reengagement:${kind}] batch ${i / RESEND_MAX_BATCH} failed: ${
          result.reason === "error" ? result.message : result.reason
        }`
      );
      // Release ONLY when the failure PROVES nothing was accepted. A 5xx or a
      // timeout is ambiguous — Resend may have accepted and delivered before the
      // wire broke, and releasing there lets a same-day retry send a SECOND copy
      // (the batch key changes with chunk membership, so Resend's own dedupe
      // would not catch it). Holding an ambiguous claim costs at most one missed
      // nudge; releasing it costs a duplicate.
      if (result.reason === "error" && result.delivery === "rejected") {
        await release(
          chunk.map((c) => c.userId),
          "batch rejected before transmission"
        );
      } else {
        console.error(
          `[email:reengagement:${kind}] batch ${i / RESEND_MAX_BATCH} outcome AMBIGUOUS; holding ${chunk.length} claim(s) to avoid a duplicate send`
        );
      }
    }

    if (i + RESEND_MAX_BATCH < messages.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  return {
    kind,
    status: "sent",
    recipients: messages.length,
    sent,
    failedBatches,
    released,
    skipped,
  };
}

/**
 * Claim and send today's re-engagement mail: the course nudge first, then the
 * generic lapse nudge. Pass order is load-bearing — see PRECEDENCE above.
 */
export async function sendReengagementEmails(params: {
  appUrl: string;
  locale: string;
  /** Lapse threshold in days. Defaults to the R17 value. */
  inactiveDays?: number;
  /** Frequency-cap window in days. Defaults to the owner's N = 14. */
  capDays?: number;
}): Promise<ReengagementRunResult> {
  // Fail closed BEFORE any claim: an unconfigured deploy must not burn a whole
  // cap window's worth of slots on sends that never happen.
  if (!isEmailConfigured()) {
    return { status: "unconfigured", passes: [], sent: 0 };
  }

  const opts = {
    appUrl: params.appUrl,
    locale: params.locale,
    inactiveDays: params.inactiveDays ?? INACTIVITY_THRESHOLD_DAYS,
    capDays: params.capDays ?? REENGAGEMENT_CAP_DAYS,
  };

  const passes: ReengagementPassResult[] = [];
  for (const kind of [
    REENGAGEMENT_LEDGER_KINDS.courseNudge,
    REENGAGEMENT_LEDGER_KINDS.inactive,
  ] as const) {
    passes.push(await runPass(kind, opts));
  }

  const sent = passes.reduce((n, p) => n + p.sent, 0);
  return {
    status: passes.some((p) => p.status === "sent") ? "sent" : "no_recipients",
    passes,
    sent,
  };
}
