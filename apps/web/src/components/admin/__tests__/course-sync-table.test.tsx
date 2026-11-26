// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { CourseStatus } from "@/app/[locale]/admin/admin-status-types";
import messages from "@/messages/en.json";
import { CourseSyncTable } from "../course-sync-table";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const syncedCourse: CourseStatus = {
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
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CourseSyncTable — deploy opens the change preview", () => {
  it("shows the preview on Sync instead of firing the request; confirm fires it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const onRefresh = vi.fn();

    renderWithIntl(
      <CourseSyncTable courses={[syncedCourse]} onRefresh={onRefresh} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sync" }));
    // Preview is open, nothing sent yet.
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Redeploy" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/courses/sync",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ courseId: "course-rust" }),
      })
    );
    await waitFor(() => expect(onRefresh).toHaveBeenCalled());
    // Preview closed after confirm.
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("cancelling the preview sends nothing", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderWithIntl(
      <CourseSyncTable courses={[syncedCourse]} onRefresh={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sync" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("CourseSyncTable — Commit content hash (§11.0)", () => {
  const staleCourse: CourseStatus = {
    ...syncedCourse,
    contentId: "course-stale",
    chainDrift: "content_stale",
  };

  it("hides Commit content hash for a content-current course", () => {
    vi.stubGlobal("fetch", vi.fn());
    renderWithIntl(
      <CourseSyncTable courses={[syncedCourse]} onRefresh={vi.fn()} />
    );
    expect(
      screen.queryByRole("button", { name: "Commit content hash" })
    ).toBeNull();
  });

  it("shows Commit content hash for a stale course and posts commitContent (no preview)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const onRefresh = vi.fn();

    renderWithIntl(
      <CourseSyncTable courses={[staleCourse]} onRefresh={onRefresh} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Commit content hash" })
    );
    // Direct POST — no confirmation dialog for the content commitment.
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/courses/sync",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          courseId: "course-stale",
          commitContent: true,
        }),
      })
    );
    await waitFor(() => expect(onRefresh).toHaveBeenCalled());
  });
});

