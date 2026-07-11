// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { AdminStatus } from "../admin-status-types";
import { DeployClient } from "../deploy/deploy-client";

// The sync tables carry their own tests and fire on-chain sync requests, so
// they are stubbed; the stubs surface the props wiring under test.
vi.mock("@/components/admin/course-sync-table", () => ({
  CourseSyncTable: ({ onRefresh }: { onRefresh: () => void }) => (
    <button data-testid="course-sync-table" onClick={onRefresh}>
      course-table
    </button>
  ),
}));
vi.mock("@/components/admin/achievement-sync-table", () => ({
  AchievementSyncTable: () => <div data-testid="achievement-sync-table" />,
}));

const status: AdminStatus = {
  program: {
    deployed: true,
    programId: "AcademyProgram1111111111111111111111111111",
    configPda: "Config11111111111111111111111111111111111",
    minterRegistered: true,
    authorityMatch: { matches: true },
  },
  courses: [
    {
      sanityId: "course-rust",
      slug: "rust",
      title: "Rust",
      isDraft: false,
      lessonCount: 3,
      sanityXpPerLesson: 50,
      missingFields: [],
      onChainStatus: "synced",
      coursePda: "Pda111",
      differences: [],
    },
  ],
  achievements: [
    {
      sanityId: "achievement-first-steps",
      name: "First Steps",
      missingFields: [],
      onChainStatus: "synced",
      achievementPda: "Pda222",
      collectionAddress: "Coll111",
    },
  ],
};

function mockStatusFetch(body: AdminStatus = status) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  } as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("DeployClient", () => {
  it("fetches /api/admin/status and renders both sync tables", async () => {
    const fetchMock = mockStatusFetch();
    render(<DeployClient />);

    expect(screen.getByText("Loading on-chain status...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("course-sync-table")).toBeInTheDocument();
    });
    expect(screen.getByTestId("achievement-sync-table")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/status");
  });

  it("shows the empty-state copy when there are no courses/achievements", async () => {
    mockStatusFetch({ ...status, courses: [], achievements: [] });
    render(<DeployClient />);

    await waitFor(() => {
      expect(
        screen.getByText("No courses found in Sanity.")
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("No achievements found in Sanity.")
    ).toBeInTheDocument();
  });

  it("refetches on the Refresh button and on the table's onRefresh", async () => {
    const fetchMock = mockStatusFetch();
    render(<DeployClient />);

    await waitFor(() => {
      expect(screen.getByTestId("course-sync-table")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    await waitFor(() => {
      expect(screen.getByTestId("course-sync-table")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("course-sync-table"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  });

  it("shows the error state with a working Retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false } as Response)
      .mockResolvedValue({ ok: true, json: async () => status } as Response);
    vi.stubGlobal("fetch", fetchMock);

    render(<DeployClient />);
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch status")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => {
      expect(screen.getByTestId("course-sync-table")).toBeInTheDocument();
    });
  });
});
