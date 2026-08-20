// @vitest-environment jsdom
import type { ReactElement, ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { AmbientWalletProvider } from "@/lib/solana/optional-wallet";
import { AuthModal } from "../auth-modal";

/**
 * #1097 — where the wallet/Dynamic providers come from when the sign-in
 * modal opens:
 *
 * - No ambient stack (marketing/admin): AuthModal lazily mounts
 *   ScopedAuthProviders around the dialog, and keeps it mounted after close
 *   (the Solana path hands off to the wallet-select modal, which must
 *   outlive this dialog).
 * - Ambient stack ((platform) routes): the scoped stack must NOT mount —
 *   nesting a second WalletProvider duplicates autoConnect and listeners.
 */

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: vi.fn() }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) },
  })),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

// The real module mounts wallet-adapter + the Dynamic SDK; this test is about
// WHEN the stack mounts, not what is inside it. The marker still stamps
// AmbientWalletProvider, exactly like the real stack's SolanaWalletProvider
// does, so the modal body's provider gate opens.
vi.mock("@/components/auth/scoped-auth-providers", async () => {
  const { AmbientWalletProvider: Stamp } =
    await import("@/lib/solana/optional-wallet");
  return {
    default: ({ children }: { children?: ReactNode }) => (
      <div data-testid="scoped-providers">
        <Stamp>{children}</Stamp>
      </div>
    ),
  };
});

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const TITLE = messages.auth.signInTitle;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthModal scoped provider mounting (#1097)", () => {
  it("lazily mounts the scoped stack when opened without ambient providers", async () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    expect(await screen.findByTestId("scoped-providers")).toBeInTheDocument();
    // The body renders INSIDE the stack (its wallet hooks resolve there).
    // Generous timeout: the body chunk's first import loads the Dynamic SDK.
    expect(
      await screen.findByText(TITLE, {}, { timeout: 10_000 })
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

    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("scoped-providers")).toBeInTheDocument();
  });

  it("never mounts the scoped stack when ambient providers exist (double-mount guard)", async () => {
    renderWithIntl(
      <AmbientWalletProvider>
        <AuthModal open onOpenChange={() => {}} />
      </AmbientWalletProvider>
    );

    expect(await screen.findByText(TITLE)).toBeInTheDocument();
    expect(screen.queryByTestId("scoped-providers")).not.toBeInTheDocument();
  });
});
