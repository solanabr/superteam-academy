/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { Keypair, PublicKey, type AccountInfo } from "@solana/web3.js";

vi.mock("server-only", () => ({}));

const { getUser, isRateLimited, getAccountInfo, profileSingle, upsert } =
  vi.hoisted(() => ({
    getUser: vi.fn<() => Promise<unknown>>(),
    isRateLimited: vi.fn<() => Promise<boolean>>(),
    getAccountInfo:
      vi.fn<
        (
          pubkey: import("@solana/web3.js").PublicKey,
          config?: unknown
        ) => Promise<AccountInfo<Buffer> | null>
      >(),
    profileSingle:
      vi.fn<() => Promise<{ data: { wallet_address: string } | null }>>(),
    upsert: vi.fn<(row: unknown, opts: unknown) => Promise<{ error: null }>>(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ upsert }),
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: profileSingle }) }),
    }),
  }),
}));
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited,
  getClientIp: () => "203.0.113.7",
}));
vi.mock("@/lib/solana/academy-program", () => ({
  getConnection: () => ({ getAccountInfo }),
}));

import { POST } from "../route";

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
