import { describe, expect, it } from "vitest";
import {
  hasAuthParams,
  scrubText,
  scrubUrl,
  stripAuthParams,
} from "../telemetry-url";

describe("scrubText", () => {
  it("drops query and fragment from a path after a separator", () => {
    expect(scrubText("GET /en?token=a#b")).toBe("GET /en");
    expect(scrubText("href=/en?token=a")).toBe("href=/en");
    expect(scrubText('{"url":"/en?token=a"}')).toBe('{"url":"/en"}');
  });

  it("reduces third-party URLs in text to their origin", () => {
    expect(scrubText("POST https://rpc.example/v1?api-key=a failed")).toBe(
      "POST https://rpc.example failed"
    );
    expect(scrubText("(https://rpc.example/v1?a=b)")).toBe(
      "(https://rpc.example"
    );
    expect(scrubText("db postgres://u:p@db.example:5432/app")).toBe(
      "db postgres://db.example:5432"
    );
  });

  it("scrubs a path sitting before a URL in the same token", () => {
    const out = scrubText("a=/b?secret-value,https://rpc.example/?k=v");

    expect(out).not.toContain("secret-value");
  });

  it("clips very long input instead of scanning all of it", () => {
    expect(scrubText("x".repeat(100_000)).length).toBeLessThanOrEqual(8_192);
  });

  // Every shape sits just under the clip, so what's measured is the scan itself.
  // A bounded scan takes single-digit milliseconds on these and a quadratic one
  // takes around 100. One run can spike past the budget on a GC pause or a busy
  // machine, but a bad pattern is slow on all of them, so the fastest run counts.
  const ADVERSARIAL: Array<[string, string]> = [
    ["hyphenated path", `/en/${"a-".repeat(4_000)}`],
    ["hyphenated word", "a-".repeat(4_000)],
    ["scheme-like runs", "a+.-".repeat(2_000)],
    ["colons without a URL", "a:".repeat(4_000)],
    ["path separators", "=/".repeat(4_000)],
    ["path commas", ",/a".repeat(2_600)],
    ["jwt-like runs", "eyJ-".repeat(2_000)],
    ["key-like runs", "AIza-".repeat(1_600)],
    ["credential words", "token ".repeat(1_300)],
    ["bearer runs", "Bearer ".repeat(1_100)],
    ["whitespace", `token${" ".repeat(8_000)}`],
    ["many URLs", "https://a.example/?b ".repeat(390)],
  ];

  it.each(ADVERSARIAL)("stays fast on %s", (_name, input) => {
    const runs = Array.from({ length: 5 }, () => {
      const start = performance.now();
      scrubText(input);
      return performance.now() - start;
    });

    expect(Math.min(...runs)).toBeLessThan(50);
  });
});

describe("scrubUrl", () => {
  it("clips before parsing", () => {
    expect(scrubUrl(`/${"a".repeat(100_000)}`).length).toBeLessThanOrEqual(
      8_192
    );
  });
});

describe("hasAuthParams", () => {
  it.each([
    "https://a.test/en?dynamicOauthCode=c",
    "https://a.test/en?dynamicOauthState=s",
    "https://a.test/en?deviceRegistrationToken=t",
    "https://a.test/en?utm_source=x&code=c",
    "/en?email=a@b.c",
    "https://a.test/en#access_token=t",
    "https://a.test/en?utm_source=x#state=s&ok=1",
  ])("flags %s", (url) => {
    expect(hasAuthParams(url)).toBe(true);
  });

  it.each([
    "https://a.test/en",
    "https://a.test/token/en",
    "https://a.test/en?utm_source=x&utm_campaign=y&ref=r&gclid=g",
    "https://a.test/en#code",
    "https://a.test/en#section=2",
    "https://a.test/en?",
  ])("passes %s", (url) => {
    expect(hasAuthParams(url)).toBe(false);
  });

  it("agrees with stripAuthParams", () => {
    const url = "https://a.test/en?deviceRegistrationToken=t&utm_source=x";
    expect(hasAuthParams(stripAuthParams(url))).toBe(false);
  });
});

describe("stripAuthParams", () => {
  it("removes auth and identity params, keeping everything else", () => {
    expect(
      stripAuthParams(
        "https://www.st.academy/en?dynamicOauthCode=a&dynamicOauthState=b&deviceRegistrationToken=c&sessionToken=d&code=e&state=f&utm_source=x&ref=y&gclid=z&tab=2&wallet=g&email=h"
      )
    ).toBe("https://www.st.academy/en?utm_source=x&ref=y&gclid=z&tab=2");
  });

  it("removes the fragment", () => {
    expect(stripAuthParams("https://a.example/en#access_token=a")).toBe(
      "https://a.example/en"
    );
  });

  it("leaves a third-party path alone and an empty referrer empty", () => {
    expect(stripAuthParams("https://google.com/search?q=x&code=a")).toBe(
      "https://google.com/search?q=x"
    );
    expect(stripAuthParams("")).toBe("");
  });
});
