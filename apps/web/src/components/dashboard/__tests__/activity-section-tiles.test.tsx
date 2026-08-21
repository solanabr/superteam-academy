// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import type { ActivityItem } from "@/lib/dashboard/types";
import { ActivitySection, activityMark } from "../activity-section";

// Glyph pass 21-08: the feed's bordered Phosphor icon boxes became the TILE
// tier — the same 24px footprint, but a flat tint wash (no border, no shadow)
// holding a mono glyph. This landed as a bare gutter mark first; the owner
// found it read sparse at real density, so the tier kept the lightest possible
// container. A fixed-size container is also what fixes the "first row looks
// smaller" report: every row's text now starts at the same x.

function item(overrides: Partial<ActivityItem>): ActivityItem {
  return {
    type: "lesson",
    action: "Completed a lesson",
    time: new Date().toISOString(),
    xp: 25,
    ...overrides,
  } as ActivityItem;
}

function renderFeed(items: ActivityItem[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ActivitySection recentActivity={items} />
    </NextIntlClientProvider>
  );
}

describe("activityMark", () => {
  it("maps each activity type to its owner-approved glyph and tint", () => {
    expect(activityMark("lesson")).toEqual({ glyph: "+", tint: "primary" });
    expect(activityMark("challenge")).toEqual({
      glyph: "</>",
      tint: "primary",
    });
    expect(activityMark("course_complete")).toEqual({
      glyph: "★",
      tint: "primary",
    });
    expect(activityMark("achievement")).toEqual({ glyph: "◎", tint: "gold" });
    expect(activityMark("certificate")).toEqual({
      glyph: "⬡",
      tint: "purple",
    });
    expect(activityMark("enrollment")).toEqual({ glyph: "▸", tint: "primary" });
    expect(activityMark("community")).toEqual({ glyph: "◍", tint: "sky" });
    expect(activityMark("xp_other")).toEqual({ glyph: "⚡", tint: "streak" });
  });

  it("falls back to the generic XP mark for an unknown type", () => {
    expect(activityMark("something_new")).toEqual({
      glyph: "⚡",
      tint: "streak",
    });
  });
});

describe("ActivitySection tiles", () => {
  it("renders one decorative tile per row, tinted by type", () => {
    const { container } = renderFeed([
      item({ type: "achievement", action: "Unlocked First Steps" }),
      item({ type: "community", action: "Answered a thread" }),
    ]);

    const tiles = container.querySelectorAll(".tile");
    expect(tiles).toHaveLength(2);
    expect(tiles[0]!.getAttribute("data-tint")).toBe("gold");
    expect(tiles[0]!.getAttribute("aria-hidden")).toBe("true");
    expect(
      tiles[0]!.querySelector("[data-glyph]")!.getAttribute("data-glyph")
    ).toBe("◎");
    expect(tiles[1]!.getAttribute("data-tint")).toBe("sky");
  });

  it("no longer renders the bordered Phosphor icon box", () => {
    const { container } = renderFeed([item({ type: "lesson" })]);
    expect(container.querySelector(".act-icon")).toBeNull();
  });

  it("keeps the row's text as the only readable content", () => {
    const { getByText } = renderFeed([
      item({ type: "certificate", action: "Minted a credential" }),
    ]);
    expect(getByText("Minted a credential")).toBeDefined();
  });
});
