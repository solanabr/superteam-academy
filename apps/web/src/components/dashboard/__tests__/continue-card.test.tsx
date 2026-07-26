// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ContinueCard } from "../continue-card";
import messages from "@/messages/en.json";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("ContinueCard — lesson target", () => {
  const target = {
    kind: "lesson" as const,
    courseTitle: "Solana 101",
    courseSlug: "solana-101",
    lessonTitle: "What is a PDA?",
    lessonSlug: "what-is-a-pda",
    completedLessons: 3,
    totalLessons: 8,
  };

  it("is a single focusable link deep-linking to the next incomplete lesson", () => {
    renderWithIntl(<ContinueCard target={target} locale="en" />);
    const link = screen.getByRole("link", {
      name: "Continue Solana 101 — next lesson: What is a PDA?",
    });
    expect(link).toHaveAttribute(
      "href",
      "/en/courses/solana-101/lessons/what-is-a-pda"
    );
  });

  it("shows course · lesson and the progress count", () => {
    renderWithIntl(<ContinueCard target={target} locale="en" />);
    expect(screen.getByText("Solana 101")).toBeInTheDocument();
    expect(screen.getByText("What is a PDA?")).toBeInTheDocument();
    expect(screen.getByText("3 of 8 lessons completed")).toBeInTheDocument();
  });
});

describe("ContinueCard — all-complete targets", () => {
  it("nextCourse variant links to the recommended course detail page", () => {
    renderWithIntl(
      <ContinueCard
        target={{
          kind: "nextCourse",
          courseTitle: "Anchor Framework",
          courseSlug: "anchor-framework",
        }}
        locale="en"
      />
    );
    const link = screen.getByRole("link", {
      name: "Start your next course: Anchor Framework",
    });
    expect(link).toHaveAttribute("href", "/en/courses/anchor-framework");
    expect(screen.getByText("Anchor Framework")).toBeInTheDocument();
    expect(screen.getByText("All caught up!")).toBeInTheDocument();
  });

  it("catalog variant links to the course catalog", () => {
    renderWithIntl(<ContinueCard target={{ kind: "catalog" }} locale="en" />);
    const link = screen.getByRole("link", { name: "Browse Courses" });
    expect(link).toHaveAttribute("href", "/en/courses");
  });
});
