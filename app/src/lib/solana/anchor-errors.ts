/**
 * Parse Anchor program errors from thrown exceptions.
 *
 * Anchor custom errors are offset by 6000 — program code 3 becomes error number 6003.
 * This utility normalizes the offset so API routes can match on program-level codes.
 */

const ANCHOR_ERROR_OFFSET = 6000;

export interface AnchorProgramError {
  /** Raw error number from Anchor (includes 6000 offset) */
  rawCode: number;
  /** Program-level error code (offset subtracted) */
  code: number;
  name: string;
  message: string;
}

/** Program-level error codes that mean "already done" — return 200 (idempotent). */
const IDEMPOTENT_ERRORS = new Set([
  3, // LessonAlreadyCompleted
  5, // CourseAlreadyFinalized
  16, // CredentialAlreadyIssued
]);

/** Program-level error codes that are user/client errors — return 400. */
const CLIENT_ERRORS = new Set([
  0, // Unauthorized
  1, // CourseNotActive
  2, // LessonOutOfBounds
  4, // CourseNotCompleted
  6, // CourseNotFinalized
  7, // PrerequisiteNotMet
  8, // UnenrollCooldown
  9, // EnrollmentCourseMismatch
  11, // CourseIdEmpty
  12, // CourseIdTooLong
  13, // InvalidLessonCount
  14, // InvalidDifficulty
  15, // CredentialAssetMismatch
  17, // MinterNotActive
  18, // MinterAmountExceeded
  19, // LabelTooLong
  20, // AchievementNotActive
  21, // AchievementSupplyExhausted
  22, // AchievementIdTooLong
  23, // AchievementNameTooLong
  24, // AchievementUriTooLong
  25, // InvalidAmount
  26, // InvalidXpReward
]);

const ERROR_CODE_RE =
  /Error Code: (\w+)\. Error Number: (\d+)\. Error Message: (.+?)\.?$/m;

function normalizeProgramCode(rawCode: number): number {
  return rawCode >= ANCHOR_ERROR_OFFSET
    ? rawCode - ANCHOR_ERROR_OFFSET
    : rawCode;
}

export function parseAnchorError(err: unknown): AnchorProgramError | null {
  if (!err || typeof err !== "object") return null;

  // Anchor SDK attaches .error with code/msg
  const anchorErr = err as Record<string, unknown>;
  if (anchorErr.error && typeof anchorErr.error === "object") {
    const inner = anchorErr.error as Record<string, unknown>;
    if (typeof inner.errorCode === "object") {
      const ec = inner.errorCode as { code: string; number: number };
      const rawCode = ec.number;
      return {
        rawCode,
        code: normalizeProgramCode(rawCode),
        name: ec.code,
        message: (inner.errorMessage as string) ?? ec.code,
      };
    }
  }

  // Fallback: parse from error message string
  const message = err instanceof Error ? err.message : String(err);
  const match = ERROR_CODE_RE.exec(message);
  if (match) {
    const rawCode = Number(match[2]);
    return {
      rawCode,
      code: normalizeProgramCode(rawCode),
      name: match[1],
      message: match[3],
    };
  }

  return null;
}

export function isIdempotentError(code: number): boolean {
  return IDEMPOTENT_ERRORS.has(code);
}

export function isClientError(code: number): boolean {
  return CLIENT_ERRORS.has(code);
}
