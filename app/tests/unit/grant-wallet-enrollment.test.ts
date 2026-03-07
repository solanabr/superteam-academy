import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("grant wallet enrollment wiring", () => {
  it("uses wallet-signed enrollment on the course detail page", () => {
    const source = readSource("src", "app", "[locale]", "courses", "[slug]", "page.tsx");

    expect(source).toContain("enrollWithOnchainTransaction");
    expect(source).toContain("getEnrollmentErrorDescription");
    expect(source).toContain("resolveClientCourseId");
    expect(source).toContain("useWallet");
    expect(source).toContain("useWalletModal");
    expect(source).toContain("callbackUrl");
    expect(source).not.toContain("await enrollWithoutWallet(");
  });

  it("does not auto-enroll from the lesson page on load", () => {
    const source = readSource("src", "components", "lessons", "LessonPageClient.tsx");

    expect(source).not.toContain("ensureWalletEnrollment");
    expect(source).not.toContain("hasAttemptedAutoEnroll");
    expect(source).not.toContain("await enrollWithoutWallet(");
  });

  it("shows an explicit lesson enrollment gate instead of silently enrolling", () => {
    const source = readSource("src", "components", "lessons", "LessonPageClient.tsx");

    expect(source).toContain("connectWalletToEnroll");
    expect(source).toContain("signEnrollmentTransaction");
    expect(source).toContain("walletRequiredToStart");
    expect(source).toContain("callbackUrl");
    expect(source).toContain("!isProgressLoading && !progress");
  });
});
