/* eslint-disable import/order -- vi.mock calls must be hoisted above the
   module-under-test import, which forces that import to sit after non-import
   code (same pattern as the other solana/__tests__ suites). */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// The scheduled, all-users drain (#1247).
//
// The sibling suite (onchain-queue.test.ts) covers per-action handling for one
// learner. This one covers the parts that were missing entirely and that let 91
// rows rot in prod on 21 Sep 2026:
//   • attempts are recorded BEFORE the work, so an attempt is never invisible
//   • selection is global and oldest-first, so a row whose owner never signs in
//     again is still drained
//   • backoff, so a failing row is not hammered every tick
//   • a terminal "already satisfied" program error resolves the row (and
//     reconciles the missing local certificate) instead of retrying forever
//
// The fake queue is a small table with a real filter/sort, not a rubber stamp:
// the drain's own query narrows it, and the assertions are on what the drain
// wrote back.
// ---------------------------------------------------------------------------

interface FakeRow {
  [column: string]: unknown;
  id: string;
  user_id: string;
  action_type: string;
  reference_id: string;
  payload: Record<string, unknown>;
  retry_count: number;
  attempt_count: number;
  failed_at: string | null;
  last_attempt_at: string | null;
  last_error: string | null;
  resolved_at: string | null;
}

const h = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  /** wallet_address per user id; a missing entry means no linked wallet. */
  wallets: {} as Record<string, string | null>,
  /** Every patch the drain wrote, in order, with the row it targeted. */
  updates: [] as {
    table: string;
    id: unknown;
    patch: Record<string, unknown>;
  }[],
  /** Rows upserted into `certificates` during the run. */
  certificateUpserts: [] as Record<string, unknown>[],
  /** Existing `certificates` rows, keyed `${userId}:${courseId}`. */
  existingCertificates: new Set<string>(),
  awardAchievement: vi.fn(),
  issueCredential: vi.fn(),
  fetchAchievementReceipt: vi.fn<() => Promise<boolean>>(),
  fetchEnrollment: vi.fn(),
  /** The fake sender: what the drain would broadcast. */
  sendSignedTransaction: vi.fn<(...args: unknown[]) => Promise<void>>(),
  buildSignedRewardXpTx: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@solana/web3.js", () => ({
  PublicKey: class {
    constructor(public value: string) {}
    toBase58() {
      return this.value;
    }
  },
}));

vi.mock("../pda", () => ({
  getProgramId: () => ({ toBase58: () => "PROGRAM_ID" }),
}));

vi.mock("../academy-program", () => ({
  getConnection: () => ({}),
  awardAchievement: (...args: unknown[]) => h.awardAchievement(...args),
  finalizeCourse: vi.fn(),
  issueCredential: (...args: unknown[]) => h.issueCredential(...args),
  buildSignedRewardXpTx: (...args: unknown[]) =>
    h.buildSignedRewardXpTx(...args),
  sendSignedTransaction: (...args: unknown[]) =>
    h.sendSignedTransaction(...args),
  TransactionNotBroadcastError: class extends Error {},
}));

vi.mock("../academy-reads", () => ({
  fetchAchievementReceipt: () => h.fetchAchievementReceipt(),
  fetchEnrollment: (...args: unknown[]) => h.fetchEnrollment(...args),
  fetchCourse: vi.fn(),
}));

vi.mock("@/lib/content/queries", () => ({
  getCourseById: (id: string) =>
    Promise.resolve({ title: `Course ${id}`, trackCollectionAddress: "COLL" }),
}));

vi.mock("@/lib/content/deployments", () => ({
  isCourseInMaintenance: () => Promise.resolve(false),
}));

vi.mock("@/lib/platform/freeze", () => ({
  isPlatformFrozen: () => Promise.resolve(false),
}));

vi.mock("@/lib/credentials/capstone-gate", () => ({
  checkCapstoneCredentialGate: () =>
    Promise.resolve({ status: "not_capstone" }),
}));

