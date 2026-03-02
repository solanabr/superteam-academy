import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackEvent, identifyUser } from "@/lib/analytics";

describe("trackEvent", () => {
  let gtagSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagSpy = vi.fn();
    (globalThis as unknown as { window: Record<string, unknown> }).window =
      globalThis;
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
      {
        name: "course_enrolled" as const,
        params: { course_slug: "s", course_title: "t" },
      },
      {
        name: "lesson_completed" as const,
        params: { course_slug: "s", lesson_id: "l", xp_earned: 10 },
      },
      {
        name: "achievement_claimed" as const,
        params: { achievement_id: "first-steps", achievement_name: "a" },
      },
      { name: "language_changed" as const, params: { locale: "pt-BR" } },
      { name: "wallet_connected" as const, params: { wallet_type: "phantom" } },
      {
        name: "certificate_shared" as const,
        params: { platform: "twitter" as const, cert_id: "c" },
      },
      {
        name: "code_challenge_run" as const,
        params: { course_slug: "s", lesson_id: "l", passed: true },
      },
      {
        name: "onboarding_completed" as const,
        params: { skill_level: "beginner", interests: ["solana", "defi"] },
      },
      {
        name: "course_viewed" as const,
        params: { course_slug: "s", course_title: "t" },
      },
      {
        name: "search_performed" as const,
        params: { query: "rust", result_count: 5 },
      },
      {
        name: "daily_challenge_started" as const,
        params: { challenge_id: "dc-1" },
      },
      {
        name: "daily_challenge_completed" as const,
        params: { challenge_id: "dc-1", tests_passed: 3, total_tests: 5 },
      },
      {
        name: "discussion_thread_created" as const,
        params: { scope: "community", category: "Help" },
      },
      {
        name: "discussion_comment_posted" as const,
        params: { thread_id: "t-1" },
      },
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
      }),
    ).not.toThrow();
  });
});

describe("identifyUser", () => {
  it("does not throw in browser environment", () => {
    (globalThis as unknown as { window: Record<string, unknown> }).window =
      globalThis;
    expect(() =>
      identifyUser("user-123", { wallet: "abc", email: null }),
    ).not.toThrow();
  });
});
