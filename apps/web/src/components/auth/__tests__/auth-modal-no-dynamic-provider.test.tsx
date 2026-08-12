// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * The gate's core promise: with `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` unset the
 * sign-in modal degrades to "no email button", never to a crash.
 *
 * This deliberately does NOT mock `@dynamic-labs/sdk-react-core`. An earlier
 * revision called `useDynamicContext()` straight from AuthModal on the
 * assumption that it degraded to a default context outside a provider. It does
 * not — it throws on the client, falling back only during SSR:
 *
 *   const DynamicContext = createContext(undefined);
 *   if (context === undefined) {
 *     if (isSSR()) return SSR_SAFE_DYNAMIC_CONTEXT;
 *     throw new Error('Hook must be used within <DynamicContextProvider>.');
 *   }
 *
 * That SSR fallback is what made it dangerous: the page rendered fine on the
 * server and crashed on hydration, so a build log looked healthy while sign-in
 * was broken for every learner. The sibling suite mocks the hook, so only an
 * UNMOCKED render can catch a regression here.
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

// Unset environment id === the gate is off. Read through lib/dynamic/config,
// which treats undefined and whitespace-only alike as "not configured".
vi.mock("@/lib/dynamic/config", () => ({
  isDynamicEnabled: () => false,
  getDynamicEnvironmentId: () => null,
}));

import { AuthModal } from "../auth-modal";

describe("AuthModal with Dynamic disabled and no provider mounted", () => {
  it("opens without throwing, and offers the other sign-in methods", () => {
    expect(() =>
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <AuthModal open onOpenChange={() => {}} />
        </NextIntlClientProvider>
      )
    ).not.toThrow();

    expect(screen.getByText(messages.auth.signInTitle)).toBeInTheDocument();
    // The wallet route stays available — it is the guaranteed way in.
    expect(
      screen.getByRole("button", { name: messages.auth.connectSolanaWallet })
    ).toBeInTheDocument();
    // ...and the email button is absent rather than broken.
    expect(
      screen.queryByText(messages.auth.continueWithEmail)
    ).not.toBeInTheDocument();
  });
});
