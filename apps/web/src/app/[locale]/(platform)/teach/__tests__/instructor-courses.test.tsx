// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { InstructorCourses } from "../instructor-courses";
import messages from "@/messages/en.json";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const courses = [
  { _id: "course-1", title: "Rust Fundamentals", slug: "rust-fundamentals" },
  { _id: "course-2", title: "Anchor Basics", slug: "anchor-basics" },
];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("InstructorCourses — empty state", () => {
  it("renders the empty state when there are no synced courses", () => {
    renderWithIntl(<InstructorCourses courses={[]} />);
    expect(screen.getByText(messages.teach.emptyState)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("InstructorCourses — course list", () => {
  it("renders a card per course, no empty state", () => {
    renderWithIntl(<InstructorCourses courses={courses} />);
    expect(screen.getByText("Rust Fundamentals")).toBeInTheDocument();
    expect(screen.getByText("Anchor Basics")).toBeInTheDocument();
    expect(
      screen.queryByText(messages.teach.emptyState)
    ).not.toBeInTheDocument();
  });

  it("does not fetch stats until a card is expanded", () => {
    renderWithIntl(<InstructorCourses courses={courses} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches and displays stats when a card is expanded", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        enrolledCount: 12,
        completionCount: 4,
        certificateCount: 2,
      }),
    } as Response);

    renderWithIntl(<InstructorCourses courses={courses} />);

    fireEvent.click(screen.getByRole("button", { name: /Rust Fundamentals/ }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/teacher/courses/course-1/stats"
    );

    await waitFor(() => {
      expect(screen.getByText("12")).toBeInTheDocument();
    });
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // Expanding never re-fetches the same course's stats twice.
    fireEvent.click(screen.getByRole("button", { name: /Rust Fundamentals/ }));
    fireEvent.click(screen.getByRole("button", { name: /Rust Fundamentals/ }));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("shows an error message when the stats fetch fails", async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false } as Response);

    renderWithIntl(<InstructorCourses courses={courses} />);
    fireEvent.click(screen.getByRole("button", { name: /Rust Fundamentals/ }));

    await waitFor(() => {
      expect(screen.getByText(messages.teach.statsError)).toBeInTheDocument();
    });
  });
});
