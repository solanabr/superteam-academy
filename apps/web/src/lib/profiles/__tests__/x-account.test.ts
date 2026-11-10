import { describe, it, expect } from "vitest";
import { parseXHandle, xProfileUrl } from "@/lib/profiles/x-account";

describe("parseXHandle", () => {
  it.each([
    ["ana_dev", "ana_dev"],
    ["@ana_dev", "ana_dev"],
    ["  @ana_dev  ", "ana_dev"],
    ["https://x.com/ana_dev", "ana_dev"],
    ["x.com/ana_dev/", "ana_dev"],
    ["https://twitter.com/ana_dev?s=21", "ana_dev"],
    ["https://www.x.com/Ana_Dev", "Ana_Dev"],
  ])("reads %j as %j", (input, expected) => {
    expect(parseXHandle(input)).toBe(expected);
  });

  it.each([
    "",
    "@",
    "ana dev",
    "ana.dev",
    "a_handle_that_is_too_long",
    "https://x.com/ana_dev/status/1",
    "https://evil.example/ana_dev",
    "javascript:alert(1)",
  ])("rejects %j", (input) => {
    expect(parseXHandle(input)).toBeNull();
  });
});

describe("xProfileUrl", () => {
  it("links to the handle on x.com", () => {
    expect(xProfileUrl("ana_dev")).toBe("https://x.com/ana_dev");
  });
});
