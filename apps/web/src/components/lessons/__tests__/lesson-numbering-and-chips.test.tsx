// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Lesson } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { courseWideOrdinals } from "@/lib/courses/lesson-ordinals";
import { CurriculumAccordion } from "@/components/course/curriculum-accordion";
import { ProseBlock } from "@/app/[locale]/(platform)/courses/[slug]/lessons/[id]/blocks/prose-block";
import type { BlockContext } from "@/app/[locale]/(platform)/courses/[slug]/lessons/[id]/blocks/types";
import { LessonJumpChips, type JumpChip } from "../lesson-jump-chips";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const MODULES = [
  {
    id: "m1",
    title: "Foundations",
    lessons: [
      { _id: "l1", title: "Intro", slug: "intro", isChallenge: false },
      { _id: "l2", title: "Accounts", slug: "accounts", isChallenge: false },
    ],
  },
  {
    id: "m2",
    title: "Going deeper",
    lessons: [
      { _id: "l3", title: "PDAs", slug: "pdas", isChallenge: false },
      { _id: "l4", title: "CPIs", slug: "cpis", isChallenge: true },
    ],
  },
];

afterEach(cleanup);

describe("courseWideOrdinals", () => {
  it("numbers across the whole course, never restarting per module", () => {
    const ordinals = courseWideOrdinals(MODULES);
    expect([...ordinals.entries()]).toEqual([
      ["l1", 1],
      ["l2", 2],
      // The old per-module numbering made this "1." again, contradicting the
      // ordinal the lesson page prints on its own h1.
      ["l3", 3],
      ["l4", 4],
    ]);
  });

  it("is empty for a course with no modules", () => {
    expect(courseWideOrdinals([]).size).toBe(0);
  });

  it("skips empty modules without consuming a number", () => {
    const ordinals = courseWideOrdinals([
      { lessons: [{ _id: "a" }] },
      { lessons: [] },
      { lessons: [{ _id: "b" }] },
    ]);
    expect(ordinals.get("b")).toBe(2);
  });
});

describe("CurriculumAccordion — course-wide numbering", () => {
  it("continues the count into the second module", () => {
    renderWithIntl(
      <CurriculumAccordion
        modules={MODULES}
        courseSlug="course"
        locale="en"
        completedLessons={[]}
      />
    );
    // Open the second module (only the first is expanded by default).
    fireEvent.click(screen.getByRole("button", { name: /Going deeper/ }));

    const pdas = screen.getByRole("link", { name: /PDAs/ });
    expect(pdas.textContent).toContain("3.");
    expect(screen.getByRole("link", { name: /CPIs/ }).textContent).toContain(
      "4."
    );
  });
});

describe("ProseBlock — numbered lesson h1", () => {
  function makeCtx(overrides: Partial<BlockContext> = {}): BlockContext {
    const lesson = {
      _id: "l2",
      title: "Accounts Are Just Bytes",
      slug: "accounts",
      blocks: [],
    } as unknown as Lesson;
    return {
      lesson,
      courseSlug: "course",
      courseId: "c1",
      locale: "en",
      isEnrolled: true,
      isCompleted: false,
      lessonNumber: 2,
      xpReward: 30,
      earnedXp: null,
      onEnroll: vi.fn(),
      setProof: vi.fn(),
      setQuizAnswered: vi.fn(),
      aiSuppressed: false,
      capstoneAiOff: false,
      buildUuid: null,
      programKeypairSecret: null,
      resetBuild: vi.fn(),
      ...overrides,
    };
  }

  function renderProse(src: string, ctx: BlockContext) {
    return renderWithIntl(
      <ProseBlock
        block={{ _type: "prose", key: "p1", src } as never}
        ctx={ctx}
      />
    );
  }

  it("prefixes the ordinal onto the heading that IS the lesson title", () => {
    renderProse("# Accounts Are Just Bytes\n\nSome prose.", makeCtx());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "2. Accounts Are Just Bytes"
    );
  });

  it("tolerates casing/whitespace drift in the authored heading", () => {
    renderProse("#   accounts are just bytes  \n\nBody.", makeCtx());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "2. Accounts Are Just Bytes"
    );
  });

  it("leaves an unrelated h1 deeper in the prose alone", () => {
    renderProse("# A totally different heading\n\nBody.", makeCtx());
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("A totally different heading");
    expect(h1.textContent).not.toContain("2.");
  });

  it("prints no number when the lesson is not in the course order", () => {
    // e.g. the teacher preview, where the lesson is not in the live bundle.
    renderProse(
      "# Accounts Are Just Bytes\n\nBody.",
      makeCtx({ lessonNumber: null })
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Accounts Are Just Bytes"
    );
  });
});

describe("LessonJumpChips", () => {
  function chips(overrides: Partial<JumpChip>[] = []): JumpChip[] {
    const base: JumpChip[] = [
      {
        kind: "topics",
        label: "Topics",
        targetId: "lesson-topics",
        onActivate: vi.fn(),
      },
      {
        kind: "discussion",
        label: "Discussion",
        count: "3",
        targetId: "lesson-discussion",
        onActivate: vi.fn(),
      },
    ];
    return base.map((c, i) => ({ ...c, ...overrides[i] }));
  }

  it("renders nothing at all when there is nothing to jump to", () => {
    const { container } = renderWithIntl(<LessonJumpChips chips={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("points each chip at its section and shows the discussion count", () => {
    renderWithIntl(<LessonJumpChips chips={chips()} />);
    expect(screen.getByRole("button", { name: /Topics/ })).toHaveAttribute(
      "aria-controls",
      "lesson-topics"
    );
    const discussion = screen.getByRole("button", { name: /Discussion/ });
    expect(discussion).toHaveAttribute("aria-controls", "lesson-discussion");
    expect(discussion).toHaveTextContent("(3)");
  });

  it("activates the section on click", () => {
    const onActivate = vi.fn();
    renderWithIntl(<LessonJumpChips chips={chips([{ onActivate }])} />);
    fireEvent.click(screen.getByRole("button", { name: /Topics/ }));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });
});
