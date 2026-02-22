const ANCHOR_ERROR_MAP: Record<number, string> = {
  6000: "Unauthorized",
  6001: "CourseNotActive",
  6002: "AlreadyEnrolled",
  6003: "NotEnrolled",
  6004: "LessonOutOfBounds",
  6005: "LessonAlreadyCompleted",
  6006: "CourseNotCompleted",
  6007: "CourseAlreadyCompleted",
  6008: "AchievementAlreadyClaimed",
  6009: "CourseNotFinalized",
  6010: "SeasonClosed",
  6011: "SelfReferral",
  6012: "AlreadyReferred",
  6013: "ReferrerNotFound",
  6014: "PrerequisiteNotMet",
  6015: "DailyXPLimitExceeded",
  6016: "UnenrollCooldown",
  6017: "EnrollmentCourseMismatch",
  6018: "SeasonNotActive",
  6019: "InvalidSeasonNumber",
  6020: "InvalidCourseId",
  6021: "InvalidLessonCount",
  6022: "ArithmeticOverflow",
};

// Idempotent errors: return success instead of failing
const IDEMPOTENT_ERRORS = new Set([
  "LessonAlreadyCompleted",
  "AlreadyEnrolled",
  "AchievementAlreadyClaimed",
  "AlreadyReferred",
]);

export function parseAnchorError(err: unknown): {
  code: number | null;
  name: string | null;
  isIdempotent: boolean;
} {
  const msg = err instanceof Error ? err.message : String(err);

  // Try to extract error code from message
  for (const [codeStr, name] of Object.entries(ANCHOR_ERROR_MAP)) {
    const code = Number(codeStr);
    if (msg.includes(name) || msg.includes(codeStr)) {
      return { code, name, isIdempotent: IDEMPOTENT_ERRORS.has(name) };
    }
  }

  // Check for "already in use" (account init collision = already enrolled)
  if (msg.includes("already in use") || msg.includes("0x0")) {
    return { code: 6002, name: "AlreadyEnrolled", isIdempotent: true };
  }

  return { code: null, name: null, isIdempotent: false };
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      // Don't retry program errors — only transient RPC/network failures
      if (
        msg.includes("6") && // looks like an Anchor error code
        Object.keys(ANCHOR_ERROR_MAP).some((code) => msg.includes(code))
      ) {
        throw err;
      }
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
