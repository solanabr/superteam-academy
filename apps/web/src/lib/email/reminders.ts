import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isEmailConfigured,
  sendEmailBatch,
  RESEND_MAX_BATCH,
  type EmailMessage,
} from "./resend";
import { sessionPlanReminderEmail } from "./templates";

/**
 * Session-plan reminder pipeline (#869) — "your next lesson is planned for today".
 *
 * CONSENT GATE: recipients come ONLY from the `claim_due_session_reminders` RPC.
 * Its SQL is the single gate: reminder consent (its OWN opt-in, never the
 * marketing one), a real email on file, and a `prefs.nextLesson.day` equal to
 * today's São Paulo weekday. This module never scans a table, so a learner
 * without reminder consent can never enter the recipient set here.
 *
 * IDEMPOTENCY: that same RPC CLAIMS each recipient by inserting an
 * `email_reminder_log` row in the same statement (PK on user+kind+day, ON
 * CONFLICT DO NOTHING). A second run on the same São Paulo day — a retried cron,
 * an overlapping invocation, a manual trigger — claims zero rows and sends
 * nothing. A batch that fails is released ONLY when the failure proves nothing
 * was accepted; an ambiguous failure (5xx, timeout) HOLDS its claims, because a
 * released claim plus a same-day retry is how a delivered email gets sent twice.
 *
 * FAIL-CLOSED: with no Resend key the pipeline returns `unconfigured` and reads
 * (and therefore claims) nothing — same contract as the marketing campaign.
 */

const DELAY_BETWEEN_BATCHES_MS = 600;

export interface ReminderRunResult {
  status: "sent" | "unconfigured" | "no_recipients";
  /** Learners claimed for today (consenting, planned for today, not yet sent). */
  recipients: number;
  /** Messages Resend accepted. */
  sent: number;
  /** Batches that failed (whether or not their claims were released). */
  failedBatches: number;
  /**
   * Claim rows released back for a same-day retry — from batches PROVABLY not
   * transmitted, plus recipients dropped by the address check. Ambiguous
   * failures are deliberately NOT counted here: their claims are still held.
   */
  released: number;
}

interface DueReminder {
  user_id: string;
  email: string;
  /**
   * REMINDER-scoped unsubscribe secret (#896). The RPC's OUT column keeps the
   * name `unsubscribe_token`, but since #896 it is sourced from
   * `email_subscriptions.reminder_unsubscribe_token` — NOT the marketing token.
   */
  unsubscribe_token: string;
  locale: string | null;
  plan_time: string;
}

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
 * Idempotency key derived from the DAY plus the chunk's member ids (the #779
 * reasoning): over the RPC's deterministic `ORDER BY user_id`, an unchanged
 * chunk keys identically on a same-day retry (Resend serves it from cache) while
 * a chunk whose membership actually changed gets a fresh key.
 */
function chunkIdempotencyKey(day: string, userIds: string[]): string {
  const digest = createHash("sha256")
    .update(userIds.join(","))
    .digest("hex")
    .slice(0, 16);
  return `session-plan:${day}:${digest}`;
}

/**
 * Claim and send today's session-plan reminders.
 *
 * @param params.appUrl   absolute app origin (email needs absolute links)
 * @param params.locale   locale used in the CTA link path when the recipient has
 *                        no recorded locale
 * @param params.weekday  optional `mon`…`sun` override for a manual catch-up run
 */
