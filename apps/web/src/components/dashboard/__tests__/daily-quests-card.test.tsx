// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { DailyQuest } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { DailyQuestsCard, questGlyph } from "../daily-quests-card";

// #572 (LX-B7): quest cards become per-type deep-links (now rendered by the
// standalone DailyQuestsCard rail card). The review quest deep-
// links into /review (locale-prefixed); quest kinds with no destination surface
// keep rendering as plain, non-interactive cards (the prior behavior).

function quest(overrides: Partial<DailyQuest>): DailyQuest {
  return {
    id: "q",
    type: "lesson",
    name: "Quest",
    description: "Do the thing",
    icon: "BookOpen",
    xpReward: 25,
    targetValue: 1,
    currentValue: 0,
    completed: false,
    resetType: "daily",
    ...overrides,
  };
}

function renderPanel(quests: DailyQuest[]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DailyQuestsCard
        quests={quests}
        questsResetTime={new Date(Date.now() + 3_600_000).toISOString()}
      />
    </NextIntlClientProvider>
  );
}

describe("DailyQuestsCard quest deep-links", () => {
  it("renders the review quest as a locale-prefixed link to /review", () => {
    renderPanel([
      quest({
        id: "quest-review",
        type: "review",
        name: "Clear your due reviews",
      }),
    ]);

    const link = screen.getByRole("link", { name: /Clear your due reviews/ });
    expect(link).toHaveAttribute("href", "/en/review");
  });

  it("renders a non-review quest as a plain card (no link)", () => {
    renderPanel([
      quest({ id: "quest-lesson", type: "lesson", name: "Complete a Lesson" }),
    ]);

    expect(screen.getByText("Complete a Lesson")).toBeDefined();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("links only the review card when kinds are mixed", () => {
    renderPanel([
      quest({ id: "quest-lesson", type: "lesson", name: "Complete a Lesson" }),
      quest({ id: "quest-review", type: "review", name: "Clear reviews" }),
    ]);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    const [reviewLink] = links;
    expect(reviewLink).toBeDefined();
    expect(within(reviewLink!).getByText("Clear reviews")).toBeDefined();
    expect(reviewLink!).toHaveAttribute("href", "/en/review");
  });
});

// Glyph pass 21-08: the Phosphor icon map became the CHIP tier of the glyph
// language. The row keeps its anatomy; only the leading icon changed.

describe("DailyQuestsCard quest chips", () => {
  it("maps every shipped quest icon string to its owner-approved glyph", () => {
    expect(questGlyph("Code", false)).toEqual({ glyph: "</>", cat: "craft" });
    expect(questGlyph("BookOpen", false)).toEqual({
      glyph: "▸",
      cat: "course",
    });
    // The module quest took `endurance` for one round; that fill is near-black
    // and dominated its row, so it moved to the course fill (owner, 21-08).
    expect(questGlyph("Scroll", false)).toEqual({
      glyph: "⬡",
      cat: "course",
    });
    expect(questGlyph("Lightning", false)).toEqual({
      glyph: "×3",
      cat: "course",
    });
    expect(questGlyph("Trophy", false)).toEqual({
      glyph: "∞",
      cat: "community",
    });
  });

  it("falls back to a neutral chip for an icon string it has never seen", () => {
    expect(questGlyph("SomeNewPhosphorIcon", false)).toEqual({
      glyph: "•",
      cat: "course",
    });
  });

  it("flips a completed quest's glyph to a check, keeping its category", () => {
    expect(questGlyph("Code", true)).toEqual({ glyph: "✓", cat: "craft" });
    expect(questGlyph("Trophy", true)).toEqual({
      glyph: "✓",
      cat: "community",
    });
  });

  it("renders a decorative chip beside the quest name", () => {
    const { container } = renderPanel([
      quest({
        id: "quest-challenge",
        icon: "Code",
        name: "Complete a Challenge",
      }),
    ]);

    const chip = container.querySelector(".chip");
    expect(chip).not.toBeNull();
    expect(chip!.getAttribute("data-cat")).toBe("craft");
    expect(chip!.getAttribute("aria-hidden")).toBe("true");
    expect(
      chip!.querySelector("[data-glyph]")!.getAttribute("data-glyph")
    ).toBe("</>");
    expect(screen.getByText("Complete a Challenge")).toBeDefined();
  });

  it("shows the check chip once the quest is completed", () => {
    const { container } = renderPanel([
      quest({ id: "quest-challenge", icon: "Code", completed: true }),
    ]);

    expect(
      container.querySelector(".chip [data-glyph]")!.getAttribute("data-glyph")
    ).toBe("✓");
  });

  it("sizes the row chip at 24px so all five quests fit without scrolling", () => {
    const { container } = renderPanel([quest({ icon: "Code" })]);

    expect(container.querySelector(".chip")!.getAttribute("data-size")).toBe(
      "24"
    );
  });

  it("says 'done' ONCE — the chip's check, not a second right-side medallion", () => {
    // The completed row used to render both. Owner, 21-08: keep the chip flip,
    // drop the medallion, let the muted title carry the rest.
    const { container } = renderPanel([
      quest({ icon: "Code", completed: true, currentValue: 1 }),
    ]);

    expect(container.querySelector(".dq-check")).toBeNull();
    expect(container.querySelector(".dq-progress-lbl")).toBeNull();
    expect(container.querySelector(".dq.done")).not.toBeNull();
  });

  it("still shows the progress counter while a quest is incomplete", () => {
    const { container } = renderPanel([
      quest({ icon: "Lightning", currentValue: 1, targetValue: 3 }),
    ]);

    expect(container.querySelector(".dq-progress-lbl")!.textContent).toBe(
      "1/3"
    );
  });
});
