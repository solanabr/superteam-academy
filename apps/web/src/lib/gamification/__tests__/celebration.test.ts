// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import confetti from "canvas-confetti";
import {
  CELEBRATION_TIERS,
  celebrationTierFor,
  celebrate,
  shouldShowEncouragement,
  ENCOURAGEMENT_THRESHOLD,
  isDuplicateFullCelebration,
  FULL_TIER_DEDUPE_MS,
  prefersReducedMotion,
  resetCelebrationThrottleForTests,
  type CelebrationEvent,
} from "../celebration";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

const confettiMock = vi.mocked(confetti);

function stubMatchMedia(matches: boolean): void {
  window.matchMedia = ((query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList) as typeof window.matchMedia;
}

beforeEach(() => {
  vi.useFakeTimers();
  confettiMock.mockClear();
  resetCelebrationThrottleForTests();
  stubMatchMedia(false);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("celebrationTierFor — the LX-B11 tier map", () => {
  const expected: Record<CelebrationEvent, string> = {
    "deploy-success": "medium",
    // Restored 2026-08-01 (owner reversal of #955/#957). POPUP, never confetti:
    // early level-ups arrive every few lessons.
    "level-up": "popup",
    "credential-mint": "full",
    // Owner reversal 2026-08-01: the recurring reward moments render popup
    // cards, not the small success toasts they had been demoted to. A
    // daily-cadence reward with CONFETTI would still be the routine-reward
    // pattern LX-B11 exists to prevent — the assertion below keeps confetti
    // pinned to deploy + credential mint.
    // Achievement unlocks joined the shared queue on 2026-08-24; the surprise
    // bonus was removed outright in the same change.
    achievement: "popup",
    "daily-quest": "popup",
  };

  for (const [event, tier] of Object.entries(expected)) {
    it(`${event} → ${tier}`, () => {
      expect(celebrationTierFor(event as CelebrationEvent)).toBe(tier);
    });
  }

  it("confetti-worthy tiers are EXACTLY deploy + credential mint (LX-B11 accept line)", () => {
    const confettiWorthy = Object.entries(CELEBRATION_TIERS)
      .filter(([, tier]) => tier === "medium" || tier === "full")
      .map(([event]) => event)
      .sort();
    expect(confettiWorthy).toEqual(["credential-mint", "deploy-success"]);
  });
});

describe("shouldShowEncouragement — struggling state after ≥3 consecutive fails", () => {
  it("stays hidden below the threshold", () => {
    expect(shouldShowEncouragement(0)).toBe(false);
    expect(shouldShowEncouragement(1)).toBe(false);
    expect(shouldShowEncouragement(2)).toBe(false);
  });

  it("appears at exactly 3 consecutive fails and beyond", () => {
    expect(ENCOURAGEMENT_THRESHOLD).toBe(3);
    expect(shouldShowEncouragement(3)).toBe(true);
    expect(shouldShowEncouragement(4)).toBe(true);
    expect(shouldShowEncouragement(10)).toBe(true);
  });
});

describe("isDuplicateFullCelebration — mint double-fire dedupe", () => {
  it("suppresses a repeat inside the window and allows one after it", () => {
    expect(isDuplicateFullCelebration(1000, 1000)).toBe(true);
    expect(
      isDuplicateFullCelebration(1000 + FULL_TIER_DEDUPE_MS - 1, 1000)
    ).toBe(true);
    expect(isDuplicateFullCelebration(1000 + FULL_TIER_DEDUPE_MS, 1000)).toBe(
      false
    );
  });
});

describe("celebrate — confetti firing per tier", () => {
  it("has no event for lesson completion or challenge pass", () => {
    // Those moments are routine, so they are not members of CelebrationEvent
    // at all — there is no tier to look up and nothing that could fire confetti.
    const events: CelebrationEvent[] = Object.keys(
      CELEBRATION_TIERS
    ) as CelebrationEvent[];
    expect(events).not.toContain("lesson-complete" as CelebrationEvent);
    expect(events).not.toContain("challenge-pass" as CelebrationEvent);
  });

  it("fires NO confetti for any popup-tier reward — the popup card IS the moment", () => {
    celebrate("level-up");
    celebrate("daily-quest");
    celebrate("achievement");
    vi.advanceTimersByTime(1000);
    expect(confettiMock).not.toHaveBeenCalled();
  });

  it("fires a single medium burst for deploy success", () => {
    celebrate("deploy-success");
    expect(confettiMock).toHaveBeenCalledTimes(1);
  });

  it("fires the full multi-burst sequence for a credential mint", () => {
    celebrate("credential-mint");
    expect(confettiMock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(500);
    expect(confettiMock).toHaveBeenCalledTimes(3);
  });

  it("collapses a duplicate credential-mint celebration inside the dedupe window", () => {
    celebrate("credential-mint");
    vi.advanceTimersByTime(500);
    expect(confettiMock).toHaveBeenCalledTimes(3);

    // Realtime INSERT + manual mint success land moments apart → one show only
    celebrate("credential-mint");
    vi.advanceTimersByTime(500);
    expect(confettiMock).toHaveBeenCalledTimes(3);

    // A later, genuinely separate mint celebrates again
    vi.advanceTimersByTime(FULL_TIER_DEDUPE_MS);
    celebrate("credential-mint");
    vi.advanceTimersByTime(500);
    expect(confettiMock).toHaveBeenCalledTimes(6);
  });

  it("respects prefers-reduced-motion for every tier", () => {
    stubMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
    celebrate("deploy-success");
    celebrate("credential-mint");
    vi.advanceTimersByTime(1000);
    expect(confettiMock).not.toHaveBeenCalled();
  });
});
