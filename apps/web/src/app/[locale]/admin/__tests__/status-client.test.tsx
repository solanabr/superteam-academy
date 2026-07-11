// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { AdminStatus } from "../admin-status-types";
import { StatusClient } from "../status/status-client";
import messages from "@/messages/en.json";

// DataResyncPanel carries its own behavior and posts to /api/admin/resync,
// so it is stubbed out here.
vi.mock("@/components/admin/data-resync-panel", () => ({
  DataResyncPanel: () => <div data-testid="data-resync-panel" />,
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
    },
    {
      contentId: "course-anchor",
      slug: "anchor",
      title: "Anchor",
      isDraft: false,
      lessonCount: 5,
      contentXpPerLesson: 50,
      missingFields: [],
      onChainStatus: "not_deployed",
      coursePda: null,
      differences: [],
      contentDrift: "up_to_date",
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
    },
  ],
};

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

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

describe("StatusClient", () => {
  it("fetches /api/admin/status and renders the program-status bar", async () => {
    const fetchMock = mockStatusFetch();
    renderWithIntl(<StatusClient />);

    expect(screen.getByText("Loading on-chain status...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("devnet")).toBeInTheDocument();
    });
    // Truncated program id: first 8 + "..." + last 4, exactly as the stacked page showed it.
    expect(screen.getByText("AcademyP...1111")).toBeInTheDocument();
    expect(screen.getByText("Found")).toBeInTheDocument();
    expect(screen.queryByText(/Authority mismatch/)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/status");
  });

  it("shows the authority-mismatch banner when authorityMatch.matches is false", async () => {
    mockStatusFetch({
      ...status,
      program: {
        ...status.program,
        authorityMatch: { matches: false },
      },
    });
    renderWithIntl(<StatusClient />);

    await waitFor(() => {
      expect(
        screen.getByText(/Authority mismatch — check PROGRAM_AUTHORITY_SECRET/)
      ).toBeInTheDocument();
    });
  });

  it("shows 'Not initialized' when the config account is missing", async () => {
    mockStatusFetch({
      ...status,
      program: { ...status.program, deployed: false },
    });
    renderWithIntl(<StatusClient />);

    await waitFor(() => {
      expect(screen.getByText("Not initialized")).toBeInTheDocument();
    });
  });

  it("renders the deploy counts and the resync panel", async () => {
    mockStatusFetch();
    renderWithIntl(<StatusClient />);

    await waitFor(() => {
      expect(screen.getByTestId("data-resync-panel")).toBeInTheDocument();
    });
    // No test-id on prod markup: locate the counts by their i18n'd labels.
    const coursesLabel = screen.getByText(`${messages.admin.counts.courses}:`);
    expect(coursesLabel.nextElementSibling).toHaveTextContent("2");
    const achievementsLabel = screen.getByText(
      `${messages.admin.counts.achievements}:`
    );
    expect(achievementsLabel.nextElementSibling).toHaveTextContent("1");
  });

  it("refetches on the program-bar Refresh button", async () => {
    const fetchMock = mockStatusFetch();
    renderWithIntl(<StatusClient />);

    await waitFor(() => {
      expect(screen.getByText("devnet")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("button", { name: messages.admin.states.refresh })
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("shows the error state and refetches on Retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false } as Response)
      .mockResolvedValue({ ok: true, json: async () => status } as Response);
    vi.stubGlobal("fetch", fetchMock);

    renderWithIntl(<StatusClient />);
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch status")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => {
      expect(screen.getByText("devnet")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
