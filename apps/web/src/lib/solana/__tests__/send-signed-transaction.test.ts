/* eslint-disable import/order -- vi.mock calls must be hoisted above the
   module-under-test import, which forces that import to sit after non-import
   code (same pattern as the other solana/__tests__ suites). */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// sendSignedTransaction's error narrowing.
//
// The quest drainer reserves a mint signature BEFORE broadcasting, and releases
// that reservation only when it is proven that nothing reached the cluster.
// This suite pins down which failures carry that proof. Only a
// SendTransactionError does: the node responded with a refusal (preflight
// revert — MintingPaused, a deactivated minter — or any other rejection). A
// transport failure is ambiguous, because the node may already have forwarded
// the transaction before the socket died, and so is a confirmation failure.
//
// Getting this boundary wrong in the permissive direction double-mints
// soulbound XP, which is unrecoverable; getting it wrong in the strict
// direction forfeits a mint, which is not.
// ---------------------------------------------------------------------------

const h = vi.hoisted(() => ({
  sendRawTransaction: vi.fn<(...args: unknown[]) => Promise<string>>(),
  confirmTransaction:
    vi.fn<(...args: unknown[]) => Promise<{ value: { err: unknown } }>>(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: { SOLANA_RPC_URL: "http://localhost:8899" },
}));

// Keep the real web3.js (SendTransactionError must be the genuine class the
// module narrows against) and swap only the Connection the module builds.
vi.mock("@solana/web3.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/web3.js")>();
  return {
    ...actual,
    Connection: class {
      sendRawTransaction(...args: unknown[]) {
        return h.sendRawTransaction(...args);
      }
      confirmTransaction(...args: unknown[]) {
        return h.confirmTransaction(...args);
      }
    },
  };
});

import { SendTransactionError } from "@solana/web3.js";
import {
  sendSignedTransaction,
  TransactionNotBroadcastError,
} from "../academy-program";

const TX = {
  signature: "MINT_SIG",
  rawTransaction: Buffer.from("signed-bytes"),
  blockhash: "BLOCKHASH",
  lastValidBlockHeight: 1000,
};

beforeEach(() => {
  h.sendRawTransaction.mockReset();
  h.sendRawTransaction.mockResolvedValue("MINT_SIG");
  h.confirmTransaction.mockReset();
  h.confirmTransaction.mockResolvedValue({ value: { err: null } });
});

describe("sendSignedTransaction", () => {
  it("sends the signed bytes and resolves on a clean confirmation", async () => {
    await expect(sendSignedTransaction(TX)).resolves.toBeUndefined();

    expect(h.sendRawTransaction).toHaveBeenCalledTimes(1);
    expect(h.sendRawTransaction.mock.calls[0]?.[0]).toBe(TX.rawTransaction);
  });

  it("flags a node REJECTION as never-broadcast (the caller may release its claim)", async () => {
    h.sendRawTransaction.mockRejectedValue(
      new SendTransactionError({
        action: "send",
        signature: "MINT_SIG",
        transactionMessage: "Transaction simulation failed: MintingPaused",
      })
    );

    await expect(sendSignedTransaction(TX)).rejects.toBeInstanceOf(
      TransactionNotBroadcastError
    );
  });

  it("does NOT flag a transport failure — the node may already have forwarded it", async () => {
    // ECONNRESET, timeout, DNS: ambiguous. Releasing a claim here would let the
    // next sweep re-sign and mint a second time.
    const transportError = new Error("ECONNRESET");
    h.sendRawTransaction.mockRejectedValue(transportError);

    await expect(sendSignedTransaction(TX)).rejects.toBe(transportError);
    await expect(sendSignedTransaction(TX)).rejects.not.toBeInstanceOf(
      TransactionNotBroadcastError
    );
  });

  it("does NOT flag a confirmation failure — the transaction may have landed", async () => {
    const confirmError = new Error("blockhash expired");
    h.confirmTransaction.mockRejectedValue(confirmError);

    await expect(sendSignedTransaction(TX)).rejects.toBe(confirmError);
  });

  it("does NOT flag an on-chain execution error either", async () => {
    h.confirmTransaction.mockResolvedValue({
      value: { err: { InstructionError: [0, { Custom: 6001 }] } },
    });

    const err = await sendSignedTransaction(TX).catch((e: unknown) => e);
    expect(err).not.toBeInstanceOf(TransactionNotBroadcastError);
    expect(String(err)).toContain("MINT_SIG");
  });
});
