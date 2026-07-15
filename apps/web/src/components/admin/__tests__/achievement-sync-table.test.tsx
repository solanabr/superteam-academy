// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { AchievementSyncTable } from "../achievement-sync-table";
import messages from "@/messages/en.json";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function mockFetch(ok: boolean, body: unknown = {}) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok, json: async () => body } as Response);
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

describe("AchievementSyncTable — relocation into the Content tab (#513) must not change sync behavior", () => {
  it("POSTs the achievement id and calls onRefresh on a successful Deploy", async () => {
    const fetchMock = mockFetch(true);
    const onRefresh = vi.fn();
    renderWithIntl(
      <AchievementSyncTable
        achievements={[
          {
            contentId: "achievement-first-steps",
            name: "First Steps",
            missingFields: [],
            onChainStatus: "not_deployed",
            achievementPda: null,
            collectionAddress: null,
          },
        ]}
        onRefresh={onRefresh}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Deploy" }));

    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/achievements/sync",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ achievementId: "achievement-first-steps" }),
      })
    );
  });

  it("shows a Sync All button that syncs every syncable achievement in sequence", async () => {
    const fetchMock = mockFetch(true);
    const onRefresh = vi.fn();
    renderWithIntl(
      <AchievementSyncTable
        achievements={[
          {
            contentId: "achievement-a",
            name: "Ach A",
            missingFields: [],
            onChainStatus: "not_deployed",
            achievementPda: null,
            collectionAddress: null,
          },
          {
            contentId: "achievement-b",
            name: "Ach B",
            missingFields: [],
            onChainStatus: "not_deployed",
            achievementPda: null,
            collectionAddress: null,
          },
        ]}
        onRefresh={onRefresh}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sync All (2)" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/admin/achievements/sync",
      expect.objectContaining({
        body: JSON.stringify({ achievementId: "achievement-a" }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/admin/achievements/sync",
      expect.objectContaining({
        body: JSON.stringify({ achievementId: "achievement-b" }),
      })
    );
  });

  it("surfaces a translated error and stops on sync failure", async () => {
    mockFetch(false, { error: "boom" });
    renderWithIntl(
      <AchievementSyncTable
        achievements={[
          {
            contentId: "achievement-first-steps",
            name: "First Steps",
            missingFields: [],
            onChainStatus: "not_deployed",
            achievementPda: null,
            collectionAddress: null,
          },
        ]}
        onRefresh={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Deploy" }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("boom");
    });
  });

  it("resolves award.course to a title when courseTitleById has it", () => {
    renderWithIntl(
      <AchievementSyncTable
        achievements={[
          {
            contentId: "achievement-first-steps",
            name: "First Steps",
            missingFields: [],
            onChainStatus: "synced",
            achievementPda: "Pda1",
            collectionAddress: "Coll1",
            award: { kind: "course-completed", course: "course-rust" },
          },
        ]}
        onRefresh={vi.fn()}
        courseTitleById={{ "course-rust": "Rust Fundamentals" }}
      />
    );

    expect(
      screen.getByText("Unlocks with course: Rust Fundamentals")
    ).toBeInTheDocument();
  });

  it("loudly flags an award ref that resolves to nothing, instead of hiding it", () => {
    renderWithIntl(
      <AchievementSyncTable
        achievements={[
          {
            contentId: "achievement-orphan",
            name: "Orphan Achievement",
            missingFields: [],
            onChainStatus: "synced",
            achievementPda: "Pda1",
            collectionAddress: "Coll1",
            award: { kind: "course-completed", course: "course-deleted" },
          },
        ]}
        onRefresh={vi.fn()}
        courseTitleById={{}}
      />
    );

    expect(screen.getByText("missing")).toBeInTheDocument();
    expect(
      screen.getByText("Unresolved ref: course-deleted")
    ).toBeInTheDocument();
  });
});
