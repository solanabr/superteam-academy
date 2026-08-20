// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import {
  publishAmbientWallet,
  setWalletReturnCaptureActive,
} from "@/lib/solana/ambient-wallet-store";
// Preloads the chunk AuthModal reaches through React.lazy, so these
// assertions never race a cold transform of its graph (#1109 flake).
import "@/components/auth/auth-modal-body";
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
// registrar, the fake registers itself in the ambient store on mount, which
// is what the Solana button waits on.
vi.mock("@/components/auth/scoped-auth-providers", async () => {
  const { publishAmbientWallet: publish } =
    await import("@/lib/solana/ambient-wallet-store");
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
  it("lazily mounts the scoped stack when opened with no live stack, and the body renders once it registers", async () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    expect(await screen.findByTestId("scoped-providers")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: CONNECT_WALLET })
    ).toBeInTheDocument();
  });

  it("mounts nothing scoped while closed", () => {
    renderWithIntl(<AuthModal open={false} onOpenChange={() => {}} />);
    expect(screen.queryByTestId("scoped-providers")).not.toBeInTheDocument();
  });

  it("keeps the scoped stack mounted after the dialog closes (wallet-modal handoff)", async () => {
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

  it("never mounts the scoped stack when a live stack is registered (double-mount guard)", async () => {
    const unregister = fakeAmbient();
    try {
      renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

      expect(
        await screen.findByRole("button", { name: CONNECT_WALLET })
      ).toBeInTheDocument();
      expect(screen.queryByTestId("scoped-providers")).not.toBeInTheDocument();
    } finally {
      unregister();
    }
  });

  it("disarms its own stack when another one registers while mounted (NEW-2: navigation with the modal open)", async () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);
    await screen.findByTestId("scoped-providers");

    // The learner navigates to a (platform) route with the dialog up: the
    // layout's stack registers as a second live stack…
    const unregister = fakeAmbient();
    try {
      // …and the modal drops its own, converging back to one stack while the
      // body keeps rendering against the newcomer.
      await waitFor(() =>
        expect(screen.queryByTestId("scoped-providers")).not.toBeInTheDocument()
      );
      expect(
        await screen.findByRole("button", { name: CONNECT_WALLET })
      ).toBeInTheDocument();
    } finally {
      unregister();
    }
  });

  it("clears a stuck loading state when the dialog closes (#1126)", async () => {
    // In the capture window no stack of ours will ever register, so the Solana
    // click pins `loading` — which lives in the shell while the body's
    // `awaitingStack` is a ref inside the lazy chunk. A body remount orphaned
    // it permanently, and `onOpenChange` refuses to close while it is truthy.
    setWalletReturnCaptureActive();
    const controlled = (open: boolean) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuthModal open={open} onOpenChange={() => {}} />
      </NextIntlClientProvider>
    );
    const { rerender } = render(controlled(true));

    fireEvent.click(
      await screen.findByRole("button", { name: CONNECT_WALLET })
    );
    expect(
      await screen.findByRole("button", { name: messages.auth.connecting })
    ).toBeDisabled();

    rerender(controlled(false));
    rerender(controlled(true));

    expect(
      await screen.findByRole("button", { name: CONNECT_WALLET })
    ).toBeEnabled();
  });

  it("does not arm while the catcher's capture window is open (F4), then renders the body once that stack registers", async () => {
    setWalletReturnCaptureActive();
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    // No modal-owned stack while the catcher's is on the way…
    expect(screen.queryByTestId("scoped-providers")).not.toBeInTheDocument();
    // …but the buttons that need no stack are already there (#1109 review):
    // this used to be a full-body spinner.
    expect(
      await screen.findByRole("button", {
        name: messages.auth.signInWithGoogle,
      })
    ).toBeEnabled();

    // The catcher's stack registers (this also clears the capture flag)…
    const unregister = fakeAmbient();
    try {
      // …and the body proceeds against it, still with no modal-owned stack.
      expect(
        await screen.findByRole("button", { name: CONNECT_WALLET })
      ).toBeInTheDocument();
      expect(screen.queryByTestId("scoped-providers")).not.toBeInTheDocument();
    } finally {
      unregister();
    }
  });
});
