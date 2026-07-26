import { describe, it, expect, vi } from "vitest";
import { isApplePlatform, tabFocusModeChord } from "../keyboard";

function src(
  platform: string,
  userAgent = ""
): {
  platform: string;
  userAgent: string;
} {
  return { platform, userAgent };
}

describe("isApplePlatform", () => {
  it("detects macOS via navigator.platform", () => {
    expect(isApplePlatform(src("MacIntel"))).toBe(true);
    expect(isApplePlatform(src("MacPPC"))).toBe(true);
  });

  it("detects iOS devices (hardware-keyboard Safari users)", () => {
    expect(isApplePlatform(src("iPhone"))).toBe(true);
    expect(isApplePlatform(src("iPad"))).toBe(true);
    expect(isApplePlatform(src("iPod"))).toBe(true);
  });

  it("is false on Windows and Linux", () => {
    expect(isApplePlatform(src("Win32"))).toBe(false);
    expect(isApplePlatform(src("Linux x86_64"))).toBe(false);
  });

  it("falls back to the user agent when platform is empty", () => {
    expect(
      isApplePlatform(
        src("", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
      )
    ).toBe(true);
    expect(
      isApplePlatform(src("", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"))
    ).toBe(false);
  });

  it("does not fall back to the user agent when platform is set", () => {
    // A Windows platform with 'Mac' elsewhere in the UA must not read as Apple.
    expect(
      isApplePlatform(src("Win32", "Mozilla/5.0 (Macintosh; Intel Mac OS X)"))
    ).toBe(false);
  });

  it("is false when no navigator global exists (SSR)", () => {
    vi.stubGlobal("navigator", undefined);
    try {
      expect(isApplePlatform()).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("tabFocusModeChord", () => {
  it("advertises Ctrl+Shift+M on Apple platforms", () => {
    expect(tabFocusModeChord(src("MacIntel"))).toBe("Ctrl+Shift+M");
    expect(tabFocusModeChord(src("iPad"))).toBe("Ctrl+Shift+M");
  });

  it("advertises Ctrl+M on Windows/Linux", () => {
    expect(tabFocusModeChord(src("Win32"))).toBe("Ctrl+M");
    expect(tabFocusModeChord(src("Linux x86_64"))).toBe("Ctrl+M");
  });

  it("always returns one of the two Monaco keybindings", () => {
    expect(["Ctrl+M", "Ctrl+Shift+M"]).toContain(tabFocusModeChord());
  });
});
