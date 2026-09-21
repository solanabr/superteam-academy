// What `pending_onchain_actions.last_error` should say, and which errors mean
// "the chain is already in the state we wanted" rather than "try again".
//
// Chain-free on purpose (no @solana/web3.js, no Anchor): the producers, the
// drain and the dry-run script all classify the same way, and this is unit
// testable without an RPC.

/** Hard cap on a persisted error string. Logs are the part that grows. */
const MAX_LAST_ERROR_CHARS = 1800;

/** Program-log lines kept, from the end (the failure is always at the tail). */
const MAX_LOG_LINES = 6;

/**
 * See describe-tx-error.ts — Anchor constructs web3.js's
 * `SendTransactionError` positionally against its options-object constructor,
 * so a transaction that failed AFTER broadcast arrives with this literal as its
 * entire message and no signature or logs.
 */
const WEB3JS_LOST_CONTEXT_SENTINEL = "Unknown action 'undefined'";

const LOST_CONTEXT_MESSAGE =
  "on-chain transaction failed after broadcast; program logs unavailable " +
  "(Anchor built SendTransactionError positionally against web3.js's " +
  "options-object constructor, discarding message/signature/logs)";

/**
 * Anchor error codes that mean the on-chain state is ALREADY what the queued
 * action was trying to produce. Retrying one is guaranteed to fail the same way
 * forever, so the drain resolves the row (after reconciling local state)
 * instead of burning the budget and then abandoning it in silence — which is
 * what happened to the two `certificate` rows stuck on 6017 in prod.
 *
 * Deliberately NOT here: 6023 AchievementSupplyExhausted, 6015/6016 mismatches,
 * 6018-6021 minter-role problems. Those are terminal too, but the desired state
 * does NOT exist — resolving them would silently drop something we owe. They
 * keep failing loudly against the retry budget, which an operator can see.
 */
export const ALREADY_SATISFIED_ERROR_CODES: Readonly<Record<number, string>> =
  Object.freeze({
    6003: "LessonAlreadyCompleted",
    6005: "CourseAlreadyFinalized",
    6017: "CredentialAlreadyIssued",
  });

export interface ProgramError {
  code: number;
  name: string;
}

/**
 * Pull the Anchor error code out of a thrown error. Anchor surfaces it three
 * ways depending on how far the transaction got, and the queue sees all three:
 *   • an `AnchorError` instance    → `error.errorCode.number`
 *   • a formatted message          → "Error Code: X. Error Number: 6017."
 *   • a raw simulation failure     → "custom program error: 0x1781"
 */
export function parseProgramError(err: unknown): ProgramError | null {
  const fromInstance = codeFromAnchorInstance(err);
  if (fromInstance) return fromInstance;

  const message = rawMessage(err);

  const numbered = /Error Number:\s*(\d+)/.exec(message);
  if (numbered) {
    const code = Number(numbered[1]);
    const named = /Error Code:\s*([A-Za-z0-9_]+)/.exec(message);
    return { code, name: named?.[1] ?? `error-${code}` };
  }

  const custom = /custom program error:\s*(0x[0-9a-fA-F]+|\d+)/.exec(message);
  if (custom) {
    const code = Number(custom[1]);
    if (Number.isFinite(code)) {
      return { code, name: `error-${code}` };
    }
  }

  return null;
}

/** Does this error mean the chain already holds the state we wanted? */
export function isAlreadySatisfied(err: unknown): ProgramError | null {
  const parsed = parseProgramError(err);
  if (!parsed) return null;
  return parsed.code in ALREADY_SATISFIED_ERROR_CODES ? parsed : null;
}

/**
 * The string we persist as `last_error`. Replaces the old `String(err)`, which
 * produced the literal `[object Object]` for anything thrown that was not an
 * Error — two prod rows carry exactly that and are unactionable.
 *
 * Shape: `<message> [code 6017 CredentialAlreadyIssued] (sig: …) | logs: …`
 * with everything after the message present only when the error carries it.
 */
export function serializeQueueError(err: unknown): string {
  const parts: string[] = [messageOf(err)];

  const program = parseProgramError(err);
  if (program) {
    const known = ALREADY_SATISFIED_ERROR_CODES[program.code] ?? program.name;
    parts.push(`[code ${program.code} ${known}]`);
  }

  const signature = stringProp(err, "signature") ?? stringProp(err, "txid");
  if (signature) parts.push(`(sig: ${signature})`);

  const logs = logExcerpt(err);
  if (logs) parts.push(`| logs: ${logs}`);

  return truncate(parts.join(" "), MAX_LAST_ERROR_CHARS);
}

// ---------------------------------------------------------------------------
// internals
// ---------------------------------------------------------------------------

function messageOf(err: unknown): string {
  const raw = rawMessage(err);
  if (raw.trim() === WEB3JS_LOST_CONTEXT_SENTINEL) return LOST_CONTEXT_MESSAGE;
  return raw;
}

/**
 * Best available text for anything that can be thrown. `String(value)` on a
 * plain object yields "[object Object]", so objects go through JSON — and a
 * value that JSON cannot represent (a cycle, a BigInt) falls back to its keys,
 * which still tells an operator what they are looking at.
 */
function rawMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message && err.message.length > 0 ? err.message : err.name;
  }
  if (typeof err === "string") return err;
  if (err === null || err === undefined) return `non-error thrown: ${err}`;
  if (typeof err === "object") {
    // A duck-typed error (Anchor and some RPC clients throw plain objects).
    const message = stringProp(err, "message");
    if (message) return message;
    try {
      const json = JSON.stringify(err);
      if (json && json !== "{}") return json;
    } catch {
      // fall through to the key list
    }
    const keys = Object.keys(err as Record<string, unknown>);
    return keys.length > 0
      ? `non-error object thrown with keys: ${keys.join(", ")}`
      : "non-error object thrown with no enumerable keys";
  }
  return String(err);
}

function codeFromAnchorInstance(err: unknown): ProgramError | null {
  if (typeof err !== "object" || err === null) return null;
  const errorCode = (err as { errorCode?: unknown }).errorCode;
  if (typeof errorCode !== "object" || errorCode === null) return null;
  const number = (errorCode as { number?: unknown }).number;
  const code = (errorCode as { code?: unknown }).code;
  if (typeof number !== "number") return null;
  return {
    code: number,
    name: typeof code === "string" ? code : `error-${number}`,
  };
}

function stringProp(value: unknown, key: string): string | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = (value as Record<string, unknown>)[key];
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

/** Last few program-log lines, from `err.logs` or `err.transactionLogs`. */
function logExcerpt(err: unknown): string | null {
  if (typeof err !== "object" || err === null) return null;
  const record = err as Record<string, unknown>;
  const logs = record.logs ?? record.transactionLogs;
  if (!Array.isArray(logs) || logs.length === 0) return null;
  const tail = logs
    .filter((line): line is string => typeof line === "string")
    .slice(-MAX_LOG_LINES);
  return tail.length > 0 ? tail.join(" ⏎ ") : null;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
