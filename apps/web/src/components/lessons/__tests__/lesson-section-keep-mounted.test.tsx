// @vitest-environment jsdom
import { useState } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { LessonSection } from "../lesson-section";

/**
 * Pins the keepMounted↔composer-draft invariant from #1042 (issue #1043).
 *
 * The lesson page's Discussion section passes `keepMounted={isComposerOpen}`:
 * children mount on first expand (not first paint — an unconditional keep made
 * useThreads fire an uncached fetch on every lesson load, #952), and the mount
 * is held across a collapse ONLY while the composer is open, so a draft
 * survives collapse/re-expand. This harness mirrors that wiring exactly —
 * controlled `open`, `keepMounted` tied to composer state, and the composer's
 * open-trigger living INSIDE the section's children (so a composer can never
 * be open behind a never-mounted section).
 */
function DiscussionHarness() {
  const [isOpen, setIsOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <LessonSection
      title="Discussion"
      open={isOpen}
      onOpenChange={setIsOpen}
      keepMounted={isComposerOpen}
    >
      {isComposerOpen ? (
        <textarea
          data-testid="composer-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <button type="button" onClick={() => setIsComposerOpen(true)}>
          Ask a question
        </button>
      )}
      <div data-testid="thread-list" />
    </LessonSection>
  );
}

const header = () => screen.getByRole("button", { name: "Discussion" });

afterEach(cleanup);

describe("LessonSection — keepMounted composer-draft invariant", () => {
  it("leaves children unmounted at rest (never expanded)", () => {
    render(<DiscussionHarness />);
    // The perf half: no thread list (and no fetch-triggering children) until
    // the learner asks for the section.
    expect(screen.queryByTestId("thread-list")).not.toBeInTheDocument();
  });

  it("mounts children on expand", () => {
    render(<DiscussionHarness />);
    fireEvent.click(header());
    expect(screen.getByTestId("thread-list")).toBeInTheDocument();
  });

  it("keeps an open composer's draft alive across collapse and re-expand", () => {
    render(<DiscussionHarness />);
    fireEvent.click(header());
    fireEvent.click(screen.getByRole("button", { name: "Ask a question" }));
    fireEvent.change(screen.getByTestId("composer-draft"), {
      target: { value: "why does my PDA derivation fail?" },
    });

    // Collapse: the panel leaves the a11y tree, but the composer must stay
    // MOUNTED — unmounting here is exactly the refactor that would destroy
    // the draft.
    fireEvent.click(header());
    expect(header()).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("composer-draft")).toBeInTheDocument();

    fireEvent.click(header());
    expect(screen.getByTestId("composer-draft")).toHaveValue(
      "why does my PDA derivation fail?"
    );
  });

  it("unmounts children on collapse when no composer is open", () => {
    render(<DiscussionHarness />);
    fireEvent.click(header());
    fireEvent.click(header());
    // No draft to protect → no reason to hold the mount (#952).
    expect(screen.queryByTestId("thread-list")).not.toBeInTheDocument();
  });
});