describe("CourseSyncTable — Task 5 polish", () => {
  const driftedCourse: CourseStatus = {
    ...syncedCourse,
    contentId: "course-anchor",
    slug: "anchor",
    title: "Anchor",
    onChainStatus: "out_of_sync",
    differences: [
      {
        field: "xpPerLesson",
        contentValue: 50,
        onChainValue: 25,
        updateable: true,
      },
    ],
    chainDrift: "content_stale",
  };

  it("renders localized status badges and the missing-fields line", () => {
    const missingCourse: CourseStatus = {
      ...syncedCourse,
      contentId: "course-defi",
      slug: "defi",
      title: "DeFi",
      onChainStatus: "missing_fields",
      coursePda: null,
      missingFields: ["creatorWallet"],
      chainDrift: "missing_fields",
    };
    renderWithIntl(
      <CourseSyncTable
        courses={[syncedCourse, missingCourse]}
        onRefresh={vi.fn()}
      />
    );
    expect(screen.getByText("Synced")).toBeTruthy();
    expect(screen.getByText("Missing fields")).toBeTruthy();
    expect(screen.getByText("Missing: creatorWallet")).toBeTruthy();
  });

  it("Sync All asks a single counted confirm and sends nothing when declined", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const confirmMock = vi.fn().mockReturnValue(false);
    vi.stubGlobal("confirm", confirmMock);

    renderWithIntl(
      <CourseSyncTable
        courses={[syncedCourse, driftedCourse]}
        onRefresh={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sync All (2)" }));
    expect(confirmMock).toHaveBeenCalledTimes(1);
    // ICU plural: 2 courses (plural) but 1 field change (singular).
    expect(confirmMock).toHaveBeenCalledWith(
      "Sync 2 courses — 1 field change. Continue?"
    );
    // Declined → no requests, no per-course dialogs.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("pluralizes the bulk confirm for a single course with several changes", () => {
    vi.stubGlobal("fetch", vi.fn());
    const confirmMock = vi.fn().mockReturnValue(false);
    vi.stubGlobal("confirm", confirmMock);

    const twoChangeCourse: CourseStatus = {
      ...driftedCourse,
      differences: [
        {
          field: "xpPerLesson",
          contentValue: 50,
          onChainValue: 25,
          updateable: true,
        },
        {
          field: "creatorRewardXp",
          contentValue: 100,
          onChainValue: 0,
          updateable: true,
        },
      ],
    };

    renderWithIntl(
      <CourseSyncTable courses={[twoChangeCourse]} onRefresh={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sync All (1)" }));
    // 1 course (singular) but 2 field changes (plural).
    expect(confirmMock).toHaveBeenCalledWith(
      "Sync 1 course — 2 field changes. Continue?"
    );
  });

  it("Sync All proceeds after the single confirm", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    renderWithIntl(
      <CourseSyncTable
        courses={[syncedCourse, driftedCourse]}
        onRefresh={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sync All (2)" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("surfaces route refusals under a localized label, message (with pubkey) intact", async () => {
    const refusal =
      'Instructor wallet "WrongWa11et111" is not a valid on-curve Solana address';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: refusal }),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    renderWithIntl(
      <CourseSyncTable courses={[syncedCourse]} onRefresh={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sync" }));
    fireEvent.click(screen.getByRole("button", { name: "Redeploy" }));
    await waitFor(() =>
      expect(screen.getByText(`Deploy action refused: ${refusal}`)).toBeTruthy()
    );
  });
});

describe("CourseSyncTable — WS-A alignment + mismatch disclosure", () => {
  const mismatchCourse: CourseStatus = {
    ...syncedCourse,
    contentId: "course-defi",
    slug: "defi",
    title: "DeFi",
    onChainStatus: "out_of_sync",
    differences: [
      {
        field: "creator",
        contentValue: "CREATOR111",
        onChainValue: "AUTH1111",
        updateable: false,
      },
    ],
    chainDrift: "content_stale",
  };

  it("gives every body cell align-top so a tall row keeps its siblings' eyeline", () => {
    const { container } = renderWithIntl(
      <CourseSyncTable courses={[syncedCourse]} onRefresh={vi.fn()} />
    );
    const cells = container.querySelectorAll("tbody td");
    expect(cells.length).toBe(5);
    cells.forEach((td) => expect(td.className).toContain("align-top"));
  });

  it("collapses the immutable mismatch to a one-line danger pill, hiding the recreate card by default", () => {
    vi.stubGlobal("fetch", vi.fn());
    renderWithIntl(
      <CourseSyncTable courses={[mismatchCourse]} onRefresh={vi.fn()} />
    );

    const pill = screen.getByRole("button", {
      name: "Immutable mismatch — 1 field",
    });
    expect(pill).toHaveAttribute("aria-expanded", "false");
    // The full RecreateCourseFlow card (its review button) is not mounted yet.
    expect(
      screen.queryByRole("button", { name: /Recreate course…/ })
    ).not.toBeInTheDocument();
  });

  const legacyTrackDiffs: CourseStatus["differences"] = [
    { field: "trackId", contentValue: 2, onChainValue: 0, updateable: false },
    {
      field: "trackLevel",
      contentValue: 1,
      onChainValue: 0,
      updateable: false,
    },
  ];
  const LEGACY_NOTE =
    "On-chain track and level are 0 (created before tracks). The content values apply when the course is created on mainnet.";

  it("legacy track-only (on-chain 0/0): Sync shown, amber note instead of the recreate pill", () => {
    vi.stubGlobal("fetch", vi.fn());
    const legacyCourse: CourseStatus = {
      ...syncedCourse,
      contentId: "course-legacy",
      differences: legacyTrackDiffs,
    };
    renderWithIntl(
      <CourseSyncTable courses={[legacyCourse]} onRefresh={vi.fn()} />
    );

    expect(screen.getByText(LEGACY_NOTE)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Immutable mismatch/ })
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Sync" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sync All (1)" })
    ).toBeInTheDocument();
    // The diff detail still lists the track values.
    expect(screen.getByText(/2 differences/)).toBeInTheDocument();

    // Nothing to push → the preview behaves like a fully synced row.
    fireEvent.click(screen.getByRole("button", { name: "Sync" }));
    expect(
      screen.getByText("No changes detected. Redeploy anyway?")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Redeploy" })).toBeTruthy();
  });

  it("legacy track plus an updateable diff: Sync All counts only the updateable change", () => {
    vi.stubGlobal("fetch", vi.fn());
    const confirmMock = vi.fn().mockReturnValue(false);
    vi.stubGlobal("confirm", confirmMock);
    const legacyCourse: CourseStatus = {
      ...syncedCourse,
      contentId: "course-legacy",
      onChainStatus: "out_of_sync",
      differences: [
        {
          field: "xpPerLesson",
          contentValue: 75,
          onChainValue: 50,
          updateable: true,
        },
        ...legacyTrackDiffs,
      ],
    };
    renderWithIntl(
      <CourseSyncTable courses={[legacyCourse]} onRefresh={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sync All (1)" }));
    expect(confirmMock).toHaveBeenCalledWith(
      "Sync 1 course — 1 field change. Continue?"
    );
  });

  it("legacy track plus another immutable diff keeps the recreate pill and hides Sync", () => {
    vi.stubGlobal("fetch", vi.fn());
    const blockedCourse: CourseStatus = {
      ...mismatchCourse,
      differences: [...mismatchCourse.differences, ...legacyTrackDiffs],
    };
    renderWithIntl(
      <CourseSyncTable courses={[blockedCourse]} onRefresh={vi.fn()} />
    );

    expect(
      screen.getByRole("button", { name: "Immutable mismatch — 3 fields" })
    ).toBeInTheDocument();
    expect(screen.queryByText(LEGACY_NOTE)).toBeNull();
    expect(screen.queryByRole("button", { name: "Sync" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Sync All/ })).toBeNull();
  });

  it("expands the same recreate card behind the disclosure on click", () => {
    vi.stubGlobal("fetch", vi.fn());
    renderWithIntl(
      <CourseSyncTable courses={[mismatchCourse]} onRefresh={vi.fn()} />
    );

    const pill = screen.getByRole("button", {
      name: "Immutable mismatch — 1 field",
    });
    fireEvent.click(pill);

    expect(pill).toHaveAttribute("aria-expanded", "true");
    // The unchanged RecreateCourseFlow at-a-glance card is now revealed.
    expect(
      screen.getByRole("button", { name: /Recreate course…/ })
    ).toBeInTheDocument();
  });
});
