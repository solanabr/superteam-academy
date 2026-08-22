// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, buttonVariants } from "../button";

/**
 * The ink Button. The primitive takes the CONSTRUCTION of the chips and
 * patches — ink outline, hard offset shadow, pressed-key active state — while
 * primary keeps the app's existing colour voice (`--primary` fill, white
 * label). That is owner option B, 22-08, superseding the earlier option A
 * which also swapped primary's fill to the chip green.
 *
 * These pin the CONSTRUCTION, not the pixel values — the values live in
 * `.btn-ink*` in globals.css and share the ink palette with the chips so the
 * two cannot drift.
 */

const FILLED_PRIMARY = ["primary", "push", "pushSuccess", "default"] as const;
const OUTLINED = ["secondary", "outline", "pushOutline"] as const;

describe("Button — the ink construction", () => {
  it.each(FILLED_PRIMARY)("%s is the primary ink button", (variant) => {
    const cls = buttonVariants({ variant });

    expect(cls).toContain("btn-ink");
    expect(cls).toContain("btn-ink--primary");
    // Option B: the fill and label stay the app's own, so no chip-green or
    // ink-text utility should appear on this variant.
    expect(cls).not.toContain("bg-xp");
    expect(cls).not.toContain("ink-green");
  });

  it.each(OUTLINED)("%s is the outlined ink plate", (variant) => {
    const cls = buttonVariants({ variant });

    expect(cls).toContain("btn-ink");
    expect(cls).toContain("btn-ink--secondary");
  });

  it("destructive is the orange ink button and keeps the danger focus ring", () => {
    const cls = buttonVariants({ variant: "destructive" });

    expect(cls).toContain("btn-ink--danger");
    expect(cls).toContain("focus-visible:outline-danger");
  });

  it("accent keeps the XP fill on the ink construction", () => {
    const cls = buttonVariants({ variant: "accent" });

    expect(cls).toContain("btn-ink");
    expect(cls).toContain("bg-xp");
  });

  it.each(["ghost", "link"] as const)(
    "%s stays quiet — no ink construction, no press",
    (variant) => {
      const cls = buttonVariants({ variant });

      expect(cls).not.toContain("btn-ink");
      expect(cls).toContain("shadow-none");
      expect(cls).toContain("active:translate-y-0");
    }
  );

  it("small buttons take the shallower shadow step", () => {
    expect(buttonVariants({ variant: "primary", size: "sm" })).toContain(
      "btn-ink--sm"
    );
    expect(
      buttonVariants({ variant: "primary", size: "default" })
    ).not.toContain("btn-ink--sm");
  });

  it("every variant keeps a focus-visible ring", () => {
    const variants = [
      ...FILLED_PRIMARY,
      ...OUTLINED,
      "accent",
      "ghost",
      "link",
      "destructive",
      "destructiveOutline",
      "pushAccent",
    ] as const;

    for (const variant of variants) {
      expect(buttonVariants({ variant })).toMatch(/focus-visible:outline-/);
    }
  });
});

describe("Button — theme-invariant ink on the filled variants", () => {
  /**
   * The mock's dark-strip rule: a filled button's fill is a theme-invariant
   * literal, so its ink is too — primary and danger keep the dark glyph ink on
   * BOTH grounds. Only the outlined variant's ink follows the theme, and it
   * does that through `--ink-line` inside `.btn-ink--secondary`.
   *
   * Pinned at the class level because jsdom applies no stylesheet: what this
   * can prove is that the filled variants never opt into the flipping variant
   * class, which is the only way their ink could flip.
   */
  it.each([...FILLED_PRIMARY, "destructive"] as const)(
    "%s never carries the flipping-ink variant",
    (variant) => {
      expect(buttonVariants({ variant })).not.toContain("btn-ink--secondary");
    }
  );

  it("the outlined variant is the one that opts into flipping ink", () => {
    expect(buttonVariants({ variant: "secondary" })).toContain(
      "btn-ink--secondary"
    );
  });
});

describe("Button — the API is unchanged", () => {
  it("still renders a button element with its children and handlers", () => {
    render(<Button>Save plan</Button>);
    expect(
      screen.getByRole("button", { name: "Save plan" })
    ).toBeInTheDocument();
  });

  it("still supports asChild", () => {
    render(
      <Button asChild>
        {/* An external href: a route path here trips the lint rule that wants
            next/link, and what this asserts is class forwarding, not routing. */}
        <a href="https://example.com/browse">Browse</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: "Browse" });
    expect(link).toHaveAttribute("href", "https://example.com/browse");
    expect(link.className).toContain("btn-ink--primary");
  });

  it("still merges a caller's className", () => {
    render(<Button className="w-full">Wide</Button>);
    expect(screen.getByRole("button").className).toContain("w-full");
  });

  it("defaults to primary", () => {
    render(<Button>Default</Button>);
    expect(screen.getByRole("button").className).toContain("btn-ink--primary");
  });
});
