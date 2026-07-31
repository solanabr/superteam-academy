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

/**
 * Whether a failed batch is KNOWN not to have been transmitted/accepted (#869
 * review F3). A caller that undoes bookkeeping on failure — the reminder
 * pipeline releases its per-day send claims — may only do so on `rejected`.
 *
 *   * `rejected` — provably nothing was accepted: the request never left this
 *     process (local guard, DNS failure, connection refused) or Resend answered
 *     4xx (validation/auth/rate-limit — the batch was refused outright).
 *   * `unknown`  — AMBIGUOUS: a 5xx, a timeout, or a socket dropped mid-flight.
 *     Resend may well have accepted and delivered the batch before the wire
 *     broke. Undoing bookkeeping here is what re-sends a delivered email.
 */
export type SendFailureDelivery = "rejected" | "unknown";

export type SendBatchResult =
  | { ok: true; sent: number }
  | { ok: false; reason: "unconfigured" }
  | {
      ok: false;
      reason: "error";
      status?: number;
      message: string;
      delivery: SendFailureDelivery;
    };

/**
 * Classify a thrown fetch error. Only failures that provably happened BEFORE
 * any byte could be accepted are `rejected`; everything else — notably aborts,
 * timeouts and mid-flight resets — is `unknown`, because the request may have
 * been fully received and acted on before the connection died.
 */
function classifyThrownError(err: unknown): SendFailureDelivery {
  const code =
    err && typeof err === "object" && "cause" in err
      ? (err as { cause?: { code?: unknown } }).cause?.code
      : undefined;
  const PRE_TRANSMISSION = new Set([
    "ECONNREFUSED", // nothing accepted the connection
    "ENOTFOUND", // DNS never resolved
    "EAI_AGAIN", // DNS failure
    "ERR_INVALID_URL",
  ]);
  return typeof code === "string" && PRE_TRANSMISSION.has(code)
    ? "rejected"
    : "unknown";
}

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
      // Local guard: the request was never made.
      delivery: "rejected",
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
      delivery: classifyThrownError(err),
    };
  }

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    return {
      ok: false,
      reason: "error",
      status: res.status,
      message: message.slice(0, 500),
      // 4xx = Resend refused the batch outright (validation, auth, rate limit):
      // nothing was queued. 5xx is AMBIGUOUS — it may have been accepted first.
      delivery: res.status >= 400 && res.status < 500 ? "rejected" : "unknown",
    };
  }
  return { ok: true, sent: messages.length };
}
