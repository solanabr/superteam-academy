import type { Connection, Transaction } from "@solana/web3.js";
import type { PublicKey } from "@solana/web3.js";

/**
 * Centralized map of on-chain AcademyError codes → i18n keys.
 *
 * Anchor assigns codes starting at 6000 + enum index.
 * See: onchain-academy/programs/onchain-academy/src/errors.rs
 *
 * Each entry maps to a key under the "programErrors" i18n namespace.
 * Components with `t()` use `t("programErrors.<key>")`;
 * hooks without i18n use the English `fallback`.
 */

interface ProgramErrorEntry {
  name: string;
  i18nKey: string;
  fallback: string;
}

const ERROR_MAP: Record<number, ProgramErrorEntry> = {
  6000: {
    name: "Unauthorized",
    i18nKey: "unauthorized",
    fallback: "Unauthorized signer.",
  },
  6001: {
    name: "CourseNotActive",
    i18nKey: "courseNotActive",
    fallback: "This course is not currently active.",
  },
  6002: {
    name: "LessonOutOfBounds",
    i18nKey: "lessonOutOfBounds",
    fallback: "Lesson index out of bounds.",
  },
  6003: {
    name: "LessonAlreadyCompleted",
    i18nKey: "lessonAlreadyCompleted",
    fallback: "You have already completed this lesson.",
  },
  6004: {
    name: "CourseNotCompleted",
    i18nKey: "courseNotCompleted",
    fallback: "You must complete all lessons before claiming the certificate.",
  },
  6005: {
    name: "CourseAlreadyFinalized",
    i18nKey: "courseAlreadyFinalized",
    fallback: "This course has already been finalized.",
  },
  6006: {
    name: "CourseNotFinalized",
    i18nKey: "courseNotFinalized",
    fallback: "This course has not been finalized yet.",
  },
  6007: {
    name: "PrerequisiteNotMet",
    i18nKey: "prerequisiteNotMet",
    fallback: "You must complete the prerequisite course first.",
  },
  6008: {
    name: "UnenrollCooldown",
    i18nKey: "unenrollCooldown",
    fallback: "You must wait 24 hours after enrolling before you can unenroll.",
  },
  6009: {
    name: "EnrollmentCourseMismatch",
    i18nKey: "enrollmentCourseMismatch",
    fallback: "Enrollment does not match this course.",
  },
  6010: {
    name: "Overflow",
    i18nKey: "overflow",
    fallback: "Arithmetic overflow. Please try again.",
  },
  6011: {
    name: "CourseIdEmpty",
    i18nKey: "courseIdEmpty",
    fallback: "Course ID cannot be empty.",
  },
  6012: {
    name: "CourseIdTooLong",
    i18nKey: "courseIdTooLong",
    fallback: "Course ID exceeds maximum length.",
  },
  6013: {
    name: "InvalidLessonCount",
    i18nKey: "invalidLessonCount",
    fallback: "Lesson count must be at least 1.",
  },
  6014: {
    name: "InvalidDifficulty",
    i18nKey: "invalidDifficulty",
    fallback: "Difficulty must be beginner, intermediate, or advanced.",
  },
  6015: {
    name: "CredentialAssetMismatch",
    i18nKey: "credentialAssetMismatch",
    fallback: "Credential asset does not match enrollment record.",
  },
  6016: {
    name: "CredentialAlreadyIssued",
    i18nKey: "credentialAlreadyIssued",
    fallback: "A certificate has already been issued for this enrollment.",
  },
  6017: {
    name: "MinterNotActive",
    i18nKey: "minterNotActive",
    fallback: "Minter role is not active.",
  },
  6018: {
    name: "MinterAmountExceeded",
    i18nKey: "minterAmountExceeded",
    fallback: "Amount exceeds minter limit.",
  },
  6019: {
    name: "LabelTooLong",
    i18nKey: "labelTooLong",
    fallback: "Label exceeds maximum length.",
  },
  6020: {
    name: "AchievementNotActive",
    i18nKey: "achievementNotActive",
    fallback: "This achievement is not currently active.",
  },
  6021: {
    name: "AchievementSupplyExhausted",
    i18nKey: "achievementSupplyExhausted",
    fallback: "This achievement has reached its maximum supply.",
  },
  6022: {
    name: "AchievementIdTooLong",
    i18nKey: "achievementIdTooLong",
    fallback: "Achievement ID exceeds maximum length.",
  },
  6023: {
    name: "AchievementNameTooLong",
    i18nKey: "achievementNameTooLong",
    fallback: "Achievement name exceeds maximum length.",
  },
  6024: {
    name: "AchievementUriTooLong",
    i18nKey: "achievementUriTooLong",
    fallback: "Achievement URI exceeds maximum length.",
  },
  6025: {
    name: "InvalidAmount",
    i18nKey: "invalidAmount",
    fallback: "Amount must be greater than zero.",
  },
  6026: {
    name: "InvalidXpReward",
    i18nKey: "invalidXpReward",
    fallback: "XP reward must be greater than zero.",
  },
};

