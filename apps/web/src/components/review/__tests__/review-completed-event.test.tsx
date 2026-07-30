// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock must precede importing the component. */
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import type { ReviewSessionItem } from "@/lib/review/interleave";

const { trackReviewCompleted } = vi.hoisted(() => ({
  trackReviewCompleted: vi.fn(),
}));
vi.mock("@/lib/analytics/events", () => ({ trackReviewCompleted }));

// Stand in for the real quiz card: exposes one button that reports the item
// graded, which is the only interaction the session's completion math reads.
vi.mock("../review-quiz-item", () => ({
  ReviewQuizItem: ({
    item,
    onGraded,
  }: {
    item: { itemKey: string };
    onGraded: (k: string) => void;
  }) => (
    <button type="button" onClick={() => onGraded(item.itemKey)}>
      grade-{item.itemKey}
    </button>
  ),
}));

import { ReviewSession } from "../review-session";

/** `quiz: []` marks a due lesson with no authored quiz — never gradable. */
function item(key: string, gradable = true): ReviewSessionItem {
  return {
    itemKey: key,
    lessonId: `lesson-${key}`,
    lessonTitle: `Lesson ${key}`,
    lessonSlug: key,
    courseSlug: "c1",
    courseTitle: "Course",
    quiz: gradable ? [{ id: `q-${key}` }] : [],
  } as unknown as ReviewSessionItem;
}

function renderSession(items: ReviewSessionItem[]): ReactElement {
  const ui = (
    <NextIntlClientProvider locale="en" messages={messages}>
      <ReviewSession items={items} />
    </NextIntlClientProvider>
  );
  render(ui);
  return ui;
}

beforeEach(() => vi.clearAllMocks());

describe("review_completed (#873)", () => {
  it("does not fire while items remain ungraded", () => {
    renderSession([item("a"), item("b")]);
    fireEvent.click(screen.getByText("grade-a"));
    expect(trackReviewCompleted).not.toHaveBeenCalled();
  });

  it("fires once every gradable item is graded", () => {
    renderSession([item("a"), item("b")]);
    fireEvent.click(screen.getByText("grade-a"));
    fireEvent.click(screen.getByText("grade-b"));
    expect(trackReviewCompleted).toHaveBeenCalledTimes(1);
    expect(trackReviewCompleted).toHaveBeenCalledWith({
      gradable: 2,
      itemsShown: 2,
    });
  });

  // The metric is inflated by any re-fire, so the latch is the point.
  it("fires only once even if a graded item reports again", () => {
    renderSession([item("a")]);
    fireEvent.click(screen.getByText("grade-a"));
    fireEvent.click(screen.getByText("grade-a"));
    expect(trackReviewCompleted).toHaveBeenCalledTimes(1);
  });

  // A due lesson with no quiz renders as a revisit link and can never be
  // graded — counting it would make the denominator unreachable.
  it("ignores non-gradable items in the denominator", () => {
    renderSession([item("a"), item("b", false)]);
    fireEvent.click(screen.getByText("grade-a"));
    expect(trackReviewCompleted).toHaveBeenCalledWith({
      gradable: 1,
      itemsShown: 2,
    });
  });

  it("never fires for a session with nothing gradable", () => {
    renderSession([item("a", false)]);
    expect(trackReviewCompleted).not.toHaveBeenCalled();
  });

  it("never fires for an empty session", () => {
    renderSession([]);
    expect(trackReviewCompleted).not.toHaveBeenCalled();
  });
});
