/* eslint-disable import/order -- vi.mock calls must precede importing the module under test. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Transaction } from "@solana/web3.js";

/**
 * The batch signing entry point, tested against the SDK boundary rather than a
 * stub of this module — a deploy maps signature i back to chunk i, so order is
 * load-bearing, and an expired session mid-batch must read as re-auth rather
 * than as a failed deploy.
 */
const sdk = vi.hoisted(() => ({
  signAllTransactions: vi.fn(),
}));

vi.mock("@/lib/dynamic/config", () => ({
  isDynamicEnabled: () => true,
  getDynamicEnvironmentId: () => "env-id",
}));

vi.mock("@/lib/dynamic/client", () => ({ getDynamicClient: () => null }));

vi.mock("@dynamic-labs-sdk/client", () => ({
  getWalletAccounts: () => [],
}));

vi.mock("@dynamic-labs-sdk/solana", () => ({
  isSolanaWalletAccount: () => true,
  signTransaction: vi.fn(),
  signAllTransactions: sdk.signAllTransactions,
}));

import {
  isDynamicSessionExpiredError,
  signAllWithDynamicWallet,
  type SolanaWalletAccount,
} from "../solana";

const ACCOUNT = { address: "acct" } as unknown as SolanaWalletAccount;

beforeEach(() => {
  sdk.signAllTransactions.mockReset();
});

describe("signAllWithDynamicWallet", () => {
  it("passes the transactions through to the SDK with the session's account", async () => {
    const txs = [new Transaction(), new Transaction()];
    sdk.signAllTransactions.mockResolvedValue({ signedTransactions: txs });

    await signAllWithDynamicWallet(txs, ACCOUNT);

    expect(sdk.signAllTransactions).toHaveBeenCalledWith({
      transactions: txs,
      walletAccount: ACCOUNT,
    });
  });

  it("returns the signed transactions in the order the SDK gave them", async () => {
    const a = new Transaction();
    const b = new Transaction();
    const c = new Transaction();
    sdk.signAllTransactions.mockResolvedValue({
      signedTransactions: [a, b, c],
    });

    const signed = await signAllWithDynamicWallet([a, b, c], ACCOUNT);

    expect(signed).toEqual([a, b, c]);
  });

  it("an expired session mid-batch reads as expiry, not as a program error", async () => {
    const unauthorized = new Error("session gone");
    unauthorized.name = "UnauthorizedError";
    sdk.signAllTransactions.mockRejectedValue(unauthorized);

    const err = await signAllWithDynamicWallet([new Transaction()], ACCOUNT)
      .then(() => null)
      .catch((e: unknown) => e);

    expect(isDynamicSessionExpiredError(err)).toBe(true);
  });
});
