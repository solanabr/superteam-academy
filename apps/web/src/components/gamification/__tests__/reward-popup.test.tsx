// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import confetti from "canvas-confetti";
import messages from "@/messages/en.json";
import { getRewardQueueLength } from "@/lib/gamification/reward-queue-state";
import { dispatchAchievementUnlock } from "../achievement-unlock";
import { dispatchLevelUp } from "../level-up-popup";
import { dispatchQuestReward } from "../quest-reward-toast";
import { RewardPopupQueue, REWARD_POPUP_DURATION_MS } from "../reward-popup";

// Owner reversal 2026-08-01: the recurring reward moments render popup cards
// instead of small success toasts, and they QUEUE.
// Choreography rework 24-08: achievement unlocks moved INTO this queue (they had
// their own always-parallel surface), a moment plays at most 3 cards, and the
// beat dropped to 3.5s.

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useParams: () => ({ locale: "en" }),
}));

// The content catalog is a network read; the fallback path (starter glyph +
// the id-derived name) is what these tests exercise.
vi.mock("@/lib/content/client-queries", () => ({
  getAllAchievements: () => Promise.reject(new Error("offline")),
}));

const confettiMock = vi.mocked(confetti);

function renderQueue() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RewardPopupQueue />
    </NextIntlClientProvider>
  );
}

/** Every popup card on screen right now. */
function cards(): Element[] {
  return Array.from(document.querySelectorAll(".rw-card"));
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  confettiMock.mockClear();
  push.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RewardPopupQueue — rendering each reward kind", () => {
  it("renders a level-up as a popup card, not a toast", () => {
    renderQueue();
    act(() => dispatchLevelUp(4));

    expect(screen.getByText("Level Up")).toBeDefined();
    expect(screen.getByText("You reached level 4!")).toBeDefined();
    expect(cards()).toHaveLength(1);
  });

  it("renders a daily-quest completion with the quest name and its XP", () => {
    renderQueue();
    act(() =>
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 })
    );

    expect(screen.getByText("Quest Complete")).toBeDefined();
    expect(screen.getByText("+25 XP")).toBeDefined();
  });

  it("renders an achievement unlock with its patch, inside the queue", () => {
    renderQueue();
    act(() =>
      dispatchAchievementUnlock("achievement-first-steps", "First Steps")
    );

    expect(screen.getByText("Achievement Unlocked")).toBeDefined();
    expect(screen.getByText("First Steps")).toBeDefined();
    // The patch — not a glyph chip — stays the achievement's own idiom.
    expect(document.querySelector(".rw-card .patch")).not.toBeNull();
    expect(document.querySelector(".rw-card .chip")).toBeNull();
  });

  it("opens the profile achievements section from an achievement card", () => {
    renderQueue();
    act(() =>
      dispatchAchievementUnlock("achievement-first-steps", "First Steps")
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Achievement Unlocked: First Steps/ })
    );

    expect(push).toHaveBeenCalledWith("/en/profile#achievements");
    expect(cards()).toHaveLength(0);
  });

  it("fires no confetti for any of them (LX-B11 still reserves it)", () => {
    renderQueue();
    act(() => dispatchLevelUp(4));
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    act(() => dispatchQuestReward({ questId: "q", xpReward: 25 }));
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    act(() =>
      dispatchAchievementUnlock("achievement-first-steps", "First Steps")
    );
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));

    expect(confettiMock).not.toHaveBeenCalled();
  });
});

describe("RewardPopupQueue — the chip icon (glyph pass 21-08)", () => {
  /** The chip's glyph + category for whatever card is on screen. */
  function chip(): {
    glyph: string | null;
    cat: string | null;
    round: boolean;
  } {
    const el = document.querySelector(".rw-card .chip");
    if (!el) throw new Error("no chip on the card");
    return {
      glyph: el.querySelector("[data-glyph]")!.getAttribute("data-glyph"),
      cat: el.getAttribute("data-cat"),
      round: el.hasAttribute("data-round"),
    };
  }

  it("shows a gold check for a completed quest", () => {
    renderQueue();
    act(() =>
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 })
    );

    expect(chip()).toEqual({ glyph: "✓", cat: "reward", round: false });
  });

  it("shows the new level number in a round course-green chip", () => {
    renderQueue();
    act(() => dispatchLevelUp(7));

    expect(chip()).toEqual({ glyph: "7", cat: "course", round: true });
  });

  it("keeps the icon decorative — the card carries the label", () => {
    renderQueue();
    act(() => dispatchLevelUp(7));

    const el = document.querySelector(".rw-card .chip")!;
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(
      document.querySelector('[aria-live="polite"]')?.getAttribute("aria-label")
    ).toBe("Level Up");
  });
});

