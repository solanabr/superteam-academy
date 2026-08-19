// @vitest-environment jsdom
// Pins the pre-init queue contract: PostHog init is async (dynamic import),
// but the first pageview and first-render events fire synchronously before it
// resolves. Without buffering, every one of those events hit the
// `if (!posthog) return` no-op — the 53-pageleave / 14-pageview gap observed
// in production on 2026-08-19. These tests fail against the unbuffered
// implementation.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type PostHogModule = typeof import("../posthog");

const mockPostHog = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
};

async function loadModule(): Promise<PostHogModule> {
  vi.doMock("posthog-js", () => ({ default: mockPostHog }));
  return import("../posthog");
}

async function loadModuleWithFailingImport(): Promise<PostHogModule> {
  vi.doMock("posthog-js", () => {
    throw new Error("simulated load failure (adblock)");
  });
  return import("../posthog");
}

describe("PostHog pre-init queue", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://ph.example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("posthog-js");
    vi.restoreAllMocks();
  });

  it("delivers an event captured before init resolves, after init", async () => {
    const { initPostHog, trackPostHogEvent } = await loadModule();

    // Fire before init is even started — the first-pageview scenario.
    trackPostHogEvent("$pageview", { $current_url: "https://a.test/en" });
    expect(mockPostHog.capture).not.toHaveBeenCalled();

    await initPostHog();

    expect(mockPostHog.capture).toHaveBeenCalledWith("$pageview", {
      $current_url: "https://a.test/en",
    });
  });

  it("flushes buffered capture/identify calls in order", async () => {
    const { initPostHog, trackPostHogEvent, identifyPostHogUser } =
      await loadModule();
    const order: string[] = [];
    mockPostHog.capture.mockImplementation((name: string) => {
      order.push(`capture:${name}`);
    });
    mockPostHog.identify.mockImplementation((id: string) => {
      order.push(`identify:${id}`);
    });

    trackPostHogEvent("first");
    identifyPostHogUser("user-1");
    trackPostHogEvent("second");

    const pending = initPostHog();
    // Still buffered while the dynamic import is in flight.
    expect(order).toEqual([]);
    await pending;

    expect(order).toEqual([
      "capture:first",
      "identify:user-1",
      "capture:second",
    ]);
  });

  it("caps the buffer at 50, dropping the oldest", async () => {
    const { initPostHog, trackPostHogEvent } = await loadModule();

    for (let i = 0; i < 60; i++) {
      trackPostHogEvent(`event-${i}`);
    }
    await initPostHog();

    expect(mockPostHog.capture).toHaveBeenCalledTimes(50);
    // Oldest 10 dropped: first delivered is event-10, last is event-59.
    expect(mockPostHog.capture.mock.calls[0]?.[0]).toBe("event-10");
    expect(mockPostHog.capture.mock.calls[49]?.[0]).toBe("event-59");
  });

  it("delivers directly (no buffering) once initialized", async () => {
    const { initPostHog, trackPostHogEvent } = await loadModule();
    await initPostHog();

    trackPostHogEvent("live-event", { a: 1 });
    expect(mockPostHog.capture).toHaveBeenCalledWith("live-event", { a: 1 });
  });

  it("warns exactly once when unconfigured, and drops", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { trackPostHogEvent } = await loadModule();

    trackPostHogEvent("dropped-1");
    trackPostHogEvent("dropped-2");

    expect(mockPostHog.capture).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain("not initialized");
  });

  it("warns once and drops after a failed posthog-js load", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { initPostHog, trackPostHogEvent } =
      await loadModuleWithFailingImport();

    trackPostHogEvent("buffered-then-lost");
    await initPostHog();
    const warnsAfterInit = warn.mock.calls.length; // load-failure warn

    trackPostHogEvent("dropped-1");
    trackPostHogEvent("dropped-2");

    expect(mockPostHog.capture).not.toHaveBeenCalled();
    // Exactly one additional "dropping events" warn, not one per capture.
    expect(warn.mock.calls.length).toBe(warnsAfterInit + 1);
  });

  it("resetPostHogUser delegates to posthog.reset once initialized", async () => {
    const { initPostHog, resetPostHogUser } = await loadModule();
    await initPostHog();

    resetPostHogUser();
    expect(mockPostHog.reset).toHaveBeenCalledTimes(1);
  });
});
