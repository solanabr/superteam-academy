import { describe, it, expect } from "vitest";
import { mapAnchorError } from "./errors";

function anchorError(code: string) {
  return { error: { errorCode: { code } } };
}

describe("mapAnchorError", () => {
  it("maps Anchor error in English", () => {
    expect(mapAnchorError(anchorError("CourseNotActive"), "en")).toBe(
      "This course is not active"
    );
  });

  it("maps Anchor error in pt-BR", () => {
    expect(mapAnchorError(anchorError("CourseNotActive"), "pt-BR")).toBe(
      "Este curso não está ativo"
    );
  });

  it("maps Anchor error in Spanish", () => {
    expect(mapAnchorError(anchorError("CourseNotActive"), "es")).toBe(
      "Este curso no está activo"
    );
  });

  const errorCodes = [
    "Unauthorized", "CourseNotActive", "LessonOutOfBounds",
    "LessonAlreadyCompleted", "CourseNotCompleted", "CourseAlreadyFinalized",
    "CourseNotFinalized", "PrerequisiteNotMet", "UnenrollCooldown",
    "EnrollmentCourseMismatch", "Overflow", "CourseIdEmpty", "CourseIdTooLong",
    "InvalidLessonCount", "InvalidDifficulty", "CredentialAssetMismatch",
    "CredentialAlreadyIssued", "MinterNotActive", "MinterAmountExceeded",
    "LabelTooLong", "AchievementNotActive", "AchievementSupplyExhausted",
    "AchievementIdTooLong", "AchievementNameTooLong", "AchievementUriTooLong",
    "InvalidAmount", "InvalidXpReward",
  ];

  it("resolves all 27 error codes", () => {
    for (const code of errorCodes) {
      const msg = mapAnchorError(anchorError(code), "en");
      expect(msg).not.toBe("An unexpected error occurred");
    }
  });

  it("maps WalletNotConnected", () => {
    expect(mapAnchorError({ name: "WalletNotConnected" }, "en")).toBe(
      "Please connect your wallet"
    );
  });

  it("maps WalletSignTransactionError", () => {
    expect(mapAnchorError({ name: "WalletSignTransactionError" }, "en")).toBe(
      "Transaction rejected"
    );
  });

  it("maps user rejected message", () => {
    expect(
      mapAnchorError({ message: "User rejected the request" }, "en")
    ).toBe("Transaction cancelled");
  });

  it("maps lowercase user rejected", () => {
    expect(mapAnchorError({ message: "user rejected" }, "en")).toBe(
      "Transaction cancelled"
    );
  });

  it("returns fallback for unknown error", () => {
    expect(mapAnchorError({}, "en")).toBe("An unexpected error occurred");
  });

  it("returns fallback for null input", () => {
    expect(mapAnchorError(null, "en")).toBe("An unexpected error occurred");
  });

  it("falls back to English for unsupported locale", () => {
    expect(mapAnchorError(anchorError("CourseNotActive"), "fr")).toBe(
      "This course is not active"
    );
  });

  it("falls back to English for undefined locale", () => {
    expect(
      mapAnchorError(anchorError("CourseNotActive"), undefined as unknown as string)
    ).toBe("This course is not active");
  });
});
