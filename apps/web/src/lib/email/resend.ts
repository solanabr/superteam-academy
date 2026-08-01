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
 * Whether a failed batch is KNOWN not to have been transmitted/accepted
 * (#869). A caller that undoes bookkeeping on failure — the reminder
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

/**
 * Resend's documented idempotency-conflict discriminators, returned as the
 * error body's `name` on a 409. They mean OPPOSITE things for the claim-release
 * invariant, which is why the 409 is special-cased rather than folded into the
 * generic 4xx branch:
 *
 *   * `invalid_idempotent_request`     — the same Idempotency-Key was replayed
 *     with a DIFFERENT payload. Resend refuses it outright: nothing was
 *     accepted (`rejected`). Because our keys are derived from (day, chunk
 *     membership), this is a PERMANENT same-day stall — every retry today
 *     rebuilds the same key with the same mismatching payload — that self-heals
 *     only when the key's 24h TTL expires.
 *   * `concurrent_idempotent_requests` — another request with this key is still
 *     in flight. That other request may well SEND, so this is ambiguous
 *     (`unknown`), not a refusal — releasing claims here risks a duplicate.
 */
const IDEMPOTENCY_CONFLICT_NAMES = [
  "invalid_idempotent_request",
  "concurrent_idempotent_requests",
] as const;

type IdempotencyConflict = (typeof IDEMPOTENCY_CONFLICT_NAMES)[number];

/** Extract Resend's `name` discriminator from a 409 error body, if present. */
function idempotencyConflictName(
  body: string
): IdempotencyConflict | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return undefined;
  }
  const name =
    parsed && typeof parsed === "object"
      ? (parsed as { name?: unknown }).name
      : undefined;
  return typeof name === "string" &&
    (IDEMPOTENCY_CONFLICT_NAMES as readonly string[]).includes(name)
    ? (name as IdempotencyConflict)
    : undefined;
}

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
        // INVARIANT (pinned, not inherited): strict batch validation makes a 4xx
        // mean "the WHOLE batch was refused — nothing was accepted". The
        // claim-release contract above (`rejected` ⇒ safe to release the
        // per-day send claims) DEPENDS on that all-or-nothing semantics: under
        // permissive validation Resend can accept the valid messages and report
        // the invalid ones, so a 4xx would no longer prove nothing was sent and
        // releasing on it would re-send delivered mail. Strict is currently the
        // API's default, but it is an UNDOCUMENTED default — pin it explicitly
        // so a server-side default flip cannot silently break the invariant.
        "x-batch-validation": "strict",
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
    // 409 = idempotency conflict. The two conflict types differ in whether
    // anything could have been sent, so they get distinct logs AND distinct
    // deliveries — folding both into the generic 4xx `rejected` branch would
    // release claims while a concurrent request is still able to deliver.
    if (res.status === 409) {
      const conflict = idempotencyConflictName(message);
      if (conflict === "concurrent_idempotent_requests") {
        console.error(
          "[email:resend] 409 concurrent_idempotent_requests — another request " +
            "with this Idempotency-Key is IN FLIGHT and may still send. " +
            "Outcome AMBIGUOUS: this batch is NOT provably rejected."
        );
        return {
          ok: false,
          reason: "error",
          status: 409,
          message: message.slice(0, 500),
          delivery: "unknown",
        };
      }
      console.error(
        conflict === "invalid_idempotent_request"
          ? "[email:resend] 409 invalid_idempotent_request — this " +
              "Idempotency-Key was already used with a DIFFERENT payload. " +
              "Nothing was accepted. Retrying today rebuilds the same key, so " +
              "this batch STALLS until the key's 24h TTL expires."
          : `[email:resend] 409 idempotency conflict of unrecognised type: ${message.slice(0, 200)}`
      );
      return {
        ok: false,
        reason: "error",
        status: 409,
        message: message.slice(0, 500),
        delivery: "rejected",
      };
    }
    return {
      ok: false,
      reason: "error",
      status: res.status,
      message: message.slice(0, 500),
      // 4xx = Resend refused the batch outright (validation, auth, rate limit):
      // nothing was queued — see the strict-validation invariant on the request
      // headers, which is what makes this all-or-nothing. 5xx is AMBIGUOUS — it
      // may have been accepted first.
      delivery: res.status >= 400 && res.status < 500 ? "rejected" : "unknown",
    };
  }

  // Count what Resend says it ACCEPTED (`{ data: [{ id }, ...] }`), not what we
  // asked it to send. Under strict validation the two are always equal, so a
  // mismatch is a tripwire on that assumption — log it rather than let a silent
  // partial acceptance be reported as a full send.
  const accepted = await res
    .json()
    .then((b: unknown) =>
      b &&
      typeof b === "object" &&
      Array.isArray((b as { data?: unknown }).data)
        ? ((b as { data: unknown[] }).data.length as number)
        : undefined
    )
    .catch(() => undefined);
  if (accepted === undefined) {
    console.error(
      `[email:resend] 2xx batch response had no \`data\` array — cannot confirm the accepted count; reporting the requested ${messages.length}`
    );
    return { ok: true, sent: messages.length };
  }
  if (accepted !== messages.length) {
    console.error(
      `[email:resend] 2xx accepted ${accepted} of ${messages.length} messages — IMPOSSIBLE under strict batch validation. The all-or-nothing assumption behind claim release may no longer hold.`
    );
  }
  return { ok: true, sent: accepted };
}
