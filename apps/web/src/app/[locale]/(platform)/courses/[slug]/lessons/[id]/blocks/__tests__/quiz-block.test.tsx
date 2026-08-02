// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Lesson, QuizBlockData } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { QuizBlock } from "../quiz-block";
import type { BlockContext } from "../types";

const quizBlock: QuizBlockData = {
  _type: "quiz",
  key: "q-block",
  questions: [
    {
      id: "q1",
      prompt: "What is a PDA?",
      multiSelect: false,
      options: [
        {
          id: "a",
          label: "A program-derived address",
          correct: true,
          feedback: "Right — derived from seeds, off the ed25519 curve.",
        },
        {
          id: "b",
          label: "A private key",
          correct: false,
          feedback: "PDAs have NO private key — that is the whole point.",
        },
      ],
      explanation: "PDAs are derived from seeds and the program id.",
    },
    {
      id: "q2",
      prompt: "Which are soulbound?",
      multiSelect: true,
      options: [
        { id: "xp", label: "XP tokens", correct: true },
        { id: "cred", label: "Credentials", correct: true },
        { id: "sol", label: "SOL", correct: false },
      ],
    },
  ],
};

const singleQuestionBlock: QuizBlockData = {
  _type: "quiz",
  key: "q-single",
  questions: [quizBlock.questions[0]!],
};

const lesson: Lesson = {
  _id: "lesson-1",
  title: "Lesson",
  slug: "lesson",
  blocks: [quizBlock],
};

function makeCtx(overrides: Partial<BlockContext> = {}): BlockContext {
  return {
    lesson,
    courseSlug: "course",
    courseId: "course-1",
    locale: "en",
    isEnrolled: true,
    isCompleted: false,
    lessonNumber: null,
    xpReward: 30,
    earnedXp: null,
    onEnroll: vi.fn(),
    setProof: vi.fn(),
    setQuizAnswered: vi.fn(),
    setBlockDone: vi.fn(),
    aiSuppressed: true,
    capstoneAiOff: false,
    buildUuid: null,
    programKeypairSecret: null,
    resetBuild: vi.fn(),
    ...overrides,
  };
}

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

/** The Check button of the CURRENT card (stepper shows one question at a time). */
function answerQ1Correctly(): void {
  fireEvent.click(screen.getByLabelText("A program-derived address"));
  fireEvent.click(checkButton());
  fireEvent.click(nextButton());
}

function checkButton(): HTMLElement {
  return screen.getByRole("button", { name: "Check answer" });
}

function nextButton(): HTMLElement {
  return screen.getByRole("button", { name: "Next question" });
}

