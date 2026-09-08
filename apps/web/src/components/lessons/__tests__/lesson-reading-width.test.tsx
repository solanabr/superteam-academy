// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Lesson } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { ProseBlock } from "@/app/[locale]/(platform)/courses/[slug]/lessons/[id]/blocks/prose-block";
import type { BlockContext } from "@/app/[locale]/(platform)/courses/[slug]/lessons/[id]/blocks/types";

/**
 * A reading lesson used to sit in a 768px band centred inside the page column
 * the course page fills, so the same course looked narrower once you opened a
 * lesson. Two caps stacked to produce it: the lesson shell's `max-w-3xl` and
 * this block's own.
 *
 * The rule now is that the PARENT owns the width — the page column on a
 * reading lesson, the instructions rail inside a challenge. That makes this
 * block's contract "carry no cap of my own", which is what these pin: a cap
 * here would silently re-narrow the reading column, and the typography
 * plugin's own 65ch default would narrow it further still if `max-w-none`
 * were ever dropped.
 *
 * jsdom has no layout engine, so the widths themselves are measured in a real
 * browser (see the PR); what is checkable here is the class contract that
 * produces them.
 */

const lesson = {
  _id: "lesson-x",
  title: "Hash everything",
  slug: "hash-everything",
  blocks: [],
} as unknown as Lesson;

function ctx(): BlockContext {
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
    setBlockDone: vi.fn(),
    aiSuppressed: false,
    capstoneAiOff: false,
    buildUuid: null,
    programKeypairSecret: null,
    resetBuild: vi.fn(),
  } as unknown as BlockContext;
}

function renderProse() {
  const { container } = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ProseBlock
        block={{ _type: "prose", key: "p1", src: "Body copy." } as never}
        ctx={ctx()}
      />
    </NextIntlClientProvider>
  );
  return container.querySelector(".prose") as HTMLElement;
}

afterEach(cleanup);

describe("prose blocks take their width from the parent", () => {
  it("cancels the typography plugin's 65ch default instead of replacing it with another cap", () => {
    expect(renderProse().className).toContain("max-w-none");
  });

  it("carries no width cap of its own", () => {
    const classes = renderProse().className.split(/\s+/);
    // `max-w-none` is the cancellation, not a cap; anything else here would
    // re-narrow a reading lesson or over-narrow a challenge's rail.
    expect(
      classes.filter((c) => c.startsWith("max-w-") && c !== "max-w-none")
    ).toEqual([]);
  });
});
