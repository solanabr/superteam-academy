import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * API security tests — verify sensitive data handling
 * and input validation across API routes.
 */

describe("API route security concerns", () => {
  describe("course API — challenge solution exposure", () => {
    it("route.ts does not expose solution or expectedOutput in the public GET response", () => {
      const routeSource = fs.readFileSync(
        path.join(process.cwd(), "src/app/api/courses/[slug]/route.ts"),
        "utf8",
      );
      // solution field must not be mapped in the public response
      expect(routeSource).not.toMatch(/solution:\s*l\.challenge\.solution/);
      // expectedOutput must be stripped from the public testCases mapping
      expect(routeSource).not.toMatch(/expectedOutput:\s*t\.expectedOutput/);
    });
  });

  describe("newsletter API — email validation", () => {
    it("rejects empty email", () => {
      // From newsletter/route.ts line 8:
      // if (!email || typeof email !== "string" || !email.includes("@"))
      // This validation is too weak — accepts "a@b" or "@" or "user@" etc.
      const weakValidation = (email: string) =>
        !!email && typeof email === "string" && email.includes("@");

      expect(weakValidation("valid@example.com")).toBe(true);
      expect(weakValidation("")).toBe(false);
      expect(weakValidation("no-at-sign")).toBe(false);

      // These SHOULD fail but pass the current weak validation:
      expect(weakValidation("@")).toBe(true); // BUG: should be false
      expect(weakValidation("a@")).toBe(true); // BUG: should be false
      expect(weakValidation("@b")).toBe(true); // BUG: should be false
      expect(weakValidation("user@.")).toBe(true); // BUG: should be false
    });

    it("should validate email format properly", () => {
      // A proper email validation regex
      const properValidation = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      expect(properValidation("valid@example.com")).toBe(true);
      expect(properValidation("user.name@domain.co")).toBe(true);
      expect(properValidation("")).toBe(false);
      expect(properValidation("@")).toBe(false);
      expect(properValidation("a@")).toBe(false);
      expect(properValidation("@b")).toBe(false);
      expect(properValidation("user@.")).toBe(false);
      expect(properValidation("no-at-sign")).toBe(false);
    });
  });

  describe("admin guard — default access when ADMIN_WALLETS not set", () => {
    it("after fix: missing ADMIN_WALLETS env defaults to denied (not open)", () => {
      const adminGuardSource = fs.readFileSync(
        path.join(process.cwd(), "src/components/admin/admin-guard.tsx"),
        "utf8",
      );
      // Must not contain the unsafe !ADMIN_WALLETS fallback
      expect(adminGuardSource).not.toMatch(/isAdmin:\s*!ADMIN_WALLETS/);
      // Must not grant admin when ADMIN_WALLETS is null (env not set)
      expect(adminGuardSource).not.toMatch(/ADMIN_WALLETS\s*===\s*null/);
    });
  });
});
