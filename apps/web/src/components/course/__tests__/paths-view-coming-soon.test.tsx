// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { LearningPath } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { PathsView } from "../paths-view";

/**
 * #998 — the Paths tab is held behind an owner-controlled switch until there
 * are enough paths to be worth browsing. These pin the HOLD, not the eventual
 * path rendering: while `PATHS_COMING_SOON` is true the tab must show the
 * Coming soon state and no path content, even though real paths exist behind
 * it.
 */

const PATH_WITH_COURSES = {
  _id: "path-first-steps",
  title: "First Steps",
  description: "Your first steps onchain.",
  slug: "first-steps",
  difficulty: "beginner",
  courses: [
    { _id: "c1", title: "From Bitcoin to Solana", slug: "btc-to-sol" },
    { _id: "c2", title: "Solana Speedrun", slug: "solana-speedrun" },
  ],
} as unknown as LearningPath;

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("PathsView — Coming soon hold (#998)", () => {
  it("shows the Coming soon state even when a populated path exists", () => {
    renderWithIntl(
      <PathsView learningPaths={[PATH_WITH_COURSES]} progress={new Map()} />
    );

    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(
      screen.getByText(messages.courses.pathsComingSoonTitle)
    ).toBeInTheDocument();
  });

  it("renders NO path content behind the hold", () => {
    renderWithIntl(
      <PathsView learningPaths={[PATH_WITH_COURSES]} progress={new Map()} />
    );

    // The whole point of the chosen option: the single existing path is hidden
    // rather than shown as a one-item list.
    expect(screen.queryByText("First Steps")).not.toBeInTheDocument();
    expect(
      screen.queryByText("From Bitcoin to Solana")
    ).not.toBeInTheDocument();
  });

  it("points learners at the All Courses tab so the catalogue stays reachable", () => {
    renderWithIntl(
      <PathsView learningPaths={[PATH_WITH_COURSES]} progress={new Map()} />
    );

    // Hiding paths must not read as "there is nothing here" — both courses are
    // still browsable, and the copy has to say where.
    expect(screen.getByText(/All Courses tab/i)).toBeInTheDocument();
  });

  it("holds even with no paths at all, rather than falling through to the empty state", () => {
    renderWithIntl(<PathsView learningPaths={[]} progress={new Map()} />);

    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(
      screen.queryByText(messages.courses.noCourses)
    ).not.toBeInTheDocument();
  });
});
