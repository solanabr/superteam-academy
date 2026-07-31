// @vitest-environment jsdom
// LX-C9 post-pass review: the opt-in "Review my solution" button lives in the
// AI Partner pane and is gated on `solutionPassed`. It appears ONLY after a
// passing run, never pre-pass. Suppression (an unanswered quiz block) is
// enforced one level up in ChallengeInterface, which does not mount this pane
// at all while suppressed (see challenge-interface-ai-gate.test.tsx), so a
// suppressed lesson can never surface this button.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { AiPartnerPane } from "../ai-partner-pane";

const review = vi.fn();
const hookState = {
  messages: [] as unknown[],
  freeHintsUsed: 0,
  counts: { free: 0, metered: 0, socratic: 0 },
  tier: "free" as const,
  budgetExhausted: false,
  spendCapped: false,
  resetState: "none" as const,
  resetAvailableAt: null as number | null,
  loading: false,
  error: null as string | null,
  requestHint: vi.fn(),
  proposeFix: vi.fn(),
  ask: vi.fn(),
  review,
  requestReset: vi.fn(async () => ({
    allowed: false,
    reason: "error",
    availableAt: null,
  })),
  verifyCheck: vi.fn(),
};

vi.mock("@/lib/ai/use-ai-partner", () => ({
  useAiPartner: () => hookState,
}));

function renderPane(
  props: {
    solutionPassed?: boolean;
    disabled?: boolean;
    hasRunTests?: boolean;
    onFocusRun?: () => void;
    onNudgeShown?: () => void;
    onNudgeOverride?: () => void;
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
const askLabel = messages.aiPartner.actions.askLabel;
const sendLabel = messages.aiPartner.actions.askSend;

beforeEach(() => {
  review.mockReset();
  hookState.requestHint.mockReset();
  hookState.ask.mockReset();
  hookState.messages = [];
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

describe("AiPartnerPane — attempt-gate nudge (#865, replaces the #770 lock)", () => {
  const nudgeTitle = messages.aiPartner.attemptNudge.title;
  const runLabel = messages.aiPartner.attemptNudge.run;
  const overrideLabel = messages.aiPartner.attemptNudge.override;
  const hintLabel = messages.aiPartner.actions.hint;

  it("keeps AI actions ENABLED pre-run — no lock, no countdown, no padlock", () => {
    renderPane({ hasRunTests: false });
    // The forbidden #770 shape is gone: nothing time-based, nothing disabled.
    expect(screen.getByRole("button", { name: hintLabel })).toBeEnabled();
    expect(screen.queryByText(nudgeTitle)).not.toBeInTheDocument();
  });

  it("surfaces the nudge on the first pre-run AI use instead of executing", () => {
    const onNudgeShown = vi.fn();
    renderPane({ hasRunTests: false, onNudgeShown });

    fireEvent.click(screen.getByRole("button", { name: hintLabel }));

    // The hint request is HELD, not refused and not executed.
    expect(hookState.requestHint).not.toHaveBeenCalled();
    expect(screen.getByText(nudgeTitle)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: runLabel })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: overrideLabel })
    ).toBeInTheDocument();
    expect(onNudgeShown).toHaveBeenCalledTimes(1);
  });

  it("[Run the tests] dismisses the nudge and shifts focus to the run button", () => {
    const onFocusRun = vi.fn();
    renderPane({ hasRunTests: false, onFocusRun });

    fireEvent.click(screen.getByRole("button", { name: hintLabel }));
    fireEvent.click(screen.getByRole("button", { name: runLabel }));

    expect(onFocusRun).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(nudgeTitle)).not.toBeInTheDocument();
    // Taking the suggestion does NOT silently spend the held hint.
    expect(hookState.requestHint).not.toHaveBeenCalled();
  });

  it("the free one-tap override proceeds with the original action immediately", () => {
    const onNudgeOverride = vi.fn();
    renderPane({ hasRunTests: false, onNudgeOverride });

    fireEvent.click(screen.getByRole("button", { name: hintLabel }));
    fireEvent.click(screen.getByRole("button", { name: overrideLabel }));

    // One tap: nudge gone AND the held hint request executed — no extra step,
    // no penalty.
    expect(hookState.requestHint).toHaveBeenCalledTimes(1);
    expect(onNudgeOverride).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(nudgeTitle)).not.toBeInTheDocument();

    // The override is sticky: further pre-run AI use is never re-nudged.
    fireEvent.click(screen.getByRole("button", { name: hintLabel }));
    expect(hookState.requestHint).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(nudgeTitle)).not.toBeInTheDocument();
  });

  it("never nudges after the first test run — actions execute directly", () => {
    const onNudgeShown = vi.fn();
    renderPane({ hasRunTests: true, onNudgeShown });

    fireEvent.click(screen.getByRole("button", { name: hintLabel }));

    expect(hookState.requestHint).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(nudgeTitle)).not.toBeInTheDocument();
    expect(onNudgeShown).not.toHaveBeenCalled();
  });

  it("a run mid-nudge hides it (hasRunTests flips true)", () => {
    const { rerender } = renderPane({ hasRunTests: false });
    fireEvent.click(screen.getByRole("button", { name: hintLabel }));
    expect(screen.getByText(nudgeTitle)).toBeInTheDocument();

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AiPartnerPane
          lessonSlug="l"
          courseSlug="c"
          hints={[]}
          getCode={() => "code"}
          getTestSummary={() => "3/3 passing"}
          onApply={() => {}}
          hasRunTests={true}
        />
      </NextIntlClientProvider>
    );
    expect(screen.queryByText(nudgeTitle)).not.toBeInTheDocument();
  });

  it("never nudges a completed lesson (actions are disabled outright)", () => {
    renderPane({ hasRunTests: false, disabled: true });
    expect(screen.getByRole("button", { name: hintLabel })).toBeDisabled();
    expect(screen.queryByText(nudgeTitle)).not.toBeInTheDocument();
  });

  it("holds a pre-run ASK behind the same gate, then sends it on override", () => {
    renderPane({ hasRunTests: false });

    const box = screen.getByLabelText(askLabel);
    fireEvent.change(box, { target: { value: "why does this fail?" } });
    fireEvent.click(screen.getByRole("button", { name: sendLabel }));

    // Held, not sent — same soft nudge the hint gets.
    expect(hookState.ask).not.toHaveBeenCalled();
    expect(screen.getByText(nudgeTitle)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: overrideLabel }));
    expect(hookState.ask).toHaveBeenCalledWith("why does this fail?");
  });
});

