// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { findNextIncompleteLesson } from "@/lib/courses/continue-learning";
import messages from "@/messages/en.json";
import { CurriculumPath } from "../curriculum-path";

const modules = [
  {
    id: "m1",
    title: "Foundations",
    lessons: [
      { _id: "l1", title: "Intro", slug: "intro", isChallenge: false },
      { _id: "l2", title: "Accounts", slug: "accounts", isChallenge: false },
      {
        _id: "l3",
        title: "First program",
        slug: "first-program",
        isChallenge: true,
      },
    ],
  },
  {
    id: "m2",
    title: "Going deeper",
    lessons: [
      { _id: "l4", title: "PDAs", slug: "pdas", isChallenge: false },
      { _id: "l5", title: "CPIs", slug: "cpis", isChallenge: true },
    ],
  },
];

const orderedLessons = modules.flatMap((m) => m.lessons);

function renderPath(completedLessons: string[]) {
  // Same derivation the course-detail page (and the dashboard Continue card)
  // uses — the component itself never re-derives the next lesson.
  const next = findNextIncompleteLesson(
    orderedLessons,
    new Set(completedLessons)
  );
  return renderWithIntl(
    <CurriculumPath
      modules={modules}
      courseSlug="solana-101"
      locale="en"
      completedLessons={completedLessons}
      activeLessonId={next?._id ?? null}
    />
  );
}

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("CurriculumPath — active-node selection (shared derivation)", () => {
  it("marks exactly one node as the active next step", () => {
    renderPath(["l1", "l2"]);

    const active = screen.getAllByRole("link", { current: "step" });
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAttribute(
      "href",
      "/en/courses/solana-101/lessons/first-program"
    );
    expect(screen.getAllByText("Up next")).toHaveLength(1);
  });

  it("follows findNextIncompleteLesson when the learner skips ahead: the active node is the first gap, not the furthest lesson", () => {
    // l1 done, l3 done out of order — the first incomplete lesson is l2.
    renderPath(["l1", "l3"]);

    const active = screen.getAllByRole("link", { current: "step" });
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAttribute(
      "href",
      "/en/courses/solana-101/lessons/accounts"
    );
  });

  it("with no progress, the first lesson is the active node", () => {
    renderPath([]);

    const active = screen.getAllByRole("link", { current: "step" });
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAttribute(
      "href",
      "/en/courses/solana-101/lessons/intro"
    );
  });

  it("fully complete course: no active node, no Up-next badge", () => {
    renderPath(["l1", "l2", "l3", "l4", "l5"]);

    expect(
      screen.queryByRole("link", { current: "step" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Up next")).not.toBeInTheDocument();
  });
});

describe("CurriculumPath — every lesson stays openable (no locks)", () => {
  it("renders every lesson as a plain link with its real href, whatever its state", () => {
    renderPath(["l1", "l2"]);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(orderedLessons.length);
    for (const lesson of orderedLessons) {
      const link = links.find(
        (l) =>
          l.getAttribute("href") ===
          `/en/courses/solana-101/lessons/${lesson.slug}`
      );
      expect(link).toBeDefined();
    }
  });

  it("no node is disabled, aria-disabled, unfocusable, or labeled locked", () => {
    renderPath(["l1"]);

    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-disabled");
      expect(link).not.toHaveAttribute("disabled");
      expect(link).not.toHaveAttribute("tabindex", "-1");
    }
    expect(screen.queryByText(messages.courses.locked)).not.toBeInTheDocument();
  });

  it("future (not-yet-active) lessons are real links too — skipping is allowed by construction", () => {
    // Active node is l1; l5 is deep in module 2 and still a first-class link.
    renderPath([]);

    const future = screen
      .getAllByRole("link")
      .find(
        (l) => l.getAttribute("href") === "/en/courses/solana-101/lessons/cpis"
      );
    expect(future).toBeDefined();
    expect(future).not.toHaveAttribute("aria-current");
  });
});

describe("CurriculumPath — progress map", () => {
  it("marks completed lessons for screen readers and shows per-module progress as a count", () => {
    renderPath(["l1", "l2", "l3"]);

    // Completed nodes carry an sr-only "Completed" state.
    expect(screen.getAllByText(messages.courses.completed)).toHaveLength(3);

    // Per-module progress is the x/y count in the module header — module 1 fully
    // complete, module 2 untouched. There is deliberately NO per-module progress
    // bar: the count plus the per-lesson node markers already carry that state,
    // so a third indicator for the same fact was removed as noise.
    expect(
      screen.getByText(`3/3 ${messages.courses.lessons}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`0/2 ${messages.courses.lessons}`)
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("progressbar")).toHaveLength(0);
  });

  it("renders modules and lessons with list semantics", () => {
    renderPath([]);

    const lists = screen.getAllByRole("list");
    // 1 module list + 1 lesson list per module.
    expect(lists).toHaveLength(1 + modules.length);
    expect(screen.getAllByRole("listitem")).toHaveLength(
      modules.length + orderedLessons.length
    );
  });
});
