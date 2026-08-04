// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { DailyQuest } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { DailyQuestsCard } from "../daily-quests-card";

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
