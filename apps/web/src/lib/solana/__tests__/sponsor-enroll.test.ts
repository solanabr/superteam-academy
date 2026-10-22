/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ComputeBudgetInstruction,
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";

const h = vi.hoisted(() => ({
  findLive: vi.fn(),
  reserve: vi.fn(),
  supersede: vi.fn(),
  settleRows: vi.fn(),
  getPlatformFeePayer: vi.fn(),
  getLatestBlockhash: vi.fn(),
  getMultipleAccountsInfo: vi.fn(),
  estimate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/platform-spend/ledger", () => ({
  findSponsorshipRows: h.findLive,
  reserveSponsoredEnroll: h.reserve,
  supersedeSponsoredEnroll: h.supersede,
}));
vi.mock("@/lib/platform-spend/settle", () => ({
  settleRows: h.settleRows,
  defaultSettleDeps: () => ({ admin: "admin" }),
}));
vi.mock("@/lib/platform-spend/events", () => ({ emitServerEvent: vi.fn() }));
vi.mock("../priority-fee", () => ({ estimatePriorityFee: h.estimate }));
vi.mock("../academy-program", () => ({
  getConnection: () => ({
    getLatestBlockhash: h.getLatestBlockhash,
    getMultipleAccountsInfo: h.getMultipleAccountsInfo,
  }),
  getPlatformFeePayer: h.getPlatformFeePayer,
}));
// Account data here is a one-byte stand-in for the generation it carries.
vi.mock("../course-generation", () => ({
  courseGeneration: (data: Buffer) => data[0],
  enrollmentCourseGeneration: (data: Buffer) => data[0],
}));
const PROGRAM = Keypair.generate().publicKey;
const OTHER_PROGRAM = Keypair.generate().publicKey;
const COURSE_PDA = Keypair.generate().publicKey;
const ENROLLMENT_PDA = Keypair.generate().publicKey;
vi.mock("../pda", () => ({
  getProgramId: () => PROGRAM,
  findCoursePDA: () => [COURSE_PDA, 255],
  findEnrollmentPDA: () => [ENROLLMENT_PDA, 255],
}));
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

import {
  buildSponsoredEnrollTransaction,
  CourseNotOnChainError,
} from "../sponsor-enroll";
import { COMPUTE_UNIT_LIMITS } from "../compute-budget";

const sponsor = Keypair.generate();
const learner = Keypair.generate().publicKey;
const BLOCKHASH = bs58.encode(Buffer.alloc(32, 7));
const GENERATION = 7;

const course = { owner: PROGRAM, data: Buffer.from([GENERATION]) };
const enrollment = (generation: number, owner = PROGRAM) => ({
  owner,
  data: Buffer.from([generation]),
});

const KEY = {
  wallet: learner.toBase58(),
  courseId: "course-x",
  programId: PROGRAM.toBase58(),
  courseGeneration: GENERATION,
};

const priorRow = (status: string, signature = "PRIOR_SIG") => ({
  signature,
  status,
  last_valid_block_height: 100,
  created_at: "2026-10-21T00:00:00.000Z",
  payer: sponsor.publicKey.toBase58(),
  payer_role: "sponsor",
  action: "enroll_sponsor",
  user_id: "user-1",
  wallet: learner.toBase58(),
  course_id: "course-x",
  cluster: "devnet",
});

const build = () =>
  buildSponsoredEnrollTransaction("course-x", learner, "user-1");

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
  h.getMultipleAccountsInfo.mockResolvedValue([course, null]);
  h.findLive.mockResolvedValue([]);
  h.reserve.mockResolvedValue("reserved");
  h.supersede.mockResolvedValue(true);
  h.estimate.mockResolvedValue(30_000);
});

