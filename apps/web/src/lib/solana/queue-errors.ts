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
 *   • a formatted message or log   → "Error Code: X. Error Number: 6017."
 *   • a raw simulation failure     → "custom program error: 0x1781"
 *
 * Unscoped by design — this is what `serializeQueueError` puts in `last_error`
 * for the operator. Whether a code may RESOLVE a row is `isAlreadySatisfied`,
 * which additionally requires the code to be attributable to our program.
 */
export function parseProgramError(err: unknown): ProgramError | null {
  const fromInstance = codeFromAnchorInstance(err);
  if (fromInstance) return fromInstance;

  // Message AND logs: a real `SendTransactionError` carries the AnchorError
  // line in `logs`, not in `message`, so scanning the message alone missed the
  // code on exactly the errors that have one.
  const message = attributionText(err);

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

/**
 * Does this error mean OUR program says the chain already holds the state we
 * wanted?
 *
 * GATE finding 4. `parseProgramError` regexes the whole thrown text, and
 * web3.js's `SendTransactionError` embeds every instruction's program logs in
 * that text — so whichever code appears first decided whether a row was
 * resolved. Two ways that gets it wrong, both live shapes:
 *   • an inner program's code that happens to collide with one of ours. The
 *     prod achievement rows fail with `custom program error: 0x0` on
 *     "Instruction 1", which is MPL Core, not the academy program.
 *   • our own non-terminal failure (MintingPaused) printed after a terminal code
 *     from an earlier, successful instruction.
 * Resolving on either would silently drop something we owe, which is strictly
 * worse than retrying, so attribution is REQUIRED and unattributable text fails
 * closed. Serialisation still reports the code — this gate is only about
 * whether the row may be resolved.
 *
 * `programId` is the academy program (base58). Pass it explicitly rather than
 * reading env here, so this module stays chain-free and the rule is testable.
 */
export function isAlreadySatisfied(
  err: unknown,
  programId: string
): ProgramError | null {
  const parsed = parseProgramError(err);
  if (!parsed) return null;
  if (!(parsed.code in ALREADY_SATISFIED_ERROR_CODES)) return null;
  return raisedByProgram(err, programId, parsed.code) ? parsed : null;
}

/** Base58 program id, as it appears in `Program <id> invoke/failed` log lines. */
const PROGRAM_ID_PATTERN = "[1-9A-HJ-NP-Za-km-z]{32,44}";

/**
 * Is `code` attributable to `programId`? True when either
 *   • the throw is an AnchorError-shaped object naming that program, or
 *   • the log text puts the code inside that program's invoke frame — the
 *     nearest preceding `Program <id> invoke` is ours, or a
 *     `Program <ourId> failed: custom program error: 0x…` line carries it.
 * False when the text names no program at all: unattributable, so fail closed.
 */
function raisedByProgram(
  err: unknown,
  programId: string,
  code: number
): boolean {
  const named = programOf(err);
  if (named) return named === programId;

  const text = attributionText(err);
  if (!text) return false;

  // `Program <ourId> failed: custom program error: 0x…` — the failure line
  // names the program and the code together, so it is self-attributing.
  const failedLine = new RegExp(
    `Program\\s+(${PROGRAM_ID_PATTERN})\\s+failed:\\s*custom program error:\\s*(0x[0-9a-fA-F]+|\\d+)`,
    "g"
  );
  for (const m of text.matchAll(failedLine)) {
    if (m[1] === programId && Number(m[2]) === code) return true;
  }

  // Otherwise locate the code and walk back to the innermost invoke frame.
  const codeIndex = indexOfCode(text, code);
  if (codeIndex < 0) return false;

  const invoke = new RegExp(
    `Program\\s+(${PROGRAM_ID_PATTERN})\\s+invoke`,
    "g"
  );
  let enclosing: string | null = null;
  for (const m of text.matchAll(invoke)) {
    if (m.index !== undefined && m.index < codeIndex) enclosing = m[1] ?? null;
    else break;
  }
  return enclosing === programId;
}

/** Where in `text` the code that was parsed actually appears. */
function indexOfCode(text: string, code: number): number {
  const numbered = text.indexOf(`Error Number: ${code}`);
  if (numbered >= 0) return numbered;
  const hex = text.indexOf(`custom program error: 0x${code.toString(16)}`);
  if (hex >= 0) return hex;
  return text.indexOf(`custom program error: ${code}`);
}

/** The program an AnchorError-shaped throw names, if any. */
function programOf(err: unknown): string | null {
  if (typeof err !== "object" || err === null) return null;
  const program = (err as { program?: unknown }).program;
  if (typeof program === "string" && program.length > 0) return program;
  const toBase58 = (program as { toBase58?: () => string } | undefined)
    ?.toBase58;
  if (typeof toBase58 === "function") {
    try {
      return toBase58.call(program);
    } catch {
      return null;
    }
  }
  return null;
}

/** Message plus program logs — everything that can carry an invoke frame. */
function attributionText(err: unknown): string {
  const parts = [rawMessage(err)];
  if (typeof err === "object" && err !== null) {
    const record = err as Record<string, unknown>;
    for (const key of ["logs", "transactionLogs", "errorLogs"]) {
      const value = record[key];
      if (Array.isArray(value)) {
        parts.push(
          value
            .filter((line): line is string => typeof line === "string")
            .join("\n")
        );
      }
    }
  }
  return parts.filter((part) => part.length > 0).join("\n");
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
