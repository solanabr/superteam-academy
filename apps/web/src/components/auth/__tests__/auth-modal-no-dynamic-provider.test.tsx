// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * The gate's core promise: with `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` unset the
 * sign-in modal degrades to "no email button", never to a crash.
 *
 * This deliberately does NOT mock the Dynamic SDK. An earlier revision called
 * the SDK's context hook straight from AuthModal on the assumption that it
 * degraded to a default context outside a provider. It does not: the legacy
 * SDK threw on the client while falling back during SSR, so the page rendered
 * fine on the server and crashed on hydration — a build log looked healthy
 * while sign-in was broken for every learner.
 *
 * The headless SDK is stricter still: every hook in
 * `@dynamic-labs-sdk/react-hooks` throws `MissingProviderError` outside a
 * `DynamicProvider`, and they additionally require an enclosing
 * `QueryClientProvider`. So the same class of bug is now possible in two ways,
 * and the gate is still a component boundary — `DynamicEmailSignIn` owns the
 * hooks and mounts only when Dynamic is enabled.
 *
 * The sibling suite mocks the SDK, so only an UNMOCKED render catches this.
 */

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: vi.fn() }),
}));
const { signInWithOAuth } = vi.hoisted(() => ({
  signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({ auth: { signInWithOAuth } })),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

// Unset environment id === the gate is off. Read through lib/dynamic/config,
// which treats undefined and whitespace-only alike as "not configured".
vi.mock("@/lib/dynamic/config", () => ({
  isDynamicEnabled: () => false,
  getDynamicEnvironmentId: () => null,
}));

import { publishAmbientWallet } from "@/lib/solana/ambient-wallet-store";
import { AuthModal } from "../auth-modal";

// A live ambient registration models a (platform) route (#1097); it is the
// plain module store, not a Dynamic provider, so this render still exercises
// "no DynamicProvider mounted".
let unregisterAmbient: (() => void) | null = null;
beforeEach(() => {
  unregisterAmbient = publishAmbientWallet({
    connected: false,
    publicKey: null,
    disconnect: vi.fn(),
    openWalletModal: vi.fn(),
  });
});
afterEach(() => {
  unregisterAmbient?.();
});

describe("AuthModal with Dynamic disabled and no provider mounted", () => {
  it("opens without throwing, and offers the other sign-in methods", { timeout: 15_000 }, async () => {
    expect(() =>
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <AuthModal open onOpenChange={() => {}} />
        </NextIntlClientProvider>
      )
    ).not.toThrow();

    // findBy with a generous timeout: the dialog body is a lazy chunk since
    // #1097, and its first import in a suite loads the Dynamic SDK.
    expect(
      await screen.findByText(
        messages.auth.signInTitle,
        {},
        { timeout: 10_000 }
      )
    ).toBeInTheDocument();
    // The wallet route stays available — it is the guaranteed way in.
    // findBy with a generous timeout: the body chunk's first import in this
    // suite loads the (unmocked) Dynamic SDK.
    expect(
      await screen.findByRole(
        "button",
        { name: messages.auth.connectSolanaWallet },
        { timeout: 10_000 }
      )
    ).toBeInTheDocument();
    // ...and the email button is absent rather than broken.
    expect(
      screen.queryByText(messages.auth.continueWithEmail)
    ).not.toBeInTheDocument();

    // Google falls back to Supabase OAuth. This is the kill switch: unsetting
    // the environment id must restore the pre-Dynamic button, and the button
    // that renders here calls Supabase, not Dynamic — the Dynamic variant
    // would have thrown `MissingProviderError` in this unmocked render.
    fireEvent.click(
      screen.getByRole("button", { name: messages.auth.signInWithGoogle })
    );
    expect(signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google" })
    );
  });

  // A separate render: a click leaves every button disabled while the
  // full-page OAuth navigation is presumed imminent, so the two kill-switch
  // clicks cannot share one modal instance.
  it("GitHub falls back to Supabase OAuth the same way", { timeout: 15_000 }, async () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuthModal open onOpenChange={() => {}} />
      </NextIntlClientProvider>
    );

    fireEvent.click(
      await screen.findByRole(
        "button",
        { name: messages.auth.signInWithGitHub },
        { timeout: 10_000 }
      )
    );
    expect(signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "github" })
    );
  });
});
