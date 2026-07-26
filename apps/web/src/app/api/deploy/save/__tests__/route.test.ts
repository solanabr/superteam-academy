/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { Keypair, PublicKey, type AccountInfo } from "@solana/web3.js";

vi.mock("server-only", () => ({}));

const {
  getUser,
  isRateLimited,
  getAccountInfo,
  profileSingle,
  upsert,
  userClientFrom,
  logEvent,
} = vi.hoisted(() => ({
  logEvent:
    vi.fn<
      (params: {
        event: string;
        level?: string;
        context?: Record<string, unknown>;
      }) => void
    >(),
  getUser: vi.fn<() => Promise<unknown>>(),
  isRateLimited: vi.fn<
    (
      namespace: string,
      key: string,
      opts: {
        maxTokens: number;
        refillIntervalMs: number;
        failClosed?: boolean;
      }
    ) => Promise<boolean>
  >(),
  getAccountInfo:
    vi.fn<
      (
        pubkey: import("@solana/web3.js").PublicKey,
        config?: unknown
      ) => Promise<AccountInfo<Buffer> | null>
    >(),
  profileSingle:
    vi.fn<() => Promise<{ data: { wallet_address: string } | null }>>(),
  upsert:
    vi.fn<
      (
        row: unknown,
        opts: unknown
      ) => Promise<{ error: { message: string } | null }>
    >(),
  // Spy so tests can prove POST never touches a table through the
  // user-scoped client — deployed_programs is service_role-write-only
  // (20260726120000_lockdown_deployed_programs_rls), so a user-client write
  // would be an RLS-bypass regression AND would fail in production.
  userClientFrom: vi.fn<(table: string) => never>(() => {
    throw new Error(
      "user-scoped client must not touch tables in POST /api/deploy/save"
    );
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from: userClientFrom,
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) =>
      table === "profiles"
        ? { select: () => ({ eq: () => ({ single: profileSingle }) }) }
        : { upsert },
  }),
}));
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited,
  getClientIp: () => "203.0.113.7",
}));
vi.mock("@/lib/solana/academy-program", () => ({
  getConnection: () => ({ getAccountInfo }),
}));
vi.mock("@/lib/logging", () => ({ logEvent }));

import { POST } from "../route";
import { CAPSTONE_CREDENTIAL } from "@/lib/credentials/capstone-gate";

// ---------------------------------------------------------------------------
// BPF Upgradeable Loader fixtures
// ---------------------------------------------------------------------------

const LOADER = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");
const OTHER_LOADER = new PublicKey(
  "BPFLoader2111111111111111111111111111111111"
);

const wallet = Keypair.generate().publicKey;
const programId = Keypair.generate().publicKey;
const [programDataAddress] = PublicKey.findProgramAddressSync(
  [programId.toBuffer()],
  LOADER
);

/** Program account data: tag 2 + programdata_address. */
function programAccountData(pointer: PublicKey = programDataAddress): Buffer {
  const buf = Buffer.alloc(36);
  buf.writeUInt32LE(2, 0);
  pointer.toBuffer().copy(buf, 4);
  return buf;
}

/** ProgramData header: tag 3 + slot + Option<upgrade_authority>. */
function programDataHeader(authority: PublicKey | null): Buffer {
  const buf = Buffer.alloc(45);
  buf.writeUInt32LE(3, 0);
  buf.writeBigUInt64LE(123n, 4); // deploy slot — irrelevant to the check
  if (authority) {
    buf[12] = 1;
    authority.toBuffer().copy(buf, 13);
  }
  return buf;
}

function account(
  overrides: Partial<AccountInfo<Buffer>> = {}
): AccountInfo<Buffer> {
  return {
    executable: true,
    owner: LOADER,
    lamports: 1_000_000,
    data: Buffer.alloc(0),
    rentEpoch: 0,
    ...overrides,
  };
}

/** Register on-chain accounts the mocked RPC should answer with. */
function setAccounts(
  entries: Record<string, AccountInfo<Buffer> | null>
): void {
  getAccountInfo.mockImplementation(async (pubkey: PublicKey) => {
    const hit = entries[pubkey.toBase58()];
    return hit ?? null;
  });
}

