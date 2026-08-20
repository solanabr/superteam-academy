// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import type { ReactElement } from "react";
import { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * The dialog and the SIWS overlay CAN coexist, and used to fight (#1109
 * follow-up).
 *
 * Since #1097 opening the sign-in dialog is what mounts the wallet stack, and
 * `SolanaWalletProvider` sets `autoConnect`, so a returning signed-out learner
 * whose wallet name is still in localStorage reconnects the instant the stack
 * mounts — firing SIWS with the dialog still open. Radix marks the body
 * `pointer-events: none` for a modal dialog, and the body-portalled overlay
 * inherits it: Retry and Dismiss render over a full-screen scrim and neither
 * one can be clicked. Before this PR the overlay at least painted UNDER the
 * dialog, so the learner kept a working dialog; the portal fix alone made that
 * window strictly worse.
 *
 * The handler now raises a flag the modal watches, and the modal closes —
 * the same handoff the manual wallet path already does.
 */

const walletState = vi.hoisted(() => ({
  signMessage: vi.fn(async () => new Uint8Array([1, 2, 3])),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    connected: true,
    publicKey: {
      toBase58: () => "TestWa11etPubkey1111111111111111111111111111",
    },
    signMessage: walletState.signMessage,
    signIn: undefined,
  }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/dynamic/config", () => ({
  isDynamicEnabled: () => false,
  getDynamicEnvironmentId: () => null,
}));

// Stands in for the real scoped stack: mounts the real WalletAuthHandler (the
// component under test) and registers in the ambient store the way
// SolanaWalletProvider's registrar does. What it deliberately does NOT do is
// pull in wallet-adapter's providers, which jsdom cannot run.
vi.mock("@/components/auth/scoped-auth-providers", async () => {
  const { publishAmbientWallet } =
    await import("@/lib/solana/ambient-wallet-store");
  const { useEffect } = await import("react");
  const { WalletAuthHandler } = await import("../wallet-auth-handler");
  return {
    default: function FakeScopedStack() {
      useEffect(
        () =>
          publishAmbientWallet({
            connected: true,
            publicKey: "TestWa11etPubkey1111111111111111111111111111",
            disconnect: async () => {},
            openWalletModal: () => {},
          }),
        []
      );
      return <WalletAuthHandler />;
    },
  };
});

import "@/components/auth/auth-modal-body";
import { AuthModal } from "../auth-modal";

/** Controlled the way the landing hero and the Enroll CTA drive it. */
function ControlledModal({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <AuthModal
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) onClose();
      }}
    />
  );
}

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  walletState.signMessage.mockImplementation(
    async () => new Uint8Array([1, 2, 3])
  );
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  // Unmount FIRST, while the wallet mock is still in place. RTL registers its
  // own cleanup at import time, so LIFO ordering runs this hook before it —
  // restoring mocks here would tear the mock out from under the unmount, and
  // WalletAuthHandler's SIWS claim is released in an effect cleanup. A claim
  // that leaks is module-level state: the next test in this file would see a
  // spurious siwsActive and the dialog would close for the wrong reason.
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("SIWS firing while the sign-in dialog is open", () => {
  it("closes the dialog so the overlay's buttons are reachable", async () => {
    // The nonce never settles, so the overlay stays on "authenticating".
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {}))
    );
    const onClose = vi.fn();

    renderWithIntl(<ControlledModal onClose={onClose} />);

    await screen.findByTestId("siws-overlay");
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.queryByText(messages.auth.signInTitle)
      ).not.toBeInTheDocument()
    );

    // The proof the regression is gone: Radix's modal body lock is lifted, so
    // the overlay does not inherit `pointer-events: none`.
    expect(document.body.style.pointerEvents).not.toBe("none");
  });

  it("leaves Retry and Dismiss clickable when SIWS fails under the open dialog", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : String(input);
        if (url.includes("/api/auth/nonce")) {
          return {
            ok: true,
            json: async () => ({ nonce: "test-nonce", domain: "localhost" }),
          } as Response;
        }
        return {
          ok: false,
          json: async () => ({ error: "serverError" }),
        } as Response;
      })
    );

    renderWithIntl(<ControlledModal onClose={vi.fn()} />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(messages.auth.authFailed);

    // Both were rendered before this fix too — and both were inert, because
    // the dialog was still open and the body still had pointer-events: none.
    await waitFor(() =>
      expect(document.body.style.pointerEvents).not.toBe("none")
    );
    expect(
      screen.getByRole("button", { name: messages.auth.retry })
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: messages.auth.dismiss })
    ).toBeEnabled();
    expect(
      screen.queryByText(messages.auth.signInTitle)
    ).not.toBeInTheDocument();
  });

  it("says so when the learner declines, instead of emptying the screen", async () => {
    // The compounding case. A returning learner clicks Sign in, their wallet
    // auto-reconnects and pops a signature prompt they never asked for, and
    // they refuse it. Dismissing silently was fine while the dialog stayed up
    // BEHIND the overlay — Google and GitHub were still in front of them. It
    // closes now, so silence would leave nothing at all.
    walletState.signMessage.mockRejectedValueOnce(new Error("User rejected"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ nonce: "test-nonce", domain: "localhost" }),
      }))
    );

    renderWithIntl(<ControlledModal onClose={vi.fn()} />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(messages.auth.signatureDeclined);
    // Retry is the one that matters: `hasTriedAuth` only resets on DISCONNECT,
    // so re-opening the modal and re-picking the same connected wallet would
    // not re-fire SIWS.
    expect(
      screen.getByRole("button", { name: messages.auth.retry })
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: messages.auth.dismiss })
    ).toBeEnabled();
    // Not the wallet-failure copy — they chose this.
    expect(alert).not.toHaveTextContent(messages.auth.authFailed);
  });

  it("opts the overlay out of an inherited body lock", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {}))
    );
    renderWithIntl(<ControlledModal onClose={vi.fn()} />);

    // jsdom loads no stylesheet, so this can only assert the class, not the
    // computed value. It covers the dialog's exit-animation window — the
    // content is still mounted, and the body still locked, for as long as the
    // close animation runs — and any other modal that is up when SIWS fires.
    expect(await screen.findByTestId("siws-overlay")).toHaveClass(
      "pointer-events-auto"
    );
  });
});
