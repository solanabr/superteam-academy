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

describe("AiPartnerPane — attempt-gate notice (#865, tightened: one line, no buttons)", () => {
  const nudgeTitle = messages.aiPartner.attemptNudge.title;
  const askBox = () =>
    screen.getByRole("textbox", { name: messages.aiPartner.actions.askLabel });
  const sendAsk = (text: string) => {
    fireEvent.change(askBox(), { target: { value: text } });
    fireEvent.keyDown(askBox(), { key: "Enter" });
  };

  it("holds a pre-run ask and shows the one-line notice instead of executing", () => {
    renderPane({ hasRunTests: false });
    expect(screen.queryByText(nudgeTitle)).not.toBeInTheDocument();
    sendAsk("why does subgoal 2 fail?");
    expect(screen.getByText(nudgeTitle)).toBeInTheDocument();
    expect(hookState.ask).not.toHaveBeenCalled();
    // No action buttons in the notice — it is a plain status line.
    expect(
      screen.queryByRole("button", { name: /run the tests/i })
    ).not.toBeInTheDocument();
  });

  it("never notices after the first test run — actions execute directly", () => {
    renderPane({ hasRunTests: true });
    sendAsk("why does subgoal 2 fail?");
    expect(hookState.ask).toHaveBeenCalledWith("why does subgoal 2 fail?");
    expect(screen.queryByText(nudgeTitle)).not.toBeInTheDocument();
  });
});

describe("AiPartnerPane — free-text composer (#944)", () => {
  it("renders the composer as the empty state", () => {
    renderPane({ hasRunTests: true });
    expect(screen.getByLabelText(askLabel)).toBeEnabled();
    expect(
      screen.getByText(messages.aiPartner.composer.empty)
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

  it("disables the composer once the lesson is complete", () => {
    renderPane({ hasRunTests: true, disabled: true });
    expect(screen.getByLabelText(askLabel)).toBeDisabled();
  });
});
