// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock calls must precede importing the component. */
// #843 — the name-reveal modal must be gated on the DURABLE record
// (profiles.prefs.nameRevealSeen), not on localStorage or name_rerolls_used:
// a learner who accepts the first generated name leaves rerolls at 0 forever,
// and localStorage is per-browser, so the old gate re-prompted on every new
// device/cleared profile.
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

const { maybeSingle, updatePayloads } = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  updatePayloads: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle }) }),
      update: (payload: Record<string, unknown>) => {
        updatePayloads.push(payload);
        return { eq: () => Promise.resolve({ error: null }) };
      },
    }),
  }),
}));

import { NameRevealDialog } from "../name-reveal-dialog";

function renderDialog(props: { nameRerollsUsed?: number } = {}): ReactElement {
  const ui = (
    <NextIntlClientProvider locale="en" messages={messages}>
      <NameRevealDialog
        isLoading={false}
        userId="user-1"
        username="brave-anchor-9000"
        nameRerollsUsed={props.nameRerollsUsed ?? 0}
      />
    </NextIntlClientProvider>
  );
  render(ui);
  return ui;
}

beforeEach(() => {
  vi.clearAllMocks();
  updatePayloads.length = 0;
  localStorage.clear();
});

describe("NameRevealDialog — durable already-seen gate (#843)", () => {
  it("never re-shows for a learner who confirmed on another device (prefs.nameRevealSeen set, localStorage empty)", async () => {
    // The accept-without-reroll path: rerolls stayed 0, this browser has no
    // localStorage record, but the profiles row says the reveal was confirmed.
    maybeSingle.mockResolvedValue({
      data: { prefs: { nameRevealSeen: true } },
      error: null,
    });

    renderDialog({ nameRerollsUsed: 0 });

    // The component must consult the profiles row before deciding to prompt.
    await waitFor(() => expect(maybeSingle).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("still shows once for a genuinely new learner (prefs empty)", async () => {
    maybeSingle.mockResolvedValue({ data: { prefs: null }, error: null });

    renderDialog({ nameRerollsUsed: 0 });

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("persists nameRevealSeen to profiles.prefs on confirm, merging other prefs keys", async () => {
    const existingPrefs = { nextLesson: { day: "tue", time: "19:00" } };
    maybeSingle.mockResolvedValue({
      data: { prefs: existingPrefs },
      error: null,
    });
    // The gate read sees no seen-flag → show; force that for the first read.
    maybeSingle.mockResolvedValueOnce({
      data: { prefs: existingPrefs },
      error: null,
    });

    renderDialog({ nameRerollsUsed: 0 });
    await screen.findByRole("dialog");

    screen.getByRole("button", { name: /ship it/i }).click();

    await waitFor(() => expect(updatePayloads.length).toBeGreaterThan(0));
    const written = updatePayloads[updatePayloads.length - 1]?.prefs as Record<
      string,
      unknown
    >;
    expect(written.nameRevealSeen).toBe(true);
    // Merge, don't clobber: sibling prefs keys survive the confirm write.
    expect(written.nextLesson).toEqual(existingPrefs.nextLesson);
    expect(localStorage.getItem("nameRevealSeen")).toBe("1");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("skips the durable write when the confirm-time prefs read fails — never clobber on a blind merge", async () => {
    // Gate read succeeds (new learner) → dialog shows.
    maybeSingle.mockResolvedValueOnce({ data: { prefs: null }, error: null });
    // Confirm-time re-read fails: merging is impossible, so writing anyway
    // would clobber sibling prefs keys (e.g. nextLesson) with a bare
    // { nameRevealSeen: true } object.
    maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "read failed" },
    });

    renderDialog({ nameRerollsUsed: 0 });
    await screen.findByRole("dialog");

    screen.getByRole("button", { name: /ship it/i }).click();

    // Both reads settled (gate + confirm re-read) …
    await waitFor(() => expect(maybeSingle).toHaveBeenCalledTimes(2));
    // … but no prefs UPDATE happened; the localStorage fast path still covers
    // this browser and the dialog still closes.
    expect(updatePayloads).toHaveLength(0);
    expect(localStorage.getItem("nameRevealSeen")).toBe("1");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("does NOT write prefs on bare dismissal (Escape/overlay/X) — only per-browser localStorage", async () => {
    maybeSingle.mockResolvedValue({ data: { prefs: null }, error: null });

    renderDialog({ nameRerollsUsed: 0 });
    const dialog = await screen.findByRole("dialog");

    // The X close button drives Radix onOpenChange(false), same path as
    // Escape and overlay taps.
    screen.getByRole("button", { name: /close/i }).click();

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    // Accidental dismissal must not durably bury the reveal cross-device:
    // no prefs write, no confirm-time re-read — only the gate read ran.
    expect(updatePayloads).toHaveLength(0);
    expect(maybeSingle).toHaveBeenCalledTimes(1);
    // Pre-#843 per-browser behavior is kept: this browser stops nagging.
    expect(localStorage.getItem("nameRevealSeen")).toBe("1");
  });

  it("keeps localStorage as an offline fast path — no prompt, no fetch, when already recorded locally", () => {
    localStorage.setItem("nameRevealSeen", "1");

    renderDialog({ nameRerollsUsed: 0 });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("does not prompt learners who already rerolled (rerolls > 0 proves they saw it)", () => {
    renderDialog({ nameRerollsUsed: 2 });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
