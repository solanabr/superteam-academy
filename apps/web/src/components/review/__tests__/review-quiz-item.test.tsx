// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { QuizBlockData } from "@superteam-lms/types";
import type { ReviewSessionItem } from "@/lib/review/interleave";
import messages from "@/messages/en.json";
import { ReviewQuizItem } from "../review-quiz-item";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const quizBlock: QuizBlockData = {
  _type: "quiz",
  key: "qb",
  questions: [
    {
      id: "q1",
      prompt: "What is a PDA?",
      options: [
        { id: "a", label: "A program-derived address", correct: true },
        { id: "b", label: "A private key", correct: false },
      ],
      explanation: "Derived from seeds, off the curve.",
    },
  ],
};

const item: ReviewSessionItem = {
  itemKey: "lesson-pdas",
  box: 1,
  lessonTitle: "PDAs",
  courseSlug: "solana-core",
  lessonSlug: "pdas",
  skills: ["pdas"],
  quiz: [quizBlock],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ReviewQuizItem (LX-B5 server-authoritative grading)", () => {
  it("keeps submit disabled until every question is answered", () => {
    renderWithIntl(<ReviewQuizItem item={item} onGraded={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: messages.review.submit })
    ).toBeDisabled();
  });

  it("posts selections to /api/review/grade and renders the server verdict", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ passed: true, box: 2, dueAt: "2026-08-01" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    const onGraded = vi.fn();
    renderWithIntl(<ReviewQuizItem item={item} onGraded={onGraded} />);

    fireEvent.click(screen.getByLabelText("A program-derived address"));
    fireEvent.click(
      screen.getByRole("button", { name: messages.review.submit })
    );

    await waitFor(() =>
      expect(
        screen.getByText(messages.review.answerCorrect)
      ).toBeInTheDocument()
    );
    // Server-authoritative: the box transition came from the route, and the
    // request carried the item key + block-keyed selections.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/review/grade");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      itemKey: "lesson-pdas",
      proofs: { qb: { selections: { q1: ["a"] } } },
    });
    expect(onGraded).toHaveBeenCalledWith("lesson-pdas");
    // Explanation revealed only after submitting (retrieval, not open-book).
    expect(
      screen.getByText("Derived from seeds, off the curve.")
    ).toBeInTheDocument();
  });

  it("surfaces a retry affordance when the grade request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 })
    );
    renderWithIntl(<ReviewQuizItem item={item} onGraded={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("A private key"));
    fireEvent.click(
      screen.getByRole("button", { name: messages.review.submit })
    );
    await waitFor(() =>
      expect(screen.getByText(messages.review.gradeError)).toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: messages.review.retry })
    ).toBeInTheDocument();
  });
});
