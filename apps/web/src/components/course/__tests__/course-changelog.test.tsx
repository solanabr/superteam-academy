// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { CourseChangelogEntry } from "@/lib/courses/changelog-types";
import messages from "@/messages/en.json";
import { CourseChangelog } from "../course-changelog";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const entries: CourseChangelogEntry[] = [
  {
    id: 3,
    kind: "lessons_added",
    version: 2,
    txSignature: "S3",
    createdAt: "2026-07-25T12:00:00Z",
    detail: { lessons: [{ slot: 2, id: "lesson-c", title: "Advanced PDAs" }] },
  },
  {
    id: 2,
    kind: "xp_changed",
    version: 1,
    txSignature: "S2",
    createdAt: "2026-07-24T12:00:00Z",
    detail: { from: 10, to: 20 },
  },
  {
    id: 1,
    kind: "deployed",
    version: 1,
    txSignature: "S1",
    createdAt: "2026-07-23T12:00:00Z",
    detail: { lessonCount: 5 },
  },
];

describe("CourseChangelog", () => {
  it("renders the section heading", () => {
    renderWithIntl(<CourseChangelog entries={entries} />);
    expect(
      screen.getByRole("heading", { name: /changelog/i })
    ).toBeInTheDocument();
  });

  it("renders a human-readable line per entry kind", () => {
    renderWithIntl(<CourseChangelog entries={entries} />);
    expect(screen.getByText("Course published")).toBeInTheDocument();
    expect(screen.getByText("1 lesson added")).toBeInTheDocument();
    expect(screen.getByText("Advanced PDAs")).toBeInTheDocument();
    expect(screen.getByText("XP reward changed")).toBeInTheDocument();
    expect(
      screen.getByText("XP per lesson changed from 10 to 20.")
    ).toBeInTheDocument();
  });

  it("stamps each entry with a version and a machine-readable date", () => {
    const { container } = renderWithIntl(<CourseChangelog entries={entries} />);
    expect(screen.getAllByText("v1").length).toBeGreaterThan(0);
    expect(screen.getByText("v2")).toBeInTheDocument();
    const times = container.querySelectorAll("time[datetime]");
    expect(times.length).toBe(entries.length);
  });

  it("falls back to the slot number when a lesson has no title snapshot", () => {
    renderWithIntl(
      <CourseChangelog
        entries={[
          {
            id: 9,
            kind: "lessons_removed",
            version: 4,
            txSignature: "S9",
            createdAt: "2026-07-26T12:00:00Z",
            detail: { lessons: [{ slot: 7, id: null, title: null }] },
          },
        ]}
      />
    );
    expect(screen.getByText("Lesson slot 7")).toBeInTheDocument();
  });

  it("renders an empty state when there are no entries", () => {
    renderWithIntl(<CourseChangelog entries={[]} />);
    expect(screen.getByText(/No changes recorded yet/i)).toBeInTheDocument();
  });

  it("flags entries newer than the learner's enrollment", () => {
    // Enrolled on the 24th → only the 25th 'lessons_added' entry is new.
    renderWithIntl(
      <CourseChangelog entries={entries} enrolledAt="2026-07-24T18:00:00Z" />
    );
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("1 update since you enrolled")).toBeInTheDocument();
  });

  it("shows no since-enrolled badge for a signed-out visitor", () => {
    renderWithIntl(<CourseChangelog entries={entries} enrolledAt={null} />);
    expect(screen.queryByText(/since you enrolled/i)).not.toBeInTheDocument();
    expect(screen.queryByText("New")).not.toBeInTheDocument();
  });
});
