// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import { AiPartnerPane } from "../ai-partner-pane";

vi.mock("@/lib/ai/use-ai-partner", () => ({
  useAiPartner: () => ({
    messages: [],
    freeHintsUsed: 0,
    paidUsed: 0,
    budgetExhausted: false,
    spendCapped: false,
    loading: false,
    error: null,
    requestHint: vi.fn(),
    review: vi.fn(),
    verifyCheck: vi.fn(),
  }),
}));

const HINT = en.aiPartner.lock.tooltip;

function renderLocked() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <AiPartnerPane
        lessonSlug="l1"
        courseSlug="c1"
        hints={[]}
        getCode={() => ""}
        getTestSummary={() => ""}
        onApply={() => {}}
        // Far enough out that the countdown is still running mid-test.
        unlockAt={Date.now() + 3 * 60 * 1000}
      />
    </NextIntlClientProvider>
  );
}

/** The countdown badge — the only button whose label carries the lock reason. */
function badge(): HTMLElement {
  return screen.getByRole("button", { name: new RegExp(HINT.slice(0, 24)) });
}

beforeEach(() => vi.useRealTimers());

describe("AI lock hint (#842)", () => {
  it("is hidden until the learner asks for it", () => {
    renderLocked();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("reveals on hover and hides again on leave", () => {
    renderLocked();
    fireEvent.mouseEnter(badge());
    expect(screen.getByRole("note")).toHaveTextContent(HINT);
    fireEvent.mouseLeave(badge());
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  // The actual bug: a native `title` is dismissed on click, so clicking the
  // badge could never show the reason. A pinned hint survives the pointer.
  it("stays visible after a click, even once the pointer leaves", () => {
    renderLocked();
    fireEvent.click(badge());
    fireEvent.mouseLeave(badge());
    expect(screen.getByRole("note")).toHaveTextContent(HINT);
  });

  it("clicking again unpins it", () => {
    renderLocked();
    fireEvent.click(badge());
    fireEvent.click(badge());
    fireEvent.mouseLeave(badge());
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("Escape dismisses a pinned hint", () => {
    renderLocked();
    fireEvent.click(badge());
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.mouseLeave(badge());
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("reveals on keyboard focus", () => {
    renderLocked();
    fireEvent.focus(badge());
    expect(screen.getByRole("note")).toHaveTextContent(HINT);
  });

  // Regression guard for the first fix (#842): the badge must not be nested in
  // the collapse control, or interacting with it would toggle the pane.
  it("the badge is not inside the collapse toggle", () => {
    renderLocked();
    const toggle = screen.getByRole("button", { expanded: true });
    expect(toggle.contains(badge())).toBe(false);
  });

  // The third bug: an in-flow hint grew the pane, which pushed the chip out
  // from under the cursor, which fired mouseleave and closed the hint. It must
  // take no layout space in the pane at all.
  it("renders outside the pane, so showing it cannot move the chip", () => {
    const { container } = renderLocked();
    fireEvent.mouseEnter(badge());

    const note = screen.getByRole("note");
    expect(container.contains(note)).toBe(false);
    // Tailwind's `fixed`; jsdom loads no CSS, so assert the class, not the
    // computed style.
    expect(note).toHaveClass("fixed");
  });

  // A bubble under the pointer would trade one hover loop for another.
  it("is inert to the pointer", () => {
    renderLocked();
    fireEvent.mouseEnter(badge());
    expect(screen.getByRole("note")).toHaveClass("pointer-events-none");
  });
});
