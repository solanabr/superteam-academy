// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { StrictMode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

/**
 * Job 0's once-per-page-load contract, exercised the only way that matters:
 * under StrictMode, whose dev double-effect is exactly the duplicate
 * invocation that once replayed the spent OAuth code in the live E2E. The
 * handler keeps its handshake promise at MODULE scope, so each test imports a
 * fresh module registry.
 */

const {
  detectSocialRedirectUrl,
  createWaasWalletAccounts,
  getChainsMissingWaasWalletAccounts,
  completeSocialRedirect,
  clearSocialRedirectParams,
  bridgeDynamicSession,
  logoutDynamic,
  getUser,
  runWalletSiws,
  reload,
} = vi.hoisted(() => ({
  detectSocialRedirectUrl: vi.fn(),
  completeSocialRedirect: vi.fn().mockResolvedValue(undefined),
  clearSocialRedirectParams: vi.fn(),
  bridgeDynamicSession: vi.fn(),
  logoutDynamic: vi.fn().mockResolvedValue(undefined),
  getUser: vi.fn(),
  runWalletSiws: vi.fn(),
  reload: vi.fn(),
  createWaasWalletAccounts: vi.fn(),
  getChainsMissingWaasWalletAccounts: vi.fn(),
}));

vi.mock("@dynamic-labs-sdk/client", () => ({
  signMessage: vi.fn(),
  clearSocialRedirectParams,
  completeDeviceRegistration: vi.fn(),
  completeSocialRedirect,
  detectDeviceRegistrationRedirect: vi.fn().mockReturnValue(false),
  detectSocialRedirectUrl,
  getDeviceRegistrationTokenFromUrl: vi.fn(),
}));
vi.mock("@dynamic-labs-sdk/client/waas", () => ({
  createWaasWalletAccounts,
  getChainsMissingWaasWalletAccounts,
}));
vi.mock("@dynamic-labs-sdk/react-hooks", () => ({
  useUser: () => ({ data: { userId: "dynamic-user-1" } }),
  useGetWalletAccounts: () => ({
    data: [{ chain: "SOL", address: "So1anaAddre55" }],
  }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/wallet/siws", () => ({ runWalletSiws }));
vi.mock("@/lib/dynamic/client", () => ({ logoutDynamic }));
vi.mock("@/lib/dynamic/siws", () => ({ toMessageSigner: vi.fn() }));
vi.mock("@/lib/dynamic/social", () => ({
  bridgeDynamicSession,
}));
vi.mock("@/lib/dynamic/social-return-pending", () => ({
  setSocialReturnPending: vi.fn(),
}));
vi.mock("@/components/ui/toast-container", () => ({ dispatchToast: vi.fn() }));

async function renderFreshHandler() {
  vi.resetModules();
  const { DynamicAuthHandler } = await import("../dynamic-auth-handler");
  return render(
    <StrictMode>
      <NextIntlClientProvider locale="en" messages={messages}>
        <DynamicAuthHandler />
      </NextIntlClientProvider>
    </StrictMode>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: null } });
  runWalletSiws.mockResolvedValue({ ok: true });
  createWaasWalletAccounts.mockResolvedValue(undefined);
  getChainsMissingWaasWalletAccounts.mockReturnValue(["SOL"]);
  Object.defineProperty(window, "location", {
    value: { ...window.location, reload },
    writable: true,
  });
});

describe("DynamicAuthHandler — social redirect return (job 0)", () => {
  it("runs the handshake exactly once under StrictMode's double effect", async () => {
    detectSocialRedirectUrl.mockResolvedValue(true);
    bridgeDynamicSession.mockResolvedValue({ ok: true });

    await renderFreshHandler();

    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect(completeSocialRedirect).toHaveBeenCalledTimes(1);
    expect(bridgeDynamicSession).toHaveBeenCalledTimes(1);
    expect(clearSocialRedirectParams).toHaveBeenCalledTimes(1);
  });

  it("holds job 3 off for the whole return — no SIWS while the bridge is pending or after success", async () => {
    detectSocialRedirectUrl.mockResolvedValue(true);
    // A never-settling bridge = the in-flight window the duplicate invocation
    // once released the guard during.
    bridgeDynamicSession.mockReturnValue(new Promise(() => {}));

    await renderFreshHandler();

    await waitFor(() => expect(bridgeDynamicSession).toHaveBeenCalled());
    // Give jobs 2 and 3 every chance to sneak in behind the pending bridge.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(runWalletSiws).not.toHaveBeenCalled();
    // The MPC keygen must not start either — the success path's hard reload
    // would kill it mid-flight, stranding the learner with no wallet.
    expect(createWaasWalletAccounts).not.toHaveBeenCalled();
  });

  it("releases job 3 on a plain page load so the SIWS bridge still runs", async () => {
    detectSocialRedirectUrl.mockResolvedValue(false);

    await renderFreshHandler();

    await waitFor(() => expect(runWalletSiws).toHaveBeenCalled());
    await waitFor(() => expect(createWaasWalletAccounts).toHaveBeenCalled());
    expect(completeSocialRedirect).not.toHaveBeenCalled();
    expect(bridgeDynamicSession).not.toHaveBeenCalled();
  });
});