describe("RewardPopupQueue — queueing, never stacking", () => {
  it("plays two simultaneous ACHIEVEMENT unlocks sequentially, never in parallel", () => {
    renderQueue();

    // The old standalone surface rendered every unlock at once; two unlocks on
    // one completion meant two cards side by side.
    act(() => {
      dispatchAchievementUnlock("achievement-first-steps", "First Steps");
      dispatchAchievementUnlock("achievement-quick-study", "Quick Study");
    });

    expect(cards()).toHaveLength(1);
    expect(screen.getByText("First Steps")).toBeDefined();
    expect(screen.queryByText("Quick Study")).toBeNull();

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    expect(cards()).toHaveLength(1);
    expect(screen.queryByText("First Steps")).toBeNull();
    expect(screen.getByText("Quick Study")).toBeDefined();

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    expect(cards()).toHaveLength(0);
  });

  it("plays two simultaneous rewards SEQUENTIALLY, never overlapping", () => {
    renderQueue();

    act(() => {
      dispatchLevelUp(4);
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 });
    });

    expect(cards()).toHaveLength(1);
    expect(screen.getByText("Level Up")).toBeDefined();
    expect(screen.queryByText("Quest Complete")).toBeNull();

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    expect(cards()).toHaveLength(1);
    expect(screen.queryByText("Level Up")).toBeNull();
    expect(screen.getByText("Quest Complete")).toBeDefined();

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    expect(cards()).toHaveLength(0);
  });

  it("gives each reward a FULL beat — a later arrival never shortens the one on screen", () => {
    renderQueue();
    act(() => dispatchLevelUp(4));

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS - 100));
    act(() =>
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 })
    );
    expect(screen.getByText("Level Up")).toBeDefined();

    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText("Quest Complete")).toBeDefined();
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS - 100));
    expect(screen.getByText("Quest Complete")).toBeDefined();
    act(() => vi.advanceTimersByTime(100));
    expect(cards()).toHaveLength(0);
  });

  it("runs a whole three-reward moment in ~10s at the shortened beat", () => {
    expect(REWARD_POPUP_DURATION_MS).toBe(3500);
  });
});

describe("RewardPopupQueue — the 3-card ceiling", () => {
  function dispatchMany(n: number) {
    act(() => {
      dispatchLevelUp(4);
      for (let i = 1; i < n; i++) {
        dispatchAchievementUnlock(`achievement-${i}`, `Achievement ${i}`);
      }
    });
  }

  it("plays exactly 2 cards + 1 summary when more than 3 rewards land at once", () => {
    renderQueue();
    dispatchMany(5);

    // Card 1 and card 2 play normally.
    expect(screen.getByText("Level Up")).toBeDefined();
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    expect(screen.getByText("Achievement 1")).toBeDefined();
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));

    // Card 3 is the summary for everything still waiting — never a 4th card.
    expect(cards()).toHaveLength(1);
    expect(screen.getByText("More Rewards")).toBeDefined();
    expect(screen.getByText("3 more rewards")).toBeDefined();

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    expect(cards()).toHaveLength(0);
  });

  it("plays exactly three cards when three rewards land — no pointless summary", () => {
    renderQueue();
    dispatchMany(3);

    for (const label of ["Level Up", "Achievement 1", "Achievement 2"]) {
      expect(cards()).toHaveLength(1);
      expect(screen.getByText(label)).toBeDefined();
      act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    }
    expect(screen.queryByText("More Rewards")).toBeNull();
    expect(cards()).toHaveLength(0);
  });

  it("totals the pending XP on the summary card and links to the profile", () => {
    renderQueue();
    act(() => {
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 });
      dispatchQuestReward({ questId: "quest-challenge", xpReward: 25 });
      dispatchQuestReward({ questId: "quest-complete-module", xpReward: 30 });
      dispatchQuestReward({ questId: "quest-lesson-batch", xpReward: 40 });
    });

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));

    expect(screen.getByText("2 more rewards")).toBeDefined();
    expect(screen.getByText("+70 XP")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /More Rewards/ }));
    expect(push).toHaveBeenCalledWith("/en/profile#achievements");
  });
});

describe("RewardPopupQueue — one level-up per moment", () => {
  it("collapses two level-ups from one XP burst into a single card at the higher level", () => {
    renderQueue();
    act(() => {
      dispatchLevelUp(4);
      dispatchLevelUp(5);
    });

    expect(cards()).toHaveLength(1);
    expect(screen.getByText("You reached level 5!")).toBeDefined();

    // And nothing is waiting behind it.
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    expect(cards()).toHaveLength(0);
  });
});

describe("RewardPopupQueue — the queue-empty signal", () => {
  it("publishes the pending count so the certificate popup can defer", () => {
    renderQueue();
    expect(getRewardQueueLength()).toBe(0);

    act(() => {
      dispatchLevelUp(4);
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 });
    });
    expect(getRewardQueueLength()).toBe(2);

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    expect(getRewardQueueLength()).toBe(1);

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    expect(getRewardQueueLength()).toBe(0);
  });
});

describe("RewardPopupQueue — dismissal and a11y", () => {
  it("dismissing advances to the next reward immediately", () => {
    renderQueue();
    act(() => {
      dispatchLevelUp(4);
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 });
    });

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByText("Level Up")).toBeNull();
    expect(screen.getByText("Quest Complete")).toBeDefined();
    expect(cards()).toHaveLength(1);
  });

  it("auto-dismisses on its own after the beat with nothing queued behind it", () => {
    renderQueue();
    act(() => dispatchLevelUp(4));
    expect(cards()).toHaveLength(1);

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    expect(cards()).toHaveLength(0);
  });

  it("announces politely", () => {
    renderQueue();
    act(() => dispatchLevelUp(4));

    const live = document.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live?.getAttribute("aria-label")).toBe("Level Up");
  });

  it("renders nothing at rest", () => {
    const { container } = renderQueue();
    expect(container.firstChild).toBeNull();
  });
});
