// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import { QuestsTable } from "../quests-table";
import type { ContentQuest } from "@/lib/content/queries";
import messages from "@/messages/en.json";

vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) =>
    createTranslator({ locale: "en", messages, namespace }),
}));

const quest: ContentQuest = {
  id: "quest-three-lessons",
  name: "Three Lessons",
  description: "Complete 3 lessons today.",
  type: "lesson_batch",
  icon: "📚",
  xpReward: 30,
  targetValue: 3,
  resetType: "daily",
};

describe("QuestsTable", () => {
  it("renders each quest's reward config — read-only, no action column", async () => {
    render(await QuestsTable({ quests: [quest] }));

    expect(screen.getByText("Three Lessons")).toBeInTheDocument();
    expect(screen.getByText("Lesson batch")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("📚")).toBeInTheDocument();
    // Zero on-chain: no sync/deploy affordance anywhere in the table.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("translates every quest type and reset type", async () => {
    const quests: ContentQuest[] = [
      "lesson",
      "lesson_batch",
      "challenge",
      "login_streak",
      "module",
    ].map((type, i) => ({
      ...quest,
      id: `quest-${i}`,
      type: type as ContentQuest["type"],
    }));
    render(await QuestsTable({ quests }));

    for (const label of [
      "Lesson",
      "Lesson batch",
      "Challenge",
      "Login streak",
      "Module",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("shows the empty-bundle copy when there are no quests", async () => {
    render(await QuestsTable({ quests: [] }));
    expect(
      screen.getByText("No quests in the content bundle.")
    ).toBeInTheDocument();
  });
});
