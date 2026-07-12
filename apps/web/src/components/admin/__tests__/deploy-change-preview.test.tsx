// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { DeployChangePreview } from "../deploy-change-preview";
import type { CourseStatus } from "@/app/[locale]/admin/admin-status-types";
import messages from "@/messages/en.json";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function course(overrides: Partial<CourseStatus> = {}): CourseStatus {
  return {
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
    ...overrides,
  };
}

describe("DeployChangePreview", () => {
  it("lists the updateable diffs the transaction will write", () => {
    const c = course({
      onChainStatus: "out_of_sync",
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
    });
    renderWithIntl(
      <DeployChangePreview course={c} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText("This transaction will write:")).toBeTruthy();
    expect(screen.getByText("xpPerLesson:")).toBeTruthy();
    expect(screen.getByText("creatorRewardXp:")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm sync" })).toBeTruthy();
  });

  it("warns on an immutable mismatch, telegraphs the recreate path, and blocks confirm", () => {
    const c = course({
      onChainStatus: "out_of_sync",
      differences: [
        {
          field: "difficulty",
          contentValue: "advanced",
          onChainValue: "beginner",
          updateable: false,
        },
      ],
    });
    renderWithIntl(
      <DeployChangePreview course={c} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(
      screen.getByText("Immutable field mismatch — cannot auto-fix")
    ).toBeTruthy();
    // Remediation copy is the git/publish-PR path, not Sanity Studio.
    expect(screen.getByText(/publish a new bundle PR/)).toBeTruthy();
    expect(screen.getByText(/deploy a new version/)).toBeTruthy();
    expect(
      screen.getByText(
        "Deploy is blocked until the immutable mismatch is resolved."
      )
    ).toBeTruthy();
    // Only Cancel remains — no confirm button of any label.
    expect(screen.queryByRole("button", { name: "Confirm sync" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Redeploy" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Deploy" })).toBeNull();
  });

  it("offers a redeploy prompt when there are no changes", () => {
    const c = course();
    renderWithIntl(
      <DeployChangePreview course={c} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(
      screen.getByText("No changes detected. Redeploy anyway?")
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Redeploy" })).toBeTruthy();
  });

  it("announces a first deploy for a course that is not on chain", () => {
    const c = course({
      onChainStatus: "not_deployed",
      coursePda: null,
      chainDrift: "not_deployed",
    });
    renderWithIntl(
      <DeployChangePreview course={c} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(
      screen.getByText(/deploying will create its on-chain account/)
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Deploy" })).toBeTruthy();
  });

  it("surfaces per-course chain drift honestly: informational, NOT a promise this deploy fixes it", () => {
    // The sync route only writes content_tx_id when the caller sends an
    // `activeLessons` mask; this deploy path posts { courseId } alone. So the
    // stale note must be purely informational and must NOT claim the deploy
    // updates the commitment — a promise the confirm cannot keep (the route
    // would answer "Already synced" and the badge would stay stale forever).
    const c = course({ chainDrift: "content_stale" });
    renderWithIntl(
      <DeployChangePreview course={c} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    // States the truth: this deploy will NOT change the commitment, and points
    // at the path that actually does.
    expect(screen.getByText(/This deploy will NOT change it/)).toBeTruthy();
    expect(
      screen.getByText(
        /updated by the content-commit step on the Content Drift screen/
      )
    ).toBeTruthy();

    // Regression guard: never reinstate a promise the deploy doesn't keep.
    expect(screen.queryByText(/this deploy will update it/i)).toBeNull();

    // With no field diffs, a content-stale course honestly has nothing to write
    // on THIS path — so it reads as "no changes", not a pending sync.
    expect(
      screen.getByText("No changes detected. Redeploy anyway?")
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Redeploy" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirm sync" })).toBeNull();
  });

  it("a content-stale course WITH field diffs still offers the sync (those fields do get written)", () => {
    const c = course({
      onChainStatus: "out_of_sync",
      chainDrift: "content_stale",
      differences: [
        {
          field: "xpPerLesson",
          contentValue: 50,
          onChainValue: 25,
          updateable: true,
        },
      ],
    });
    renderWithIntl(
      <DeployChangePreview course={c} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    // The field diff is real and IS written → confirm offered…
    expect(screen.getByText("xpPerLesson:")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm sync" })).toBeTruthy();
    // …while the commitment note stays honest about what it will not do.
    expect(screen.getByText(/This deploy will NOT change it/)).toBeTruthy();
    expect(
      screen.queryByText("No changes detected. Redeploy anyway?")
    ).toBeNull();
  });

  it("wires confirm and cancel", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderWithIntl(
      <DeployChangePreview
        course={course()}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Redeploy" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", () => {
    const onCancel = vi.fn();
    renderWithIntl(
      <DeployChangePreview
        course={course()}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("traps Tab focus inside the dialog (both directions)", () => {
    renderWithIntl(
      <DeployChangePreview
        course={course()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const redeploy = screen.getByRole("button", { name: "Redeploy" });

    // Tab on the last focusable wraps to the first…
    redeploy.focus();
    fireEvent.keyDown(redeploy, { key: "Tab" });
    expect(document.activeElement).toBe(cancel);

    // …and Shift+Tab on the first wraps to the last.
    fireEvent.keyDown(cancel, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(redeploy);
  });

  it("#400: a creator mismatch renders the loud dedicated emphasis and blocks confirm", () => {
    const c = course({
      onChainStatus: "out_of_sync",
      differences: [
        {
          field: "creator",
          contentValue: "CreatorWa11et" + "1".repeat(31),
          onChainValue: "WrongWa11et" + "1".repeat(33),
          updateable: false,
        },
      ],
    });
    renderWithIntl(
      <DeployChangePreview course={c} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    // The creator-specific emphasized copy, beyond the generic immutable warning.
    expect(
      screen.getByText(/every future creator reward would pay the wrong wallet/)
    ).toBeTruthy();
    expect(
      screen.getByText(/Recreating the course is the only fix/)
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirm sync" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Deploy" })).toBeNull();
  });
});
