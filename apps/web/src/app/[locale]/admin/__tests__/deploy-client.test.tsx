// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { AdminStatus } from "../admin-status-types";
import { DeployClient } from "../courses/deploy-client";
import messages from "@/messages/en.json";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

// The sync table carries its own tests and fires on-chain sync requests, so
// it is stubbed; the stub surfaces the props wiring under test. The
// Achievements sync table used to render as a second section here (#513
// WS-C relocated it into `admin/content/achievements-subview.tsx`).
vi.mock("@/components/admin/course-sync-table", () => ({
  CourseSyncTable: ({ onRefresh }: { onRefresh: () => void }) => (
    <button data-testid="course-sync-table" onClick={onRefresh}>
      course-table
    </button>
  ),
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
      contentId: "course-rust",
      slug: "rust",
      title: "Rust",
      isDraft: false,
      lessonCount: 3,
      contentXpPerLesson: 50,
      missingFields: [],
      onChainStatus: "synced",
      coursePda: "Pda111",
      differences: [],
      contentDrift: "up_to_date",
      chainDrift: "content_current",
    },
  ],
  // DeployClient no longer renders achievements (#513 WS-C moved that table to
  // the Content tab) — this array only needs to satisfy `AdminStatus`'s shape.
  achievements: [
    {
      contentId: "achievement-first-steps",
      name: "First Steps",
      missingFields: [],
      onChainStatus: "synced",
      achievementPda: "Pda222",
      collectionAddress: "Coll111",
      award: null,
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
  it("fetches /api/admin/status and renders the course sync table", async () => {
    const fetchMock = mockStatusFetch();
    renderWithIntl(<DeployClient />);

    expect(screen.getByText("Loading on-chain status...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("course-sync-table")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/status");
  });

  it("shows the empty-state copy when there are no courses", async () => {
    mockStatusFetch({ ...status, courses: [] });
    renderWithIntl(<DeployClient />);

    await waitFor(() => {
      expect(
        screen.getByText("No courses in the content bundle.")
      ).toBeInTheDocument();
    });
  });

  it("refetches on the Refresh button and on the table's onRefresh", async () => {
    const fetchMock = mockStatusFetch();
    renderWithIntl(<DeployClient />);

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

    renderWithIntl(<DeployClient />);
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch status")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => {
      expect(screen.getByTestId("course-sync-table")).toBeInTheDocument();
    });
  });
});
