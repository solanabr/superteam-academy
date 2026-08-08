// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * #987 — provenance for the graduation card. A successful bridge cannot write
 * prefs directly: on the fresh sign-in path the browser client has no session
 * until after the reload, so the handler stamps a localStorage marker and this
 * mount effect flushes it into `prefs.walletProvider` on the next load.
 */

const db = vi.hoisted(() => ({
  user: { id: "user-1" } as { id: string } | null,
  prefs: null as unknown,
  readError: null as { message: string } | null,
  updates: [] as Array<Record<string, unknown>>,
  getUser: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: db.getUser.mockImplementation(async () => ({
        data: { user: db.user },
      })),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: db.readError ? null : { prefs: db.prefs },
            error: db.readError,
          }),
        }),
      }),
      update: (payload: Record<string, unknown>) => {
        db.updates.push(payload);
        return { eq: async () => ({ error: null }) };
      },
    }),
  }),
}));

// Keep the bridge effect inert: no connected address, only the flush runs.
vi.mock("@/components/auth/phantom-connect-provider", () => ({
  usePhantomConnect: () => ({
    enabled: true,
    status: "idle",
    address: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));
vi.mock("@/lib/phantom/siws", () => ({ runPhantomSiws: vi.fn() }));
vi.mock("@/lib/phantom/client", () => ({ createPhantomClient: () => null }));

import { PhantomAuthHandler } from "../phantom-auth-handler";

function renderHandler() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PhantomAuthHandler />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  db.user = { id: "user-1" };
  db.prefs = null;
  db.readError = null;
  db.updates.length = 0;
});

describe("PhantomAuthHandler — deferred provenance flush (#987)", () => {
  it("flushes the marker into prefs.walletProvider, merging sibling keys, then clears it", async () => {
    localStorage.setItem("phantomEmbeddedPending", "1");
    db.prefs = { nextLesson: { days: ["tue"] }, nameRevealSeen: true };

    renderHandler();

    await waitFor(() => expect(db.updates.length).toBeGreaterThan(0));
    const written = db.updates[0]?.prefs as Record<string, unknown>;
    expect(written.walletProvider).toBe("phantom-embedded");
    // Merge, never clobber: the same prefs blob carries nextLesson and the
    // name-reveal record — a blind write here would erase them.
    expect(written.nextLesson).toEqual({ days: ["tue"] });
    expect(written.nameRevealSeen).toBe(true);
    // Cleared only after a successful write.
    await waitFor(() =>
      expect(localStorage.getItem("phantomEmbeddedPending")).toBeNull()
    );
  });

  it("keeps the marker when the prefs read fails, so the flush retries next load", async () => {
    localStorage.setItem("phantomEmbeddedPending", "1");
    db.readError = { message: "read failed" };

    renderHandler();

    await waitFor(() => expect(db.getUser).toHaveBeenCalled());
    // No blind write — merging was impossible.
    expect(db.updates).toHaveLength(0);
    expect(localStorage.getItem("phantomEmbeddedPending")).toBe("1");
  });

  it("does nothing at all without the marker", async () => {
    renderHandler();

    // Give any stray async work a tick to surface.
    await new Promise((r) => setTimeout(r, 50));
    expect(db.getUser).not.toHaveBeenCalled();
    expect(db.updates).toHaveLength(0);
  });
});
