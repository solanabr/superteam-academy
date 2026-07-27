import "server-only";

import { serverEnv } from "@/lib/env.server";

/**
 * Resend send seam (#769) — FAIL-CLOSED marketing/announcement email.
 *
 * Plain fetch to Resend's HTTP API (no `resend` SDK dependency — keeps the send
 * path a thin, auditable, dependency-light module and makes the unconfigured
 * path trivially total). The module ALWAYS loads: with no `RESEND_API_KEY`,
 * {@link sendEmailBatch} returns `{ ok:false, reason:'unconfigured' }` and sends
 * nothing — it NEVER throws at import or at call. The owner sets the key once a
 * Resend sending domain (DKIM/SPF/DMARC) is verified.
 */

/** Used when `EMAIL_FROM` is unset. The domain must be Resend-verified to send. */
export const DEFAULT_EMAIL_FROM = "Superteam Academy <news@st.academy>";

/** Resend's `/emails/batch` accepts at most 100 messages per request. */
export const RESEND_MAX_BATCH = 100;

const RESEND_BATCH_ENDPOINT = "https://api.resend.com/emails/batch";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Per-recipient headers — carries List-Unsubscribe (RFC 8058). */
  headers?: Record<string, string>;
}

export type SendBatchResult =
  | { ok: true; sent: number }
  | { ok: false; reason: "unconfigured" }
  | { ok: false; reason: "error"; status?: number; message: string };

/** True when a Resend key is configured. The pipeline checks this before any read. */
export function isEmailConfigured(): boolean {
  return Boolean(serverEnv.RESEND_API_KEY);
}

/** The verified From identity, or the documented default. */
export function emailFrom(): string {
  return serverEnv.EMAIL_FROM ?? DEFAULT_EMAIL_FROM;
}

/**
 * Send one batch (≤ {@link RESEND_MAX_BATCH}). Fail-closed when unconfigured;
 * every network/HTTP failure comes back as a typed `error` result rather than a
 * throw, so the caller can count failed batches without try/catch. Callers MUST
 * chunk larger audiences (the pipeline does).
 */
export async function sendEmailBatch(
  messages: readonly EmailMessage[],
  opts: {
    idempotencyKey?: string;
    signal?: AbortSignal;
    fetchImpl?: typeof fetch;
  } = {}
): Promise<SendBatchResult> {
  const apiKey = serverEnv.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "unconfigured" };
  if (messages.length === 0) return { ok: true, sent: 0 };
  if (messages.length > RESEND_MAX_BATCH) {
    return {
      ok: false,
      reason: "error",
      message: `batch of ${messages.length} exceeds the ${RESEND_MAX_BATCH}-message limit`,
    };
  }

  const from = emailFrom();
  const body = messages.map((m) => ({
    from,
    to: [m.to],
    subject: m.subject,
    html: m.html,
    text: m.text,
    ...(m.headers ? { headers: m.headers } : {}),
  }));

  const doFetch = opts.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await doFetch(RESEND_BATCH_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(opts.idempotencyKey
          ? { "Idempotency-Key": opts.idempotencyKey }
          : {}),
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    return {
      ok: false,
      reason: "error",
      status: res.status,
      message: message.slice(0, 500),
    };
  }
  return { ok: true, sent: messages.length };
}
