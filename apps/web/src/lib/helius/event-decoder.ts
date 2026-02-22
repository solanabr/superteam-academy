import { BorshEventCoder, Idl } from "@coral-xyz/anchor";
import type { DecodedEvent, HeliusRawTransaction } from "./types";
import IDL from "@/lib/solana/idl/superteam_academy.json";

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID!;
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
  const signature = tx.transaction.signatures[0];
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
      } catch {
        // Not one of our events — skip silently
      }
    }
  }

  return { events, signature };
}

/**
 * Normalize Anchor event data from BN/PublicKey to plain strings/numbers.
 * BorshEventCoder returns BN for integers and PublicKey for pubkeys.
 */
export function normalizeEventData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && "toBase58" in value) {
      // PublicKey → string
      normalized[key] = (value as { toBase58(): string }).toBase58();
    } else if (value && typeof value === "object" && "toNumber" in value) {
      // BN → number
      normalized[key] = (value as { toNumber(): number }).toNumber();
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}
