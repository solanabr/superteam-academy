import { BorshEventCoder, Idl } from "@coral-xyz/anchor";
import type { DecodedEvent, HeliusRawTransaction } from "./types";
import IDL from "@/lib/solana/idl/superteam_academy.json";

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID!;
console.log(`[event-decoder] PROGRAM_ID="${PROGRAM_ID}"`);
// Double cast: JSON import lacks Anchor's Idl type shape at compile time
const eventCoder = new BorshEventCoder(IDL as unknown as Idl);

/**
 * Extract and decode all Anchor events from a raw Helius transaction.
 *
 * Anchor emits events via `sol_log_data` which appears in transaction logs as:
 *   "Program data: <base64-encoded event>"
 *
 * We filter logs to find entries from our program, extract the base64 data,
 * and decode each one using the IDL's BorshEventCoder.
 */
export function decodeEventsFromTransaction(tx: HeliusRawTransaction): {
  events: DecodedEvent[];
  signature: string;
} {
  const signature = tx.transaction.signatures[0] ?? "";
  const logs = tx.meta?.logMessages ?? [];

  if (tx.meta?.err) {
    return { events: [], signature };
  }

  const events: DecodedEvent[] = [];
  let insideOurProgram = false;

  for (const log of logs) {
    // Track when we enter/exit our program's execution context
    if (log.includes(`Program ${PROGRAM_ID} invoke`)) {
      insideOurProgram = true;
      continue;
    }
    if (
      log.includes(`Program ${PROGRAM_ID} success`) ||
      log.includes(`Program ${PROGRAM_ID} failed`)
    ) {
      insideOurProgram = false;
      continue;
    }

    // Only decode "Program data:" lines emitted while inside our program
    if (insideOurProgram && log.startsWith("Program data: ")) {
      const base64Data = log.slice("Program data: ".length);
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
