import { BorshEventCoder, Idl } from "@coral-xyz/anchor";
import { logEvent } from "@/lib/logging";
import IDL from "@/lib/solana/idl/superteam_academy_vnext.json";
import type { DecodedEvent, HeliusRawTransaction } from "./types";

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID;
if (!PROGRAM_ID) {
  throw new Error(
    "[event-decoder] NEXT_PUBLIC_PROGRAM_ID environment variable is required"
  );
}
// Double cast: JSON import lacks Anchor's Idl type shape at compile time
const eventCoder = new BorshEventCoder(IDL as unknown as Idl);

/**
 * Stable code for webhook entries we cannot decode at all. The route counts
 * them across a request and logs ONE line carrying the count — a malformed
 * feed then shows up as a number rather than as silence, and a batch that is
 * entirely undecodable cannot spam the log with one line per entry.
 */
export const UNDECODABLE_CODE = "HELIUS_DECODE_001";

/**
 * Logged when a transaction's logs stop being a reliable record of which
 * program was running, so decoding stopped early and later events (if any) were
 * not read. Should stay near zero: a rise means learner activity is going
 * unmirrored.
 */
export const LOG_FRAMES_UNTRUSTED_CODE = "HELIUS_DECODE_002";

// Lines only the runtime writes (agave `program-runtime/src/stable_log.rs`),
// matched whole because a program's own output can contain the same text after
// a `Program log: ` prefix. `$` without the `m` flag anchors to the end of the
// entry and `.` stops at a line break, so a multi-line entry never matches.
const ADDRESS = "[1-9A-HJ-NP-Za-km-z]{32,44}";
const INVOKE_LINE = new RegExp(`^Program (${ADDRESS}) invoke \\[(\\d+)\\]$`);
const SUCCESS_LINE = new RegExp(`^Program (${ADDRESS}) success$`);
const FAILED_LINE = new RegExp(`^Program (${ADDRESS}) failed: .+$`);
const LOG_TRUNCATED_LINE = "Log truncated";
const DATA_PREFIX = "Program data: ";

/**
 * Extract and decode all Anchor events from a raw Helius transaction.
 *
 * Events arrive as `sol_log_data` lines, "Program data: <base64>", which don't
 * name their emitter: only the enclosing invoke lines say who wrote them. So we
 * replay the invocation stack and decode only while our program is the current
 * frame, whether it was called top-level or through a CPI.
 *
 * Decoding stops for the rest of the transaction once the stack can't be
 * trusted. Past `Log truncated` the runtime can still record shorter lines while
 * dropping longer ones, so invoke or exit lines may be missing. Events read
 * before that point stand.
 */
export function decodeEventsFromTransaction(tx: HeliusRawTransaction): {
  events: DecodedEvent[];
  signature: string;
  /** Set when the entry carried no usable transaction and was skipped. */
  undecodable?: boolean;
} {
  // Helius has delivered entries with no `transaction` at all (Sentry SA-2:
  // 5 events, `TypeError: Cannot read properties of undefined (reading
  // 'signatures')`). The payload type says the field is always there; the wire
  // format disagrees, and the throw took down the whole batch — every later
  // entry in the same POST went unprocessed and the route 500'd, so Helius
  // retried a payload we can never decode. Skip the entry instead: no
  // signature means nothing to attribute an event to anyway.
  const signature = tx?.transaction?.signatures?.[0];
  if (!signature) {
    return { events: [], signature: "", undecodable: true };
  }

  const logs = tx.meta?.logMessages ?? [];

  if (tx.meta?.err) {
    return { events: [], signature };
  }

  const events: DecodedEvent[] = [];
  const frames: string[] = [];
  const stopDecoding = (reason: "truncated" | "malformed") =>
    logEvent({
      event: LOG_FRAMES_UNTRUSTED_CODE,
      context: { signature, reason, eventsDecoded: events.length },
    });

  for (const log of logs) {
    if (log === LOG_TRUNCATED_LINE) {
      stopDecoding("truncated");
      break;
    }

    const invoke = INVOKE_LINE.exec(log);
    if (invoke) {
      if (Number(invoke[2]) !== frames.length + 1) {
        stopDecoding("malformed");
        break;
      }
      frames.push(invoke[1]!);
      continue;
    }

    const exit = SUCCESS_LINE.exec(log) ?? FAILED_LINE.exec(log);
    if (exit) {
      if (frames.pop() !== exit[1]) {
        stopDecoding("malformed");
        break;
      }
      continue;
    }

    if (frames.at(-1) === PROGRAM_ID && log.startsWith(DATA_PREFIX)) {
      const base64Data = log.slice(DATA_PREFIX.length);
      try {
        const decoded = eventCoder.decode(base64Data);
        if (decoded) {
          events.push({
            name: decoded.name,
            data: decoded.data as Record<string, unknown>,
          });
        }
      } catch (err) {
        console.warn(
          `[event-decoder] Failed to decode log entry: ${base64Data.slice(0, 40)}...`,
          err
        );
      }
    }
  }

  return { events, signature };
}

/** Convert snake_case to camelCase (e.g. lesson_index → lessonIndex) */
function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Normalize Anchor event data:
 * - BN → number, PublicKey → base58 string
 * - snake_case keys → camelCase (Anchor 0.31+ IDL preserves snake_case)
 */
export function normalizeEventData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const camelKey = snakeToCamel(key);
    if (value && typeof value === "object" && "toBase58" in value) {
      normalized[camelKey] = (value as { toBase58(): string }).toBase58();
    } else if (value && typeof value === "object" && "toNumber" in value) {
      normalized[camelKey] = (value as { toNumber(): number }).toNumber();
    } else {
      normalized[camelKey] = value;
    }
  }
  return normalized;
}
