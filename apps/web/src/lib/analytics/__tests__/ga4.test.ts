// @vitest-environment jsdom
// Pins the shape gtag.js actually consumes: raw `arguments` objects pushed to
// the dataLayer (Google's official snippet). The launch bug this guards
// against: a stub that pushed plain objects instead — silently ignored by the
// library, so GA4 never received a single hit ("data collection isn't
// active"). Discovered 2026-08-19 with a live-page probe.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("initGA4 dataLayer contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "G-TEST123");
    document
      .querySelectorAll('script[src*="googletagmanager"]')
      .forEach((s) => s.remove());
    // @ts-expect-error test reset of globals the module owns
    delete window.dataLayer;
    // @ts-expect-error test reset of globals the module owns
    delete window.gtag;
  });

  it("pushes raw arguments objects, never plain records", async () => {
    const { initGA4 } = await import("../ga4");
    initGA4();

    expect(window.dataLayer.length).toBe(3);
    for (const entry of window.dataLayer) {
      // An Arguments object is array-like (numeric keys + length) and NOT a
      // plain object literal — gtag.js branches on exactly this.
      expect(Object.prototype.toString.call(entry)).toBe("[object Arguments]");
    }

    const first = window.dataLayer[0] as IArguments;
    expect(first[0]).toBe("js");
    expect(first[1]).toBeInstanceOf(Date);

    const second = window.dataLayer[2] as IArguments;
    expect(second[0]).toBe("config");
    expect(second[1]).toBe("G-TEST123");
    expect(second[2]).toEqual({ send_page_view: false });
  });

  it("trackGA4Event and trackGA4PageView push arguments too", async () => {
    const { initGA4, trackGA4Event, trackGA4PageView } = await import("../ga4");
    initGA4();
    trackGA4Event("lesson_completed", { lesson_id: "l1" });
    trackGA4PageView("/en/courses");

    const entries = (window.dataLayer.slice(3) as IArguments[]).filter(
      (entry) => entry[0] === "event"
    );
    expect(entries).toHaveLength(2);
    expect(Object.prototype.toString.call(entries[0])).toBe(
      "[object Arguments]"
    );
    expect(entries[0]![0]).toBe("event");
    expect(entries[0]![1]).toBe("lesson_completed");
    expect(entries[1]![0]).toBe("event");
    expect(entries[1]![1]).toBe("page_view");
    // Google's manual-pageview contract: full URL in page_location + title,
    // page_path kept as a convenience dimension.
    expect(entries[1]![2]).toMatchObject({
      page_path: "/en/courses",
      page_location: window.location.href,
      page_title: document.title,
    });
  });

  it("injects the script tag exactly once", async () => {
    const { initGA4 } = await import("../ga4");
    initGA4();
    initGA4();
    expect(
      document.querySelectorAll('script[src*="googletagmanager"]')
    ).toHaveLength(1);
  });

  describe("location fields", () => {
    const SECRETS = ["oauth-code", "oauth-state", "device-token", "hash-token"];
    const RAW =
      "/en/courses?dynamicOauthCode=oauth-code&dynamicOauthState=oauth-state&deviceRegistrationToken=device-token&utm_source=news&ref=abc&gclid=g1#access_token=hash-token";
    const CLEAN = "/en/courses?utm_source=news&ref=abc&gclid=g1";

    beforeEach(() => {
      window.history.replaceState(null, "", RAW);
      vi.spyOn(document, "referrer", "get").mockReturnValue(
        "https://accounts.google.com/o?code=oauth-code&hl=en"
      );
    });

    afterEach(() => {
      window.history.replaceState(null, "", "/");
      vi.restoreAllMocks();
    });

    function pushed(): unknown[][] {
      return (window.dataLayer as IArguments[]).map((entry) =>
        Array.from(entry)
      );
    }

    it("sets clean location fields before config, so no hit uses the raw URL", async () => {
      const { initGA4 } = await import("../ga4");
      initGA4();

      const calls = pushed();
      const set = calls.findIndex((call) => call[0] === "set");
      const config = calls.findIndex((call) => call[0] === "config");
      expect(set).toBeGreaterThanOrEqual(0);
      expect(set).toBeLessThan(config);
      expect(calls[set]![1]).toEqual({
        page_location: `${window.location.origin}${CLEAN}`,
        page_referrer: "https://accounts.google.com/o?hl=en",
      });
    });

    it("puts clean location fields on page views and custom events", async () => {
      const { initGA4, trackGA4Event, trackGA4PageView } =
        await import("../ga4");
      initGA4();
      trackGA4PageView("/en/courses?token=device-token");
      trackGA4Event("lesson_completed", { lesson_id: "l1" });

      const events = pushed().filter((call) => call[0] === "event");
      expect(events[0]![2]).toMatchObject({
        page_location: `${window.location.origin}${CLEAN}`,
        page_referrer: "https://accounts.google.com/o?hl=en",
        page_path: "/en/courses",
      });
      expect(events[1]![2]).toMatchObject({
        lesson_id: "l1",
        page_location: `${window.location.origin}${CLEAN}`,
      });
    });

    it("sends none of the secrets anywhere in the data layer", async () => {
      const { initGA4, trackGA4Event, trackGA4PageView } =
        await import("../ga4");
      initGA4();
      trackGA4PageView("/en/courses");
      trackGA4Event("lesson_completed");

      const out = JSON.stringify(pushed());
      for (const secret of SECRETS) expect(out).not.toContain(secret);
    });
  });
});