// Reverse lookup: error name → entry
const NAME_MAP = new Map<string, ProgramErrorEntry>();
for (const entry of Object.values(ERROR_MAP)) {
  NAME_MAP.set(entry.name, entry);
}

export interface ParsedProgramError {
  code: number | null;
  name: string | null;
  /** Key under the "programErrors" i18n namespace, e.g. "unenrollCooldown" */
  i18nKey: string | null;
  /** English fallback for contexts without i18n */
  fallback: string;
}

/**
 * Parse any on-chain error into a structured result.
 *
 * Handles multiple error formats:
 * - Hex codes: "custom program error: 0x1778"
 * - Decimal codes: "Error Number: 6008"
 * - Error names: "UnenrollCooldown"
 */
export function parseProgramError(err: unknown): ParsedProgramError {
  const raw =
    err instanceof Error ? err.message : String(err || "Transaction failed");

  // 1. Try hex error code (most common from RPC simulation failures)
  const hexMatch = raw.match(
    /(?:custom program error|error):\s*0x([0-9a-fA-F]+)/i
  );
  if (hexMatch?.[1]) {
    const code = parseInt(hexMatch[1], 16);
    const entry = ERROR_MAP[code];
    if (entry) {
      return {
        code,
        name: entry.name,
        i18nKey: entry.i18nKey,
        fallback: entry.fallback,
      };
    }
  }

  // 2. Try decimal error code
  const decMatch = raw.match(/(?:Error Number|error code)[:\s]+(\d{4,})/i);
  if (decMatch?.[1]) {
    const code = parseInt(decMatch[1], 10);
    const entry = ERROR_MAP[code];
    if (entry) {
      return {
        code,
        name: entry.name,
        i18nKey: entry.i18nKey,
        fallback: entry.fallback,
      };
    }
  }

  // 3. Try matching error name directly in message
  for (const [name, entry] of NAME_MAP) {
    if (raw.includes(name)) {
      return {
        code: null,
        name,
        i18nKey: entry.i18nKey,
        fallback: entry.fallback,
      };
    }
  }

  // 4. No match — return raw message
  return { code: null, name: null, i18nKey: null, fallback: raw };
}

/**
 * Pre-simulate a transaction via RPC before sending to the wallet.
 *
 * Some wallets (e.g. Backpack) show a blocking error popup on simulation
 * failure and then never reject the `sendTransaction` promise, causing
 * the UI to hang. By simulating ourselves first, we catch program errors
 * immediately — the wallet popup is never opened.
 *
 * Throws a structured error that `parseProgramError` can parse.
 */
export async function preflightTransaction(
  tx: Transaction,
  connection: Connection,
  feePayer: PublicKey
): Promise<void> {
  tx.feePayer = feePayer;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const sim = await connection.simulateTransaction(tx);
  if (!sim.value.err) return;

  // Extract hex error code from simulation logs
  const logs = sim.value.logs ?? [];
  for (const log of logs) {
    const match = log.match(/custom program error: 0x([0-9a-fA-F]+)/);
    if (match?.[1]) {
      throw new Error(`custom program error: 0x${match[1]}`);
    }
  }

  throw new Error("Transaction simulation failed");
}
