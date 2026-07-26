// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { QuizBlockData } from "@superteam-lms/types";
import type { ReviewSessionItem } from "@/lib/review/interleave";
import messages from "@/messages/en.json";
import { ReviewSession } from "../review-session";

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
    },
  ],
};

function quizItem(itemKey: string): ReviewSessionItem {
  return {
    itemKey,
    box: 1,
    lessonTitle: `Lesson ${itemKey}`,
    courseSlug: "solana-core",
    lessonSlug: itemKey,
    skills: ["pdas"],
    quiz: [quizBlock],
  };
}

function linkItem(itemKey: string): ReviewSessionItem {
  return { ...quizItem(itemKey), quiz: [] };
}

describe("ReviewSession (LX-B5 page states)", () => {
  it("renders the honest all-caught-up empty state with a catalog link", () => {
    renderWithIntl(<ReviewSession items={[]} />);
    expect(screen.getByText(messages.review.emptyTitle)).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: messages.review.browseCourses,
    });
    expect(link).toHaveAttribute("href", "/en/courses");
  });

  it("renders a gradable quiz card and shows session progress", () => {
    renderWithIntl(<ReviewSession items={[quizItem("l1"), quizItem("l2")]} />);
    expect(screen.getAllByText("What is a PDA?")).toHaveLength(2);
    // "0 of 2 reviewed"
    expect(screen.getByText("0 of 2 reviewed")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: messages.review.submit })
    ).toHaveLength(2);
  });

  it("renders a revisit link (never a Monaco editor) for a quiz-less item", () => {
    renderWithIntl(<ReviewSession items={[linkItem("l3")]} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/en/courses/solana-core/lessons/l3");
    expect(screen.getByText(messages.review.revisitHint)).toBeInTheDocument();
    // No progress line when nothing in the session is gradable.
    expect(screen.queryByText(/reviewed/)).not.toBeInTheDocument();
  });
});
