/* eslint-disable import/order -- vi.mock factories are hoisted above imports;
   the env module and the SDK must both be stubbed before the graph loads. */
import { describe, it, expect, vi, beforeEach } from "vitest";

const envMock = vi.hoisted(() => ({
  env: { NEXT_PUBLIC_PHANTOM_APP_ID: undefined as string | undefined },
}));
vi.mock("@/lib/env", () => envMock);

// Capture the config the SDK is constructed with, without standing up the real
// client (which would reach out to Phantom's auth service).
const sdk = vi.hoisted(() => ({
  ctorCalls: [] as Array<Record<string, unknown>>,
}));
vi.mock("@phantom/browser-sdk", () => ({
  AddressType: { solana: "Solana", ethereum: "Ethereum" },
  BrowserSDK: class {
    constructor(config: Record<string, unknown>) {
      sdk.ctorCalls.push(config);
    }
  },
}));

import { createPhantomClient } from "../client";

beforeEach(() => {
  envMock.env.NEXT_PUBLIC_PHANTOM_APP_ID = undefined;
  sdk.ctorCalls.length = 0;
});

describe("Phantom Connect client (#985)", () => {
  it("returns null and constructs nothing when the feature is gated off", () => {
    expect(createPhantomClient()).toBeNull();
    // Not merely null — the SDK must never be instantiated, so no auth-service
    // traffic happens for an app that has not opted in.
    expect(sdk.ctorCalls).toHaveLength(0);
  });

  it("passes the configured app id through", () => {
    envMock.env.NEXT_PUBLIC_PHANTOM_APP_ID = "app-id-123";

    expect(createPhantomClient()).not.toBeNull();
    expect(sdk.ctorCalls[0]?.appId).toBe("app-id-123");
  });

  // The load-bearing setting for the whole Phantom-over-Privy decision: a
  // "user-wallet" belongs to the learner's Phantom account, so signing into the
  // Phantom app with the same Google account surfaces this same wallet. An
  // "app-wallet" would be scoped to this app and never appear there.
  it("requests a user-wallet, so the wallet follows the learner into Phantom", () => {
    envMock.env.NEXT_PUBLIC_PHANTOM_APP_ID = "app-id-123";

    createPhantomClient();

    expect(sdk.ctorCalls[0]?.embeddedWalletType).toBe("user-wallet");
  });

  it("requests Solana addresses only", () => {
    envMock.env.NEXT_PUBLIC_PHANTOM_APP_ID = "app-id-123";

    createPhantomClient();

    expect(sdk.ctorCalls[0]?.addressTypes).toEqual(["Solana"]);
  });

  it("offers the extension alongside social login, so both cohorts share one path", () => {
    envMock.env.NEXT_PUBLIC_PHANTOM_APP_ID = "app-id-123";

    createPhantomClient();

    const providers = sdk.ctorCalls[0]?.providers as string[];
    expect(providers).toContain("google");
    expect(providers).toContain("injected");
  });
});
