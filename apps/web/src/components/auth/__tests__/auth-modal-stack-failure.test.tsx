// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * The other half of the dead-chunk story (#1109 review): the STACK chunk
 * fails while the body loads fine. Only the Solana button depended on that
 * stack, so it is the only thing that may break — and it must say so instead
 * of spinning forever on a handoff that will never happen.
 *
 * This models a marketing route: nothing is registered in the ambient store,
 * so opening the modal arms the scoped stack.
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
// The scoped stack's chunk 404s. The "[vitest] There was an error when
// mocking a module" lines this factory prints ARE the simulated failure.
vi.mock("@/components/auth/scoped-auth-providers", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

// Preloads the chunk AuthModal reaches through React.lazy: only the STACK
// chunk is meant to fail here, and a cold body transform would otherwise race
// these assertions.
import "@/components/auth/auth-modal-body";
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
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AuthModal when the provider-stack chunk fails to load", () => {
  it("keeps Google and GitHub working", async () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    fireEvent.click(
      await screen.findByRole(
        "button",
        {
          name: messages.auth.signInWithGoogle,
        },
        { timeout: 5000 }
      )
    );
    await waitFor(() =>
      expect(signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: "google" })
      )
    );
  });

  it("fails the wallet button loudly instead of hanging on 'Connecting…'", async () => {
    renderWithIntl(<AuthModal open onOpenChange={() => {}} />);

    fireEvent.click(
      await screen.findByRole(
        "button",
        {
          name: messages.auth.connectSolanaWallet,
        },
        { timeout: 5000 }
      )
    );

    const alert = await screen.findByRole("alert", undefined, {
      timeout: 5000,
    });
    expect(alert).toHaveTextContent(messages.auth.authFailed);
    // …and the button is usable again rather than stuck in its loading state.
    expect(
      screen.getByRole("button", { name: messages.auth.connectSolanaWallet })
    ).toBeEnabled();
  });
});