describe("AiPartnerPane — free-text composer (#944)", () => {
  it("renders the composer as the empty state, with the hint button beside it", () => {
    renderPane({ hasRunTests: true });
    expect(screen.getByLabelText(askLabel)).toBeEnabled();
    expect(
      screen.getByText(messages.aiPartner.composer.empty)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.aiPartner.actions.hint })
    ).toBeInTheDocument();
  });

  it("sends the question through the hook and clears the box", () => {
    renderPane({ hasRunTests: true });
    const box = screen.getByLabelText(askLabel);

    fireEvent.change(box, { target: { value: "  what is a PDA?  " } });
    fireEvent.click(screen.getByRole("button", { name: sendLabel }));

    expect(hookState.ask).toHaveBeenCalledWith("what is a PDA?");
    expect(box).toHaveValue("");
  });

  it("Enter sends, Shift+Enter does not", () => {
    renderPane({ hasRunTests: true });
    const box = screen.getByLabelText(askLabel);

    fireEvent.change(box, { target: { value: "line one" } });
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
    expect(hookState.ask).not.toHaveBeenCalled();

    fireEvent.keyDown(box, { key: "Enter" });
    expect(hookState.ask).toHaveBeenCalledWith("line one");
  });

  it("never sends an empty question", () => {
    renderPane({ hasRunTests: true });
    const box = screen.getByLabelText(askLabel);

    expect(screen.getByRole("button", { name: sendLabel })).toBeDisabled();
    fireEvent.change(box, { target: { value: "   " } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(hookState.ask).not.toHaveBeenCalled();
  });

  it("disables the composer once the ladder is exhausted (#864 handoff state)", () => {
    hookState.budgetExhausted = true;
    renderPane({ hasRunTests: true });

    const box = screen.getByLabelText(askLabel);
    expect(box).toBeDisabled();
    fireEvent.change(box, { target: { value: "still stuck" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(hookState.ask).not.toHaveBeenCalled();
    // The community handoff carries the copy — no wall inside the composer.
    expect(
      screen.getByText(messages.aiPartner.exhausted.title)
    ).toBeInTheDocument();
  });

  it("disables the composer while a request is in flight", () => {
    hookState.loading = true;
    renderPane({ hasRunTests: true });
    expect(screen.getByLabelText(askLabel)).toBeDisabled();
    expect(screen.getByRole("button", { name: sendLabel })).toBeDisabled();
  });

  it("disables the composer once the lesson is complete, like the hint", () => {
    renderPane({ hasRunTests: true, disabled: true });
    expect(screen.getByLabelText(askLabel)).toBeDisabled();
    expect(
      screen.getByRole("button", { name: messages.aiPartner.actions.hint })
    ).toBeDisabled();
  });
});
