// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * PR #992 review, blocking finding 1: a Phantom connect failure BEFORE the
 * redirect (closed Google popup, network blip, Phantom outage) used to leave
 * this modal permanently stuck — the provider swallowed the rejection, the
 * modal's catch never ran, `loading` never reset, and the Dialog's close guard
 * (`if (!loading)`) made it unclosable with every button disabled.
 *
 * These tests drive the REAL modal against a rejecting connect and pin the
 * recovery: error shown, buttons re-enabled, dialog closable.
 */

const phantom = vi.hoisted(() => ({
  connect: vi.fn(async () => {}),
}));
vi.mock("@/components/auth/phantom-connect-provider", () => ({
  usePhantomConnect: () => ({
    enabled: true,
    status: "idle",
    address: null,
    connect: phantom.connect,
    disconnect: vi.fn(),
  }),
}));

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: vi.fn() }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOAuth: vi.fn() } }),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { AuthModal } from "../auth-modal";

function openModal() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AuthModal />
    </NextIntlClientProvider>
  );
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
  return screen.findByRole("dialog");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthModal — Phantom failure recovery (#992 review)", () => {
  it("shows the error and re-enables every sign-in option after a rejected connect", async () => {
    phantom.connect.mockRejectedValueOnce(new Error("popup closed"));
    await openModal();

    fireEvent.click(
      screen.getByRole("button", { name: /continue with phantom/i })
    );

    // The localized failure message renders…
    expect(
      await screen.findByText(messages.auth.phantomSignInFailed)
    ).toBeInTheDocument();
    // …and `loading` reset, so nothing stays disabled — the learner can retry
    // Phantom or fall back to any other method.
    for (const name of [
      /continue with phantom/i,
      /connect solana wallet/i,
      /sign in with google/i,
      /sign in with github/i,
    ]) {
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
  });

  it("keeps the dialog CLOSABLE after the failure — the stuck-modal bug", async () => {
    phantom.connect.mockRejectedValueOnce(new Error("phantom outage"));
    const dialog = await openModal();

    fireEvent.click(
      screen.getByRole("button", { name: /continue with phantom/i })
    );
    await screen.findByText(messages.auth.phantomSignInFailed);

    // The Dialog's onOpenChange only honours a close when !loading. Before the
    // fix `loading` was stuck on "phantom", so Escape did nothing, forever.
    fireEvent.keyDown(dialog, { key: "Escape" });

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("stays in the loading state while a connect is genuinely in flight", async () => {
    // Never resolves — the tab would normally navigate away mid-redirect.
    phantom.connect.mockImplementationOnce(() => new Promise(() => {}));
    await openModal();

    fireEvent.click(
      screen.getByRole("button", { name: /continue with phantom/i })
    );

    // A spinner during a real redirect handoff is CORRECT — the guard exists
    // to stop accidental dismissal mid-auth. Only failure must unstick it.
    expect(
      await screen.findByText(messages.auth.connecting)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with google/i })
    ).toBeDisabled();
  });
});
