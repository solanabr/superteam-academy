// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminDisclosure } from "../admin-disclosure";

describe("AdminDisclosure", () => {
  it("is collapsed by default: children unmounted, aria-expanded false", () => {
    render(
      <AdminDisclosure summary="More">
        <p>revealed body</p>
      </AdminDisclosure>
    );
    const trigger = screen.getByRole("button", { name: "More" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("revealed body")).not.toBeInTheDocument();
  });

  it("toggles aria-expanded and reveals/hides the children on click", () => {
    render(
      <AdminDisclosure summary="More">
        <p>revealed body</p>
      </AdminDisclosure>
    );
    const trigger = screen.getByRole("button", { name: "More" });

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("revealed body")).toBeInTheDocument();
    // The trigger controls the revealed region.
    expect(trigger).toHaveAttribute("aria-controls");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("revealed body")).not.toBeInTheDocument();
  });

  it("honours defaultOpen and wraps the trigger in the requested heading level", () => {
    render(
      <AdminDisclosure summary="Legend" defaultOpen headingLevel={3}>
        <p>revealed body</p>
      </AdminDisclosure>
    );
    const trigger = screen.getByRole("button", { name: "Legend" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("revealed body")).toBeInTheDocument();
    // ARIA accordion pattern: <h3><button>…</button></h3>.
    expect(screen.getByRole("heading", { level: 3 })).toContainElement(trigger);
  });
});
