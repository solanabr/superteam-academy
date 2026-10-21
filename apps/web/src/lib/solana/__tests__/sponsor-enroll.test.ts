/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";

const h = vi.hoisted(() => ({
  findLive: vi.fn(),
  reserve: vi.fn(),
  settleRows: vi.fn(),
  getPlatformFeePayer: vi.fn(),
  getLatestBlockhash: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/platform-spend/ledger", () => ({
  findLiveSponsoredEnroll: h.findLive,
  reserveSponsoredEnroll: h.reserve,
}));
vi.mock("@/lib/platform-spend/settle", () => ({
  settleRows: h.settleRows,
  defaultSettleDeps: () => ({ admin: "admin" }),
}));
vi.mock("@/lib/platform-spend/events", () => ({ emitServerEvent: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("../academy-program", () => ({
  getConnection: () => ({ getLatestBlockhash: h.getLatestBlockhash }),
  getPlatformFeePayer: h.getPlatformFeePayer,
}));
const PROGRAM = Keypair.generate().publicKey;
vi.mock("../pda", () => ({ getProgramId: () => PROGRAM }));
vi.mock("../instructions", () => ({
  // Shape of the real enroll: the learner and the payer both sign.
  buildEnrollInstruction: (
    _courseId: string,
    learner: PublicKey,
    programId: PublicKey,
    payer: PublicKey
  ) =>
    new TransactionInstruction({
      programId,
      keys: [
        { pubkey: learner, isSigner: true, isWritable: false },
        { pubkey: payer, isSigner: true, isWritable: true },
      ],
      data: Buffer.from([1]),
    }),
}));

import { buildSponsoredEnrollTransaction } from "../sponsor-enroll";

const sponsor = Keypair.generate();
const learner = Keypair.generate().publicKey;
const BLOCKHASH = bs58.encode(Buffer.alloc(32, 7));

const pendingRow = {
  signature: "PRIOR_SIG",
  status: "pending",
  last_valid_block_height: 100,
  created_at: "2026-10-21T00:00:00.000Z",
  payer: sponsor.publicKey.toBase58(),
  payer_role: "sponsor",
  action: "enroll_sponsor",
  user_id: "user-1",
  wallet: learner.toBase58(),
  course_id: "course-x",
  cluster: "devnet",
};

beforeEach(() => {
  vi.clearAllMocks();
  h.getPlatformFeePayer.mockResolvedValue({
    keypair: sponsor,
    role: "sponsor",
  });
  h.getLatestBlockhash.mockResolvedValue({
    blockhash: BLOCKHASH,
    lastValidBlockHeight: 500,
  });
  h.findLive.mockResolvedValue(null);
  h.reserve.mockResolvedValue("reserved");
});

describe("buildSponsoredEnrollTransaction", () => {
  it("makes the sponsor the payer and fee payer, and reserves the signature", async () => {
    const result = await buildSponsoredEnrollTransaction(
      "course-x",
      learner,
      "user-1"
    );
    if (!result.ok) throw new Error("expected a transaction");

    const tx = Transaction.from(
      Buffer.from(result.transaction.transaction, "base64")
    );
    expect(tx.feePayer?.equals(sponsor.publicKey)).toBe(true);
    expect(result.transaction.sponsor).toBe(sponsor.publicKey.toBase58());
    const signature = bs58.encode(tx.signature!);

    expect(h.reserve).toHaveBeenCalledWith({
      signature,
      action: "enroll_sponsor",
      userId: "user-1",
      wallet: learner.toBase58(),
      courseId: "course-x",
      payer: sponsor.publicKey.toBase58(),
      payerRole: "sponsor",
      lastValidBlockHeight: 500,
    });
  });

  it("declines a wallet whose sponsorship for the course already landed", async () => {
    h.findLive.mockResolvedValue({ ...pendingRow, status: "confirmed" });

    const result = await buildSponsoredEnrollTransaction(
      "course-x",
      learner,
      "user-1"
    );

    expect(result).toEqual({ ok: false, reason: "already_sponsored" });
    expect(h.getLatestBlockhash).not.toHaveBeenCalled();
    expect(h.reserve).not.toHaveBeenCalled();
  });

  it("settles a pending sponsorship first, and declines if it landed", async () => {
    h.findLive.mockResolvedValue(pendingRow);
    h.settleRows.mockResolvedValue(new Map([["PRIOR_SIG", "confirmed"]]));

    const result = await buildSponsoredEnrollTransaction(
      "course-x",
      learner,
      "user-1"
    );

    expect(h.settleRows).toHaveBeenCalledWith(
      [pendingRow],
      expect.objectContaining({ admin: "admin", emit: expect.any(Function) })
    );
    expect(result).toEqual({ ok: false, reason: "already_sponsored" });
  });

  it("asks the learner to wait while the earlier transaction can still land", async () => {
    h.findLive.mockResolvedValue(pendingRow);
    h.settleRows.mockResolvedValue(new Map([["PRIOR_SIG", "pending"]]));

    const result = await buildSponsoredEnrollTransaction(
      "course-x",
      learner,
      "user-1"
    );

    expect(result).toEqual({ ok: false, reason: "in_flight" });
    expect(h.reserve).not.toHaveBeenCalled();
  });

  it.each(["expired", "failed"])(
    "sponsors again once the earlier attempt %s without enrolling",
    async (outcome) => {
      h.findLive.mockResolvedValue(pendingRow);
      h.settleRows.mockResolvedValue(new Map([["PRIOR_SIG", outcome]]));

      const result = await buildSponsoredEnrollTransaction(
        "course-x",
        learner,
        "user-1"
      );

      expect(result.ok).toBe(true);
      expect(h.reserve).toHaveBeenCalledTimes(1);
    }
  );

  it("declines when a concurrent request reserved the slot first", async () => {
    h.reserve.mockResolvedValue("conflict");

    const result = await buildSponsoredEnrollTransaction(
      "course-x",
      learner,
      "user-1"
    );

    expect(result).toEqual({ ok: false, reason: "in_flight" });
  });

  it("refuses to sponsor when the once-per check cannot read the ledger", async () => {
    h.findLive.mockRejectedValue(new Error("platform_spend read failed"));

    await expect(
      buildSponsoredEnrollTransaction("course-x", learner, "user-1")
    ).rejects.toThrow(/platform_spend/);
    expect(h.reserve).not.toHaveBeenCalled();
  });

  it("fails closed when no sponsor may pay", async () => {
    h.getPlatformFeePayer.mockRejectedValue(new Error("SPONSOR_SECRET unset"));

    await expect(
      buildSponsoredEnrollTransaction("course-x", learner, "user-1")
    ).rejects.toThrow(/SPONSOR_SECRET/);
    expect(h.findLive).not.toHaveBeenCalled();
  });
});
