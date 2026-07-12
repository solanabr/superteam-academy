// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { CourseSyncTable } from "../course-sync-table";
import type { CourseStatus } from "@/app/[locale]/admin/admin-status-types";
import messages from "@/messages/en.json";

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
    expect(confirmMock).toHaveBeenCalledWith(
      "Sync 2 courses — 1 field changes. Continue?"
    );
    // Declined → no requests, no per-course dialogs.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
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
