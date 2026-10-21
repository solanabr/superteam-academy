/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFakeDb, type FakeDb } from "./fake-db";

const h = vi.hoisted(() => ({
  db: null as unknown as FakeDb,
  hang: false,
  logEvent: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) =>
      h.hang
        ? {
            upsert: () => new Promise(() => undefined),
          }
        : h.db.from(table),
  }),
}));
vi.mock("@/lib/solana/sponsor", () => ({ spendCluster: () => "devnet" }));
vi.mock("@/lib/logging", () => ({ logEvent: h.logEvent }));

import {
  findLiveSponsoredEnroll,
  LedgerUnavailableError,
  recordPlatformTx,
  recordSponsoredEnrollRefund,
  reserveSponsoredEnroll,
  supersedeSponsoredEnroll,
  type SponsorshipKey,
} from "../ledger";

const base = {
  action: "complete_lesson" as const,
  payer: "SponsorPubkey",
  payerRole: "sponsor" as const,
  wallet: "LearnerWallet",
  courseId: "course-x",
  lastValidBlockHeight: 900,
};

const KEY: SponsorshipKey = {
  wallet: "LearnerWallet",
  courseId: "course-x",
  programId: "ProgramA",
  courseGeneration: 7,
};

const enroll = (
  signature: string,
  overrides: Partial<SponsorshipKey> & {
    action?: "enroll_sponsor" | "enroll_sponsor_reenroll";
  } = {}
) => ({
  ...base,
  ...KEY,
  signature,
  action: "enroll_sponsor" as const,
  userId: "user-1",
  ...overrides,
});

