import { describe, it, expect } from "vitest";
import { isAdminRoute, isAdminRootPath } from "@/lib/admin/routes";

const locales = ["en", "es", "pt-BR"] as const;

describe("isAdminRootPath", () => {
  // Regression for #418: the previous inline regex `^\/[a-z-]+\/admin\/?$`
  // failed to match the uppercase segment in `pt-BR`, so `/pt-BR/admin` was
  // treated as a sub-route and redirected to itself in an infinite loop.
  for (const locale of locales) {
    it(`matches the admin root for ${locale} (no trailing slash)`, () => {
      expect(isAdminRootPath(`/${locale}/admin`)).toBe(true);
    });

    it(`matches the admin root for ${locale} (trailing slash)`, () => {
      expect(isAdminRootPath(`/${locale}/admin/`)).toBe(true);
    });

    it(`does not match an admin sub-route for ${locale}`, () => {
      expect(isAdminRootPath(`/${locale}/admin/content`)).toBe(false);
    });

    it(`does not match a non-admin route for ${locale}`, () => {
      expect(isAdminRootPath(`/${locale}/dashboard`)).toBe(false);
    });
  }

  it("does not match an unknown locale", () => {
    expect(isAdminRootPath("/fr/admin")).toBe(false);
  });
});

describe("isAdminRoute", () => {
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
