// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import confetti from "canvas-confetti";
import messages from "@/messages/en.json";
import { dispatchAchievementUnlock } from "../achievement-unlock";
import {
  CertificatePopup,
  dispatchCertificateMinted,
} from "../certificate-popup";
import { dispatchLevelUp } from "../level-up-popup";
import { dispatchQuestReward } from "../quest-reward-toast";
import {
  RewardPopupQueue,
  REWARD_POPUP_DURATION_MS,
  REWARD_LEAVE_MS,
  MAX_VISIBLE_REWARD_CARDS,
} from "../reward-popup";

// Owner reversal 2026-08-01: the recurring reward moments render popup cards
// instead of small success toasts.
// Choreography rework 24-08: achievement unlocks moved onto this one surface,
// and the beat dropped to 3.5s.
// OWNER REVERSAL 2026-09-18: the cards STACK — they no longer take turns. Each
// one runs its own beat, the oldest is pushed out past the cap, and the
// certificate popup renders over the stack instead of waiting for it.

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

function renderStack() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <RewardPopupQueue />
    </NextIntlClientProvider>
  );
}

/** Cards on screen — a card animating out is excluded. */
function cards(): Element[] {
  return Array.from(document.querySelectorAll(".rw-card:not(.rw-leaving)"));
}

/** Card headlines, in DOM order (top of the stack first). */
function names(): (string | null)[] {
  return cards().map((c) => c.querySelector(".rw-name")?.textContent ?? null);
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
    renderStack();
    act(() => dispatchLevelUp(4));

    expect(screen.getByText("Level Up")).toBeDefined();
    expect(screen.getByText("You reached level 4!")).toBeDefined();
    expect(cards()).toHaveLength(1);
  });

  it("renders a daily-quest completion with the quest name and its XP", () => {
    renderStack();
    act(() =>
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 })
    );

    expect(screen.getByText("Quest Complete")).toBeDefined();
    expect(screen.getByText("+25 XP")).toBeDefined();
  });

  it("renders an achievement unlock with its patch, inside the stack", () => {
    renderStack();
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
    renderStack();
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
    renderStack();
    act(() => {
      dispatchLevelUp(4);
      dispatchQuestReward({ questId: "q", xpReward: 25 });
      dispatchAchievementUnlock("achievement-first-steps", "First Steps");
    });
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
    renderStack();
    act(() =>
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 })
    );

    expect(chip()).toEqual({ glyph: "✓", cat: "reward", round: false });
  });

  it("shows the new level number in a round course-green chip", () => {
    renderStack();
    act(() => dispatchLevelUp(7));

    expect(chip()).toEqual({ glyph: "7", cat: "course", round: true });
  });

  it("keeps the icon decorative — the card carries the label", () => {
    renderStack();
    act(() => dispatchLevelUp(7));

    const el = document.querySelector(".rw-card .chip")!;
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("RewardPopupQueue — stacking, never queueing", () => {
  it("renders two simultaneous rewards STACKED, newest on top", () => {
    renderStack();

    act(() => {
      dispatchLevelUp(4);
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 });
    });

    expect(cards()).toHaveLength(2);
    // The stack is bottom-anchored, so the newest card is first in DOM order.
    expect(names()).toEqual(["Complete a Lesson", "You reached level 4!"]);
  });

  it("renders two simultaneous ACHIEVEMENT unlocks side by side in the stack", () => {
    renderStack();

    act(() => {
      dispatchAchievementUnlock("achievement-first-steps", "First Steps");
      dispatchAchievementUnlock("achievement-quick-study", "Quick Study");
    });

    expect(names()).toEqual(["Quick Study", "First Steps"]);
  });

  it("gives every card its own full beat — nothing waits for anything else", () => {
    renderStack();
    act(() => dispatchLevelUp(4));

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS - 100));
    act(() =>
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 })
    );
    expect(cards()).toHaveLength(2);

    // The level-up's own beat runs out first; the quest card keeps its full one.
    act(() => vi.advanceTimersByTime(100 + REWARD_LEAVE_MS));
    expect(names()).toEqual(["Complete a Lesson"]);

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    act(() => vi.advanceTimersByTime(REWARD_LEAVE_MS));
    expect(cards()).toHaveLength(0);
  });

  it("holds a card open while it is hovered, and resumes on leave", () => {
    renderStack();
    act(() => dispatchLevelUp(4));

    fireEvent.mouseEnter(cards()[0]!);
    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS * 3));
    expect(cards()).toHaveLength(1);

    fireEvent.mouseLeave(cards()[0]!);
    act(() =>
      vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS + REWARD_LEAVE_MS)
    );
    expect(cards()).toHaveLength(0);
  });

  it("keeps the beat at 3.5s", () => {
    expect(REWARD_POPUP_DURATION_MS).toBe(3500);
  });
});

