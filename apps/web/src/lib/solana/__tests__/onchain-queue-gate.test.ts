/* eslint-disable import/order -- vi.mock calls must be hoisted above the
   module-under-test import (same pattern as the other solana/__tests__ suites). */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// The drain runs only where it can sign.
//
// Each row the drain claims gets an attempt stamp, and the stamp spends one of
// the row's retries. A deployment that cannot sign would claim a learner's
// real rows on every sign-in and fail them, so the drain must stop BEFORE it
// reads or writes a single row unless it is on production (or on a local
// machine that opts in) with both the admin client and the signer available.
// ---------------------------------------------------------------------------

const h = vi.hoisted(() => ({
  adminAvailable: true,
  signerAvailable: true,
  /** Every table or RPC the admin client was asked for, in order. */
  dbCalls: [] as string[],
  createAdminClient: vi.fn(),
  awardAchievement: vi.fn(),
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
  hasBackendSigner: () => h.signerAvailable,
  awardAchievement: (...args: unknown[]) => h.awardAchievement(...args),
  finalizeCourse: vi.fn(),
  issueCredential: vi.fn(),
  buildSignedRewardXpTx: vi.fn(),
  sendSignedTransaction: vi.fn(),
  TransactionNotBroadcastError: class extends Error {},
}));

vi.mock("../academy-reads", () => ({
  fetchAchievementReceipt: () => Promise.resolve(false),
  fetchEnrollment: vi.fn(),
  fetchCourse: vi.fn(),
}));

vi.mock("@/lib/content/queries", () => ({ getCourseById: vi.fn() }));
vi.mock("@/lib/content/deployments", () => ({
  isCourseInMaintenance: () => Promise.resolve(false),
}));
vi.mock("@/lib/platform/freeze", () => ({
  isPlatformFrozen: () => Promise.resolve(false),
}));
vi.mock("@/lib/credentials/capstone-gate", () => ({
  checkCapstoneCredentialGate: vi.fn(),
}));

vi.mock("@/lib/supabase/admin-unavailable", () => ({
  isAdminClientAvailable: () => h.adminAvailable,
}));

vi.mock("@/lib/supabase/admin", () => {
  // Thenable chain: every builder call returns the chain, and awaiting it
  // answers one due achievement row (for the queue) or the learner's wallet.
  function chain(table: string) {
    const self = {
      select: () => self,
      is: () => self,
      or: () => self,
      eq: () => self,
      order: () => self,
      update: () => self,
      limit: () =>
        Promise.resolve({
          data:
            table === "pending_onchain_actions"
              ? [
                  {
                    id: "row-1",
                    user_id: "u1",
                    action_type: "achievement",
                    reference_id: "achievement-first-steps",
                    payload: {},
                    retry_count: 0,
                    attempt_count: 0,
                    failed_at: "2026-09-01T00:00:00.000Z",
                    last_attempt_at: null,
                    last_error: null,
                    resolved_at: null,
                  },
                ]
              : [],
          error: null,
        }),
      single: () =>
        Promise.resolve({ data: { wallet_address: "WALLET_1" }, error: null }),
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(resolve),
    };
    return self;
  }
  return {
    createAdminClient: () => {
      h.createAdminClient();
      return {
        from: (table: string) => {
          h.dbCalls.push(`from:${table}`);
          return chain(table);
        },
        rpc: (fn: string, params: Record<string, unknown>) => {
          h.dbCalls.push(`rpc:${fn}`);
          return Promise.resolve({
            data: fn === "claim_onchain_action" ? [{ id: params.p_id }] : null,
            error: null,
          });
        },
      };
    },
  };
});

import {
  LOCAL_DRAIN_OPT_IN,
  drainAllPendingOnchainActions,
  retryPendingOnchainActions,
} from "../onchain-queue";

const EMPTY = { selected: 0, users: 0, attempted: 0 };

let info: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  h.adminAvailable = true;
  h.signerAvailable = true;
  h.dbCalls.length = 0;
  h.createAdminClient.mockReset();
  h.awardAchievement.mockReset();
  h.awardAchievement.mockResolvedValue({
    signature: "SIG",
    assetAddress: { toBase58: () => "ASSET" },
  });
  info = vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function expectNoRowTouched(): void {
  expect(h.createAdminClient).not.toHaveBeenCalled();
  expect(h.dbCalls).toEqual([]);
  expect(h.awardAchievement).not.toHaveBeenCalled();
}

const drains = [
  ["the per-user drain", () => retryPendingOnchainActions("u1")],
  ["the all-users drain", () => drainAllPendingOnchainActions()],
] as const;

describe.each(drains)("%s", (_name, drain) => {
  it("reads and stamps no row on a preview deployment", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");

    expect(await drain()).toEqual(EMPTY);
    expectNoRowTouched();
  });

  it("reads and stamps no row on a development deployment", async () => {
    vi.stubEnv("VERCEL_ENV", "development");
    vi.stubEnv(LOCAL_DRAIN_OPT_IN, "1");

    expect(await drain()).toEqual(EMPTY);
    expectNoRowTouched();
  });

  it("reads and stamps no row locally without the opt-in", async () => {
    vi.stubEnv("VERCEL_ENV", undefined);
    vi.stubEnv(LOCAL_DRAIN_OPT_IN, undefined);

    expect(await drain()).toEqual(EMPTY);
    expectNoRowTouched();
  });

  it("reads and stamps no row on production without the signer", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    h.signerAvailable = false;

    expect(await drain()).toEqual(EMPTY);
    expectNoRowTouched();
  });

  it("reads and stamps no row on production without the admin client", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    h.adminAvailable = false;

    expect(await drain()).toEqual(EMPTY);
    expectNoRowTouched();
  });

  it("logs one line that names the reason and carries no row data", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");

    await drain();

    const lines = info.mock.calls.filter((c: unknown[]) =>
      String(c[0]).includes("onchain-queue.drain-skipped")
    );
    expect(lines).toHaveLength(1);
    const logged = JSON.stringify(lines[0]);
    expect(logged).toContain("not-production");
    expect(logged).not.toContain("u1");
    expect(logged).not.toContain("row-1");
  });

  it("drains as before on production with the admin client and the signer", async () => {
    vi.stubEnv("VERCEL_ENV", "production");

    const summary = await drain();

    expect(summary).toEqual({ selected: 1, users: 1, attempted: 1 });
    expect(h.dbCalls).toContain("from:pending_onchain_actions");
    expect(h.dbCalls).toContain("rpc:claim_onchain_action");
    expect(h.awardAchievement).toHaveBeenCalledTimes(1);
  });

  it("drains locally when the opt-in is set", async () => {
    vi.stubEnv("VERCEL_ENV", undefined);
    vi.stubEnv(LOCAL_DRAIN_OPT_IN, "1");

    const summary = await drain();

    expect(summary.attempted).toBe(1);
    expect(h.awardAchievement).toHaveBeenCalledTimes(1);
  });

  it("still needs the signer locally with the opt-in", async () => {
    vi.stubEnv("VERCEL_ENV", undefined);
    vi.stubEnv(LOCAL_DRAIN_OPT_IN, "1");
    h.signerAvailable = false;

    expect(await drain()).toEqual(EMPTY);
    expectNoRowTouched();
  });
});