vi.mock("@/lib/supabase/admin", () => {
  // A fake queue that actually filters. `.eq`/`.is`/`.lt`/`.or` record
  // predicates and `.order`/`.limit` apply them, so the drain's own selection
  // is under test rather than mocked away.
  class Chain {
    private mode: "read" | "update" | "upsert" = "read";
    private patch: Record<string, unknown> | null = null;
    private eqs: [string, unknown][] = [];
    private isNulls: string[] = [];
    private lts: [string, unknown][] = [];
    private orCutoff: number | null = null;
    private limitN: number | null = null;

    constructor(private table: string) {}

    select(): this {
      return this;
    }
    update(patch: Record<string, unknown>): this {
      this.mode = "update";
      this.patch = patch;
      return this;
    }
    upsert(row: Record<string, unknown>): this {
      this.mode = "upsert";
      if (this.table === "certificates") h.certificateUpserts.push(row);
      return this;
    }
    /** The certificate path's `nft_metadata` write, and its cleanup on a
     *  failed mint. */
    insert(): this {
      this.mode = "upsert";
      return this;
    }
    delete(): this {
      this.mode = "upsert";
      return this;
    }
    eq(column: string, value: unknown): this {
      this.eqs.push([column, value]);
      return this;
    }
    is(column: string, _value: unknown): this {
      this.isNulls.push(column);
      return this;
    }
    lt(column: string, value: unknown): this {
      this.lts.push([column, value]);
      return this;
    }
    /** Only shape used: `last_attempt_at.is.null,last_attempt_at.lt.<iso>`. */
    or(expr: string): this {
      const match = /last_attempt_at\.lt\.(.+)$/.exec(expr);
      this.orCutoff = match?.[1] ? Date.parse(match[1]) : null;
      return this;
    }
    order(): this {
      return this;
    }
    limit(n: number): Promise<{ data: unknown[]; error: null }> {
      this.limitN = n;
      return Promise.resolve({ data: this.read(), error: null });
    }

    private read(): Record<string, unknown>[] {
      let out = h.rows.filter((row) =>
        this.eqs.every(([c, v]) => row[c] === v)
      );
      out = out.filter((row) => this.isNulls.every((c) => row[c] == null));
      out = out.filter((row) =>
        this.lts.every(([c, v]) => ((row[c] as number) ?? 0) < (v as number))
      );
      if (this.orCutoff !== null) {
        out = out.filter((row) => {
          const last = row.last_attempt_at;
          if (!last) return true;
          return Date.parse(last as string) < (this.orCutoff as number);
        });
      }
      return this.limitN === null ? out : out.slice(0, this.limitN);
    }

    single(): Promise<{ data: Record<string, unknown> | null; error: null }> {
      if (this.table === "nft_metadata") {
        return Promise.resolve({ data: { id: "meta-1" }, error: null });
      }
      const userId = this.eqs.find(([c]) => c === "id")?.[1] as string;
      const wallet = h.wallets[userId];
      return Promise.resolve({
        data: wallet ? { wallet_address: wallet } : null,
        error: null,
      });
    }

    maybeSingle(): Promise<{ data: unknown; error: null }> {
      if (this.table === "certificates") {
        const userId = this.eqs.find(([c]) => c === "user_id")?.[1];
        const courseId = this.eqs.find(([c]) => c === "course_id")?.[1];
        const exists = h.existingCertificates.has(`${userId}:${courseId}`);
        return Promise.resolve({
          data: exists ? { id: "cert-existing" } : null,
          error: null,
        });
      }
      if (this.table === "xp_transactions") {
        return Promise.resolve({
          data: { id: "xptx-1", tx_signature: null },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    }

    then(onFulfilled?: (v: unknown) => unknown): Promise<unknown> {
      if (this.mode === "update" && this.patch) {
        const id = this.eqs.find(([c]) => c === "id")?.[1];
        h.updates.push({ table: this.table, id, patch: this.patch });
        // Keep the fake table consistent, so a second pass in the same run
        // sees what the first one wrote.
        const target = h.rows.find((r) => r.id === id);
        if (target) Object.assign(target, this.patch);
      }
      if (this.table === "xp_transactions" && this.mode === "update") {
        return Promise.resolve({ data: [{ id: "xptx-1" }], error: null }).then(
          onFulfilled
        );
      }
      return Promise.resolve({ data: null, error: null }).then(onFulfilled);
    }
  }

  return {
    createAdminClient: () => ({
      from: (table: string) => new Chain(table),
      rpc: () => Promise.resolve({ data: 10, error: null }),
    }),
  };
});

import {
  drainAllPendingOnchainActions,
  retryPendingOnchainActions,
} from "../onchain-queue";
import { BACKOFF_BASE_MS, DRAIN_LIMIT } from "@/lib/queue/selection";

function row(overrides: Partial<FakeRow> & { id: string }): FakeRow {
  return {
    user_id: "u1",
    action_type: "achievement",
    reference_id: `achievement-${overrides.id}`,
    payload: {},
    retry_count: 0,
    attempt_count: 0,
    failed_at: "2026-09-01T00:00:00.000Z",
    last_attempt_at: null,
    last_error: null,
    resolved_at: null,
    ...overrides,
  };
}

/** Every patch written to `rowId`, merged in order = the row's final state. */
function finalPatch(rowId: string): Record<string, unknown> {
  return Object.assign(
    {},
    ...h.updates.filter((u) => u.id === rowId).map((u) => u.patch)
  );
}

function patchesFor(rowId: string): Record<string, unknown>[] {
  return h.updates.filter((u) => u.id === rowId).map((u) => u.patch);
}

beforeEach(() => {
  h.rows = [];
  h.wallets = { u1: "WALLET_1", u2: "WALLET_2", u3: "WALLET_3" };
  h.updates.length = 0;
  h.certificateUpserts.length = 0;
  h.existingCertificates.clear();
  h.awardAchievement.mockReset();
  h.awardAchievement.mockResolvedValue({
    signature: "AWARD_SIG",
    assetAddress: { toBase58: () => "ASSET_ADDR" },
  });
  h.issueCredential.mockReset();
  h.fetchAchievementReceipt.mockReset();
  h.fetchAchievementReceipt.mockResolvedValue(false);
  h.fetchEnrollment.mockReset();
  h.fetchEnrollment.mockResolvedValue(null);
  h.sendSignedTransaction.mockReset();
  h.sendSignedTransaction.mockResolvedValue(undefined);
  h.buildSignedRewardXpTx.mockReset();
  h.buildSignedRewardXpTx.mockResolvedValue({
    signature: "MINT_SIG",
    rawTransaction: Buffer.from("signed"),
    blockhash: "BH",
    lastValidBlockHeight: 1,
  });
});

describe("every attempt is recorded before the work", () => {
  it("stamps attempt_count and last_attempt_at first, then the outcome", async () => {
    h.rows = [row({ id: "r1", attempt_count: 2 })];

    await drainAllPendingOnchainActions();

    const patches = patchesFor("r1");
    expect(patches[0]).toMatchObject({ attempt_count: 3 });
    expect(typeof patches[0]?.last_attempt_at).toBe("string");
    expect(typeof finalPatch("r1").resolved_at).toBe("string");
  });

  it("records the attempt even when the action throws", async () => {
    h.rows = [row({ id: "r1" })];
    h.awardAchievement.mockRejectedValue(new Error("blockhash not found"));

    await drainAllPendingOnchainActions();

    const patch = finalPatch("r1");
    expect(patch.attempt_count).toBe(1);
    expect(patch.retry_count).toBe(1);
    expect(patch.last_error).toContain("blockhash not found");
    expect(patch.resolved_at).toBeUndefined();
  });

  it("reports what the run did, so the cron response is not a black box", async () => {
    h.rows = [row({ id: "a", user_id: "u1" }), row({ id: "b", user_id: "u2" })];

    const summary = await drainAllPendingOnchainActions();

    expect(summary).toEqual({ selected: 2, users: 2, attempted: 2 });
  });
});

describe("selection is global and oldest-first", () => {
  it("drains rows for users who never signed in again, oldest debt first", async () => {
    // The prod shape: three learners, none of them the caller, the oldest row
    // 30 days old. The old drain took a userId and would have selected none.
    h.rows = [
      row({ id: "new", user_id: "u3", failed_at: "2026-09-19T00:00:00.000Z" }),
      row({ id: "old", user_id: "u1", failed_at: "2026-08-22T00:00:00.000Z" }),
      row({ id: "mid", user_id: "u2", failed_at: "2026-09-02T00:00:00.000Z" }),
    ];

    await drainAllPendingOnchainActions();

    const order = h.updates
      .filter((u) => u.patch.attempt_count !== undefined)
      .map((u) => u.id);
    expect(order).toEqual(["old", "mid", "new"]);
  });

  it("caps a run and leaves the rest for the next tick", async () => {
    h.rows = Array.from({ length: DRAIN_LIMIT + 5 }, (_, i) =>
      row({
        id: `r${String(i).padStart(2, "0")}`,
        failed_at: new Date(
          Date.parse("2026-08-01T00:00:00Z") + i * 3_600_000
        ).toISOString(),
      })
    );

    const summary = await drainAllPendingOnchainActions();

    expect(summary.selected).toBe(DRAIN_LIMIT);
    expect(h.awardAchievement).toHaveBeenCalledTimes(DRAIN_LIMIT);
    expect(finalPatch("r00").resolved_at).toBeDefined();
    expect(patchesFor(`r${DRAIN_LIMIT + 4}`)).toHaveLength(0);
  });

  it("honours an explicit limit, for a smaller budget", async () => {
    h.rows = [row({ id: "a" }), row({ id: "b" }), row({ id: "c" })];

    const summary = await drainAllPendingOnchainActions({ limit: 2 });

    expect(summary.selected).toBe(2);
  });

  it("still drains just one learner from a login", async () => {
    h.rows = [
      row({ id: "mine", user_id: "u1" }),
      row({ id: "theirs", user_id: "u2" }),
    ];

    const summary = await retryPendingOnchainActions("u1");

    expect(summary.selected).toBe(1);
    expect(patchesFor("theirs")).toHaveLength(0);
  });

  it("touches nothing, loudly, for a learner with no linked wallet", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    h.wallets = {};
    h.rows = [row({ id: "r1" })];

    const summary = await retryPendingOnchainActions("u1");

    expect(summary.attempted).toBe(0);
    expect(patchesFor("r1")).toHaveLength(0);
    expect(warn.mock.calls.flat().join(" ")).toContain("no linked wallet");
    warn.mockRestore();
  });
});

describe("backoff", () => {
  it("skips a row attempted inside its backoff window", async () => {
    h.rows = [
      row({
        id: "cooling",
        retry_count: 2,
        last_attempt_at: new Date(Date.now() - 60_000).toISOString(),
      }),
    ];

    const summary = await drainAllPendingOnchainActions();

    expect(summary.selected).toBe(0);
    expect(h.awardAchievement).not.toHaveBeenCalled();
  });

  it("takes the row once its backoff has elapsed", async () => {
    h.rows = [
      row({
        id: "ready",
        retry_count: 1,
        last_attempt_at: new Date(
          Date.now() - BACKOFF_BASE_MS * 2
        ).toISOString(),
      }),
    ];

    const summary = await drainAllPendingOnchainActions();

    expect(summary.selected).toBe(1);
    expect(h.awardAchievement).toHaveBeenCalledTimes(1);
  });

  it("does not re-attempt a row it just deferred, within the same run", async () => {
    // Two rows for one learner; the fake table is updated in place, so a
    // second selection in the same run would show up as a second attempt.
    h.rows = [row({ id: "a" }), row({ id: "b" })];

    await drainAllPendingOnchainActions();

    expect(
      patchesFor("a").filter((p) => p.attempt_count !== undefined)
    ).toHaveLength(1);
    expect(
      patchesFor("b").filter((p) => p.attempt_count !== undefined)
    ).toHaveLength(1);
  });
});

describe("terminal already-satisfied errors", () => {
  const certRow = {
    id: "r-cert",
    action_type: "certificate",
    reference_id: "course-solana-speedrun",
    payload: { courseId: "course-solana-speedrun" },
  } as const;

  it("resolves a CredentialAlreadyIssued row instead of retrying it forever", async () => {
    // The exact prod row: enqueued 9 Sep by the webhook, stuck on 6017.
    h.rows = [row({ ...certRow })];
    h.fetchEnrollment.mockResolvedValue({});
    h.issueCredential.mockRejectedValue(
      new Error(
        "AnchorError occurred. Error Code: CredentialAlreadyIssued. Error Number: 6017. Error Message: Credential already issued for this enrollment"
      )
    );

    await drainAllPendingOnchainActions();

    const patch = finalPatch("r-cert");
    expect(typeof patch.resolved_at).toBe("string");
    expect(patch.last_error).toContain("resolved-already-satisfied");
    expect(patch.last_error).toContain("CredentialAlreadyIssued");
    expect(patch.retry_count).toBeUndefined();
  });

  it("reconciles the missing local certificates row from the on-chain asset", async () => {
    h.rows = [row({ ...certRow })];
    // No credential_asset on the first read (so the mint is attempted), then
    // the revert proves it exists — the reconcile re-reads and finds it.
    h.fetchEnrollment
      .mockResolvedValueOnce({})
      .mockResolvedValue({ credential_asset: "ASSET_ON_CHAIN" });
    h.issueCredential.mockRejectedValue(
      new Error("Error Code: CredentialAlreadyIssued. Error Number: 6017.")
    );

    await drainAllPendingOnchainActions();

    expect(h.certificateUpserts).toHaveLength(1);
    expect(h.certificateUpserts[0]).toMatchObject({
      user_id: "u1",
      course_id: "course-solana-speedrun",
      mint_address: "ASSET_ON_CHAIN",
    });
  });

  it("does not duplicate a certificates row that already exists", async () => {
    h.existingCertificates.add("u1:course-solana-speedrun");
    h.rows = [row({ ...certRow })];
    h.fetchEnrollment.mockResolvedValue({ credential_asset: "ASSET_ON_CHAIN" });

    await drainAllPendingOnchainActions();

    expect(h.certificateUpserts).toHaveLength(0);
    expect(typeof finalPatch("r-cert").resolved_at).toBe("string");
  });

  it("keeps retrying a terminal error whose state we do NOT already have", async () => {
    // AchievementSupplyExhausted never succeeds on retry either, but nothing
    // was awarded — resolving it would silently drop what we owe.
    h.rows = [row({ id: "r1" })];
    h.awardAchievement.mockRejectedValue(
      new Error("Error Code: AchievementSupplyExhausted. Error Number: 6023.")
    );

    await drainAllPendingOnchainActions();

    const patch = finalPatch("r1");
    expect(patch.resolved_at).toBeUndefined();
    expect(patch.retry_count).toBe(1);
    expect(patch.last_error).toContain("[code 6023");
  });
});

describe("error serialisation", () => {
  it("writes a usable string for a non-Error throw instead of [object Object]", async () => {
    h.rows = [row({ id: "r1" })];
    h.awardAchievement.mockRejectedValue({ code: -32005, msg: "rate limited" });

    await drainAllPendingOnchainActions();

    const lastError = finalPatch("r1").last_error as string;
    expect(lastError).not.toBe("[object Object]");
    expect(lastError).toContain("-32005");
  });

  it("carries the program code, signature and logs for a post-broadcast failure", async () => {
    h.rows = [row({ id: "r1" })];
    h.awardAchievement.mockRejectedValue(
      Object.assign(new Error("Unknown action 'undefined'"), {
        signature: "SIG_ABC",
        logs: ["Program log: one", "Program failed to complete"],
      })
    );

    await drainAllPendingOnchainActions();

    const lastError = finalPatch("r1").last_error as string;
    expect(lastError).toContain("failed after broadcast");
    expect(lastError).toContain("SIG_ABC");
    expect(lastError).toContain("Program failed to complete");
  });
});
