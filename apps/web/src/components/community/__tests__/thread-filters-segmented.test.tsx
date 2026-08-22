// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { ThreadFilters } from "../thread-filters";

/**
 * The community sort and type filters route through the shared
 * SegmentedControl (owner, 22-08). They previously painted their own selected
 * state — a flat `--primary` fill with white text — which is one of the three
 * looks the shared control replaced.
 */

function renderFilters(
  props: Partial<Parameters<typeof ThreadFilters>[0]> = {}
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ThreadFilters
        sort="latest"
        onSortChange={vi.fn()}
        type={undefined}
        onTypeChange={vi.fn()}
        {...props}
      />
    </NextIntlClientProvider>
  );
}

describe("ThreadFilters — the shared segmented control", () => {
  it("renders sort and type as two named segment groups", () => {
    renderFilters();

    expect(
      screen.getByRole("group", { name: messages.community.sortLabel })
    ).toBeDefined();
    expect(
      screen.getByRole("group", { name: messages.community.filterLabel })
    ).toBeDefined();
  });

  it("gives the active sort the shared pressed-key treatment", () => {
    renderFilters({ sort: "top" });

    const on = screen.getByRole("button", { name: messages.community.sortTop });
    expect(on.className).toContain("pressed-key");
    expect(on).toHaveAttribute("aria-pressed", "true");

    const off = screen.getByRole("button", {
      name: messages.community.sortLatest,
    });
    expect(off.className).not.toContain("pressed-key");
  });

  it("no longer paints its own selected fill", () => {
    const { container } = renderFilters({ sort: "top" });

    // The old look was `bg-[var(--primary)] text-white` on the active segment.
    expect(container.innerHTML).not.toContain("bg-[var(--primary)]");
  });

  it("selects 'All' as a real value on the type axis", () => {
    renderFilters({ type: undefined });

    expect(
      screen.getByRole("button", { name: messages.community.filterAll })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("reports a sort change", () => {
    const onSortChange = vi.fn();
    renderFilters({ onSortChange });

    fireEvent.click(
      screen.getByRole("button", { name: messages.community.sortTop })
    );
    expect(onSortChange).toHaveBeenCalledWith("top");
  });

  it("keeps the course-questions toggle as a separate chip, not a segment", () => {
    // A course question is still a question — it is an independent axis, so it
    // must not join the type segments.
    renderFilters({
      showCourseFilter: true,
      onCourseOnlyChange: vi.fn(),
      courseOnly: true,
    });

    const chip = screen.getByRole("button", {
      name: messages.community.filterCourseQuestions,
    });
    expect(chip.className).not.toContain("seg");
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("hides the type group when the embed asks for sort only", () => {
    renderFilters({ showTypeFilter: false });

    expect(
      screen.queryByRole("group", { name: messages.community.filterLabel })
    ).toBeNull();
    expect(
      screen.getByRole("group", { name: messages.community.sortLabel })
    ).toBeDefined();
  });
});