function prevButton(): HTMLElement {
  return screen.getByRole("button", { name: "Previous question" });
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("QuizBlock — Check interaction (LX-C1)", () => {
  it("disables Check until an option is selected", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    expect(checkButton()).toBeDisabled();

    fireEvent.click(screen.getByLabelText("A private key"));
    expect(checkButton()).toBeEnabled();
  });

  it("wrong answer → authored per-option feedback + explanation inline", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(checkButton());

    expect(
      screen.getByText("Not quite — review your answer and try again.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("PDAs have NO private key — that is the whole point.")
    ).toBeInTheDocument();
    // Explanation shows after ANY check (schema: "regardless of choice").
    expect(
      screen.getByText("PDAs are derived from seeds and the program id.")
    ).toBeInTheDocument();
    // The other option's feedback must NOT leak.
    expect(
      screen.queryByText(/derived from seeds, off the ed25519 curve/)
    ).not.toBeInTheDocument();
  });

  it("correct answer → correct status + that option's feedback + explanation", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    fireEvent.click(screen.getByLabelText("A program-derived address"));
    fireEvent.click(checkButton());

    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(
      screen.getByText("Right — derived from seeds, off the ed25519 curve.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("PDAs are derived from seeds and the program id.")
    ).toBeInTheDocument();
  });

  it("multi-select correctness is set equality, not subset", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    answerQ1Correctly(); // q2 is the multi-select question

    // Subset of the correct set → incorrect.
    fireEvent.click(screen.getByLabelText("XP tokens"));
    fireEvent.click(checkButton());
    expect(
      screen.getByText("Not quite — review your answer and try again.")
    ).toBeInTheDocument();

    // Completing the set → correct.
    fireEvent.click(screen.getByLabelText("Credentials"));
    fireEvent.click(checkButton());
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("changing the selection retires the previous verdict", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(checkButton());
    expect(
      screen.getByText("Not quite — review your answer and try again.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("A program-derived address"));
    expect(
      screen.queryByText("Not quite — review your answer and try again.")
    ).not.toBeInTheDocument();
  });

  it("renders feedback inside an always-mounted aria-live region", () => {
    const { container } = renderWithIntl(
      <QuizBlock block={quizBlock} ctx={makeCtx()} />
    );
    // The feedback region lives inside the question fieldset and is mounted
    // BEFORE the check, so the verdict is announced when it appears.
    const feedbackRegion = container.querySelector(
      'fieldset [aria-live="polite"]'
    );
    expect(feedbackRegion).not.toBeNull();
    expect(feedbackRegion?.textContent).toBe("");

    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(checkButton());
    expect(feedbackRegion?.textContent).toContain(
      "Not quite — review your answer and try again."
    );
  });
});

describe("QuizBlock — proofs and answered reporting", () => {
  it("reports selections upward as the block proof", () => {
    const ctx = makeCtx();
    renderWithIntl(<QuizBlock block={quizBlock} ctx={ctx} />);
    fireEvent.click(screen.getByLabelText("A program-derived address"));
    expect(ctx.setProof).toHaveBeenLastCalledWith("q-block", {
      selections: { q1: ["a"] },
    });
  });

  it("reports answered=false until EVERY question has been checked, then true (even if wrong)", () => {
    const ctx = makeCtx();
    renderWithIntl(<QuizBlock block={quizBlock} ctx={ctx} />);
    expect(ctx.setQuizAnswered).toHaveBeenLastCalledWith("q-block", false);

    fireEvent.click(screen.getByLabelText("A private key")); // wrong on purpose
    fireEvent.click(checkButton());
    expect(ctx.setQuizAnswered).toHaveBeenLastCalledWith("q-block", false);

    fireEvent.click(nextButton());
    fireEvent.click(screen.getByLabelText("SOL")); // wrong on purpose
    fireEvent.click(checkButton());
    // Checked (attempted) — feedback + explanation already revealed, so the
    // AI gate has nothing left to protect. Correctness is NOT required here;
    // the server still gates completion.
    expect(ctx.setQuizAnswered).toHaveBeenLastCalledWith("q-block", true);
  });

  it("answered stays true after a re-selection (sticky once revealed)", () => {
    const ctx = makeCtx();
    renderWithIntl(<QuizBlock block={quizBlock} ctx={ctx} />);
    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(checkButton());
    fireEvent.click(nextButton());
    fireEvent.click(screen.getByLabelText("SOL"));
    fireEvent.click(checkButton());
    expect(ctx.setQuizAnswered).toHaveBeenLastCalledWith("q-block", true);

    // Changing an answer clears its verdict but must not re-suppress the AI.
    fireEvent.click(prevButton());
    fireEvent.click(screen.getByLabelText("A program-derived address"));
    expect(ctx.setQuizAnswered).toHaveBeenLastCalledWith("q-block", true);
  });
});

describe("QuizBlock — completion state survives the auto-collapse", () => {
  /** Answer every question of `quizBlock` correctly, in stepper order. */
  function sweep(): void {
    fireEvent.click(screen.getByLabelText("A program-derived address"));
    fireEvent.click(checkButton());
    fireEvent.click(nextButton());
    fireEvent.click(screen.getByLabelText("XP tokens"));
    fireEvent.click(screen.getByLabelText("Credentials"));
    fireEvent.click(checkButton());
  }

  it("shows the all-correct summary in a live region even though the block folds", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    sweep();

    // The owner-requested auto-collapse fires on this exact transition.
    expect(screen.getByRole("button", { name: /Quiz/ })).toHaveAttribute(
      "aria-expanded",
      "false"
    );

    // ...and the completion line must still be perceivable. It has to live in
    // a polite live region OUTSIDE the collapsible body: the body carries the
    // `hidden` utility on the very frame the sweep lands, so a summary nested
    // in it is neither painted nor reliably announced. (jsdom loads no
    // stylesheet, so `toBeVisible` cannot see a class-driven display:none —
    // the ancestor check below is what actually proves the placement.)
    const summary = screen.getByText("All 2 questions answered correctly.");
    const live = summary.closest("[aria-live]");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live!.closest(".hidden")).toBeNull();
  });

  it("keeps the header score + Complete chip readable while collapsed", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    sweep();
    expect(screen.getByText("2/2 correct")).toBeVisible();
    expect(screen.getByText("Complete")).toBeVisible();
  });
});

