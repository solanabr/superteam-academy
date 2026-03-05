import { describe, expect, it } from "vitest";
import { getEnrollmentErrorDescription } from "@/lib/progress/client-enrollment";

describe("getEnrollmentErrorDescription", () => {
  it("maps wallet rejection to a clear message", () => {
    const error = new Error("User rejected the request.");
    expect(getEnrollmentErrorDescription(error)).toBe(
      "Transaction was rejected in your wallet."
    );
  });

  it("maps generic wallet send failures to devnet guidance", () => {
    const error = new Error("WalletSendTransactionError: Unexpected error");
    expect(getEnrollmentErrorDescription(error)).toContain("Solana Devnet");
  });

  it("maps missing on-chain course account to course-id guidance", () => {
    const error = new Error(
      'On-chain course account not found for courseId "solana-fundamentals" on devnet. Configure a valid slug -> courseId override in settings.'
    );
    expect(getEnrollmentErrorDescription(error)).toContain("course ID");
  });
});
