import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { localeFromRequest } from "../locale";

/**
 * `/api/content/*` sits outside the `[locale]` segment, so the reader's UI
 * language has to be recovered from the request itself. Precedence is
 * explicit param → next-intl's cookie → the calling page's path in `Referer`
 * — and NOTHING when none of them says: the queries then serve the source
 * tree rather than guessing English for a Portuguese reader.
 */
function req(url: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost${url}`, { headers });
}

describe("localeFromRequest", () => {
  it("prefers an explicit ?locale=", () => {
    expect(
      localeFromRequest(
        req("/api/content/courses?ids=a&locale=es", {
          cookie: "NEXT_LOCALE=en",
          referer: "http://localhost/pt-BR/dashboard",
        })
      )
    ).toBe("es");
  });

  it("then the NEXT_LOCALE cookie", () => {
    expect(
      localeFromRequest(
        req("/api/content/courses?ids=a", {
          cookie: "NEXT_LOCALE=pt-BR",
          referer: "http://localhost/en/dashboard",
        })
      )
    ).toBe("pt-BR");
  });

  it("then the calling page's locale prefix in Referer", () => {
    expect(
      localeFromRequest(
        req("/api/content/courses?ids=a", {
          referer: "http://localhost/pt-BR/profile/someone",
        })
      )
    ).toBe("pt-BR");
  });

  it("ignores values that are not app locales, and is undefined with nothing to go on", () => {
    expect(
      localeFromRequest(
        req("/api/content/courses?ids=a&locale=fr", {
          cookie: "NEXT_LOCALE=de",
          referer: "http://localhost/api/other",
        })
      )
    ).toBeUndefined();
    expect(
      localeFromRequest(req("/api/content/courses?ids=a"))
    ).toBeUndefined();
    expect(
      localeFromRequest(req("/api/content/courses", { referer: "not a url" }))
    ).toBeUndefined();
  });
});