describe("buildSponsoredEnrollTransaction", () => {
  it("makes the sponsor the payer and fee payer, and reserves the generation's slot", async () => {
    const result = await build();
    if (!result.ok) throw new Error("expected a transaction");

    const tx = Transaction.from(
      Buffer.from(result.transaction.transaction, "base64")
    );
    expect(tx.feePayer?.equals(sponsor.publicKey)).toBe(true);
    expect(result.transaction.sponsor).toBe(sponsor.publicKey.toBase58());

    expect(h.findLive).toHaveBeenCalledWith("enroll_sponsor", KEY);
    expect(h.reserve).toHaveBeenCalledWith({
      ...KEY,
      signature: bs58.encode(tx.signature!),
      action: "enroll_sponsor",
      userId: "user-1",
      payer: sponsor.publicKey.toBase58(),
      payerRole: "sponsor",
      lastValidBlockHeight: 500,
    });
  });

  it("sets the fixed enroll limit and the estimated price before the sponsor signs", async () => {
    const result = await build();
    if (!result.ok) throw new Error("expected a transaction");

    const tx = Transaction.from(
      Buffer.from(result.transaction.transaction, "base64")
    );
    const [limitIx, priceIx, enrollIx] = tx.instructions;
    expect(tx.instructions).toHaveLength(3);
    expect(limitIx!.programId.equals(ComputeBudgetProgram.programId)).toBe(
      true
    );
    // A fixed limit: the sponsor's priority fee is bounded by limit x ceiling.
    expect(
      ComputeBudgetInstruction.decodeSetComputeUnitLimit(limitIx!)
    ).toEqual({ units: COMPUTE_UNIT_LIMITS.enroll });
    expect(
      ComputeBudgetInstruction.decodeSetComputeUnitPrice(priceIx!).microLamports
    ).toBe(30_000n);
    expect(enrollIx!.programId.equals(PROGRAM)).toBe(true);
    // The sponsor's signature covers the budget, so the learner can't change it.
    const sponsorSig = tx.signatures.find((s) =>
      s.publicKey.equals(sponsor.publicKey)
    );
    expect(sponsorSig?.signature).not.toBeNull();
    expect(tx.verifySignatures(false)).toBe(true);
    // Priced on what the sponsored transaction writes.
    const [, accounts] = h.estimate.mock.calls[0] as [unknown, PublicKey[]];
    expect(accounts.map((a) => a.toBase58())).toEqual([
      sponsor.publicKey.toBase58(),
    ]);
  });

  it("refuses when the Course account is not on-chain (no generation to key on)", async () => {
    h.getMultipleAccountsInfo.mockResolvedValue([null, null]);
    await expect(build()).rejects.toBeInstanceOf(CourseNotOnChainError);
    expect(h.reserve).not.toHaveBeenCalled();
  });

  it("does not sponsor a learner already enrolled in the current generation", async () => {
    h.getMultipleAccountsInfo.mockResolvedValue([
      course,
      enrollment(GENERATION),
    ]);

    await expect(build()).resolves.toEqual({
      ok: false,
      reason: "already_enrolled",
    });
    expect(h.findLive).not.toHaveBeenCalled();
    expect(h.reserve).not.toHaveBeenCalled();
  });

  it("sponsors re-enrolling into a recreated course without using the generation's slot", async () => {
    h.getMultipleAccountsInfo.mockResolvedValue([
      course,
      enrollment(GENERATION - 1),
    ]);

    const result = await build();

    expect(result.ok).toBe(true);
    expect(h.findLive).toHaveBeenCalledWith("enroll_sponsor_reenroll", KEY);
    expect(h.reserve.mock.calls[0]?.[0]).toMatchObject({
      action: "enroll_sponsor_reenroll",
      courseGeneration: GENERATION,
    });
  });

  it("ignores an Enrollment address held by another program", async () => {
    h.getMultipleAccountsInfo.mockResolvedValue([
      course,
      enrollment(GENERATION, OTHER_PROGRAM),
    ]);

    const result = await build();

    expect(result.ok).toBe(true);
    expect(h.findLive).toHaveBeenCalledWith("enroll_sponsor", KEY);
  });

  it("declines a plain close and re-enroll on the same generation", async () => {
    h.findLive.mockResolvedValue([priorRow("confirmed")]);

    await expect(build()).resolves.toEqual({
      ok: false,
      reason: "already_sponsored",
    });
    expect(h.getLatestBlockhash).not.toHaveBeenCalled();
    expect(h.reserve).not.toHaveBeenCalled();
  });

  it("settles a pending sponsorship first, and declines if it landed", async () => {
    h.findLive.mockResolvedValue([priorRow("pending")]);
    h.settleRows.mockResolvedValue(new Map([["PRIOR_SIG", "confirmed"]]));

    await expect(build()).resolves.toEqual({
      ok: false,
      reason: "already_sponsored",
    });
    expect(h.settleRows).toHaveBeenCalledWith(
      [priorRow("pending")],
      expect.objectContaining({ admin: "admin", emit: expect.any(Function) })
    );
  });

  it("asks the learner to wait while the earlier transaction is landing", async () => {
    h.findLive.mockResolvedValue([priorRow("pending")]);
    h.settleRows.mockResolvedValue(new Map([["PRIOR_SIG", "pending"]]));

    await expect(build()).resolves.toEqual({ ok: false, reason: "in_flight" });
    expect(h.supersede).not.toHaveBeenCalled();
    expect(h.reserve).not.toHaveBeenCalled();
  });

  it("supersedes an abandoned sponsorship (no trace on-chain) and sponsors again", async () => {
    h.findLive.mockResolvedValue([priorRow("pending")]);
    h.settleRows.mockResolvedValue(new Map([["PRIOR_SIG", "unseen"]]));

    const result = await build();

    expect(h.supersede).toHaveBeenCalledWith("PRIOR_SIG");
    expect(result.ok).toBe(true);
    expect(h.reserve).toHaveBeenCalledTimes(1);
  });

  it("waits instead when the abandoned row settled between the read and the supersede", async () => {
    h.findLive.mockResolvedValue([priorRow("pending")]);
    h.settleRows.mockResolvedValue(new Map([["PRIOR_SIG", "unseen"]]));
    h.supersede.mockResolvedValue(false);

    await expect(build()).resolves.toEqual({ ok: false, reason: "in_flight" });
    expect(h.reserve).not.toHaveBeenCalled();
  });

  it("counts an abandoned sponsorship that landed after all as used", async () => {
    h.findLive.mockResolvedValue([priorRow("superseded_landed", "A")]);

    await expect(build()).resolves.toEqual({
      ok: false,
      reason: "already_sponsored",
    });
    expect(h.settleRows).not.toHaveBeenCalled();
  });

  it("settles abandoned rows inline: one that landed uses the slot even if the live one expired", async () => {
    // A was superseded by B, then A was submitted and landed. No cron pass
    // has run; B expired unsubmitted.
    const a = priorRow("superseded", "A");
    const b = priorRow("pending", "B");
    h.findLive.mockResolvedValue([a, b]);
    h.settleRows.mockResolvedValue(
      new Map([
        ["A", "superseded_landed"],
        ["B", "expired"],
      ])
    );

    await expect(build()).resolves.toEqual({
      ok: false,
      reason: "already_sponsored",
    });
    // Both settled in one pass (one signature-status lookup).
    expect(h.settleRows).toHaveBeenCalledTimes(1);
    expect(h.settleRows.mock.calls[0]?.[0]).toEqual([a, b]);
    expect(h.supersede).not.toHaveBeenCalled();
    expect(h.reserve).not.toHaveBeenCalled();
  });

  it("waits while an abandoned attempt is landing right now", async () => {
    h.findLive.mockResolvedValue([
      priorRow("superseded", "A"),
      priorRow("pending", "B"),
    ]);
    h.settleRows.mockResolvedValue(
      new Map([
        ["A", "superseded"],
        ["B", "unseen"],
      ])
    );

    await expect(build()).resolves.toEqual({ ok: false, reason: "in_flight" });
    expect(h.supersede).not.toHaveBeenCalled();
  });

  it("sponsors again when every abandoned attempt expired", async () => {
    h.findLive.mockResolvedValue([
      priorRow("superseded", "A"),
      priorRow("pending", "B"),
    ]);
    h.settleRows.mockResolvedValue(
      new Map([
        ["A", "expired"],
        ["B", "unseen"],
      ])
    );

    const result = await build();

    expect(h.supersede).toHaveBeenCalledWith("B");
    expect(result.ok).toBe(true);
  });

  it.each(["expired", "failed"])(
    "sponsors again once the earlier attempt %s without enrolling",
    async (outcome) => {
      h.findLive.mockResolvedValue([priorRow("pending")]);
      h.settleRows.mockResolvedValue(new Map([["PRIOR_SIG", outcome]]));

      const result = await build();

      expect(result.ok).toBe(true);
      expect(h.reserve).toHaveBeenCalledTimes(1);
    }
  );

  it("declines when a concurrent request reserved the slot first", async () => {
    h.reserve.mockResolvedValue("conflict");
    await expect(build()).resolves.toEqual({ ok: false, reason: "in_flight" });
  });

  it("refuses to sponsor when the once-per check cannot read the ledger", async () => {
    h.findLive.mockRejectedValue(new Error("platform_spend read failed"));

    await expect(build()).rejects.toThrow(/platform_spend/);
    expect(h.reserve).not.toHaveBeenCalled();
  });

  it("fails closed when no sponsor may pay", async () => {
    h.getPlatformFeePayer.mockRejectedValue(new Error("SPONSOR_SECRET unset"));

    await expect(build()).rejects.toThrow(/SPONSOR_SECRET/);
    expect(h.findLive).not.toHaveBeenCalled();
  });
});
