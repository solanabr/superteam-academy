// @vitest-environment jsdom
// LX-C9 post-pass review: the opt-in "Review my solution" button lives in the
// AI Partner pane and is gated on `solutionPassed`. It appears ONLY after a
// passing run, never pre-pass. Suppression (an unanswered quiz block) is
// enforced one level up in ChallengeInterface, which does not mount this pane
// at all while suppressed (see challenge-interface-ai-gate.test.tsx), so a
// suppressed lesson can never surface this button.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { AiPartnerPane } from "../ai-partner-pane";

const review = vi.fn();
const hookState = {
  messages: [] as unknown[],
  freeHintsUsed: 0,
  paidUsed: 0,
  paidRemaining: 4,
  budgetExhausted: false,
  spendCapped: false,
  loading: false,
  error: null as string | null,
  requestHint: vi.fn(),
  proposeFix: vi.fn(),
  ask: vi.fn(),
  review,
  verifyCheck: vi.fn(),
};

vi.mock("@/lib/ai/use-ai-partner", () => ({
  useAiPartner: () => hookState,
}));

function renderPane(
  props: {
    solutionPassed?: boolean;
    disabled?: boolean;
    unlockAt?: number | null;
  } = {}
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AiPartnerPane
        lessonSlug="l"
        courseSlug="c"
        hints={[]}
        getCode={() => "code"}
        getTestSummary={() => "3/3 passing"}
        onApply={() => {}}
        {...props}
      />
    </NextIntlClientProvider>
  );
}

const reviewLabel = messages.aiPartner.actions.review;

beforeEach(() => {
  review.mockReset();
  hookState.budgetExhausted = false;
  hookState.spendCapped = false;
  hookState.loading = false;
  hookState.error = null;
});

describe("AiPartnerPane — daily spend cap (#591)", () => {
  it("shows the localized spend-cap copy, not the generic error, when spendCapped", () => {
    hookState.spendCapped = true;
    renderPane();
    expect(
      screen.getByText(messages.aiPartner.messages.spendCapped)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.aiPartner.messages.error)
    ).not.toBeInTheDocument();
  });
});

describe("AiPartnerPane — post-pass review button (LX-C9)", () => {
  it("does NOT render the review button before a passing run", () => {
    renderPane({ solutionPassed: false });
    expect(
      screen.queryByRole("button", { name: reviewLabel })
    ).not.toBeInTheDocument();
  });

  it("does NOT render the review button when the prop is omitted", () => {
    renderPane();
    expect(
      screen.queryByRole("button", { name: reviewLabel })
    ).not.toBeInTheDocument();
  });

  it("renders the review button after a passing run and calls review() on click", () => {
    renderPane({ solutionPassed: true });
    const button = screen.getByRole("button", { name: reviewLabel });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(review).toHaveBeenCalledTimes(1);
  });

  it("offers the review even after the lesson is complete (disabled=true) — it is post-pass", () => {
    // `disabled` (lesson complete) hard-stops hints/propose/ask but NOT review:
    // reviewing the solution you just passed is the point of the surface.
    renderPane({ solutionPassed: true, disabled: true });
    expect(screen.getByRole("button", { name: reviewLabel })).toBeEnabled();
  });

  it("disables the review button when the paid budget is exhausted", () => {
    hookState.budgetExhausted = true;
    renderPane({ solutionPassed: true });
    expect(screen.getByRole("button", { name: reviewLabel })).toBeDisabled();
  });
});

describe("AiPartnerPane — think-first lock (#770)", () => {
  const lockTitle = messages.aiPartner.lock.title;
  const lockTooltip = messages.aiPartner.lock.tooltip;
  const hintLabel = messages.aiPartner.actions.hint;
  const THREE_MIN = 3 * 60 * 1000;

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the lock countdown chip and disables the actions while locked", () => {
    // Post-#791 the locked state is announced by a header chip rather than a
    // body banner: a tabular m:ss countdown (~2:59/3:00 depending on the
    // sub-ms gap to the pane's own Date.now()). Since #842 the chip is a
    // BUTTON that discloses the think-first reason, wrapping a role="status"
    // span for the ticking value — the reason lives in its aria-label and in
    // the disclosed note, never in a `title` (browsers dismiss those on click,
    // which is the bug #842 fixed). Assert the chip, not the retired
    // `lock.body` text.
    renderPane({ unlockAt: Date.now() + THREE_MIN });

    const chip = screen.getByRole("status");
    expect(chip).toHaveTextContent(/^\d:\d\d$/);

    const chipButton = screen.getByRole("button", {
      name: new RegExp(lockTooltip.slice(0, 24)),
    });
    expect(chipButton).not.toHaveAttribute("title");
    const ariaLabel = chipButton.getAttribute("aria-label") ?? "";
    expect(ariaLabel).toMatch(/^\d:\d\d — /);
    expect(ariaLabel).toContain(lockTooltip);

    // Subtitle switches to the think-first prompt while locked.
    expect(screen.getByText(lockTitle)).toBeInTheDocument();

    // Actions stay hard-disabled while locked (must NOT weaken).
    expect(screen.getByRole("button", { name: hintLabel })).toBeDisabled();
  });

  it("does not lock when unlockAt is null (completed lesson / no lock)", () => {
    renderPane({ unlockAt: null });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(lockTitle)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: hintLabel })).toBeEnabled();
  });

  it("does not lock when unlockAt is already in the past", () => {
    renderPane({ unlockAt: Date.now() - 1000 });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(lockTitle)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: hintLabel })).toBeEnabled();
  });

  it("renders the countdown chip OUTSIDE the collapse toggle; clicking it does not toggle (#842)", () => {
    renderPane({ unlockAt: Date.now() + THREE_MIN });

    const chip = screen.getByRole("status");
    const toggle = screen.getByRole("button", { expanded: true });

    // The chip must not live inside the toggle: nested, its clicks bubbled to
    // the toggle and the pane collapsed out from under the tooltip (#842).
    expect(toggle.contains(chip)).toBe(false);

    // Clicking the countdown does nothing — pane stays open.
    fireEvent.click(chip);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: hintLabel })).toBeInTheDocument();

    // The toggle itself still collapses and re-expands the pane.
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: hintLabel })
    ).not.toBeInTheDocument();
    // The chip survives the collapse — the wait stays visible in the header.
    expect(screen.getByRole("status")).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("counts down and unlocks once the window elapses", () => {
    vi.useFakeTimers();
    const start = Date.now();
    renderPane({ unlockAt: start + 2000 });
    // Chip present + actions disabled while locked.
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: hintLabel })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Chip gone + actions re-enabled once the window elapses.
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: hintLabel })).toBeEnabled();
  });
});
