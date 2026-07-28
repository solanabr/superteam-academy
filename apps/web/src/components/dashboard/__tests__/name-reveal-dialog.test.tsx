// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { NameRevealDialog } from "../name-reveal-dialog";

const updateMock = vi.fn();
let prefsResult: { data: { prefs: unknown } | null; error: unknown } = {
  data: { prefs: {} },
  error: null,
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve(prefsResult) }),
      }),
      update: (values: unknown) => {
        updateMock(values);
        return { eq: () => Promise.resolve({ error: null }) };
      },
    }),
  }),
}));

vi.mock("@/components/profile/wallet-name-generator", () => ({
  WalletNameGenerator: () => <div>name-generator</div>,
}));

function renderDialog(overrides: Partial<{ nameRerollsUsed: number }> = {}) {
  return render(
    <NameRevealDialog
      isLoading={false}
      userId="u1"
      username="CoolPanda"
      nameRerollsUsed={overrides.nameRerollsUsed ?? 0}
    />
  );
}

beforeEach(() => {
  localStorage.clear();
  updateMock.mockClear();
  prefsResult = { data: { prefs: {} }, error: null };
});
afterEach(() => localStorage.clear());

describe("NameRevealDialog (#843)", () => {
  it("shows for a learner who has never completed the reveal", async () => {
    renderDialog();
    expect(await screen.findByText("name-generator")).toBeInTheDocument();
  });

  // The regression: accepting the generated name leaves name_rerolls_used at 0
  // forever, so the server flag is the only thing that can suppress it.
  it("stays hidden when prefs.nameRevealSeen is set, even with 0 rerolls", async () => {
    prefsResult = { data: { prefs: { nameRevealSeen: true } }, error: null };
    renderDialog({ nameRerollsUsed: 0 });
    await waitFor(() =>
      expect(screen.queryByText("name-generator")).not.toBeInTheDocument()
    );
  });

  it("hydrates the local fast path from the server flag", async () => {
    prefsResult = { data: { prefs: { nameRevealSeen: true } }, error: null };
    renderDialog();
    await waitFor(() =>
      expect(localStorage.getItem("nameRevealSeen")).toBe("1")
    );
  });

  it("suppresses via localStorage without hitting the network", async () => {
    localStorage.setItem("nameRevealSeen", "1");
    renderDialog();
    await waitFor(() =>
      expect(screen.queryByText("name-generator")).not.toBeInTheDocument()
    );
  });

  // Fail closed: re-prompting someone who already named themselves is the bug.
  it("stays hidden when the prefs read errors", async () => {
    prefsResult = { data: null, error: { message: "boom" } };
    renderDialog();
    await waitFor(() =>
      expect(screen.queryByText("name-generator")).not.toBeInTheDocument()
    );
  });

  it("merges the flag into existing prefs rather than replacing them", async () => {
    prefsResult = {
      data: { prefs: { nextLesson: { day: "tue", time: "19:00" } } },
      error: null,
    };
    renderDialog();
    await screen.findByText("name-generator");

    // Radix closes on Escape → onOpenChange → handleNameConfirm.
    fireEvent.keyDown(document.body, { key: "Escape" });

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith({
        prefs: {
          nextLesson: { day: "tue", time: "19:00" },
          nameRevealSeen: true,
        },
      })
    );
  });
});
