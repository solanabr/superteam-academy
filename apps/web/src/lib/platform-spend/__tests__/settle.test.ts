/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Keypair } from "@solana/web3.js";
import type { PublicKey } from "@solana/web3.js";
import { createFakeDb, type FakeDb, type Row } from "./fake-db";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/solana/sponsor", () => ({
  getPlatformPayerKeys: () => new Map(),
}));
vi.mock("@/lib/analytics/server-capture", () => ({
  captureServerEvent: vi.fn(),
  PLATFORM_DISTINCT_ID: "platform",
}));
vi.mock("@/lib/logging", () => ({ logEvent: vi.fn() }));

import {
  computeSpend,
  settlePendingSpend,
  settleRows,
  type SettleDeps,
  type SpendRow,
} from "../settle";
import type { ServerEvent } from "../events";
import { logEvent } from "@/lib/logging";

const sponsor = Keypair.generate().publicKey;
const backend = Keypair.generate().publicKey;
const learner = Keypair.generate().publicKey;
const NOW = Date.parse("2026-10-21T12:00:00.000Z");

describe("computeSpend", () => {
  const keys = new Set([sponsor.toBase58(), backend.toBase58()]);
  const accountKeys = [sponsor, backend, learner].map((k) => k.toBase58());

  it("splits the sponsor's fee from rent other platform keys paid", () => {
    expect(
      computeSpend(
        {
          fee: 5_000,
          accountKeys,
          // Sponsor: fee + token account rent. Backend: program rent.
          preBalances: [1_000_000_000, 500_000_000, 0],
          postBalances: [
            1_000_000_000 - 5_000 - 2_039_280,
            500_000_000 - 3_000_000,
            0,
          ],
        },
        keys
      )
    ).toEqual({
      feeLamports: 5_000,
      rentLamports: 5_039_280,
      refundLamports: 0,
    });
  });

  it("counts lamports that come back to a platform key as a refund", () => {
    // A learner-sent close_enrollment: the learner pays the fee, the sponsor
    // gets the enrollment rent back.
    expect(
      computeSpend(
        {
          fee: 5_000,
          accountKeys: [learner.toBase58(), sponsor.toBase58()],
          preBalances: [10_000_000, 100],
          postBalances: [10_000_000 - 5_000, 100 + 1_500_000],
        },
        keys
      )
    ).toEqual({ feeLamports: 0, rentLamports: 0, refundLamports: 1_500_000 });
  });

  it("charges only the fee for a transaction that failed on-chain", () => {
    expect(
      computeSpend(
        {
          fee: 5_000,
          accountKeys,
          preBalances: [10_000, 1_000, 0],
          postBalances: [5_000, 1_000, 0],
        },
        keys
      )
    ).toEqual({ feeLamports: 5_000, rentLamports: 0, refundLamports: 0 });
  });
});

// ---------------------------------------------------------------------------

type Status = {
  confirmationStatus: "processed" | "confirmed" | "finalized";
  err: unknown;
} | null;

function fakeTx(keys: PublicKey[], pre: number[], post: number[], fee = 5_000) {
  return {
    meta: { fee, preBalances: pre, postBalances: post, loadedAddresses: null },
    transaction: {
      message: {
        version: "legacy",
        getAccountKeys: () => ({ keySegments: () => [keys] }),
      },
    },
  };
}

interface Chain {
  statuses: Record<string, Status>;
  txs: Record<string, ReturnType<typeof fakeTx>>;
  blockHeight: number;
  heightSlot: number;
  statusSlot: number;
}

function makeDeps(db: FakeDb, chain: Chain, events: ServerEvent[]): SettleDeps {
  return {
    connection: {
      getEpochInfo: vi.fn(async () => ({
        epoch: 1,
        slotIndex: 0,
        slotsInEpoch: 1,
        absoluteSlot: chain.heightSlot,
        blockHeight: chain.blockHeight,
      })),
      getSignatureStatuses: vi.fn(async (sigs: string[]) => ({
        context: { slot: chain.statusSlot },
        value: sigs.map((s) => chain.statuses[s] ?? null),
      })),
      getTransaction: vi.fn(async (sig: string) => chain.txs[sig] ?? null),
    } as unknown as SettleDeps["connection"],
    admin: db as unknown as SettleDeps["admin"],
    platformKeys: new Map([[backend.toBase58(), "backend" as const]]),
    emit: async (event) => {
      events.push(event);
    },
    now: () => NOW,
  };
}

