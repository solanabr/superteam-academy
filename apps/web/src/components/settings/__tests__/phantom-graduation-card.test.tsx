// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * #987 — the graduation card renders ONLY for wallets provisioned through
 * Phantom Connect. The gate is the point: a learner who linked an external
 * wallet must never be told to "download Phantom to take it with you" —
 * those instructions are nonsense for a wallet that already lives elsewhere.
 */

const db = vi.hoisted(() => ({
  prefs: null as unknown,
  user: { id: "user-1" } as { id: string } | null,
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: db.user } })) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { prefs: db.prefs } }),
        }),
      }),
    }),
  }),
}));

import { PhantomGraduationCard } from "../phantom-graduation-card";

const WALLET = "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF";

function renderCard() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PhantomGraduationCard walletAddress={WALLET} />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  db.prefs = null;
  db.user = { id: "user-1" };
});

describe("PhantomGraduationCard — provenance gate (#987)", () => {
  it("renders for a Phantom-provisioned wallet, with the address tail to confirm against", async () => {
    db.prefs = { walletProvider: "phantom-embedded", nextLesson: {} };

    renderCard();

    expect(
      await screen.findByText(messages.settings.phantomGraduationTitle)
    ).toBeInTheDocument();
    // First/last four characters — what the learner compares inside Phantom.
    expect(screen.getByText("B7o8…vzJF")).toBeInTheDocument();
    // The load-bearing instruction: sign in with Google, never Create new.
    expect(
      screen.getByText(messages.settings.phantomGraduationStep2)
    ).toBeInTheDocument();
  });

  it("links to Phantom's own help article", async () => {
    db.prefs = { walletProvider: "phantom-embedded" };

    renderCard();

    const link = await screen.findByRole("link", {
      name: messages.settings.phantomGraduationHelp,
    });
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("help.phantom.com")
    );
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("renders NOTHING for an external wallet (no provenance)", async () => {
    db.prefs = { nextLesson: { days: ["tue"] } }; // prefs exist, no provenance

    const { container } = renderCard();

    // The gate must fail closed — wait for the fetch to settle, then assert
    // silence rather than a flash of wrong instructions.
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders nothing when prefs are null entirely", async () => {
    db.prefs = null;
    const { container } = renderCard();
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("renders nothing when signed out", async () => {
    db.user = null;
    const { container } = renderCard();
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