describe("RewardPopupQueue — the 5-card cap", () => {
  it("shows 5 cards and drops the OLDEST when a 6th lands", () => {
    renderStack();

    act(() => {
      for (let i = 1; i <= 6; i++) {
        dispatchAchievementUnlock(`achievement-${i}`, `Achievement ${i}`);
      }
    });
    act(() => vi.advanceTimersByTime(REWARD_LEAVE_MS));

    expect(cards()).toHaveLength(MAX_VISIBLE_REWARD_CARDS);
    // Newest on top, and the first one is gone rather than queued behind.
    expect(names()).toEqual([
      "Achievement 6",
      "Achievement 5",
      "Achievement 4",
      "Achievement 3",
      "Achievement 2",
    ]);
    expect(screen.queryByText("Achievement 1")).toBeNull();
  });

  it("never collapses the extras into a summary card", () => {
    renderStack();
    act(() => {
      for (let i = 1; i <= 6; i++) {
        dispatchAchievementUnlock(`achievement-${i}`, `Achievement ${i}`);
      }
    });

    expect(screen.queryByText("More Rewards")).toBeNull();
  });
});

describe("RewardPopupQueue — one level-up per moment", () => {
  it("collapses two level-ups from one XP burst into a single card at the higher level", () => {
    renderStack();
    act(() => {
      dispatchLevelUp(4);
      dispatchLevelUp(5);
    });

    expect(cards()).toHaveLength(1);
    expect(screen.getByText("You reached level 5!")).toBeDefined();

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    act(() => vi.advanceTimersByTime(REWARD_LEAVE_MS));
    expect(cards()).toHaveLength(0);
  });

  it("upgrades in place without disturbing the other cards", () => {
    renderStack();
    act(() => {
      dispatchLevelUp(4);
      dispatchAchievementUnlock("achievement-first-steps", "First Steps");
      dispatchLevelUp(5);
    });

    expect(names()).toEqual(["First Steps", "You reached level 5!"]);
  });
});

describe("RewardPopupQueue — the certificate popup on top", () => {
  it("renders a mint immediately, above a running reward stack", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CertificatePopup />
        <RewardPopupQueue />
      </NextIntlClientProvider>
    );

    act(() => {
      dispatchLevelUp(4);
      dispatchAchievementUnlock("achievement-first-steps", "First Steps");
    });
    act(() => dispatchCertificateMinted("cert-1"));

    expect(screen.getByText("Certificate Earned")).toBeDefined();
    expect(cards()).toHaveLength(2);
    expect(confettiMock).toHaveBeenCalled();
  });
});

describe("RewardPopupQueue — dismissal and a11y", () => {
  it("dismisses one card without touching the others", () => {
    renderStack();
    act(() => {
      dispatchLevelUp(4);
      dispatchQuestReward({ questId: "quest-complete-lesson", xpReward: 25 });
    });

    // The ✕ buttons are in DOM order too — the first belongs to the top card.
    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss" })[0]!);
    act(() => vi.advanceTimersByTime(REWARD_LEAVE_MS));

    expect(names()).toEqual(["You reached level 4!"]);
  });

  it("auto-dismisses on its own after the beat", () => {
    renderStack();
    act(() => dispatchLevelUp(4));
    expect(cards()).toHaveLength(1);

    act(() => vi.advanceTimersByTime(REWARD_POPUP_DURATION_MS));
    act(() => vi.advanceTimersByTime(REWARD_LEAVE_MS));
    expect(cards()).toHaveLength(0);
  });

  it("announces politely from the stack container", () => {
    renderStack();
    act(() => dispatchLevelUp(4));

    const live = document.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live?.querySelector(".rw-card")).not.toBeNull();
  });

  it("renders nothing at rest", () => {
    const { container } = renderStack();
    expect(container.firstChild).toBeNull();
  });
});
