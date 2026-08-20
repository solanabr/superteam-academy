// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type {
  QuestData,
  AdminLearningPathWithRefs,
} from "@/lib/content/queries";
import messages from "@/messages/en.json";

/**
 * `/admin/courses` — the merged Publish + Deploy + supporting-content screen.
 * Every moved component carries its own tests, so they are stubbed; what is
 * under test here is the composition (publish, then deploy, then the content
 * tables), the teaching copy, and the state legend.
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

vi.mock("../courses/publish-pin-client", () => ({
  PublishPinClient: () => <div data-testid="publish-pin-client" />,
}));
vi.mock("../courses/deploy-client", () => ({
  DeployClient: () => <div data-testid="deploy-client" />,
}));
vi.mock("../courses/content-tabs", () => ({
  ContentTabs: ({
    questsSlot,
    achievementsSlot,
    pathsSlot,
  }: {
    questsSlot: React.ReactNode;
    achievementsSlot: React.ReactNode;
    pathsSlot: React.ReactNode;
  }) => (
    <div data-testid="content-tabs">
      <div>{questsSlot}</div>
      <div>{achievementsSlot}</div>
      <div>{pathsSlot}</div>
    </div>
  ),
}));
vi.mock("../courses/quests-table", () => ({
  QuestsTable: () => <div data-testid="quests-table" />,
}));
vi.mock("../courses/achievements-subview", () => ({
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
vi.mock("../courses/paths-table", () => ({
  PathsTable: () => <div data-testid="paths-table" />,
}));

// Imported after the mocks so the page's `@/lib/content/queries` fetches
// resolve against the stubs above.
const { default: AdminCoursesPage } = await import("../courses/page");

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

const admin = messages.admin;
const intro = admin.coursesScreen.intro;
const legend = admin.coursesScreen.legend;

async function renderPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {await AdminCoursesPage()}
    </NextIntlClientProvider>
  );
}

describe("AdminCoursesPage", () => {
  it("renders the screen heading and both merged surfaces", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", { level: 2, name: admin.screens.courses })
    ).toBeInTheDocument();
    expect(screen.getByTestId("publish-pin-client")).toBeInTheDocument();
    expect(screen.getByTestId("deploy-client")).toBeInTheDocument();
  });

  it("puts publish above deploy, the order the two steps happen in", async () => {
    await renderPage();

    const publish = screen.getByTestId("publish-pin-client");
    const deploy = screen.getByTestId("deploy-client");
    expect(
      publish.compareDocumentPosition(deploy) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // #1136: the Quests/Achievements/Paths tables came from the retired
  // `/admin/content`, which was a third step of this same flow.
  it("carries the supporting-content tables as a third labelled step", async () => {
    await renderPage();

    // Fetched server-side by the page, not by a client round trip.
    expect(getAllQuestsMock).toHaveBeenCalled();
    expect(getLearningPathsForAdminWithRefsMock).toHaveBeenCalled();

    const region = screen.getByRole("region", {
      name: admin.coursesScreen.step3Eyebrow,
    });
    expect(region).toContainElement(screen.getByTestId("content-tabs"));
    expect(screen.getByTestId("quests-table")).toBeInTheDocument();
    expect(screen.getByTestId("achievements-subview")).toBeInTheDocument();
    expect(screen.getByTestId("paths-table")).toBeInTheDocument();

    // Deploy stays above it — the tables are step 3, not a replacement.
    const deploy = screen.getByTestId("deploy-client");
    expect(
      deploy.compareDocumentPosition(region) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("derives pathTitleById from the fetched paths for the Achievements sub-view", async () => {
    await renderPage();
    expect(screen.getByTestId("achievements-subview")).toHaveTextContent(
      JSON.stringify({ "path-main": "Main Path" })
    );
  });

  it("teaches the two steps and their distinct questions", async () => {
    await renderPage();

    expect(screen.getByText(intro.lede)).toBeInTheDocument();
    expect(screen.getByText(intro.step1Title)).toBeInTheDocument();
    expect(screen.getByText(intro.step1Body)).toBeInTheDocument();
    expect(screen.getByText(intro.step2Title)).toBeInTheDocument();
    expect(screen.getByText(intro.step2Body)).toBeInTheDocument();
  });

  it("states that editing lesson content needs no deploy", async () => {
    await renderPage();
    expect(screen.getByText(intro.contentOnlyNote)).toBeInTheDocument();
  });

  it("groups each surface in a labelled region naming its step", async () => {
    await renderPage();

    expect(
      screen.getByRole("region", { name: admin.coursesScreen.step1Eyebrow })
    ).toContainElement(screen.getByTestId("publish-pin-client"));
    expect(
      screen.getByRole("region", { name: admin.coursesScreen.step2Eyebrow })
    ).toContainElement(screen.getByTestId("deploy-client"));
  });

  it("legends every deploy state the rows can show", async () => {
    await renderPage();

    // The legend is a default-collapsed disclosure (WS-A) — its heading is the
    // toggle; expand it to reveal the state reference.
    expect(
      screen.getByRole("heading", { name: legend.title })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: legend.title }));

    // On-chain states (StatusBadge) — badge label paired with its meaning.
    for (const state of [
      "not_deployed",
      "synced",
      "out_of_sync",
      "draft",
      "missing_fields",
    ] as const) {
      expect(screen.getByText(admin.statusBadge[state])).toBeInTheDocument();
      expect(screen.getByText(legend[state])).toBeInTheDocument();
    }

    // Content-drift states (ContentDriftBadge).
    for (const state of ["drifted", "blocked", "unknown"] as const) {
      expect(
        screen.getByText(admin.deployScreen.contentDrift[state])
      ).toBeInTheDocument();
      expect(screen.getByText(legend[state])).toBeInTheDocument();
    }

    // The immutable mismatch shows no badge, so it needs its own explanation.
    expect(screen.getByText(legend.immutableTitle)).toBeInTheDocument();
    expect(screen.getByText(legend.immutableBody)).toBeInTheDocument();
  });

  it("legends the drifted state as a publish fix, not a redeploy", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: legend.title }));
    expect(legend.drifted).toMatch(/publish PR/i);
    expect(screen.getByText(legend.drifted)).toBeInTheDocument();
  });
});
