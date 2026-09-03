// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * Job 3's `wallet_kind` heal. Accounts that had a Supabase session before
 * Dynamic existed never touch a server route that could record the kind: the
 * bridge skips them (a session already exists, so the social return is a link,
 * not a sign-in) and job 3's "already linked" early return skips them too. A
 * NULL kind routes an expired embedded session to the connect-a-wallet modal,
 * which is a dead end for a learner with no extension.
 */

const EMBEDDED = "So11111111111111111111111111111111111111112";
const EXTENSION = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

const {
  detectSocialRedirectUrl,
  getChainsMissingWaasWalletAccounts,
  getUser,
  selectProfile,
  runWalletSiws,
  dispatchToast,
  reload,
} = vi.hoisted(() => ({
  detectSocialRedirectUrl: vi.fn(),
  getChainsMissingWaasWalletAccounts: vi.fn().mockReturnValue([]),
  getUser: vi.fn(),
  selectProfile: vi.fn<(fields: string) => Promise<{ data: unknown }>>(),
  runWalletSiws: vi.fn(),
  dispatchToast: vi.fn(),
  reload: vi.fn(),
}));

vi.mock("@dynamic-labs-sdk/client", () => ({
  signMessage: vi.fn(),
  clearSocialRedirectParams: vi.fn(),
  completeDeviceRegistration: vi.fn(),
  completeSocialRedirect: vi.fn(),
  detectDeviceRegistrationRedirect: vi.fn().mockReturnValue(false),
  detectSocialRedirectUrl,
  getDeviceRegistrationTokenFromUrl: vi.fn(),
}));
vi.mock("@dynamic-labs-sdk/client/waas", () => ({
  createWaasWalletAccounts: vi.fn(),
  getChainsMissingWaasWalletAccounts,
}));
vi.mock("@dynamic-labs-sdk/react-hooks", () => ({
  useUser: () => ({ data: { userId: "dynamic-user-1" } }),
  useGetWalletAccounts: () => ({
    data: [{ chain: "SOL", address: EMBEDDED }],
  }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser },
    from: (table: string) => {
      if (table !== "profiles") throw new Error(`unexpected table ${table}`);
      return {
        select: (fields: string) => ({
          eq: () => ({ maybeSingle: () => selectProfile(fields) }),
        }),
      };
    },
  }),
}));
vi.mock("@/lib/wallet/siws", () => ({ runWalletSiws }));
vi.mock("@/lib/dynamic/client", () => ({ logoutDynamic: vi.fn() }));
vi.mock("@/lib/dynamic/siws", () => ({
  toMessageSigner: vi.fn().mockReturnValue({ signMessage: vi.fn() }),
}));
vi.mock("@/lib/dynamic/social", () => ({ bridgeDynamicSession: vi.fn() }));
vi.mock("@/lib/dynamic/social-return-pending", () => ({
  setSocialReturnPending: vi.fn(),
}));
vi.mock("@/components/ui/toast-container", () => ({ dispatchToast }));

// The handler keeps its social-return promise at module scope, so each test
// needs a fresh module registry.
async function renderFreshHandler() {
  vi.resetModules();
  const { DynamicAuthHandler } = await import("../dynamic-auth-handler");
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DynamicAuthHandler />
    </NextIntlClientProvider>
  );
}

/** Let jobs 0 and 3 settle, whether or not they end up calling SIWS. */
async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 50));
}

beforeEach(() => {
  vi.clearAllMocks();
  detectSocialRedirectUrl.mockResolvedValue(false);
  getChainsMissingWaasWalletAccounts.mockReturnValue([]);
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  runWalletSiws.mockResolvedValue({ ok: true });
  Object.defineProperty(window, "location", {
    value: { ...window.location, reload },
    writable: true,
  });
});

describe("DynamicAuthHandler — wallet_kind heal (job 3)", () => {
  it("re-links the wallet the account already has when its kind is NULL", async () => {
    selectProfile.mockResolvedValue({
      data: { wallet_address: EMBEDDED, wallet_kind: null },
    });

    await renderFreshHandler();

    await waitFor(() => expect(runWalletSiws).toHaveBeenCalledTimes(1));
    expect(runWalletSiws).toHaveBeenCalledWith(
      expect.anything(),
      EMBEDDED,
      true,
      "embedded"
    );
    // The kind cannot be read without asking for it.
    expect(selectProfile).toHaveBeenCalledWith(
      expect.stringContaining("wallet_kind")
    );
  });

  it("does not reload the page after a heal", async () => {
    // The link route sets no cookies, unlike sign-in, so there is nothing for
    // a reload to pick up — and a failing recordWalletKind would otherwise
    // heal, reload, and retry forever.
    selectProfile.mockResolvedValue({
      data: { wallet_address: EMBEDDED, wallet_kind: null },
    });

    await renderFreshHandler();

    await waitFor(() => expect(runWalletSiws).toHaveBeenCalledTimes(1));
    await settle();
    expect(reload).not.toHaveBeenCalled();
  });

  it("leaves an account whose kind is already recorded alone", async () => {
    selectProfile.mockResolvedValue({
      data: { wallet_address: EMBEDDED, wallet_kind: "embedded" },
    });

    await renderFreshHandler();
    await settle();

    expect(runWalletSiws).not.toHaveBeenCalled();
  });

  it("leaves an account linked to a different wallet alone", async () => {
    // A Phantom learner whose Dynamic account holds an unlinked embedded
    // wallet: re-linking would be refused, and the prompt is noise.
    selectProfile.mockResolvedValue({
      data: { wallet_address: EXTENSION, wallet_kind: null },
    });

    await renderFreshHandler();
    await settle();

    expect(runWalletSiws).not.toHaveBeenCalled();
  });

  it("stays quiet when the heal does not go through", async () => {
    selectProfile.mockResolvedValue({
      data: { wallet_address: EMBEDDED, wallet_kind: null },
    });
    runWalletSiws.mockResolvedValue({ ok: false, reason: "declined" });

    await renderFreshHandler();

    await waitFor(() => expect(runWalletSiws).toHaveBeenCalled());
    await settle();
    expect(dispatchToast).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("still links a wallet the account does not have yet", async () => {
    selectProfile.mockResolvedValue({
      data: { wallet_address: null, wallet_kind: null },
    });

    await renderFreshHandler();

    await waitFor(() => expect(runWalletSiws).toHaveBeenCalledTimes(1));
    expect(runWalletSiws).toHaveBeenCalledWith(
      expect.anything(),
      EMBEDDED,
      true,
      "embedded"
    );
    // Not a heal — the sign-in route does set cookies, so this path still
    // needs the reload to pick them up.
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });
});
