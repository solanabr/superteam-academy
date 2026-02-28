import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackEvent } from "@/lib/analytics";

describe("trackEvent", () => {
  let gtagSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagSpy = vi.fn();
    (globalThis as unknown as { window: Record<string, unknown> }).window = globalThis;
    window.gtag = gtagSpy as Window["gtag"];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.gtag;
  });

  it("sends event to GA4 via gtag", () => {
    trackEvent({
      name: "course_enrolled",
      params: { course_slug: "intro", course_title: "Intro" },
    });
    expect(gtagSpy).toHaveBeenCalledWith("event", "course_enrolled", {
      course_slug: "intro",
      course_title: "Intro",
    });
  });

  it("handles all event types without throwing", () => {
    const events = [
      { name: "course_enrolled" as const, params: { course_slug: "s", course_title: "t" } },
      { name: "lesson_completed" as const, params: { course_slug: "s", lesson_id: "l", xp_earned: 10 } },
      { name: "achievement_claimed" as const, params: { achievement_id: 1, achievement_name: "a" } },
      { name: "language_changed" as const, params: { locale: "pt-BR" } },
      { name: "wallet_connected" as const, params: { wallet_type: "phantom" } },
      { name: "certificate_shared" as const, params: { platform: "twitter" as const, cert_id: "c" } },
      { name: "code_challenge_run" as const, params: { course_slug: "s", lesson_id: "l", passed: true } },
    ];

    for (const event of events) {
      expect(() => trackEvent(event)).not.toThrow();
    }
    expect(gtagSpy).toHaveBeenCalledTimes(events.length);
  });

  it("does not throw when gtag is not available", () => {
    delete window.gtag;
    expect(() =>
      trackEvent({
        name: "language_changed",
        params: { locale: "en" },
      })
    ).not.toThrow();
  });
});
