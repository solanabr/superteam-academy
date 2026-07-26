// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { RecommendedCourse } from "@/lib/content/queries";
import type { ActivityItem } from "@/hooks/use-dashboard-data";
import messages from "@/messages/en.json";
import { ActivitySection } from "../activity-section";
import { RecommendedCoursesSection } from "../recommended-courses-section";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("ActivitySection", () => {
  const items: ActivityItem[] = [
    {
      type: "lesson",
      action: "Completed lesson: What is a PDA?",
      xp: 25,
      time: new Date().toISOString(),
      href: "/courses/solana-101/lessons/what-is-a-pda",
      txSignature: "5igNaTure",
    },
    {
      type: "enrollment",
      action: "Enrolled in Solana 101",
      xp: 0,
      time: new Date().toISOString(),
      href: "/courses/solana-101",
      txSignature: null,
    },
  ];

  it("renders the feed with XP badge and an explorer link for on-chain items", () => {
    renderWithIntl(<ActivitySection recentActivity={items} />);
    expect(
      screen.getByText("Completed lesson: What is a PDA?")
    ).toBeInTheDocument();
    expect(screen.getByText("+25 XP")).toBeInTheDocument();
    const explorerLink = screen
      .getByText("Completed lesson: What is a PDA?")
      .closest("a");
    expect(explorerLink).toHaveAttribute(
      "href",
      "https://explorer.solana.com/tx/5igNaTure?cluster=devnet"
    );
    // Items without a tx signature render as plain rows, not links
    expect(screen.getByText("Enrolled in Solana 101").closest("a")).toBeNull();
  });

  it("hides the pager when everything fits on one page", () => {
    renderWithIntl(<ActivitySection recentActivity={items} />);
    expect(screen.queryByLabelText("Previous")).toBeNull();
    expect(screen.queryByLabelText("Next")).toBeNull();
  });

  it("renders the empty state when there is no activity", () => {
    renderWithIntl(<ActivitySection recentActivity={[]} />);
    expect(screen.getByText("No recent activity")).toBeInTheDocument();
  });
});

describe("RecommendedCoursesSection", () => {
  const course: RecommendedCourse = {
    _id: "course-anchor-framework",
    title: "Anchor Framework",
    slug: "anchor-framework",
    description: "Build Solana programs with Anchor.",
    difficulty: "intermediate",
    duration: 300,
    thumbnail: null,
    creator: null,
    tags: null,
    xpReward: 1000,
    totalLessons: 12,
    learningPath: null,
  };

  it("renders a course card linking to the course detail page", () => {
    renderWithIntl(<RecommendedCoursesSection recommendedCourses={[course]} />);
    const link = screen.getByRole("link", { name: "Anchor Framework" });
    expect(link).toHaveAttribute("href", "/en/courses/anchor-framework");
  });

  it("renders the empty state when there is nothing to recommend", () => {
    renderWithIntl(<RecommendedCoursesSection recommendedCourses={[]} />);
    expect(screen.getByText(messages.dashboard.noCourses)).toBeInTheDocument();
  });
});
