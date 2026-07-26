// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Lesson, QuizBlockData } from "@superteam-lms/types";
import { QuizBlock } from "../quiz-block";
import type { BlockContext } from "../types";
import messages from "@/messages/en.json";

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
    xpReward: 30,
    earnedXp: null,
    onEnroll: vi.fn(),
    setProof: vi.fn(),
    setQuizAnswered: vi.fn(),
    aiSuppressed: true,
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

/** The per-question Check button (question order = render order). */
function checkButton(index: number): HTMLElement {
  const button = screen.getAllByRole("button", { name: "Check answer" })[index];
  if (!button) throw new Error(`No Check button at index ${index}`);
  return button;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("QuizBlock — Check interaction (LX-C1)", () => {
  it("disables Check until an option is selected", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    expect(checkButton(0)).toBeDisabled();

    fireEvent.click(screen.getByLabelText("A private key"));
    expect(checkButton(0)).toBeEnabled();
  });

  it("wrong answer → authored per-option feedback + explanation inline", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(checkButton(0));

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
    fireEvent.click(checkButton(0));

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
    // Subset of the correct set → incorrect.
    fireEvent.click(screen.getByLabelText("XP tokens"));
    fireEvent.click(checkButton(1));
    expect(
      screen.getByText("Not quite — review your answer and try again.")
    ).toBeInTheDocument();

    // Completing the set → correct.
    fireEvent.click(screen.getByLabelText("Credentials"));
    fireEvent.click(checkButton(1));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("changing the selection retires the previous verdict", () => {
    renderWithIntl(<QuizBlock block={quizBlock} ctx={makeCtx()} />);
    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(checkButton(0));
    expect(
      screen.getByText("Not quite — review your answer and try again.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("A program-derived address"));
    expect(
      screen.queryByText("Not quite — review your answer and try again.")
    ).not.toBeInTheDocument();
  });

  it("renders feedback inside an aria-live region", () => {
    const { container } = renderWithIntl(
      <QuizBlock block={quizBlock} ctx={makeCtx()} />
    );
    const liveRegions = container.querySelectorAll('[aria-live="polite"]');
    // One always-mounted live region per question, so announcements fire when
    // the verdict appears inside it.
    expect(liveRegions).toHaveLength(2);

    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(checkButton(0));
    expect(liveRegions[0]?.textContent).toContain(
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
    fireEvent.click(checkButton(0));
    expect(ctx.setQuizAnswered).toHaveBeenLastCalledWith("q-block", false);

    fireEvent.click(screen.getByLabelText("SOL")); // wrong on purpose
    fireEvent.click(checkButton(1));
    // Checked (attempted) — feedback + explanation already revealed, so the
    // AI gate has nothing left to protect. Correctness is NOT required here;
    // the server still gates completion.
    expect(ctx.setQuizAnswered).toHaveBeenLastCalledWith("q-block", true);
  });

  it("answered stays true after a re-selection (sticky once revealed)", () => {
    const ctx = makeCtx();
    renderWithIntl(<QuizBlock block={quizBlock} ctx={ctx} />);
    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(checkButton(0));
    fireEvent.click(screen.getByLabelText("SOL"));
    fireEvent.click(checkButton(1));
    expect(ctx.setQuizAnswered).toHaveBeenLastCalledWith("q-block", true);

    // Changing an answer clears its verdict but must not re-suppress the AI.
    fireEvent.click(screen.getByLabelText("A program-derived address"));
    expect(ctx.setQuizAnswered).toHaveBeenLastCalledWith("q-block", true);
  });
});
