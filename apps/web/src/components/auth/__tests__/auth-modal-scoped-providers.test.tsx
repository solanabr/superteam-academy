// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import {
  publishAmbientWallet,
  setWalletReturnCaptureActive,
} from "@/lib/solana/ambient-wallet-store";
import { AuthModal } from "../auth-modal";

/**
 * #1097 — where the wallet/Dynamic providers come from when the sign-in
 * modal opens:
 *
 * - No live stack (marketing/admin): AuthModal lazily mounts
 *   ScopedAuthProviders as a sibling of the Dialog, and keeps it mounted
 *   after close (the Solana path hands off to the wallet-select modal, which
 *   lives in that stack).
 * - Live ambient stack ((platform) routes register in the store): the scoped
 *   stack must NOT mount — a second WalletProvider duplicates autoConnect,
 *   listeners, and SIWS.
 * - Catcher capture window (a Dynamic redirect return is standing up its own
 *   stack): the modal must not arm either (review F4).
 */

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) },
  })),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

// The real module mounts wallet-adapter + the Dynamic SDK; this suite is
// about WHEN the stack mounts, not what is inside it. Like the real stack's
// registrar, the fake registers itself in the ambient store on mount so the
// modal's body gate opens.
vi.mock("@/components/auth/scoped-auth-providers", async () => {
  const { publishAmbientWallet: publish } = await import(
    "@/lib/solana/ambient-wallet-store"
  );
  const { useEffect } = await import("react");
  return {
    default: function FakeScopedStack() {
      useEffect(
        () =>
          publish({
            connected: false,
            publicKey: null,
            disconnect: async () => {},
            openWalletModal: () => {},
          }),
        []
      );
      return <div data-testid="scoped-providers" />;
    },
  };
});

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const fakeAmbient = () =>
  publishAmbientWallet({
    connected: false,
    publicKey: null,
    disconnect: async () => {},
    openWalletModal: () => {},
  });

const CONNECT_WALLET = messages.auth.connectSolanaWallet;

afterEach(() => {
  // Reset module-store state between tests: a publish clears the capture
  // flag, and unregistering leaves the store empty.
  fakeAmbient()();
  vi.clearAllMocks();
});

describe("AuthModal scoped provider mounting (#1097)", () => {
  it("lazily mounts the scoped stack when opened with no live stack, and the body renders once it registers", { timeout: 15_000 }, async () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    expect(await screen.findByTestId("scoped-providers")).toBeInTheDocument();
    // Generous timeout: the body chunk's first import loads the Dynamic SDK.
    expect(
      await screen.findByRole(
        "button",
        { name: CONNECT_WALLET },
        { timeout: 10_000 }
      )
    ).toBeInTheDocument();
  });

  it("mounts nothing scoped while closed", () => {
    renderWithIntl(<AuthModal open={false} onOpenChange={() => {}} />);
    expect(screen.queryByTestId("scoped-providers")).not.toBeInTheDocument();
  });

  it("keeps the scoped stack mounted after the dialog closes (wallet-modal handoff)", { timeout: 15_000 }, async () => {
    const { rerender } = renderWithIntl(
      <AuthModal open onOpenChange={() => {}} />
    );
    await screen.findByTestId("scoped-providers");

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuthModal open={false} onOpenChange={() => {}} />
      </NextIntlClientProvider>
    );

    expect(
      screen.queryByText(messages.auth.signInTitle)
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("scoped-providers")).toBeInTheDocument();
  });

  it("never mounts the scoped stack when a live stack is registered (double-mount guard)", { timeout: 15_000 }, async () => {
    const unregister = fakeAmbient();
    try {
      renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

      expect(
        await screen.findByRole(
          "button",
          { name: CONNECT_WALLET },
          { timeout: 10_000 }
        )
      ).toBeInTheDocument();
      expect(screen.queryByTestId("scoped-providers")).not.toBeInTheDocument();
    } finally {
      unregister();
    }
  });

  it("does not arm while the catcher's capture window is open (F4), then renders the body once that stack registers", { timeout: 15_000 }, async () => {
    setWalletReturnCaptureActive();
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    // The modal shows the standing-up spinner and must not start its own
    // stack while the catcher's is on the way.
    expect(screen.queryByTestId("scoped-providers")).not.toBeInTheDocument();

    // The catcher's stack registers (this also clears the capture flag)…
    const unregister = fakeAmbient();
    try {
      // …and the body proceeds against it, still with no modal-owned stack.
      expect(
        await screen.findByRole(
          "button",
          { name: CONNECT_WALLET },
          { timeout: 10_000 }
        )
      ).toBeInTheDocument();
      expect(screen.queryByTestId("scoped-providers")).not.toBeInTheDocument();
    } finally {
      unregister();
    }
  });
});