beforeEach(() => {
  h.db = createFakeDb();
  h.hang = false;
  h.logEvent.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("recordPlatformTx", () => {
  it("writes a pending row with the payer, context and cluster", async () => {
    await recordPlatformTx({ ...base, signature: "SIG1" });

    expect(h.db.tables.platform_spend).toEqual([
      expect.objectContaining({
        signature: "SIG1",
        action: "complete_lesson",
        status: "pending",
        payer: "SponsorPubkey",
        payer_role: "sponsor",
        wallet: "LearnerWallet",
        course_id: "course-x",
        user_id: null,
        cluster: "devnet",
        last_valid_block_height: 900,
      }),
    ]);
  });

  it("is idempotent on the signature: a re-send adds no second row", async () => {
    await recordPlatformTx({ ...base, signature: "SIG1" });
    h.db.tables.platform_spend![0]!.status = "confirmed";

    await recordPlatformTx({ ...base, signature: "SIG1" });

    expect(h.db.tables.platform_spend).toHaveLength(1);
    // The settled row is left alone, not reset to pending.
    expect(h.db.tables.platform_spend![0]!.status).toBe("confirmed");
    expect(h.logEvent).not.toHaveBeenCalled();
  });

  it("never throws on a DB error; it logs instead", async () => {
    h.db.failNext("platform_spend", { message: "relation does not exist" });

    await expect(
      recordPlatformTx({ ...base, signature: "SIG1" })
    ).resolves.toBeUndefined();
    expect(h.logEvent.mock.calls[0]?.[0]).toMatchObject({
      event: "SPEND_LEDGER_001",
    });
  });

  it("gives up on a hung DB instead of stalling the send", async () => {
    vi.useFakeTimers();
    h.hang = true;

    const done = recordPlatformTx({ ...base, signature: "SIG1" });
    await vi.advanceTimersByTimeAsync(3_000);

    await expect(done).resolves.toBeUndefined();
    expect(h.logEvent.mock.calls[0]?.[0]).toMatchObject({
      context: expect.objectContaining({ reason: "timed out" }),
    });
  });
});

describe("once per wallet and course", () => {
  it("reserves the first sponsorship and refuses a second live one", async () => {
    await expect(reserveSponsoredEnroll(enroll("SIG1"))).resolves.toBe(
      "reserved"
    );
    await expect(reserveSponsoredEnroll(enroll("SIG2"))).resolves.toBe(
      "conflict"
    );
  });

  it("frees the slot when the earlier attempt expired or failed", async () => {
    await reserveSponsoredEnroll(enroll("SIG1"));
    h.db.tables.platform_spend![0]!.status = "expired";
    await expect(reserveSponsoredEnroll(enroll("SIG2"))).resolves.toBe(
      "reserved"
    );

    h.db.tables.platform_spend![1]!.status = "failed";
    await expect(reserveSponsoredEnroll(enroll("SIG3"))).resolves.toBe(
      "reserved"
    );
  });

  it("keeps the slot forever once the sponsorship landed", async () => {
    await reserveSponsoredEnroll(enroll("SIG1"));
    h.db.tables.platform_spend![0]!.status = "confirmed";

    await expect(reserveSponsoredEnroll(enroll("SIG2"))).resolves.toBe(
      "conflict"
    );
    await expect(
      findLiveSponsoredEnroll("enroll_sponsor", KEY)
    ).resolves.toMatchObject({ signature: "SIG1", status: "confirmed" });
  });

  it("is per course: another course is a separate slot", async () => {
    await reserveSponsoredEnroll(enroll("SIG1"));
    await expect(
      reserveSponsoredEnroll(enroll("SIG2", { courseId: "course-y" }))
    ).resolves.toBe("reserved");
  });

  it("sponsors a recreated course again: a new generation is a new slot", async () => {
    await reserveSponsoredEnroll(enroll("SIG1"));
    h.db.tables.platform_spend![0]!.status = "confirmed";

    await expect(
      reserveSponsoredEnroll(enroll("SIG2", { courseGeneration: 8 }))
    ).resolves.toBe("reserved");
  });

  it("sponsors again after a program move on the same cluster", async () => {
    await reserveSponsoredEnroll(enroll("SIG1"));
    h.db.tables.platform_spend![0]!.status = "confirmed";

    await expect(
      reserveSponsoredEnroll(enroll("SIG2", { programId: "ProgramB" }))
    ).resolves.toBe("reserved");
  });

  it("keeps a re-enroll of a stale enrollment out of the generation's slot", async () => {
    await reserveSponsoredEnroll(
      enroll("SIG1", { action: "enroll_sponsor_reenroll" })
    );
    h.db.tables.platform_spend![0]!.status = "confirmed";

    // The generation's own sponsorship is still available...
    await expect(reserveSponsoredEnroll(enroll("SIG2"))).resolves.toBe(
      "reserved"
    );
    // ...but a second live re-enroll for the same generation is not.
    await expect(
      reserveSponsoredEnroll(
        enroll("SIG3", { action: "enroll_sponsor_reenroll" })
      )
    ).resolves.toBe("conflict");
  });

  it("frees the slot when a pending sponsorship is superseded", async () => {
    await reserveSponsoredEnroll(enroll("SIG1"));

    await expect(supersedeSponsoredEnroll("SIG1")).resolves.toBe(true);
    expect(h.db.tables.platform_spend![0]!.status).toBe("superseded");
    await expect(reserveSponsoredEnroll(enroll("SIG2"))).resolves.toBe(
      "reserved"
    );
  });

  it("does not supersede a sponsorship that already settled", async () => {
    await reserveSponsoredEnroll(enroll("SIG1"));
    h.db.tables.platform_spend![0]!.status = "confirmed";

    await expect(supersedeSponsoredEnroll("SIG1")).resolves.toBe(false);
    expect(h.db.tables.platform_spend![0]!.status).toBe("confirmed");
  });

  it("throws LedgerUnavailableError on any other DB error, so the route fails closed", async () => {
    h.db.failNext("platform_spend", { code: "42P01", message: "no table" });
    await expect(reserveSponsoredEnroll(enroll("SIG1"))).rejects.toBeInstanceOf(
      LedgerUnavailableError
    );
  });
});

describe("recordSponsoredEnrollRefund", () => {
  it("records the close of a sponsored enrollment against the sponsor", async () => {
    await reserveSponsoredEnroll(enroll("SIG1"));
    h.db.tables.platform_spend![0]!.status = "confirmed";

    await recordSponsoredEnrollRefund({
      signature: "CLOSE_SIG",
      wallet: "LearnerWallet",
      courseId: "course-x",
      programId: "ProgramA",
      userId: "user-1",
    });

    expect(h.db.tables.platform_spend![1]).toMatchObject({
      signature: "CLOSE_SIG",
      action: "enroll_refund",
      payer: "SponsorPubkey",
      payer_role: "sponsor",
      status: "pending",
    });
  });

  it("ignores the close of an enrollment the learner paid for", async () => {
    await recordSponsoredEnrollRefund({
      signature: "CLOSE_SIG",
      wallet: "LearnerWallet",
      courseId: "course-x",
      programId: "ProgramA",
      userId: "user-1",
    });
    expect(h.db.tables.platform_spend).toHaveLength(0);
  });
});
