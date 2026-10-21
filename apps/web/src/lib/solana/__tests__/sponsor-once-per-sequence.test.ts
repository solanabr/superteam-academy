/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  createFakeDb,
  type FakeDb,
} from "@/lib/platform-spend/__tests__/fake-db";

// The once-per rule end to end: the real sponsor-enroll, ledger and settlement
// code over an in-memory ledger and a scripted chain. Covers the abandoned-
// then-landed sequence (A superseded by B, then A lands) through the inline
// check and through the cron.

const h = vi.hoisted(() => ({
  db: null as unknown as FakeDb,
  chain: null as unknown as {
    blockHeight: number;
    blockhashes: number;
    statuses: Map<string, { confirmationStatus: string; err: unknown }>;
    txs: Map<string, unknown>;
    enrollment: { owner: unknown; data: Buffer } | null;
  },
  logEvent: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: (task: () => unknown) => task() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.db }));
vi.mock("@/lib/logging", () => ({ logEvent: h.logEvent }));
vi.mock("@/lib/analytics/server-capture", () => ({
  captureServerEvent: vi.fn(),
  PLATFORM_DISTINCT_ID: "platform",
}));
const sponsor = Keypair.generate();
vi.mock("@/lib/solana/sponsor", () => ({
  spendCluster: () => "devnet",
  getPlatformPayerKeys: () =>
    new Map([[sponsor.publicKey.toBase58(), "sponsor"]]),
}));

const PROGRAM = Keypair.generate().publicKey;
const GENERATION = 7;

const connection = {
  getLatestBlockhash: async () => {
    h.chain.blockhashes += 1;
    return {
      blockhash: bs58.encode(Buffer.alloc(32, h.chain.blockhashes)),
      lastValidBlockHeight: h.chain.blockHeight + 150,
    };
  },
  getMultipleAccountsInfo: async () => [
    { owner: PROGRAM, data: Buffer.from([GENERATION]) },
    h.chain.enrollment,
  ],
  getEpochInfo: async () => ({
    epoch: 1,
    slotIndex: 0,
    slotsInEpoch: 1,
    absoluteSlot: 50,
    blockHeight: h.chain.blockHeight,
  }),
  getSignatureStatuses: async (sigs: string[]) => ({
    context: { slot: 60 },
    value: sigs.map((s) => h.chain.statuses.get(s) ?? null),
  }),
  getTransaction: async (sig: string) => h.chain.txs.get(sig) ?? null,
};

vi.mock("../academy-program", () => ({
  getConnection: () => connection,
  getPlatformFeePayer: async () => ({ keypair: sponsor, role: "sponsor" }),
}));
vi.mock("../course-generation", () => ({
  courseGeneration: (data: Buffer) => data[0],
  enrollmentCourseGeneration: (data: Buffer) => data[0],
}));
vi.mock("../pda", () => ({
  getProgramId: () => PROGRAM,
  findCoursePDA: () => [Keypair.generate().publicKey, 255],
  findEnrollmentPDA: () => [Keypair.generate().publicKey, 255],
}));
vi.mock("../instructions", () => ({
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
import {
  defaultSettleDeps,
  settlePendingSpend,
} from "@/lib/platform-spend/settle";

const learner = Keypair.generate().publicKey;
const RENT = 1_500_000;

async function request() {
  const result = await buildSponsoredEnrollTransaction(
    "course-x",
    learner,
    "user-1"
  );
  if (!result.ok) return { result, signature: null };
  const tx = Transaction.from(
    Buffer.from(result.transaction.transaction, "base64")
  );
  return { result, signature: bs58.encode(tx.signature!) };
}

/** The learner submits a held sponsored transaction and it lands. */
function lands(signature: string) {
  h.chain.statuses.set(signature, {
    confirmationStatus: "finalized",
    err: null,
  });
  h.chain.txs.set(signature, {
    meta: {
      fee: 5_000,
      preBalances: [10_000_000, 0],
      postBalances: [10_000_000 - 5_000 - RENT, 0],
      loadedAddresses: null,
    },
    transaction: {
      message: {
        version: "legacy",
        getAccountKeys: () => ({
          keySegments: () => [[sponsor.publicKey, learner]],
        }),
      },
    },
  });
}

/** The cron runs a while later (its sweep skips rows under 20 s old). */
const cronDeps = () => ({
  ...defaultSettleDeps(connection as never),
  now: () => Date.now() + 60_000,
});

/** Time passes: every blockhash handed out so far has expired. */
function blockhashesExpire() {
  h.chain.blockHeight += 1_000;
}

const statusOf = (signature: string) =>
  h.db.tables.platform_spend!.find((r) => r.signature === signature)?.status;

/** A requests, abandons, B replaces it, then A lands after all. */
async function abandonThenLand() {
  const a = await request();
  const b = await request();
  expect(a.result.ok && b.result.ok).toBe(true);
  expect(statusOf(a.signature!)).toBe("superseded");
  expect(statusOf(b.signature!)).toBe("pending");

  lands(a.signature!);
  // A day later the learner closes the enrollment; B was never submitted.
  h.chain.enrollment = null;
  blockhashesExpire();
  return { a: a.signature!, b: b.signature! };
}

beforeEach(() => {
  h.db = createFakeDb();
  h.chain = {
    blockHeight: 1_000,
    blockhashes: 0,
    statuses: new Map(),
    txs: new Map(),
    enrollment: null,
  };
  h.logEvent.mockReset();
});

describe("once per wallet and course: an abandoned sponsorship that lands later", () => {
  it("is caught by the inline check before any cron pass", async () => {
    const { a, b } = await abandonThenLand();

    const third = await request();

    expect(third.result).toEqual({ ok: false, reason: "already_sponsored" });
    expect(statusOf(a)).toBe("superseded_landed");
    expect(statusOf(b)).toBe("expired");
    // A's spend is on the ledger.
    expect(
      h.db.tables.platform_spend!.find((r) => r.signature === a)
    ).toMatchObject({ fee_lamports: 5_000, rent_lamports: RENT });
    expect(h.db.tables.platform_spend).toHaveLength(2);
  });

  it("is caught after the cron settled it", async () => {
    const { a, b } = await abandonThenLand();

    await settlePendingSpend(connection as never, cronDeps());
    expect(statusOf(a)).toBe("superseded_landed");
    expect(statusOf(b)).toBe("expired");

    const third = await request();
    expect(third.result).toEqual({ ok: false, reason: "already_sponsored" });
  });

  it("never loops on the unique index when a replacement already holds the slot", async () => {
    const { a } = await abandonThenLand();
    // State the old code could reach: a third sponsorship C confirmed in the
    // slot before A's late landing was settled.
    h.db.tables.platform_spend!.push({
      ...h.db.tables.platform_spend!.find((r) => r.signature === a),
      signature: "C",
      status: "confirmed",
    });

    const deps = cronDeps();
    await settlePendingSpend(connection as never, deps);
    await settlePendingSpend(connection as never, deps);

    expect(statusOf(a)).toBe("superseded_landed");
    expect(statusOf("C")).toBe("confirmed");
    expect(h.logEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: "SPEND_LEDGER_002" })
    );
  });

  it("frees the slot when the abandoned attempt never lands", async () => {
    const a = await request();
    const b = await request();
    blockhashesExpire();

    const third = await request();

    expect(third.result.ok).toBe(true);
    expect(statusOf(a.signature!)).toBe("expired");
    expect(statusOf(b.signature!)).toBe("expired");
    expect(statusOf(third.signature!)).toBe("pending");
  });
});
