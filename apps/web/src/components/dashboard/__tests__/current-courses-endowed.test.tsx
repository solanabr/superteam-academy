// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { CurrentCourse } from "@/lib/dashboard/types";
import messages from "@/messages/en.json";

// The section pulls in the wallet-adapter + on-chain unenroll flow, none of
// which the endowed-progress presentation depends on. Stub them so the test
// can render the card grid in isolation.
vi.mock("@solana/wallet-adapter-react", () => ({
  useConnection: () => ({ connection: {} }),
  useWallet: () => ({ publicKey: null, sendTransaction: vi.fn() }),
}));
vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: vi.fn() }),
}));
vi.mock("@/components/certificates/course-completion-mint", () => ({
  CourseCompletionMint: () => null,
}));

import { CurrentCoursesSection } from "../current-courses-section";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const baseCourse: Omit<CurrentCourse, "courseId" | "title" | "slug"> = {
  completedLessons: 0,
  totalLessons: 8,
  difficulty: "beginner",
  learningPath: null,
  thumbnail: null,
};

describe("CurrentCoursesSection — endowed progress (LX-B12)", () => {
  it("shows the stated reason for the enrollment first tick without claiming a lesson", () => {
    renderWithIntl(
      <CurrentCoursesSection
        currentCourses={[
          {
            ...baseCourse,
            courseId: "course-solana-101",
            title: "Solana 101",
            slug: "solana-101",
            completedLessons: 0,
          },
        ]}
        userId="user-1"
      />
    );

    // The pre-credited tick carries its stated reason.
    expect(
      screen.getByText(messages.dashboard.endowedProgress.enrolledFirstStep)
    ).toBeInTheDocument();

    // The honest count is still 0 of 8 — the tick never inflates it.
    const bar = screen.getByRole("progressbar", {
      name: "0 of 8 lessons completed",
    });
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "8");
  });

  it("renders a non-zero fill after enrollment (bar is not empty at 0%)", () => {
    const { container } = renderWithIntl(
      <CurrentCoursesSection
        currentCourses={[
          {
            ...baseCourse,
            courseId: "course-solana-101",
            title: "Solana 101",
            slug: "solana-101",
            completedLessons: 0,
          },
        ]}
        userId="user-1"
      />
    );

    // Zero completions, but the endowed tick still lights exactly one cell —
    // an all-dark strip would drop the head-start the ring used to show.
    expect(container.querySelectorAll(".seg-cell")).toHaveLength(8);
    expect(container.querySelectorAll(".seg-cell--on")).toHaveLength(1);
  });

  it("surfaces the near-goal nudge and intensifies the ring near completion", () => {
    const { container } = renderWithIntl(
      <CurrentCoursesSection
        currentCourses={[
          {
            ...baseCourse,
            courseId: "course-solana-101",
            title: "Solana 101",
            slug: "solana-101",
            completedLessons: 6,
            totalLessons: 8,
          },
        ]}
        userId="user-1"
      />
    );

    expect(
      screen.getByText(messages.dashboard.endowedProgress.nearGoal)
    ).toBeInTheDocument();
    expect(container.querySelector(".cc-card--near-goal")).not.toBeNull();
    // 6 of 8 lit — the strip never runs ahead of the honest count.
    expect(container.querySelectorAll(".seg-cell--on")).toHaveLength(6);
    // No enrollment reason once lessons are earned.
    expect(
      screen.queryByText(messages.dashboard.endowedProgress.enrolledFirstStep)
    ).toBeNull();
  });

  it("shows no endowed reason mid-course before near-goal", () => {
    renderWithIntl(
      <CurrentCoursesSection
        currentCourses={[
          {
            ...baseCourse,
            courseId: "course-solana-101",
            title: "Solana 101",
            slug: "solana-101",
            completedLessons: 2,
            totalLessons: 8,
          },
        ]}
        userId="user-1"
      />
    );

    const grid = screen.getByText("Solana 101").closest(".cc-card")!;
    expect(
      within(grid as HTMLElement).queryByText(
        messages.dashboard.endowedProgress.enrolledFirstStep
      )
    ).toBeNull();
    expect(
      within(grid as HTMLElement).queryByText(
        messages.dashboard.endowedProgress.nearGoal
      )
    ).toBeNull();
  });
});

// Owner, 22-08: the empty state lost its "Browse Courses" CTA — the dashed chip
// and the copy carry it alone. (The i18n key stays: continue-card and
// review-session are still consumers.)
describe("CurrentCoursesSection — empty state", () => {
  function renderEmpty() {
    return renderWithIntl(
      <CurrentCoursesSection currentCourses={[]} userId="user-1" />
    );
  }

  it("shows the dashed chip and the copy", () => {
    const { container } = renderEmpty();

    expect(screen.getByText(messages.dashboard.noCourses)).toBeInTheDocument();
    const chip = container.querySelector(".cc-empty .chip");
    expect(chip).not.toBeNull();
    expect(chip!.hasAttribute("data-empty")).toBe(true);
  });

  it("renders NO call to action", () => {
    renderEmpty();

    expect(
      screen.queryByRole("link", { name: messages.dashboard.browseCourses })
    ).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
