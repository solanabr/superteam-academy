// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import ptBR from "@/messages/pt-BR.json";
import es from "@/messages/es.json";

/**
 * A dead chunk must cost the wallet path only (#1109 review).
 *
 * Google and GitHub sign-in need nothing but Supabase — no wallet-adapter, no
 * Dynamic SDK, no provider above them. Before this, a body chunk that failed
 * to load (blocked CDN, stale deploy after a redeploy, offline) replaced the
 * whole modal with a "Try again", so the two methods that never needed the
 * lazy stack became unreachable.
 */

const { signInWithOAuth } = vi.hoisted(() => ({
  signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithOAuth } }),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/dynamic/config", () => ({
  isDynamicEnabled: () => false,
  getDynamicEnvironmentId: () => null,
}));
vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: vi.fn() }),
}));
// What a 404'd chunk looks like to React.lazy: the import rejects. The
// "[vitest] There was an error when mocking a module" lines this factory
// prints ARE the simulated failure, not a broken test.
vi.mock("@/components/auth/auth-modal-body", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

import { AuthModal } from "../auth-modal";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // React logs every boundary-caught error; the boundary is the point here.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AuthModal when the body chunk fails to load", () => {
  it("still offers Google and GitHub through Supabase OAuth", async () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: messages.auth.signInWithGoogle,
      })
    );
    await waitFor(() =>
      expect(signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: "google" })
      )
    );

    expect(
      screen.getByRole("button", { name: messages.auth.signInWithGitHub })
    ).toBeInTheDocument();
    // The wallet path is the only casualty, and the failure says so.
    expect(
      screen.queryByRole("button", { name: messages.auth.connectSolanaWallet })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(messages.auth.optionsLoadFailed, { selector: "p" })
    ).toBeInTheDocument();
  });

  it("does not blame the wallet for a chunk that failed to download", async () => {
    // `authFailed` reads "Wallet authentication failed. Please try again…" —
    // but no wallet was involved and nothing was attempted, and this is the
    // first thing a screen reader announces when the modal opens.
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    // Await the fallback: asserting before the lazy import rejects would pass
    // against the spinner, whatever the copy says.
    expect(await screen.findByRole("alert")).toHaveTextContent(
      messages.auth.optionsLoadFailed
    );
    expect(
      screen.queryByText(messages.auth.authFailed)
    ).not.toBeInTheDocument();
    for (const locale of [messages, ptBR, es]) {
      expect(locale.auth.optionsLoadFailed).not.toMatch(
        /wallet|carteira|billetera/i
      );
    }
  });

  it("drops a stale error when the retry lands, and stays out of reach mid-sign-in", async () => {
    signInWithOAuth.mockResolvedValueOnce({
      error: { message: "provider is down" },
    });
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    const google = await screen.findByRole("button", {
      name: messages.auth.signInWithGoogle,
    });
    fireEvent.click(google);
    await waitFor(() =>
      expect(
        screen.getByText(messages.auth.googleSignInFailed)
      ).toBeInTheDocument()
    );

    // The retry re-attempts the chunk; it must not leave the previous
    // failure sitting above a fresh button set.
    fireEvent.click(screen.getByRole("button", { name: messages.auth.retry }));
    await waitFor(() =>
      expect(
        screen.getByText(messages.auth.optionsLoadFailed)
      ).toBeInTheDocument()
    );
    expect(
      screen.queryByText(messages.auth.googleSignInFailed)
    ).not.toBeInTheDocument();

    // …and while an OAuth redirect is in flight, Retry would remount the
    // chunk out from under it.
    signInWithOAuth.mockImplementationOnce(() => new Promise(() => {}));
    fireEvent.click(
      screen.getByRole("button", { name: messages.auth.signInWithGoogle })
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: messages.auth.retry })
      ).toBeDisabled()
    );
  });

  it("offers a retry that re-attempts the chunk", async () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    const retry = await screen.findByRole("button", {
      name: messages.auth.retry,
    });
    fireEvent.click(retry);

    // The import still fails, so we land back on the same fallback rather than
    // on a blank dialog — and Google is still there.
    expect(
      await screen.findByRole("button", {
        name: messages.auth.signInWithGoogle,
      })
    ).toBeInTheDocument();
  });
});