function setHappyChain(authority: PublicKey = wallet): void {
  setAccounts({
    [programId.toBase58()]: account({ data: programAccountData() }),
    [programDataAddress.toBase58()]: account({
      executable: false,
      data: programDataHeader(authority),
    }),
  });
}

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/deploy/save", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const validBody = {
  lessonId: "lesson-1",
  courseId: "course-1",
  programId: programId.toBase58(),
};

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  isRateLimited.mockResolvedValue(false);
  profileSingle.mockResolvedValue({
    data: { wallet_address: wallet.toBase58() },
  });
  upsert.mockResolvedValue({ error: null });
  setAccounts({});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("POST /api/deploy/save — on-chain verification (#560 / LX-E1)", () => {
  it("saves when the program is executable and the upgrade authority is the linked wallet", async () => {
    setHappyChain();

    const res = await POST(req(validBody));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(getAccountInfo).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        course_id: "course-1",
        lesson_id: "lesson-1",
        program_id: programId.toBase58(),
        network: "devnet",
      }),
      { onConflict: "user_id,course_id,lesson_id" }
    );
  });

  it("rejects a non-executable account with the generic message", async () => {
    setAccounts({
      [programId.toBase58()]: account({
        executable: false,
        data: programAccountData(),
      }),
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Program verification failed"
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects when the upgrade authority is not the linked wallet", async () => {
    setHappyChain(Keypair.generate().publicKey);

    const res = await POST(req(validBody));

    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Program verification failed"
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects when the upgrade authority has been burned (None)", async () => {
    setHappyChain();
    setAccounts({
      [programId.toBase58()]: account({ data: programAccountData() }),
      [programDataAddress.toBase58()]: account({
        executable: false,
        data: programDataHeader(null),
      }),
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Program verification failed"
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects an executable program owned by a non-upgradeable loader", async () => {
    setAccounts({
      [programId.toBase58()]: account({
        owner: OTHER_LOADER,
        data: programAccountData(),
      }),
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Program verification failed"
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects a program whose ProgramData pointer is not the canonical PDA", async () => {
    const decoy = Keypair.generate().publicKey;
    setAccounts({
      [programId.toBase58()]: account({ data: programAccountData(decoy) }),
      [decoy.toBase58()]: account({
        executable: false,
        data: programDataHeader(wallet),
      }),
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Program verification failed"
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects a missing account after one propagation-lag retry", async () => {
    vi.useFakeTimers();
    setAccounts({}); // nothing on chain

    const pending = POST(req(validBody));
    await vi.advanceTimersByTimeAsync(2_000);
    const res = await pending;

    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Program verification failed"
    );
    // Two verification attempts: initial read + one retry.
    expect(getAccountInfo).toHaveBeenCalledTimes(2);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("saves when the account only appears on the retry (RPC propagation lag)", async () => {
    vi.useFakeTimers();
    let reads = 0;
    getAccountInfo.mockImplementation(async (pubkey: PublicKey) => {
      reads += 1;
      if (reads === 1) return null; // first attempt: account not visible yet
      if (pubkey.equals(programId)) {
        return account({ data: programAccountData() });
      }
      if (pubkey.equals(programDataAddress)) {
        return account({ executable: false, data: programDataHeader(wallet) });
      }
      return null;
    });

    const pending = POST(req(validBody));
    await vi.advanceTimersByTimeAsync(2_000);
    const res = await pending;

    expect(res.status).toBe(200);
    // Attempt 1: program read (miss). Attempt 2: program + ProgramData reads.
    expect(getAccountInfo).toHaveBeenCalledTimes(3);
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it("rejects when no wallet is linked, without touching the RPC", async () => {
    profileSingle.mockResolvedValue({ data: null });

    const res = await POST(req(validBody));

    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toMatch(/wallet/i);
    expect(getAccountInfo).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects malformed base58 before rate limiting or RPC reads", async () => {
    const res = await POST(
      req({ ...validBody, programId: "not-a-real-base58-key!!" })
    );

    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Invalid program ID format"
    );
    expect(isRateLimited).not.toHaveBeenCalled();
    expect(getAccountInfo).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("429s when rate limited, before any RPC read", async () => {
    isRateLimited.mockResolvedValue(true);

    const res = await POST(req(validBody));

    expect(res.status).toBe(429);
    expect(getAccountInfo).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("503s (fail closed, retryable) when the RPC is unreachable", async () => {
    getAccountInfo.mockRejectedValue(new Error("fetch failed"));

    const res = await POST(req(validBody));

    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toMatch(
      /try again/i
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it("401s without a session", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST(req(validBody));

    expect(res.status).toBe(401);
    expect(getAccountInfo).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("POST /api/deploy/save — adversarial account layouts", () => {
  async function expectGenericReject(): Promise<void> {
    const res = await POST(req(validBody));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Program verification failed"
    );
    expect(upsert).not.toHaveBeenCalled();
  }

  it("rejects a program account with truncated data (< 36 bytes)", async () => {
    setAccounts({
      [programId.toBase58()]: account({ data: Buffer.alloc(10) }),
    });

    await expectGenericReject();
    // Malformed program account never triggers the ProgramData read.
    expect(getAccountInfo).toHaveBeenCalledTimes(1);
  });

  it("rejects a program account with the wrong state tag", async () => {
    const data = programAccountData();
    data.writeUInt32LE(1, 0); // tag 1 = Buffer, not Program

    setAccounts({ [programId.toBase58()]: account({ data }) });

    await expectGenericReject();
    expect(getAccountInfo).toHaveBeenCalledTimes(1);
  });

  it("rejects a ProgramData account with a truncated header (< 45 bytes)", async () => {
    setAccounts({
      [programId.toBase58()]: account({ data: programAccountData() }),
      [programDataAddress.toBase58()]: account({
        executable: false,
        data: programDataHeader(wallet).subarray(0, 20),
      }),
    });

    await expectGenericReject();
  });

  it("rejects a ProgramData account with the wrong state tag", async () => {
    const header = programDataHeader(wallet);
    header.writeUInt32LE(2, 0); // tag 2 = Program, not ProgramData

    setAccounts({
      [programId.toBase58()]: account({ data: programAccountData() }),
      [programDataAddress.toBase58()]: account({
        executable: false,
        data: header,
      }),
    });

    await expectGenericReject();
  });

  it("rejects a ProgramData account owned by a non-loader program", async () => {
    setAccounts({
      [programId.toBase58()]: account({ data: programAccountData() }),
      [programDataAddress.toBase58()]: account({
        executable: false,
        owner: OTHER_LOADER,
        data: programDataHeader(wallet),
      }),
    });

    await expectGenericReject();
  });

  it("rejects regex-passing base58 that fails PublicKey construction", async () => {
    // 44 valid base58 chars, but decodes to 33 bytes — the regex passes and
    // `new PublicKey()` throws. Must reject before rate limiting / RPC.
    const res = await POST(req({ ...validBody, programId: "z".repeat(44) }));

    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe(
      "Invalid program ID format"
    );
    expect(isRateLimited).not.toHaveBeenCalled();
    expect(getAccountInfo).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("POST /api/deploy/save — rate limiting", () => {
  it("passes failClosed to both limiters (store error must deny, not allow)", async () => {
    setHappyChain();

    await POST(req(validBody));

    expect(isRateLimited).toHaveBeenCalledWith(
      "deploy:save",
      "user-1",
      expect.objectContaining({ failClosed: true })
    );
    expect(isRateLimited).toHaveBeenCalledWith(
      "deploy:save:ip",
      "203.0.113.7",
      expect.objectContaining({ failClosed: true })
    );
  });

  it("429s when only the per-user limit trips, without consulting the IP limiter", async () => {
    setHappyChain();
    isRateLimited.mockImplementation(async (namespace) => {
      return namespace === "deploy:save";
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: string }).error).toMatch(
      /try again later/i
    );
    expect(isRateLimited).toHaveBeenCalledTimes(1);
    expect(getAccountInfo).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("429s when only the per-IP limit trips, even for an unthrottled user", async () => {
    setHappyChain();
    isRateLimited.mockImplementation(async (namespace) => {
      return namespace === "deploy:save:ip";
    });

    const res = await POST(req(validBody));

    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: string }).error).toMatch(/network/i);
    expect(isRateLimited).toHaveBeenCalledTimes(2);
    expect(getAccountInfo).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("429s (denies) when the limiter store errors in fail-closed mode", async () => {
    setHappyChain();
    // The real limiter returns `true` (deny) on a store error when
    // failClosed is set — the route must translate that into a 429, never
    // an unmetered RPC read.
    isRateLimited.mockResolvedValue(true);

    const res = await POST(req(validBody));

    expect(res.status).toBe(429);
    expect(getAccountInfo).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("POST /api/deploy/save — service_role-only writes (RLS lockdown)", () => {
  it("upserts through the admin (service_role) client, never the user-scoped client", async () => {
    setHappyChain();

    const res = await POST(req(validBody));

    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledTimes(1);
    // deployed_programs has no client INSERT/UPDATE policies — a write
    // through the user-scoped client would bypass on-chain verification in
    // this suite and fail RLS in production.
    expect(userClientFrom).not.toHaveBeenCalled();
  });

  // deployed_programs must be service_role-write-only: authenticated users
  // could otherwise insert rows from devtools with anyone's program id,
  // skipping the on-chain verification above entirely. RLS itself cannot be
  // exercised in unit tests, so pin the SQL artifacts that enforce it.
  const repoRoot = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../../../../.."
  );
  const INSERT_POLICY = `"Users can insert their own deployments"`;
  const UPDATE_POLICY = `"Users can update their own deployments"`;
  const SELECT_POLICY = `"Users can view their own deployments"`;

  it("migration drops the client INSERT and UPDATE policies on deployed_programs", () => {
    const migration = readFileSync(
      resolve(
        repoRoot,
        "supabase/migrations/20260726120000_lockdown_deployed_programs_rls.sql"
      ),
      "utf8"
    );

    expect(migration).toContain(
      `DROP POLICY IF EXISTS ${INSERT_POLICY} ON deployed_programs;`
    );
    expect(migration).toContain(
      `DROP POLICY IF EXISTS ${UPDATE_POLICY} ON deployed_programs;`
    );
    // Keep SELECT: the migration must not touch the read policy.
    expect(migration).not.toContain(`DROP POLICY IF EXISTS ${SELECT_POLICY}`);
  });

  it("schema.sql end-state has no client INSERT/UPDATE policies on deployed_programs, keeps SELECT", () => {
    const schema = readFileSync(
      resolve(repoRoot, "supabase/schema.sql"),
      "utf8"
    );

    expect(schema).not.toContain(`CREATE POLICY ${INSERT_POLICY}`);
    expect(schema).not.toContain(`CREATE POLICY ${UPDATE_POLICY}`);
    expect(schema).toContain(`CREATE POLICY ${SELECT_POLICY}`);
    expect(schema).toContain(
      "ALTER TABLE deployed_programs ENABLE ROW LEVEL SECURITY;"
    );
  });
});

// #725 — the save path had silent deny/exception paths (incl. an empty
// `catch {}`), so a broken write looked identical to the gate correctly
// withholding. Every non-success path must now emit a structured, greppable
// event; every success must too (0 prod rows ever — the first real run must be
// visible).
describe("POST /api/deploy/save — observability logging (#725)", () => {
  function loggedEvents(): string[] {
    return logEvent.mock.calls.map((c) => c[0].event);
  }

  it("logs a saved event (info) with the row keys on success", async () => {
    setHappyChain();

    await POST(req(validBody));

    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "deploy-save.saved",
        level: "info",
        context: expect.objectContaining({
          userId: "user-1",
          courseId: "course-1",
          lessonId: "lesson-1",
          programId: programId.toBase58(),
        }),
      })
    );
  });

  it("logs a rejected event carrying the on-chain reason (not leaked to client)", async () => {
    setHappyChain(Keypair.generate().publicKey); // authority mismatch

    const res = await POST(req(validBody));

    expect(((await res.json()) as { error: string }).error).toBe(
      "Program verification failed"
    );
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "deploy-save.rejected",
        context: expect.objectContaining({
          reason: "verification:authority-mismatch",
        }),
      })
    );
  });

  it("logs a rejected event when no wallet is linked", async () => {
    profileSingle.mockResolvedValue({ data: null });

    await POST(req(validBody));

    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "deploy-save.rejected",
        context: expect.objectContaining({ reason: "no-wallet-linked" }),
      })
    );
  });

  it("logs an error event when the RPC is unreachable (fail-closed 503)", async () => {
    getAccountInfo.mockRejectedValue(new Error("fetch failed"));

    const res = await POST(req(validBody));

    expect(res.status).toBe(503);
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "deploy-save.rpc-unavailable",
        level: "error",
      })
    );
  });

  it("logs an error event when the verified row fails to write", async () => {
    setHappyChain();
    upsert.mockResolvedValue({ error: { message: "insert failed" } });

    const res = await POST(req(validBody));

    expect(res.status).toBe(500);
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "deploy-save.write-failed",
        level: "error",
      })
    );
  });

  it("logs an unhandled event instead of swallowing an unexpected throw", async () => {
    getUser.mockRejectedValue(new Error("auth exploded"));

    const res = await POST(req(validBody));

    expect(res.status).toBe(500);
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "deploy-save.unhandled",
        level: "error",
      })
    );
  });

  it("does not log a rejection on the happy path", async () => {
    setHappyChain();

    await POST(req(validBody));

    expect(loggedEvents()).not.toContain("deploy-save.rejected");
  });
});

// The gate reads a `deployed_programs` row keyed by (user_id, course_id,
// lesson_id). This proves the WRITE side stamps exactly the keys the READ side
// (checkCapstoneCredentialGate) queries — a mismatch would silently deny every
// legitimate capstone credential. Pinned to the real capstone constants, so a
// content rename that moves the gate also breaks this test.
describe("POST /api/deploy/save — writes the keys the capstone gate reads (#721/#725)", () => {
  it("upserts a row scoped to the capstone course + deploy lesson", async () => {
    setHappyChain();

    const res = await POST(
      req({
        courseId: CAPSTONE_CREDENTIAL.courseId,
        lessonId: CAPSTONE_CREDENTIAL.deployLessonId,
        programId: programId.toBase58(),
      })
    );

    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        course_id: CAPSTONE_CREDENTIAL.courseId,
        lesson_id: CAPSTONE_CREDENTIAL.deployLessonId,
        program_id: programId.toBase58(),
      }),
      { onConflict: "user_id,course_id,lesson_id" }
    );
  });
});