describe("QuizBlock — interaction states (#943)", () => {
  it("locks the question and disables Check after a CORRECT check", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    const correctOption = screen.getByLabelText("A program-derived address");
    fireEvent.click(correctOption);
    fireEvent.click(checkButton());

    expect(correctOption).toBeDisabled();
    expect(screen.getByLabelText("A private key")).toBeDisabled();
    // The morphing action slot (owner 2026-07-31): Check is gone, primary Next takes its place.
    expect(
      screen.queryByRole("button", { name: "Check answer" })
    ).not.toBeInTheDocument();
    expect(nextButton().className).toContain("bg-primary");
    // Correct-state styling + explanation survive the lock.
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(
      screen.getByText("PDAs are derived from seeds and the program id.")
    ).toBeInTheDocument();
    expect(correctOption.closest("label")?.className).toContain(
      "border-success"
    );
  });

  it("leaves the question re-checkable after an INCORRECT check", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(checkButton());

    expect(screen.getByLabelText("A private key")).toBeEnabled();
    expect(checkButton()).toBeEnabled();
  });

  it("Enter cannot re-check a locked question", () => {
    const ctx = makeCtx();
    renderWithIntl(<QuizBlock block={quizBlock} ctx={ctx} />);
    const correctOption = screen.getByLabelText("A program-derived address");
    fireEvent.click(correctOption);
    fireEvent.click(checkButton());
    // Still exactly one verdict — Enter is a no-op once locked.
    fireEvent.keyDown(correctOption, { key: "Enter" });
    expect(screen.getAllByText("Correct!")).toHaveLength(1);
  });

  it("emphasizes Next only once the current question is correct", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    // Unattempted: no Next at all — Check owns the action slot.
    expect(
      screen.queryByRole("button", { name: "Next question" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("A program-derived address"));
    fireEvent.click(checkButton());
    expect(nextButton().className).toContain("bg-primary");
  });

  it("keeps Next subdued when the current answer is wrong", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(checkButton());
    expect(nextButton().className).not.toContain("bg-primary");
  });

  it("shows an in-block completion state only when EVERY question is correct", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    expect(screen.queryByText("Complete")).not.toBeInTheDocument();
    expect(
      screen.queryByText("All 2 questions answered correctly.")
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("A program-derived address"));
    fireEvent.click(checkButton());
    // One of two — not a sweep yet.
    expect(
      screen.queryByText("All 2 questions answered correctly.")
    ).not.toBeInTheDocument();

    fireEvent.click(nextButton());
    fireEvent.click(screen.getByLabelText("XP tokens"));
    fireEvent.click(screen.getByLabelText("Credentials"));
    fireEvent.click(checkButton());

    expect(screen.getByText("Complete")).toBeInTheDocument();
    const summary = screen.getByText("All 2 questions answered correctly.");
    expect(summary).toBeInTheDocument();
    expect(summary.closest('[aria-live="polite"]')).not.toBeNull();
    expect(screen.getByText("2/2 correct")).toBeInTheDocument();
  });

  it("states the AI gate with a live N/M answered counter", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    expect(
      screen.getByText("AI Partner unlocks after the quiz — 0/2 answered")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("A private key")); // wrong still counts
    fireEvent.click(checkButton());
    expect(
      screen.getByText("AI Partner unlocks after the quiz — 1/2 answered")
    ).toBeInTheDocument();

    fireEvent.click(nextButton());
    fireEvent.click(screen.getByLabelText("SOL"));
    fireEvent.click(checkButton());
    // Gate satisfied — the note retires entirely.
    expect(
      screen.queryByText(/AI Partner unlocks after the quiz/)
    ).not.toBeInTheDocument();
  });
});

