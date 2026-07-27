import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  isEmailConfigured,
  sendEmailBatch,
  RESEND_MAX_BATCH,
  type EmailMessage,
} from "./resend";
import { newCourseAnnouncementEmail } from "./templates";

/**
 * Marketing campaign pipeline (#769).
 *
 * CONSENT GATE: recipients come ONLY from the `list_marketing_recipients` RPC,
 * which returns opted-in users who have an email on file (its SQL is the single
 * consent gate — see the migration). This module never scans a table directly,
 * so a non-consenting user can never enter the recipient set here.
 *
 * FAIL-CLOSED: with no Resend key the pipeline returns `unconfigured` and reads
 * nothing. Audiences are chunked to Resend's 100/batch limit with a courtesy
 * delay between batches (rate-limit friendly); each batch carries a per-course/
 * per-chunk idempotency key so a retried campaign never double-sends.
 */

const DELAY_BETWEEN_BATCHES_MS = 600;

export interface CampaignResult {
  status: "sent" | "unconfigured" | "no_recipients";
  /** Consenting recipients with a valid email. */
  recipients: number;
  /** Messages Resend accepted. */
  sent: number;
  /** Batches that failed to send (non-fatal; the rest still went out). */
  failedBatches: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Defensive email sanity check on top of the RPC's NOT NULL / non-empty gate. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendNewCourseAnnouncement(params: {
  courseId: string;
  courseTitle: string;
  courseUrl: string;
  appUrl: string;
}): Promise<CampaignResult> {
  // Fail closed before any DB read.
  if (!isEmailConfigured()) {
    return { status: "unconfigured", recipients: 0, sent: 0, failedBatches: 0 };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("list_marketing_recipients");
  if (error) {
    console.error(
      `[email:campaign] recipient read failed for ${params.courseId}: ${error.message}`
    );
    return {
      status: "no_recipients",
      recipients: 0,
      sent: 0,
      failedBatches: 0,
    };
  }

  const recipients = (data ?? []).filter((r) => isValidEmail(r.email));
  if (recipients.length === 0) {
    return {
      status: "no_recipients",
      recipients: 0,
      sent: 0,
      failedBatches: 0,
    };
  }

  let sent = 0;
  let failedBatches = 0;

  for (let i = 0; i < recipients.length; i += RESEND_MAX_BATCH) {
    const chunk = recipients.slice(i, i + RESEND_MAX_BATCH);
    const messages: EmailMessage[] = chunk.map((r) => {
      const unsubscribeUrl = `${params.appUrl}/api/email/unsubscribe?token=${r.unsubscribe_token}`;
      const rendered = newCourseAnnouncementEmail({
        courseTitle: params.courseTitle,
        courseUrl: params.courseUrl,
        unsubscribeUrl,
      });
      return {
        to: r.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        // RFC 8058 one-click unsubscribe — mandatory on every marketing send.
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });

    const idempotencyKey = `new-course:${params.courseId}:${i / RESEND_MAX_BATCH}`;
    const result = await sendEmailBatch(messages, { idempotencyKey });
    if (result.ok) {
      sent += result.sent;
    } else {
      failedBatches += 1;
      console.error(
        `[email:campaign] batch ${i / RESEND_MAX_BATCH} failed for ${params.courseId}: ${
          result.reason === "error" ? result.message : result.reason
        }`
      );
    }

    if (i + RESEND_MAX_BATCH < recipients.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  return { status: "sent", recipients: recipients.length, sent, failedBatches };
}
