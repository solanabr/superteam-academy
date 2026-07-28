import { describe, it, expect } from "vitest";
import { parsePrUrl } from "../pr-url";

describe("parsePrUrl", () => {
  it("parses a canonical PR url", () => {
    expect(
      parsePrUrl("https://github.com/solanabr/courses-academy/pull/42")
    ).toEqual({
      ok: true,
      owner: "solanabr",
      repo: "courses-academy",
      number: 42,
    });
  });

  it("tolerates a trailing slash — the paste that hid every preview link (#831)", () => {
    expect(
      parsePrUrl("https://github.com/solanabr/courses-academy/pull/24/")
    ).toMatchObject({ ok: true, number: 24 });
  });

  it("ignores trailing segments and fragments", () => {
    const parsed = parsePrUrl(
      "https://github.com/solanabr/courses-academy/pull/7/files#diff-abc"
    );
    expect(parsed).toMatchObject({ ok: true, number: 7 });
  });

  it("tolerates a missing scheme and www", () => {
    expect(
      parsePrUrl("www.github.com/solanabr/courses-academy/pull/3")
    ).toMatchObject({ ok: true, number: 3 });
  });

  it("accepts a bare PR number", () => {
    expect(parsePrUrl("42")).toMatchObject({ ok: true, number: 42 });
    expect(parsePrUrl("#42")).toMatchObject({ ok: true, number: 42 });
  });

  it("rejects an empty string", () => {
    expect(parsePrUrl("   ")).toEqual({ ok: false, error: "empty" });
  });

  // The route compiles whatever it is pointed at, so anything outside the
  // pinned content repo must be refused rather than fetched.
  it("rejects other repos", () => {
    expect(parsePrUrl("https://github.com/evil/repo/pull/1")).toEqual({
      ok: false,
      error: "wrong_repo",
    });
  });

  it("rejects other hosts", () => {
    expect(
      parsePrUrl("https://gitlab.com/solanabr/courses-academy/pull/1")
    ).toEqual({ ok: false, error: "wrong_host" });
  });

  it("rejects non-PR paths in the right repo", () => {
    expect(
      parsePrUrl("https://github.com/solanabr/courses-academy/issues/12")
    ).toEqual({ ok: false, error: "not_a_pull_request" });
  });

  it("rejects a non-numeric PR number", () => {
    expect(
      parsePrUrl("https://github.com/solanabr/courses-academy/pull/abc")
    ).toEqual({ ok: false, error: "not_a_pull_request" });
  });

  it("rejects garbage", () => {
    expect(parsePrUrl("not a url at all")).toMatchObject({ ok: false });
  });
});
