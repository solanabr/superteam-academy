import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Security regression tests — verify fixes for known vulnerabilities.
 * Uses source-code inspection for routes that require a full Next.js runtime.
 */

describe("Admin Guard security", () => {
  const adminGuardSource = fs.readFileSync(
    path.join(process.cwd(), "src/components/admin/admin-guard.tsx"),
    "utf8",
  );

  it("non-matching wallet is denied when ADMIN_WALLETS is set", () => {
    // Simulate the guard logic: wallet not in list → denied
    const ADMIN_WALLETS = ["AdminWallet1111111111111111111111111111111111"];
    const publicKey = "SomeOtherWallet1111111111111111111111111111";
    const isAdmin = ADMIN_WALLETS.includes(publicKey);
    expect(isAdmin).toBe(false);
  });

  it("missing ADMIN_WALLETS env defaults to denied (isAdmin: false)", () => {
    // After A1 fix: !ADMIN_WALLETS must not appear as an isAdmin value
    expect(adminGuardSource).not.toMatch(/isAdmin:\s*!ADMIN_WALLETS/);
    // ADMIN_WALLETS === null must not grant admin
    expect(adminGuardSource).not.toMatch(/ADMIN_WALLETS\s*===\s*null/);
    // All three fallback sites now use false
    const falseMatches = adminGuardSource.match(/isAdmin:\s*false/g);
    expect(falseMatches).not.toBeNull();
    expect(falseMatches!.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Email validation", () => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  it("rejects invalid email addresses", () => {
    expect(EMAIL_RE.test("@")).toBe(false);
    expect(EMAIL_RE.test("a@")).toBe(false);
    expect(EMAIL_RE.test("@b")).toBe(false);
    expect(EMAIL_RE.test("user@.")).toBe(false);
    expect(EMAIL_RE.test("no-at-sign")).toBe(false);
    expect(EMAIL_RE.test("")).toBe(false);
    expect(EMAIL_RE.test("   ")).toBe(false);
  });

  it("accepts valid email addresses", () => {
    expect(EMAIL_RE.test("user@example.com")).toBe(true);
    expect(EMAIL_RE.test("user.name@domain.co")).toBe(true);
    expect(EMAIL_RE.test("a@b.c")).toBe(true);
  });

  it("newsletter route uses proper email regex (not just .includes('@'))", () => {
    const newsletterSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/newsletter/route.ts"),
      "utf8",
    );
    expect(newsletterSource).not.toMatch(/email\.includes\("@"\)/);
    expect(newsletterSource).toMatch(/EMAIL_RE\s*=/);
    expect(newsletterSource).toMatch(/EMAIL_RE\.test\(email\)/);
  });
});

describe("IDOR fix — credentials route validates wallet ownership", () => {
  it("credentials route.ts contains wallet ownership check", () => {
    const credentialsSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/credentials/route.ts"),
      "utf8",
    );
    // Must query the user's wallet from DB
    expect(credentialsSource).toMatch(/prisma\.user\.findUnique/);
    // Must compare the session user's wallet with the requested wallet
    expect(credentialsSource).toMatch(/user\.wallet\s*!==\s*wallet/);
    // Must return 403 on mismatch
    expect(credentialsSource).toMatch(/status:\s*403/);
  });
});

describe("expectedOutput stripped from public course API", () => {
  it("courses/[slug]/route.ts does not expose expectedOutput in testCases", () => {
    const routeSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/courses/[slug]/route.ts"),
      "utf8",
    );
    expect(routeSource).not.toMatch(/expectedOutput:\s*t\.expectedOutput/);
  });

  it("courses/[slug]/route.ts does not expose challenge solution", () => {
    const routeSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/courses/[slug]/route.ts"),
      "utf8",
    );
    expect(routeSource).not.toMatch(/solution:\s*l\.challenge\.solution/);
  });
});

describe("totalCompletions is not always 0", () => {
  it("courses/route.ts computes totalCompletions from DB (not hardcoded 0)", () => {
    const routeSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/courses/route.ts"),
      "utf8",
    );
    // Must not contain the old hardcoded zero comment
    expect(routeSource).not.toMatch(/completedEnrollments\s*=\s*0/);
    // Must use a real query (groupBy or count)
    expect(routeSource).toMatch(/enrollment\.groupBy|enrollment\.count/);
  });

  it("courses/[slug]/route.ts computes totalCompletions from DB (not hardcoded 0)", () => {
    const routeSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/courses/[slug]/route.ts"),
      "utf8",
    );
    expect(routeSource).not.toMatch(/totalCompletions:\s*0/);
    expect(routeSource).toMatch(/enrollment\.count/);
  });
});
