// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import confetti from "canvas-confetti";
import messages from "@/messages/en.json";
import { dispatchLevelUp } from "../level-up-popup";
import { dispatchQuestReward } from "../quest-reward-toast";
import { dispatchSurpriseBonus } from "../surprise-bonus-toast";
import { RewardPopupQueue, REWARD_POPUP_DURATION_MS } from "../reward-popup";

// Owner reversal 2026-08-01: level-up, daily-quest and surprise-bonus render
// popup cards instead of small success toasts, and they QUEUE — one lesson
// completion can fire all three, and stacking them buried the moment.

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

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

  it("renders a surprise bonus with its own copy and its XP", () => {
    renderQueue();
    act(() => dispatchSurpriseBonus(30));

    expect(screen.getByText("Surprise Bonus")).toBeDefined();
    expect(screen.getByText("+30 XP")).toBeDefined();
  });

  it("fires no confetti for any of them (LX-B11 still reserves it)", () => {
    renderQueue();
    act(() => dispatchLevelUp(4));
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    act(() => dispatchQuestReward({ questId: "q", xpReward: 25 }));
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    act(() => dispatchSurpriseBonus(30));
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));

    expect(confettiMock).not.toHaveBeenCalled();
  });
});

describe("RewardPopupQueue — queueing, never stacking", () => {
  it("plays two simultaneous rewards SEQUENTIALLY, never overlapping", () => {
    renderQueue();

    // One lesson completion: a level-up and a quest award land together.
    act(() => {
      dispatchLevelUp(4);
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 });
    });

    // Only the first is on screen — the second waits its turn.
    expect(cards()).toHaveLength(1);
    expect(screen.getByText("Level Up")).toBeDefined();
    expect(screen.queryByText("Quest Complete")).toBeNull();

    // The first holds the full beat, then the second takes the stage alone.
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    expect(cards()).toHaveLength(1);
    expect(screen.queryByText("Level Up")).toBeNull();
    expect(screen.getByText("Quest Complete")).toBeDefined();

    // And the queue empties.
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    expect(cards()).toHaveLength(0);
  });

  it("gives each reward a FULL beat — a later arrival never shortens the one on screen", () => {
    renderQueue();
    act(() => dispatchLevelUp(4));

    // A surprise bonus lands most of the way through the level-up's beat.
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS - 100));
    act(() => dispatchSurpriseBonus(30));
    expect(screen.getByText("Level Up")).toBeDefined();

    // The level-up finishes its own beat, then the bonus starts a fresh one.
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByText("Surprise Bonus")).toBeDefined();
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS - 100));
    expect(screen.getByText("Surprise Bonus")).toBeDefined();
    act(() => vi.advanceTimersByTime(100));
    expect(cards()).toHaveLength(0);
  });

  it("all three kinds at once play one at a time, in arrival order", () => {
    renderQueue();
    act(() => {
      dispatchLevelUp(4);
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 });
      dispatchSurpriseBonus(30);
    });

    for (const label of ["Level Up", "Quest Complete", "Surprise Bonus"]) {
      expect(cards()).toHaveLength(1);
      expect(screen.getByText(label)).toBeDefined();
      act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    }
    expect(cards()).toHaveLength(0);
  });
});

describe("RewardPopupQueue — dismissal and a11y", () => {
  it("dismissing advances to the next reward immediately", () => {
    renderQueue();
    act(() => {
      dispatchLevelUp(4);
      dispatchSurpriseBonus(30);
    });

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByText("Level Up")).toBeNull();
    expect(screen.getByText("Surprise Bonus")).toBeDefined();
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
