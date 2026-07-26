// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { CourseCompletionMint } from "../course-completion-mint";
import {
  resetAnalyticsEventDedupeForTests,
  trackCredentialMinted,
} from "@/lib/analytics/events";
import messages from "@/messages/en.json";

// Real events module between component and facade — asserts the wire format
// AND the cross-path dedupe with the Realtime observation.
const h = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  celebrate: vi.fn(),
  db: {
    certificate: null as Record<string, unknown> | null,
    progressCount: 0,
    profile: {
      wallet_address: "test-wallet",
      username: "learner",
    } as Record<string, unknown> | null,
  },
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: h.trackEvent }));
vi.mock("@/lib/gamification/celebration", () => ({ celebrate: h.celebrate }));
vi.mock("../earn-handoff-card", () => ({ EarnHandoffCard: () => null }));
vi.mock("../credential-share-nudge", () => ({
  CredentialShareNudge: () => null,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: () =>
          Promise.resolve({
            data: table === "certificates" ? h.db.certificate : null,
          }),
        single: () =>
          Promise.resolve({
            data: table === "profiles" ? h.db.profile : null,
          }),
        then: (
          resolve: (value: { data: unknown[]; count: number }) => unknown
        ) => resolve({ data: [], count: h.db.progressCount }),
      };
      return query;
    },
  }),
}));

function renderMint() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CourseCompletionMint
        courseId="course-solana-101"
        userId="user-1"
        totalLessons={3}
      />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  h.trackEvent.mockClear();
  h.celebrate.mockClear();
  h.db.certificate = null;
  h.db.progressCount = 3;
  resetAnalyticsEventDedupeForTests();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => ({}) }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CourseCompletionMint — credential_minted (manual mint path)", () => {
  it("fires credential_minted with courseId on manual mint success", async () => {
    renderMint();
    const mintButton = await screen.findByRole("button", {
      name: "Mint Certificate",
    });
    expect(h.trackEvent).not.toHaveBeenCalled();

    fireEvent.click(mintButton);

    await waitFor(() =>
      expect(h.trackEvent).toHaveBeenCalledWith("credential_minted", {
        courseId: "course-solana-101",
        source: "manual_mint",
      })
    );
    expect(h.trackEvent).toHaveBeenCalledTimes(1);
  });

  it("does not double-fire when the Realtime INSERT observes the same mint", async () => {
    renderMint();
    fireEvent.click(
      await screen.findByRole("button", { name: "Mint Certificate" })
    );
    await waitFor(() => expect(h.trackEvent).toHaveBeenCalledTimes(1));

    // The Supabase Realtime certificates-INSERT path lands moments later
    // (use-gamification-events.ts) — same course, same mint.
    trackCredentialMinted("course-solana-101", "realtime");

    expect(h.trackEvent).toHaveBeenCalledTimes(1);
  });

  it("does not fire when the mint API rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ error: "Minting failed" }),
      }))
    );
    renderMint();
    fireEvent.click(
      await screen.findByRole("button", { name: "Mint Certificate" })
    );

    await screen.findByText(/Minting failed/);
    expect(h.trackEvent).not.toHaveBeenCalled();
  });
});
