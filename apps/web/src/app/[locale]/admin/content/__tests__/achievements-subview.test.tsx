// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { AdminStatus } from "../../admin-status-types";
import { AchievementsSubview } from "../achievements-subview";
import messages from "@/messages/en.json";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

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
      title: "Rust Fundamentals",
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
  achievements: [
    {
      contentId: "achievement-first-steps",
      name: "First Steps",
      missingFields: [],
      onChainStatus: "synced",
      achievementPda: "Pda222",
      collectionAddress: "Coll111",
      award: { kind: "course-completed", course: "course-rust" },
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

describe("AchievementsSubview", () => {
  it("fetches /api/admin/status and renders the achievement table", async () => {
    mockStatusFetch();
    renderWithIntl(<AchievementsSubview pathTitleById={{}} />);

    expect(screen.getByText("Loading on-chain status...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("First Steps")).toBeInTheDocument();
    });
  });

  it("resolves award.course against the courses in the SAME status response (no extra request)", async () => {
    const fetchMock = mockStatusFetch();
    renderWithIntl(<AchievementsSubview pathTitleById={{}} />);

    await waitFor(() => {
      expect(
        screen.getByText("Unlocks with course: Rust Fundamentals")
      ).toBeInTheDocument();
    });
    // One status fetch, no second request for course titles.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows the empty-state copy when there are no achievements", async () => {
    mockStatusFetch({ ...status, achievements: [] });
    renderWithIntl(<AchievementsSubview pathTitleById={{}} />);

    await waitFor(() => {
      expect(
        screen.getByText("No achievements in the content bundle.")
      ).toBeInTheDocument();
    });
  });

  it("shows the error state with a working Retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false } as Response)
      .mockResolvedValue({ ok: true, json: async () => status } as Response);
    vi.stubGlobal("fetch", fetchMock);

    renderWithIntl(<AchievementsSubview pathTitleById={{}} />);
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch status")).toBeInTheDocument();
    });
  });
});
