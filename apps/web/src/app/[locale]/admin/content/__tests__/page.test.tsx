// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type {
  QuestData,
  AdminLearningPathWithRefs,
} from "@/lib/content/queries";
import messages from "@/messages/en.json";

/**
 * `/admin/content` (#513 WS-C) composition test — the sub-views carry their
 * own tests (quests-table / paths-table / achievements-subview), so they're
 * stubbed here; what's under test is that the page fetches the bundle data
 * server-side and wires it into `ContentTabs` + the pin indicator.
 */
const questData: QuestData = {
  quests: [],
  challengeLessonIds: [],
  moduleLessonMap: [],
};
const paths: AdminLearningPathWithRefs[] = [
  {
    _id: "path-main",
    title: "Main Path",
    courseIds: [],
    resolvedCourses: [],
    danglingCourseIds: [],
  },
];

const getAllQuestsMock = vi.fn(async () => questData);
const getLearningPathsForAdminWithRefsMock = vi.fn(async () => paths);

vi.mock("@/lib/content/queries", () => ({
  getAllQuests: () => getAllQuestsMock(),
  getLearningPathsForAdminWithRefs: () =>
    getLearningPathsForAdminWithRefsMock(),
}));

vi.mock("../content-tabs", () => ({
  ContentTabs: ({
    questsSlot,
    achievementsSlot,
    pathsSlot,
  }: {
    questsSlot: React.ReactNode;
    achievementsSlot: React.ReactNode;
    pathsSlot: React.ReactNode;
  }) => (
    <div>
      <div data-testid="quests-slot">{questsSlot}</div>
      <div data-testid="achievements-slot">{achievementsSlot}</div>
      <div data-testid="paths-slot">{pathsSlot}</div>
    </div>
  ),
}));
vi.mock("../quests-table", () => ({
  QuestsTable: () => <div data-testid="quests-table" />,
}));
vi.mock("../achievements-subview", () => ({
  AchievementsSubview: ({
    pathTitleById,
  }: {
    pathTitleById: Record<string, string>;
  }) => (
    <div data-testid="achievements-subview">
      {JSON.stringify(pathTitleById)}
    </div>
  ),
}));
vi.mock("../paths-table", () => ({
  PathsTable: () => <div data-testid="paths-table" />,
}));
vi.mock("../pin-status-badge", () => ({
  PinStatusBadge: () => <div data-testid="pin-status-badge" />,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) => (key: string) => {
    const path = `${namespace}.${key}`.split(".");
    let node: unknown = messages;
    for (const segment of path) {
      node = (node as Record<string, unknown>)[segment];
    }
    return node as string;
  },
}));

const { default: AdminContentPage } = await import("../page");

describe("AdminContentPage", () => {
  it("fetches quests + paths server-side and renders the heading, pin badge, and all three sub-views", async () => {
    render(await AdminContentPage());

    expect(getAllQuestsMock).toHaveBeenCalledTimes(1);
    expect(getLearningPathsForAdminWithRefsMock).toHaveBeenCalledTimes(1);

    expect(
      screen.getByRole("heading", { name: messages.admin.screens.content })
    ).toBeInTheDocument();
    expect(screen.getByTestId("pin-status-badge")).toBeInTheDocument();
    expect(screen.getByTestId("quests-table")).toBeInTheDocument();
    expect(screen.getByTestId("achievements-subview")).toBeInTheDocument();
    expect(screen.getByTestId("paths-table")).toBeInTheDocument();
  });

  it("derives pathTitleById from the fetched paths and hands it to the Achievements sub-view", async () => {
    render(await AdminContentPage());
    expect(screen.getByTestId("achievements-subview")).toHaveTextContent(
      JSON.stringify({ "path-main": "Main Path" })
    );
  });
});
