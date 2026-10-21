/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  Keypair,
  SendTransactionError,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import { ProgramError } from "@coral-xyz/anchor";
import bs58 from "bs58";

const h = vi.hoisted(() => ({
  record: vi.fn<(...args: unknown[]) => Promise<void>>(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/platform-spend/ledger", () => ({ recordPlatformTx: h.record }));

import { sendPlatformTransaction } from "../platform-tx";

const sponsor = Keypair.generate();
const backend = Keypair.generate();
const program = Keypair.generate().publicKey;
const BLOCKHASH = bs58.encode(Buffer.alloc(32, 3));

function buildTx(): Transaction {
  return new Transaction().add(
    new TransactionInstruction({
      programId: program,
      keys: [{ pubkey: backend.publicKey, isSigner: true, isWritable: false }],
      data: Buffer.from([0]),
    })
  );
}

function fakeConnection() {
  const conn = {
    getLatestBlockhash: vi.fn(async () => ({
      blockhash: BLOCKHASH,
      lastValidBlockHeight: 900,
    })),
    sendRawTransaction: vi.fn(async () => "ignored"),
    confirmTransaction: vi.fn(async () => ({ value: { err: null } })),
    getTransaction: vi.fn(async () => null as unknown),
  };
  return { conn, connection: conn as unknown as Connection };
}

const context = {
  action: "complete_lesson" as const,
  wallet: "LearnerWallet",
  courseId: "course-x",
};

beforeEach(() => {
  h.record.mockReset();
  h.record.mockResolvedValue(undefined);
});

describe("sendPlatformTransaction", () => {
  it("makes the sponsor the fee payer and records the send in the ledger", async () => {
    const { conn, connection } = fakeConnection();
    const tx = buildTx();

    const signature = await sendPlatformTransaction(connection, tx, {
      feePayer: { keypair: sponsor, role: "sponsor" },
      signers: [backend],
      context,
    });

    expect(tx.feePayer?.equals(sponsor.publicKey)).toBe(true);
    // The fee payer's signature is the transaction id.
    expect(signature).toBe(bs58.encode(tx.signatures[0]!.signature!));
    expect(tx.signatures[0]!.publicKey.equals(sponsor.publicKey)).toBe(true);
    expect(tx.verifySignatures()).toBe(true);
    expect(conn.confirmTransaction).toHaveBeenCalledWith(
      { signature, blockhash: BLOCKHASH, lastValidBlockHeight: 900 },
      "confirmed"
    );
    expect(h.record).toHaveBeenCalledWith({
      ...context,
      signature,
      payer: sponsor.publicKey.toBase58(),
      payerRole: "sponsor",
      lastValidBlockHeight: 900,
    });
  });

  it("signs once when the fee payer is also a required signer (devnet fallback)", async () => {
    const { connection } = fakeConnection();
    const tx = buildTx();

    await sendPlatformTransaction(connection, tx, {
      feePayer: { keypair: backend, role: "backend" },
      signers: [backend],
      context,
    });

    expect(tx.signatures).toHaveLength(1);
    expect(tx.verifySignatures()).toBe(true);
  });

  it("does not record a broadcast the node refused: it cost nothing", async () => {
    const { conn, connection } = fakeConnection();
    const refusal = new SendTransactionError({
      action: "simulate",
      signature: "",
      transactionMessage: "Transaction simulation failed",
      logs: ["Program log: nope"],
    });
    conn.sendRawTransaction.mockRejectedValue(refusal);

    await expect(
      sendPlatformTransaction(connection, buildTx(), {
        feePayer: { keypair: sponsor, role: "sponsor" },
        signers: [backend],
        context,
      })
    ).rejects.toBe(refusal);
    expect(h.record).not.toHaveBeenCalled();
    expect(conn.confirmTransaction).not.toHaveBeenCalled();
  });

  it("records an ambiguous send failure, since the transaction may still land", async () => {
    const { conn, connection } = fakeConnection();
    const transport = new Error("ECONNRESET");
    conn.sendRawTransaction.mockRejectedValue(transport);

    await expect(
      sendPlatformTransaction(connection, buildTx(), {
        feePayer: { keypair: sponsor, role: "sponsor" },
        signers: [backend],
        context,
      })
    ).rejects.toBe(transport);
    expect(h.record).toHaveBeenCalledTimes(1);
  });

  it("surfaces an on-chain failure with its program logs, and still records it", async () => {
    const { conn, connection } = fakeConnection();
    conn.confirmTransaction.mockResolvedValue({
      value: { err: { InstructionError: [0, { Custom: 6003 }] } },
    } as never);
    conn.getTransaction.mockResolvedValue({
      meta: { logMessages: ["Program failed: custom program error: 0x1773"] },
    });

    const err = await sendPlatformTransaction(connection, buildTx(), {
      feePayer: { keypair: sponsor, role: "sponsor" },
      signers: [backend],
      context,
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(SendTransactionError);
    expect((err as SendTransactionError).logs).toEqual([
      "Program failed: custom program error: 0x1773",
    ]);
    expect(h.record).toHaveBeenCalledTimes(1);
  });

  it("translates failures through the IDL like Anchor's .rpc() does", async () => {
    const { conn, connection } = fakeConnection();
    conn.sendRawTransaction.mockRejectedValue(
      new SendTransactionError({
        action: "simulate",
        signature: "",
        transactionMessage:
          "Transaction simulation failed: custom program error: 0x1773",
        logs: [`Program ${program.toBase58()} invoke [1]`],
      })
    );

    const err = await sendPlatformTransaction(connection, buildTx(), {
      feePayer: { keypair: sponsor, role: "sponsor" },
      signers: [backend],
      context,
      idlErrors: new Map([[6003, "Lesson already completed"]]),
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ProgramError);
    expect((err as ProgramError).code).toBe(6003);
    expect((err as ProgramError).msg).toBe("Lesson already completed");
  });
});
