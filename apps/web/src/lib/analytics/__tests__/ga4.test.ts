// @vitest-environment jsdom
// Pins the shape gtag.js actually consumes: raw `arguments` objects pushed to
// the dataLayer (Google's official snippet). The launch bug this guards
// against: a stub that pushed plain objects instead — silently ignored by the
// library, so GA4 never received a single hit ("data collection isn't
// active"). Discovered 2026-08-19 with a live-page probe.
import { describe, it, expect, beforeEach, vi } from "vitest";

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

    expect(window.dataLayer.length).toBe(2);
    for (const entry of window.dataLayer) {
      // An Arguments object is array-like (numeric keys + length) and NOT a
      // plain object literal — gtag.js branches on exactly this.
      expect(Object.prototype.toString.call(entry)).toBe("[object Arguments]");
    }

    const first = window.dataLayer[0] as IArguments;
    expect(first[0]).toBe("js");
    expect(first[1]).toBeInstanceOf(Date);

    const second = window.dataLayer[1] as IArguments;
    expect(second[0]).toBe("config");
    expect(second[1]).toBe("G-TEST123");
    expect(second[2]).toEqual({ send_page_view: false });
  });

  it("trackGA4Event and trackGA4PageView push arguments too", async () => {
    const { initGA4, trackGA4Event, trackGA4PageView } = await import("../ga4");
    initGA4();
    trackGA4Event("lesson_completed", { lesson_id: "l1" });
    trackGA4PageView("/en/courses");

    const entries = window.dataLayer.slice(2) as IArguments[];
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
});