export async function sendSessionPlanReminders(params: {
  appUrl: string;
  locale: string;
  weekday?: string;
}): Promise<ReminderRunResult> {
  const empty = {
    recipients: 0,
    sent: 0,
    failedBatches: 0,
    released: 0,
  } as const;

  // Fail closed BEFORE the claim: an unconfigured deploy must not burn the day's
  // idempotency slots on sends that never happen.
  if (!isEmailConfigured()) return { status: "unconfigured", ...empty };

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_due_session_reminders", {
    p_weekday: params.weekday ?? undefined,
  });
  if (error) {
    console.error(`[email:reminders] claim failed: ${error.message}`);
    return { status: "no_recipients", ...empty };
  }

  const claimed = (data ?? []) as DueReminder[];
  const recipients = claimed.filter((r) => isValidEmail(r.email));

  const day = saoPauloDay();
  let sent = 0;
  let failedBatches = 0;
  let released = 0;

  /**
   * Release claims we hold but will not send against. Best-effort: a failed
   * release only costs today's reminder for those learners, never a duplicate.
   */
  const release = async (userIds: string[], why: string): Promise<void> => {
    if (userIds.length === 0) return;
    const { data: freed, error: releaseError } = await admin.rpc(
      "release_session_reminder_claims",
      { p_user_ids: userIds }
    );
    if (releaseError) {
      console.error(
        `[email:reminders] claim release (${why}) failed: ${releaseError.message}`
      );
    } else if (typeof freed === "number") {
      released += freed;
    }
  };

  // The claim RPC already claimed EVERY row it returned. Anything this filter
  // drops is a claim we will never send against — release it, or that learner
  // is silently locked out for the day with nothing in the logs.
  const filteredOut = claimed.filter((r) => !isValidEmail(r.email));
  if (filteredOut.length > 0) {
    console.error(
      `[email:reminders] ${filteredOut.length} claimed recipient(s) failed the address check; releasing their claims`
    );
    await release(
      filteredOut.map((r) => r.user_id),
      "invalid address"
    );
  }

  if (recipients.length === 0) {
    return { status: "no_recipients", ...empty, released };
  }

  for (let i = 0; i < recipients.length; i += RESEND_MAX_BATCH) {
    const chunk = recipients.slice(i, i + RESEND_MAX_BATCH);
    const messages: EmailMessage[] = chunk.map((r) => {
      // `kind=reminders` clears REMINDER consent only — product news is a
      // separate consent and must survive this unsubscribe. #896: the token is
      // reminder-scoped too (`claim_due_session_reminders` returns
      // `email_subscriptions.reminder_unsubscribe_token`), so this link cannot
      // touch marketing consent even with the `kind` stripped.
      const unsubscribeUrl = `${params.appUrl}/api/email/unsubscribe?token=${r.unsubscribe_token}&kind=reminders`;
      const locale = r.locale ?? params.locale;
      const rendered = sessionPlanReminderEmail({
        locale: r.locale,
        planTime: r.plan_time,
        dashboardUrl: `${params.appUrl}/${locale}/dashboard`,
        unsubscribeUrl,
      });
      return {
        to: r.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        // RFC 8058 one-click unsubscribe — mandatory on every send.
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });

    const result = await sendEmailBatch(messages, {
      idempotencyKey: chunkIdempotencyKey(
        day,
        chunk.map((r) => r.user_id)
      ),
    });

    if (result.ok) {
      sent += result.sent;
    } else {
      failedBatches += 1;
      console.error(
        `[email:reminders] batch ${i / RESEND_MAX_BATCH} failed: ${
          result.reason === "error" ? result.message : result.reason
        }`
      );
      // Release the claim ONLY when the failure PROVES nothing was accepted.
      // A 5xx or a timeout is ambiguous — Resend may have accepted
      // and delivered the batch before the wire broke, and releasing there lets
      // a same-day manual retry send a SECOND copy to a learner who already got
      // one (the batch's idempotency key changes with chunk membership, so
      // Resend's own dedupe would not catch it). Holding an ambiguous claim
      // costs at most one missed reminder; releasing it costs a duplicate.
      if (result.reason === "error" && result.delivery === "rejected") {
        await release(
          chunk.map((r) => r.user_id),
          "batch rejected before transmission"
        );
      } else {
        console.error(
          `[email:reminders] batch ${i / RESEND_MAX_BATCH} outcome AMBIGUOUS; holding ${chunk.length} claim(s) to avoid a duplicate send`
        );
      }
    }

    if (i + RESEND_MAX_BATCH < recipients.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  return {
    status: "sent",
    recipients: recipients.length,
    sent,
    failedBatches,
    released,
  };
}