function seed(
  db: FakeDb,
  overrides: Partial<SpendRow> & { signature: string }
): SpendRow {
  const row: SpendRow = {
    status: "pending",
    action: "complete_lesson",
    user_id: null,
    wallet: learner.toBase58(),
    course_id: "course-x",
    payer: sponsor.toBase58(),
    payer_role: "sponsor",
    cluster: "devnet",
    last_valid_block_height: 1_000,
    created_at: new Date(NOW - 60_000).toISOString(),
    ...overrides,
  };
  db.tables.platform_spend!.push({ ...row } as Row);
  return row;
}

describe("settleRows", () => {
  let db: FakeDb;
  let events: ServerEvent[];
  let chain: Chain;

  beforeEach(() => {
    vi.mocked(logEvent).mockClear();
    db = createFakeDb();
    db.tables.profiles!.push({
      id: "user-7",
      wallet_address: learner.toBase58(),
    });
    events = [];
    chain = {
      statuses: {},
      txs: {},
      blockHeight: 2_000,
      heightSlot: 50,
      statusSlot: 60,
    };
  });

  it("settles a landed transaction: amounts, status, learner, one event", async () => {
    const row = seed(db, { signature: "SIG1" });
    chain.statuses.SIG1 = { confirmationStatus: "confirmed", err: null };
    chain.txs.SIG1 = fakeTx(
      [sponsor, backend, learner],
      [1_000_000, 1_000_000, 0],
      [1_000_000 - 5_000 - 2_000, 1_000_000, 0]
    );

    const result = await settleRows([row], makeDeps(db, chain, events));

    expect(result.get("SIG1")).toBe("confirmed");
    expect(db.tables.platform_spend![0]).toMatchObject({
      status: "confirmed",
      fee_lamports: 5_000,
      rent_lamports: 2_000,
      refund_lamports: 0,
      user_id: "user-7",
      settled_at: new Date(NOW).toISOString(),
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      event: "platform_spend_settled",
      distinctId: "user-7",
      properties: {
        action: "complete_lesson",
        status: "confirmed",
        fee_lamports: 5_000,
        rent_lamports: 2_000,
        refund_lamports: 0,
        net_lamports: 7_000,
        payer_role: "sponsor",
        course_id: "course-x",
        cluster: "devnet",
        signature: "SIG1",
      },
    });
    // No wallet address anywhere in the event.
    expect(JSON.stringify(events[0])).not.toContain(learner.toBase58());
    expect(JSON.stringify(events[0])).not.toContain(sponsor.toBase58());
  });

  it("emits exactly once per signature, even when two settlers race", async () => {
    const row = seed(db, { signature: "SIG1" });
    chain.statuses.SIG1 = { confirmationStatus: "finalized", err: null };
    chain.txs.SIG1 = fakeTx([sponsor], [10_000], [5_000]);
    const deps = makeDeps(db, chain, events);

    // Both read the row while it was pending.
    await Promise.all([settleRows([row], deps), settleRows([row], deps)]);
    await settleRows([row], deps);

    expect(events).toHaveLength(1);
    expect(db.tables.platform_spend).toHaveLength(1);
  });

  it("records a transaction that failed on-chain with the fee it still cost", async () => {
    const row = seed(db, { signature: "SIG1" });
    chain.statuses.SIG1 = {
      confirmationStatus: "confirmed",
      err: { InstructionError: [0, { Custom: 6003 }] },
    };
    chain.txs.SIG1 = fakeTx([sponsor], [10_000], [5_000]);

    await settleRows([row], makeDeps(db, chain, events));

    expect(db.tables.platform_spend![0]).toMatchObject({
      status: "failed",
      fee_lamports: 5_000,
    });
    expect(events[0]?.properties).toMatchObject({ status: "failed" });
  });

  it("expires a transaction that never landed before its last valid height", async () => {
    const row = seed(db, { signature: "SIG1", last_valid_block_height: 1_500 });

    const result = await settleRows([row], makeDeps(db, chain, events));

    expect(result.get("SIG1")).toBe("expired");
    expect(db.tables.platform_spend![0]).toMatchObject({
      status: "expired",
      fee_lamports: 0,
    });
    expect(events).toHaveLength(0);
  });

  it("does not expire on a lagging status node", async () => {
    const row = seed(db, { signature: "SIG1", last_valid_block_height: 1_500 });
    chain.statusSlot = 40; // behind the slot the height was read at

    const result = await settleRows([row], makeDeps(db, chain, events));

    expect(result.get("SIG1")).toBe("unseen");
    expect(db.tables.platform_spend![0]!.status).toBe("pending");
  });

  it("leaves a transaction pending while it can still land", async () => {
    const row = seed(db, { signature: "SIG1", last_valid_block_height: 2_100 });
    const processing = seed(db, { signature: "SIG2" });
    chain.statuses.SIG2 = { confirmationStatus: "processed", err: null };

    const result = await settleRows(
      [row, processing],
      makeDeps(db, chain, events)
    );

    // Unseen: the cluster has no trace of it (it may never have been sent).
    expect(result.get("SIG1")).toBe("unseen");
    // Seen but not final yet.
    expect(result.get("SIG2")).toBe("pending");
    expect(events).toHaveLength(0);
  });

  it("records a superseded sponsorship that lands late as superseded_landed", async () => {
    const row = seed(db, {
      signature: "OLD",
      status: "superseded",
      action: "enroll_sponsor",
    });
    chain.statuses.OLD = { confirmationStatus: "confirmed", err: null };
    chain.txs.OLD = fakeTx(
      [sponsor],
      [10_000_000],
      [10_000_000 - 5_000 - 1_500_000]
    );

    const result = await settleRows([row], makeDeps(db, chain, events));

    expect(result.get("OLD")).toBe("superseded_landed");
    expect(db.tables.platform_spend![0]).toMatchObject({
      status: "superseded_landed",
      rent_lamports: 1_500_000,
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.properties.status).toBe("confirmed");
  });

  it.each(["pending", "confirmed"])(
    "records a late landing without fighting a %s replacement for the slot, once",
    async (replacementStatus) => {
      const slot = { program_id: "P", course_generation: 1 };
      const old = seed(db, {
        signature: "OLD",
        status: "superseded",
        action: "enroll_sponsor",
        ...slot,
      } as Partial<SpendRow> & { signature: string });
      seed(db, {
        signature: "NEW",
        status: replacementStatus as SpendRow["status"],
        action: "enroll_sponsor",
        last_valid_block_height: 3_000, // still landable
        ...slot,
      } as Partial<SpendRow> & { signature: string });
      chain.statuses.OLD = { confirmationStatus: "confirmed", err: null };
      chain.txs.OLD = fakeTx([sponsor], [10_000], [5_000]);
      const deps = makeDeps(db, chain, events);

      const result = await settleRows([old], deps);
      // A second pass (the next cron tick) has nothing left to do.
      await settlePendingSpend(deps.connection, deps);

      expect(result.get("OLD")).toBe("superseded_landed");
      expect(db.tables.platform_spend![0]).toMatchObject({
        status: "superseded_landed",
        fee_lamports: 5_000,
      });
      expect(db.tables.platform_spend![1]!.status).toBe(replacementStatus);
      expect(events).toHaveLength(1);
      // No unique-index conflict, so nothing is logged and retried forever.
      expect(vi.mocked(logEvent)).not.toHaveBeenCalled();
    }
  );

  it("stops taking rows once its deadline passes", async () => {
    const first = seed(db, {
      signature: "SIG1",
      last_valid_block_height: 1_500,
    });
    const second = seed(db, {
      signature: "SIG2",
      last_valid_block_height: 1_500,
    });
    // Both rows are expirable, but the budget is already spent.
    const deps = { ...makeDeps(db, chain, events), deadline: NOW - 1 };

    const result = await settleRows([first, second], deps);

    expect(result.get("SIG1")).toBe("pending");
    expect(result.get("SIG2")).toBe("pending");
    expect(db.tables.platform_spend!.every((r) => r.status === "pending")).toBe(
      true
    );
  });

  it("attributes a learner-less row to the platform", async () => {
    const row = seed(db, {
      signature: "SIG1",
      action: "admin_course_write",
      wallet: null,
      payer_role: "authority",
    });
    chain.statuses.SIG1 = { confirmationStatus: "confirmed", err: null };
    chain.txs.SIG1 = fakeTx([sponsor], [10_000], [5_000]);

    await settleRows([row], makeDeps(db, chain, events));

    expect(events[0]?.distinctId).toBe("platform");
    expect(events[0]?.properties.payer_role).toBe("authority");
  });
});

describe("settlePendingSpend", () => {
  it("settles the oldest pending rows and skips ones sent seconds ago", async () => {
    const db = createFakeDb();
    const events: ServerEvent[] = [];
    seed(db, { signature: "OLD", last_valid_block_height: 1_000 });
    seed(db, {
      signature: "FRESH",
      last_valid_block_height: 1_000,
      created_at: new Date(NOW - 5_000).toISOString(),
    });
    const chain: Chain = {
      statuses: {},
      txs: {},
      blockHeight: 2_000,
      heightSlot: 50,
      statusSlot: 60,
    };
    const deps = makeDeps(db, chain, events);

    const summary = await settlePendingSpend(deps.connection, deps);

    expect(summary).toEqual({
      checked: 1,
      confirmed: 0,
      failed: 0,
      expired: 1,
      pending: 0,
    });
    expect(
      db.tables.platform_spend!.find((r) => r.signature === "FRESH")!.status
    ).toBe("pending");
  });
});
