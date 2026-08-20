// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
// A Dynamic Google sign-in creates an email-provider Supabase user — no
// google identity — so the Account tab, read purely from Supabase, told that
// learner "Google: Not Linked" seconds after they used Google. What is pinned
// here: Dynamic-off renders exactly the legacy rows (the hooks are never
// called), the wallet row only claims "embedded" when the Dynamic session's
// Solana address IS the profile wallet, and a Dynamic-verified provider shows
// the sign-in state while KEEPING its Link button.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

const dyn = vi.hoisted(() => ({
  enabled: false,
  user: null as {
    verifiedCredentials: { oauthProvider?: string }[];
  } | null,
  accounts: [] as { chain: string; address: string }[],
  hookCalls: 0,
}));

vi.mock("@/lib/dynamic/config", () => ({
  isDynamicEnabled: () => dyn.enabled,
}));
vi.mock("@dynamic-labs-sdk/react-hooks", () => ({
  useUser: () => {
    dyn.hookCalls += 1;
    return { data: dyn.user };
  },
  useGetWalletAccounts: () => {
    dyn.hookCalls += 1;
    return { data: dyn.accounts };
  },
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: null,
    signMessage: undefined,
    connected: false,
  }),
}));
vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: vi.fn() }),
}));
vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ refreshProfile: vi.fn() }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
  }),
}));

import { AccountTab } from "../account-tab";

const WALLET = "7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2";

function renderTab(overrides?: Partial<Parameters<typeof AccountTab>[0]>) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AccountTab
        accountEmail="learner@example.com"
        initialWalletAddress={WALLET}
        initialGoogleEmail={null}
        initialGoogleIdentity={null}
        initialGitHubEmail={null}
        initialGitHubIdentity={null}
        avatarUrl={null}
        onAvatarChange={vi.fn()}
        {...overrides}
      />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  dyn.enabled = false;
  dyn.user = null;
  dyn.accounts = [];
  dyn.hookCalls = 0;
});

describe("AccountTab — Dynamic off (kill-switch)", () => {
  it("renders exactly the legacy rows and never calls a Dynamic hook", () => {
    renderTab();

    expect(dyn.hookCalls).toBe(0);
    expect(
      screen.getByText(messages.settings.walletPermanent)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.settings.walletEmbeddedDynamic)
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(messages.settings.notLinked)).toHaveLength(2);
    expect(
      screen.queryByText(messages.settings.usedForSignInDynamic)
    ).not.toBeInTheDocument();
  });
});

describe("AccountTab — Dynamic session", () => {
  it("labels the wallet as embedded when the Dynamic address matches", async () => {
    dyn.enabled = true;
    dyn.accounts = [{ chain: "SOL", address: WALLET }];

    renderTab();

    expect(
      await screen.findByText(messages.settings.walletEmbeddedDynamic)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.settings.walletPermanent)
    ).not.toBeInTheDocument();
  });

  it("keeps the plain permanent copy for an external wallet", async () => {
    dyn.enabled = true;
    dyn.accounts = [{ chain: "SOL", address: "SomeOtherEmbeddedAddress" }];
    dyn.user = { verifiedCredentials: [] };

    renderTab();

    expect(
      await screen.findByText(messages.settings.walletPermanent)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.settings.walletEmbeddedDynamic)
    ).not.toBeInTheDocument();
  });

  it("shows the Google sign-in state and keeps the Link button", async () => {
    dyn.enabled = true;
    dyn.user = {
      verifiedCredentials: [{ oauthProvider: "google" }, {}],
    };

    renderTab();

    expect(
      await screen.findByText(messages.settings.usedForSignInDynamic)
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.settings.dynamicLinkHint)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.settings.linkGoogle })
    ).toBeInTheDocument();
    // GitHub row stays untouched — one "Not Linked" left (Google's replaced).
    expect(screen.getAllByText(messages.settings.notLinked)).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: messages.settings.linkGitHub })
    ).toBeInTheDocument();
  });

  it("reconciles the method-count hint when the only extra sign-in is via Dynamic (#1077)", async () => {
    dyn.enabled = true;
    dyn.user = { verifiedCredentials: [{ oauthProvider: "google" }] };

    renderTab(); // wallet linked (count 1) + Google via Dynamic, unlinked

    expect(
      await screen.findByText(messages.settings.dynamicMethodCountNote)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.settings.cannotUnlinkLastHint)
    ).not.toBeInTheDocument();
  });

  it("keeps the plain safety hint when no Dynamic provider is in play", () => {
    dyn.enabled = true;

    renderTab();

    expect(
      screen.getByText(messages.settings.cannotUnlinkLastHint)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.settings.dynamicMethodCountNote)
    ).not.toBeInTheDocument();
  });

  it("leaves every row unchanged when there is no Dynamic session", () => {
    dyn.enabled = true;

    renderTab();

    expect(
      screen.getByText(messages.settings.walletPermanent)
    ).toBeInTheDocument();
    expect(screen.getAllByText(messages.settings.notLinked)).toHaveLength(2);
    expect(
      screen.queryByText(messages.settings.usedForSignInDynamic)
    ).not.toBeInTheDocument();
  });
});
