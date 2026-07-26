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
    "lesson-complete": "none",
    "challenge-pass": "none",
    "deploy-success": "medium",
    "level-up": "medium",
    "credential-mint": "full",
  };

  for (const [event, tier] of Object.entries(expected)) {
    it(`${event} → ${tier}`, () => {
      expect(celebrationTierFor(event as CelebrationEvent)).toBe(tier);
    });
  }

  it("confetti-worthy tiers are exactly deploy, level-up, and credential mint", () => {
    const celebrated = Object.entries(CELEBRATION_TIERS)
      .filter(([, tier]) => tier !== "none")
      .map(([event]) => event)
      .sort();
    expect(celebrated).toEqual([
      "credential-mint",
      "deploy-success",
      "level-up",
    ]);
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
  it("never fires for lesson completion or challenge pass", () => {
    celebrate("lesson-complete");
    celebrate("challenge-pass");
    expect(confettiMock).not.toHaveBeenCalled();
  });

  it("fires a single medium burst for deploy success and level-up", () => {
    celebrate("deploy-success");
    expect(confettiMock).toHaveBeenCalledTimes(1);
    celebrate("level-up");
    expect(confettiMock).toHaveBeenCalledTimes(2);
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
    celebrate("level-up");
    celebrate("credential-mint");
    vi.advanceTimersByTime(1000);
    expect(confettiMock).not.toHaveBeenCalled();
  });
});
