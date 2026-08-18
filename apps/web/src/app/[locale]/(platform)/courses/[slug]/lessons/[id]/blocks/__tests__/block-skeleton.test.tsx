// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { BlockSkeleton, ChallengeSkeleton } from "../block-skeleton";

afterEach(cleanup);

describe("ChallengeSkeleton", () => {
  it("renders the challenge anatomy: rail, toolbar, editor, output", () => {
    const { getByTestId } = render(<ChallengeSkeleton />);

    const root = getByTestId("challenge-skeleton");
    // Decorative — hidden from assistive tech, like BlockSkeleton.
    expect(root.getAttribute("aria-hidden")).toBe("true");

    // Left card: prose rail (chips + lines).
    expect(getByTestId("challenge-skeleton-rail")).toBeTruthy();
    // Right card regions, in DOM order: toolbar above editor above output.
    const toolbar = getByTestId("challenge-skeleton-toolbar");
    const editor = getByTestId("challenge-skeleton-editor");
    const output = getByTestId("challenge-skeleton-output");
    expect(
      toolbar.compareDocumentPosition(editor) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      editor.compareDocumentPosition(output) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("reserves the output panel's mounted height (120px default)", () => {
    const { getByTestId } = render(<ChallengeSkeleton />);
    expect(getByTestId("challenge-skeleton-output").style.height).toBe("120px");
  });

  it("renders three disclosure-row placeholders (Topics/Hints/Discussion)", () => {
    const { getByTestId } = render(<ChallengeSkeleton />);
    const root = getByTestId("challenge-skeleton");
    const rows = root.querySelectorAll(".border-t.border-border.py-3");
    expect(rows.length).toBe(3);
  });
});

describe("BlockSkeleton", () => {
  it("reserves the requested height and stays decorative", () => {
    const { container } = render(<BlockSkeleton height="20rem" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.height).toBe("20rem");
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });
});
