/**
 * Maps Anchor error code strings (from err.error?.errorCode?.code) to
 * i18n translation keys for use with next-intl's useTranslations("errors") hook.
 *
 * Keys correspond to the "errors.onChain.*" namespace in the message files.
 * Usage: const t = useTranslations("errors"); t(ERROR_MAP[code])
 *
 * All 26 variants from programs/onchain-academy/src/errors.rs are covered.
 */
export const ERROR_MAP: Record<string, string> = {
  Unauthorized: "onChain.Unauthorized",
  CourseNotActive: "onChain.CourseNotActive",
  LessonOutOfBounds: "onChain.LessonOutOfBounds",
  LessonAlreadyCompleted: "onChain.LessonAlreadyCompleted",
  CourseNotCompleted: "onChain.CourseNotCompleted",
  CourseAlreadyFinalized: "onChain.CourseAlreadyFinalized",
  CourseNotFinalized: "onChain.CourseNotFinalized",
  PrerequisiteNotMet: "onChain.PrerequisiteNotMet",
  UnenrollCooldown: "onChain.UnenrollCooldown",
  EnrollmentCourseMismatch: "onChain.EnrollmentCourseMismatch",
  Overflow: "onChain.Overflow",
  CourseIdEmpty: "onChain.CourseIdEmpty",
  CourseIdTooLong: "onChain.CourseIdTooLong",
  InvalidLessonCount: "onChain.InvalidLessonCount",
  InvalidDifficulty: "onChain.InvalidDifficulty",
  CredentialAssetMismatch: "onChain.CredentialAssetMismatch",
  CredentialAlreadyIssued: "onChain.CredentialAlreadyIssued",
  MinterNotActive: "onChain.MinterNotActive",
  MinterAmountExceeded: "onChain.MinterAmountExceeded",
  LabelTooLong: "onChain.LabelTooLong",
  AchievementNotActive: "onChain.AchievementNotActive",
  AchievementSupplyExhausted: "onChain.AchievementSupplyExhausted",
  AchievementIdTooLong: "onChain.AchievementIdTooLong",
  AchievementNameTooLong: "onChain.AchievementNameTooLong",
  AchievementUriTooLong: "onChain.AchievementUriTooLong",
  InvalidAmount: "onChain.InvalidAmount",
  InvalidXpReward: "onChain.InvalidXpReward",
};

/**
 * Resolves an Anchor error object to an i18n key, falling back to a generic
 * key when the error code is not in the map.
 */
export function resolveErrorKey(error: unknown): string {
  if (
    error !== null &&
    typeof error === "object" &&
    "error" in error &&
    error.error !== null &&
    typeof error.error === "object" &&
    "errorCode" in error.error &&
    error.error.errorCode !== null &&
    typeof error.error.errorCode === "object" &&
    "code" in error.error.errorCode &&
    typeof error.error.errorCode.code === "string"
  ) {
    const key = ERROR_MAP[error.error.errorCode.code];
    if (key !== undefined) return key;
  }
  return "generic";
}