describe("QuizBlock — stepper (#849)", () => {
  it("shows one question per card and navigates with next/prev", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    expect(screen.getByText("What is a PDA?")).toBeInTheDocument();
    expect(screen.queryByText("Which are soulbound?")).not.toBeInTheDocument();
    expect(prevButton()).toBeDisabled();

    // Attempting (even wrongly) surfaces the subdued skip-Next.
    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(checkButton());
    expect(nextButton()).toBeEnabled();

    fireEvent.click(nextButton());
    expect(screen.getByText("Which are soulbound?")).toBeInTheDocument();
    expect(screen.queryByText("What is a PDA?")).not.toBeInTheDocument();
    expect(prevButton()).toBeEnabled();
    // Unattempted last question: the action slot holds Check, no Next at all.
    expect(
      screen.queryByRole("button", { name: "Next question" })
    ).not.toBeInTheDocument();

    fireEvent.click(prevButton());
    expect(screen.getByText("What is a PDA?")).toBeInTheDocument();
  });

  it("displays the position alongside the correct-count and announces it via aria-live", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    // Once: the sr-only live announcer (the visible chip was dropped — owner
    // 2026-07-31; the score chip alone carries the header).
    expect(screen.getAllByText("Question 1 of 2")).toHaveLength(1);
    expect(screen.getByText("0/2 correct")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(checkButton());
    fireEvent.click(nextButton());
    const announcements = screen.getAllByText("Question 2 of 2");
    expect(announcements).toHaveLength(1);
    expect(
      announcements.some((el) => el.getAttribute("aria-live") === "polite")
    ).toBe(true);
  });

  it("preserves answered state and feedback across navigation", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    fireEvent.click(screen.getByLabelText("A program-derived address"));
    fireEvent.click(checkButton());
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.getByText("1/2 correct")).toBeInTheDocument();

    fireEvent.click(nextButton());
    expect(screen.queryByText("Correct!")).not.toBeInTheDocument();

    fireEvent.click(prevButton());
    // Selection, verdict, feedback, and explanation all survived the round trip.
    expect(screen.getByLabelText("A program-derived address")).toBeChecked();
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(
      screen.getByText("Right — derived from seeds, off the ed25519 curve.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("PDAs are derived from seeds and the program id.")
    ).toBeInTheDocument();
    expect(screen.getByText("1/2 correct")).toBeInTheDocument();
  });

  it("renders single-question quizzes without stepper chrome", () => {
    renderWithIntl(<QuizBlock block={singleQuestionBlock} ctx={makeCtx()} />);
    expect(screen.getByText("What is a PDA?")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next question" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Previous question" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Question 1 of 1/)).not.toBeInTheDocument();
    // The check flow itself is untouched.
    fireEvent.click(screen.getByLabelText("A program-derived address"));
    fireEvent.click(checkButton());
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("navigates with arrow keys when focus is within the block", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    fireEvent.keyDown(screen.getByText("What is a PDA?"), {
      key: "ArrowRight",
    });
    expect(screen.getByText("Which are soulbound?")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByText("Which are soulbound?"), {
      key: "ArrowLeft",
    });
    expect(screen.getByText("What is a PDA?")).toBeInTheDocument();
  });

  it("does NOT hijack arrow keys inside the radio/checkbox group", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    // Arrows on an option input move the native selection, never the card.
    fireEvent.keyDown(screen.getByLabelText("A private key"), {
      key: "ArrowRight",
    });
    expect(screen.getByText("What is a PDA?")).toBeInTheDocument();
    expect(screen.queryByText("Which are soulbound?")).not.toBeInTheDocument();
  });

  it("checks the current question on Enter", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    const option = screen.getByLabelText("A program-derived address");
    fireEvent.click(option);
    fireEvent.keyDown(option, { key: "Enter" });
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("ignores Enter when nothing is selected", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    fireEvent.keyDown(screen.getByText("What is a PDA?"), { key: "Enter" });
    expect(screen.queryByText("Correct!")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Not quite — review your answer and try again.")
    ).not.toBeInTheDocument();
  });

  it("moves focus to the question heading when the card changes", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(checkButton());
    fireEvent.click(nextButton());
    expect(document.activeElement).toBe(
      screen.getByText("Which are soulbound?")
    );

    fireEvent.click(prevButton());
    expect(document.activeElement).toBe(screen.getByText("What is a PDA?"));
  });
});
