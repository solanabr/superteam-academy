/* eslint-disable import/order -- vi.mock calls must precede importing the module under test. */
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The state machine behind #1179, tested against the SDK rather than against a
 * stub of this module.
 *
 * The consumer suites (use-on-chain-enroll, current-courses-*) mock the
 * SESSION HOOK, which is the right seam for them but means none of them can
 * catch a wrong answer here. This file mocks one layer lower — the Dynamic
 * client and its wallet-account reader — so the four-way discrimination is
 * exercised for real.
 */

const sdk = vi.hoisted(() => ({
  enabled: true,
  client: null as {
    initStatus: string;
    user: { id: string } | null;
    sessionExpiresAt: Date | null;
  } | null,
  accounts: [] as Array<{ chain: string; address: string }>,
  throwOnAccounts: false,
}));

vi.mock("@/lib/dynamic/config", () => ({
  isDynamicEnabled: () => sdk.enabled,
  getDynamicEnvironmentId: () => (sdk.enabled ? "env-id" : undefined),
}));

vi.mock("@/lib/dynamic/client", () => ({
  getDynamicClient: () => sdk.client,
}));

vi.mock("@dynamic-labs-sdk/client", () => ({
  getWalletAccounts: () => {
    if (sdk.throwOnAccounts) throw new Error("not initialised");
    return sdk.accounts;
  },
}));

vi.mock("@dynamic-labs-sdk/solana", () => ({
  isSolanaWalletAccount: (a: { chain: string }) => a.chain === "SOL",
  signTransaction: vi.fn(),
}));

import {
  getDynamicSolanaAccount,
  getDynamicSolanaAccountOrNull,
  isDynamicSessionExpiredError,
} from "../solana";

const READY = {
  initStatus: "finished",
  user: null,
  sessionExpiresAt: null,
} as const;

beforeEach(() => {
  sdk.enabled = true;
  sdk.client = { ...READY };
  sdk.accounts = [];
  sdk.throwOnAccounts = false;
});

describe("getDynamicSolanaAccount", () => {
  it("returns the account when one exists", () => {
    sdk.accounts = [{ chain: "SOL", address: "So1..." }];
    const state = getDynamicSolanaAccount("embedded");
    expect(state).toEqual({
      kind: "account",
      account: { chain: "SOL", address: "So1..." },
    });
  });

  it("reports LOADING while the SDK is still initialising", () => {
    // The init race: the old code returned null here, and callers read null as
    // "no wallet" and opened the connect modal on a VALID session.
    sdk.client = { ...READY, initStatus: "in-progress" };
    sdk.throwOnAccounts = true;
    expect(getDynamicSolanaAccount("embedded")).toEqual({ kind: "loading" });
  });

  it("reports LOADING when signed in with a live session but no wallet yet", () => {
    // The WaaS keygen DynamicAuthHandler starts on first sign-in.
    sdk.client = {
      initStatus: "finished",
      user: { id: "u1" },
      sessionExpiresAt: new Date(Date.now() + 60_000),
    };
    expect(getDynamicSolanaAccount("embedded")).toEqual({ kind: "loading" });
  });

  it("reports EXPIRED for an embedded learner with no session left", () => {
    // The reload-after-expiry case: hydration restored nothing and no logout
    // event was ever emitted, so wallet_kind is the only thing that knows.
    expect(getDynamicSolanaAccount("embedded")).toEqual({ kind: "expired" });
  });

  it("reports EXPIRED when the stored session is already in the past", () => {
    sdk.client = {
      initStatus: "finished",
      user: { id: "u1" },
      sessionExpiresAt: new Date(Date.now() - 1_000),
    };
    expect(getDynamicSolanaAccount("embedded")).toEqual({ kind: "expired" });
  });

  it("reports NONE for an external learner — unchanged behaviour", () => {
    expect(getDynamicSolanaAccount("external")).toEqual({ kind: "none" });
  });

  it("reports NONE for a legacy row with no recorded wallet_kind", () => {
    // Additive by design: an unwritten column must behave exactly as before.
    expect(getDynamicSolanaAccount(null)).toEqual({ kind: "none" });
    expect(getDynamicSolanaAccount()).toEqual({ kind: "none" });
  });

  it("reports NONE when the feature is switched off entirely", () => {
    sdk.enabled = false;
    expect(getDynamicSolanaAccount("embedded")).toEqual({ kind: "none" });
  });

  it("reports NONE when no client was ever created", () => {
    sdk.client = null;
    expect(getDynamicSolanaAccount("embedded")).toEqual({ kind: "none" });
  });
});

describe("getDynamicSolanaAccountOrNull", () => {
  it("keeps the old null-or-account shape for untouched call sites", () => {
    expect(getDynamicSolanaAccountOrNull()).toBeNull();
    sdk.accounts = [{ chain: "SOL", address: "So1..." }];
    expect(getDynamicSolanaAccountOrNull()).toEqual({
      chain: "SOL",
      address: "So1...",
    });
  });
});

describe("isDynamicSessionExpiredError", () => {
  it("matches the SDK's UnauthorizedError by name", () => {
    const err = Object.assign(new Error("Unauthorized"), {
      name: "UnauthorizedError",
    });
    expect(isDynamicSessionExpiredError(err)).toBe(true);
  });

  it("matches by code too — the pnpm graph holds two client instances, so the class identity does not always cross", () => {
    const err = Object.assign(new Error("Unauthorized"), {
      code: "unauthorized_error",
    });
    expect(isDynamicSessionExpiredError(err)).toBe(true);
  });

  it("unwraps one level of `cause` — the WaaS signer wraps its failures", () => {
    const wrapped = Object.assign(new Error("Waas load failed"), {
      name: "WaasLoadFailedError",
      cause: Object.assign(new Error("Unauthorized"), {
        name: "UnauthorizedError",
      }),
    });
    expect(isDynamicSessionExpiredError(wrapped)).toBe(true);
  });

  it("stops at one level — a deeper chain is no longer ABOUT the expiry", () => {
    const deep = new Error("outer", {
      cause: new Error("middle", {
        cause: Object.assign(new Error("Unauthorized"), {
          name: "UnauthorizedError",
        }),
      }),
    });
    expect(isDynamicSessionExpiredError(deep)).toBe(false);
  });

  it("does not swallow ordinary program failures", () => {
    expect(
      isDynamicSessionExpiredError(new Error("custom program error"))
    ).toBe(false);
    expect(isDynamicSessionExpiredError("Unauthorized")).toBe(false);
    expect(isDynamicSessionExpiredError(null)).toBe(false);
  });
});
