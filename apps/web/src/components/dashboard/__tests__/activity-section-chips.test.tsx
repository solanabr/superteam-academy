// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import type { ActivityItem } from "@/lib/dashboard/types";
import { ActivitySection, activityChip } from "../activity-section";

// Glyph pass 21-08, third and final shape: the feed's bordered Phosphor icon
// boxes become the SAME 24px GlyphChip the quest rows use, and the rows become
// the dashboard's row-card system instead of a zebra table. Two earlier passes
// (bare gutter marks, then tint-washed tiles) were rejected as treatments
// invented for this one card. Colour therefore comes from the standard
// `data-cat` fills only — no bespoke tints survive.

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

describe("activityChip", () => {
  it("maps each activity type to its glyph and a STANDARD patch category", () => {
    expect(activityChip("lesson")).toEqual({ glyph: "+", cat: "course" });
    expect(activityChip("challenge")).toEqual({ glyph: "</>", cat: "craft" });
    expect(activityChip("course_complete")).toEqual({
      glyph: "★",
      cat: "course",
    });
    expect(activityChip("achievement")).toEqual({ glyph: "◎", cat: "reward" });
    // Certificate was a bespoke purple; `onchain` is the nearest standard fill
    // and is literally what a credential is.
    expect(activityChip("certificate")).toEqual({ glyph: "⬡", cat: "onchain" });
    expect(activityChip("enrollment")).toEqual({ glyph: "▸", cat: "start" });
    // Community was a bespoke sky blue; it takes the community fill instead.
    expect(activityChip("community")).toEqual({ glyph: "◍", cat: "community" });
    expect(activityChip("xp_other")).toEqual({ glyph: "⚡", cat: "community" });
  });

  it("falls back to the generic XP chip for an unknown type", () => {
    expect(activityChip("something_new")).toEqual({
      glyph: "⚡",
      cat: "community",
    });
  });

  it("uses only categories the patch/chip fills actually define", () => {
    const defined = new Set([
      "reward",
      "start",
      "course",
      "craft",
      "community",
      "endurance",
      "onchain",
    ]);
    const types = [
      "lesson",
      "challenge",
      "course_complete",
      "achievement",
      "certificate",
      "enrollment",
      "community",
      "xp_other",
    ];
    for (const type of types) {
      expect(defined.has(activityChip(type).cat)).toBe(true);
    }
  });
});

describe("ActivitySection rows", () => {
  it("renders one decorative 24px chip per row, categorised by type", () => {
    const { container } = renderFeed([
      item({ type: "achievement", action: "Unlocked First Steps" }),
      item({ type: "certificate", action: "Minted a credential" }),
    ]);

    const chips = container.querySelectorAll(".act-row .chip");
    expect(chips).toHaveLength(2);
    expect(chips[0]!.getAttribute("data-cat")).toBe("reward");
    expect(chips[0]!.getAttribute("data-size")).toBe("24");
    expect(chips[0]!.getAttribute("aria-hidden")).toBe("true");
    expect(
      chips[0]!.querySelector("[data-glyph]")!.getAttribute("data-glyph")
    ).toBe("◎");
    expect(chips[1]!.getAttribute("data-cat")).toBe("onchain");
  });

  it("renders the same chip object the quest rows use — no card-local icon", () => {
    const { container } = renderFeed([item({ type: "lesson" })]);

    expect(container.querySelector(".act-icon")).toBeNull();
    expect(container.querySelector(".tile")).toBeNull();
    expect(container.querySelector(".mark")).toBeNull();
    expect(container.querySelector(".chip")).not.toBeNull();
  });

  it("keeps the row's columns: title, XP pill, timestamp", () => {
    const { container, getByText } = renderFeed([
      item({ type: "certificate", action: "Minted a credential", xp: 40 }),
    ]);

    expect(getByText("Minted a credential")).toBeDefined();
    expect(container.querySelector(".act-xp")!.textContent).toBe("+40 XP");
    expect(container.querySelector(".act-time")).not.toBeNull();
  });

  it("links a row with a tx signature out to the explorer", () => {
    const { container } = renderFeed([
      item({ type: "certificate", txSignature: "abc123" }),
    ]);

    const row = container.querySelector("a.act-row");
    expect(row).not.toBeNull();
    expect(row!.getAttribute("href")).toContain("abc123");
    expect(container.querySelector(".act-tx")).not.toBeNull();
  });
});
