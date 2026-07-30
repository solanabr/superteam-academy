// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock must precede importing the component. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

const { trackContinueCardShown, trackContinueCardClick } = vi.hoisted(() => ({
  trackContinueCardShown: vi.fn(),
  trackContinueCardClick: vi.fn(),
}));
vi.mock("@/lib/analytics/events", () => ({
  trackContinueCardShown,
  trackContinueCardClick,
}));

import { ContinueCard, type ContinueCardTarget } from "../continue-card";

const LESSON: ContinueCardTarget = {
  kind: "lesson",
  courseTitle: "Solana Fundamentals",
  courseSlug: "solana-fundamentals",
  lessonTitle: "Accounts",
  lessonSlug: "accounts",
  completedLessons: 2,
  totalLessons: 8,
};

function renderCard(target: ContinueCardTarget) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContinueCard target={target} locale="en" />
    </NextIntlClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

describe("Continue card events (#871)", () => {
  it("reports shown with the resolved target", () => {
    renderCard(LESSON);
    expect(trackContinueCardShown).toHaveBeenCalledTimes(1);
    expect(trackContinueCardShown).toHaveBeenCalledWith({
      kind: "lesson",
      courseSlug: "solana-fundamentals",
    });
  });

  it("omits courseSlug for the catalog target, which has no course", () => {
    renderCard({ kind: "catalog" });
    expect(trackContinueCardShown).toHaveBeenCalledWith({
      kind: "catalog",
      courseSlug: undefined,
    });
  });

  it("reports the click on the same target", () => {
    renderCard(LESSON);
    fireEvent.click(screen.getByRole("link"));
    expect(trackContinueCardClick).toHaveBeenCalledWith({
      kind: "lesson",
      courseSlug: "solana-fundamentals",
    });
  });

  // Shown is the click-through denominator; a re-render with an unchanged
  // target must not inflate it.
  it("does not re-report shown when re-rendered with the same target", () => {
    const { rerender } = renderCard(LESSON);
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ContinueCard target={LESSON} locale="en" />
      </NextIntlClientProvider>
    );
    expect(trackContinueCardShown).toHaveBeenCalledTimes(1);
  });

  it("reports again when the target changes", () => {
    const { rerender } = renderCard(LESSON);
    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ContinueCard
          target={{
            kind: "nextCourse",
            courseTitle: "Anchor",
            courseSlug: "anchor",
          }}
          locale="en"
        />
      </NextIntlClientProvider>
    );
    expect(trackContinueCardShown).toHaveBeenCalledTimes(2);
    expect(trackContinueCardShown).toHaveBeenLastCalledWith({
      kind: "nextCourse",
      courseSlug: "anchor",
    });
  });
});
