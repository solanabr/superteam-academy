/**
 * Anchor program error codes (from IDL).
 * Solana custom errors start at 6000 (0x1770).
 */
export const PROGRAM_ERROR_NAMES: Record<number, string> = {
  6000: "Unauthorized",
  6001: "CourseNotActive",
  6002: "LessonOutOfBounds",
  6003: "LessonAlreadyCompleted",
  6004: "CourseNotCompleted",
  6005: "CourseAlreadyFinalized",
  6006: "CourseNotFinalized",
  6007: "PrerequisiteNotMet",
  6008: "UnenrollCooldown",
  6009: "MinterNotActive",
  6010: "MinterAmountExceeded",
  6011: "AchievementNotActive",
  6012: "AchievementSupplyExhausted",
  6013: "InvalidAmount",
  6014: "Overflow",
  6015: "LabelTooLong",
  6016: "AchievementIdTooLong",
  6017: "AchievementNameTooLong",
  6018: "AchievementUriTooLong",
  6019: "InvalidXpReward",
};

const PROGRAM_ERROR_CODES = Object.fromEntries(
  Object.entries(PROGRAM_ERROR_NAMES).map(([k, v]) => [v, Number(k)]),
) as Record<string, number>;

export interface ParsedAnchorError {
  code: number | null;
  name: string | null;
}

/**
 * Extract Anchor program error code from a web3.js error.
 *
 * Handles three formats:
 *  1. SendTransactionError with .logs[] containing "Error Number: NNNN"
 *  2. Message string with "custom program error: 0xHEX"
 *  3. Message string with "Error Code: ErrorName" (Anchor client format)
 */
export function parseAnchorError(err: unknown): ParsedAnchorError {
  // 1. SendTransactionError.logs (preflight simulation failure)
  if (err && typeof err === "object" && "logs" in err) {
    const logs = (err as { logs?: string[] }).logs ?? [];
    for (const line of logs) {
      const numMatch = line.match(/Error Number: (\d+)/);
      if (numMatch) {
        const code = parseInt(numMatch[1], 10);
        return { code, name: PROGRAM_ERROR_NAMES[code] ?? null };
      }
      const nameMatch = line.match(/Error Code: (\w+)/);
      if (nameMatch) {
        const name = nameMatch[1];
        return { code: PROGRAM_ERROR_CODES[name] ?? null, name };
      }
    }
  }

  const msg = err instanceof Error ? err.message : String(err);

  // 2. "custom program error: 0x1773" (web3.js RPC error)
  const hexMatch = msg.match(/custom program error: 0x([0-9a-fA-F]+)/i);
  if (hexMatch) {
    const code = parseInt(hexMatch[1], 16);
    return { code, name: PROGRAM_ERROR_NAMES[code] ?? null };
  }

  // 3. "Error Code: LessonAlreadyCompleted" in message string
  const nameMatch = msg.match(/Error Code: (\w+)/);
  if (nameMatch) {
    const name = nameMatch[1];
    return { code: PROGRAM_ERROR_CODES[name] ?? null, name };
  }

  return { code: null, name: null };
}

/**
 * Returns true for errors that mean the action already happened —
 * safe to return success to the caller.
 */
export function isAlreadyDoneError(name: string | null): boolean {
  return (
    name === "LessonAlreadyCompleted" ||
    name === "CourseAlreadyFinalized"
  );
}
