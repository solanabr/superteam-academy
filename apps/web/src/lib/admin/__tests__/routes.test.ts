import { describe, it, expect } from "vitest";
import { isAdminRoute } from "@/lib/admin/routes";

const locales = ["en", "es", "pt-BR"] as const;

describe("isAdminRoute", () => {
  // Regression for #418: a locale-agnostic `^\/[a-z-]+\/admin` regex failed to
  // match the uppercase segment in `pt-BR`, misclassifying `/pt-BR/admin`.
  for (const locale of locales) {
    it(`matches the admin root for ${locale}`, () => {
      expect(isAdminRoute(`/${locale}/admin`)).toBe(true);
    });

    it(`matches an admin sub-route for ${locale}`, () => {
      expect(isAdminRoute(`/${locale}/admin/content`)).toBe(true);
    });

    it(`does not match a non-admin route for ${locale}`, () => {
      expect(isAdminRoute(`/${locale}/courses`)).toBe(false);
    });
  }

  it("does not match an unknown locale", () => {
    expect(isAdminRoute("/fr/admin")).toBe(false);
  });
});
