/* eslint-disable import/order -- vi.mock calls must precede importing admin-signer. */
// deployCoursePda is the one place create_course is sent. These tests pin that
// the mainnet course-identity guard runs before any transaction is built (on a
// refusal `methods.createCourse` is never called) and that the cluster is
// resolved fail-closed from the connection's genesis hash. The last block pins
// that closeCoursePda waits for a definitive outcome.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  Keypair,
  SendTransactionError,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => {
  const rpc = vi.fn(async () => "create-sig");
  return {
    env: {
      SOLANA_RPC_URL: "https://rpc.example.com",
      PROGRAM_AUTHORITY_SECRET: "",
      BACKEND_SIGNER_SECRET: "" as string | undefined,
    },
    rpc,
    createCourse: vi.fn(() => ({ accountsPartial: () => ({ rpc }) })),
    closeCourse: vi.fn(),
    getGenesisHash: vi.fn<() => Promise<string>>(),
    fetchConfig: vi.fn<() => Promise<unknown>>(),
    getLatestBlockhashAndContext: vi.fn(),
    sendRawTransaction: vi.fn(),
    getEpochInfo: vi.fn(),
    getSignatureStatus: vi.fn(),
  };
});

vi.mock("@/lib/env.server", () => ({ serverEnv: h.env }));

vi.mock("@coral-xyz/anchor", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@coral-xyz/anchor")>();
  return {
    ...actual,
    AnchorProvider: class {},
    Program: class {
      methods = { createCourse: h.createCourse, closeCourse: h.closeCourse };
    },
  };
});

vi.mock("@solana/web3.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/web3.js")>();
  return {
    ...actual,
    Connection: class {
      constructor(readonly rpcEndpoint: string) {}
      getGenesisHash = h.getGenesisHash;
      getLatestBlockhashAndContext = h.getLatestBlockhashAndContext;
      sendRawTransaction = h.sendRawTransaction;
      getEpochInfo = h.getEpochInfo;
      getSignatureStatus = h.getSignatureStatus;
    },
  };
});

vi.mock("../academy-reads", () => ({
  fetchConfig: h.fetchConfig,
  fetchCourse: vi.fn(),
}));

const MAINNET_GENESIS = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
const DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
const LOCALNET_GENESIS = "4MpjwXxqwNqkk8xjyRZQ3TGb3x8wGbSCH1ifwCWTLcEf";
const MAINNET_ERROR_ID = "COURSE_IDENTITY_001";
const CLUSTER_UNVERIFIED_ID = "COURSE_IDENTITY_002";

const AUTHORITY = Keypair.generate();
const ENV_BACKEND_SIGNER = Keypair.generate();
const CONFIG_BACKEND_SIGNER = Keypair.generate().publicKey;
const INSTRUCTOR = Keypair.generate().publicKey.toBase58();

function params(overrides: Record<string, unknown> = {}) {
  return {
    courseId: "course-speedrun",
    lessonCount: 8,
    difficulty: 1,
    xpPerLesson: 10,
    trackId: 1,
    trackLevel: 1,
    creatorWallet: INSTRUCTOR,
    creatorRewardXp: 30,
    ...overrides,
  };
}

/**
 * A fresh admin-signer per call: it caches the connection per process, so each
 * test gets its own module instance.
 */
async function deploy(overrides: Record<string, unknown> = {}) {
  const { deployCoursePda } = await import("../admin-signer");
  return deployCoursePda(params(overrides));
}

const ORIGINAL_LABEL = process.env.NEXT_PUBLIC_SOLANA_NETWORK;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  // Label unset: only the genesis hash can tell the cluster apart.
  delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  h.env.SOLANA_RPC_URL = "https://rpc.example.com";
  h.env.PROGRAM_AUTHORITY_SECRET = JSON.stringify(
    Array.from(AUTHORITY.secretKey)
  );
  h.env.BACKEND_SIGNER_SECRET = JSON.stringify(
    Array.from(ENV_BACKEND_SIGNER.secretKey)
  );
  h.getGenesisHash.mockResolvedValue(MAINNET_GENESIS);
  h.fetchConfig.mockResolvedValue({ backend_signer: CONFIG_BACKEND_SIGNER });
});

afterEach(() => {
  vi.restoreAllMocks();
  if (ORIGINAL_LABEL === undefined) {
    delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  } else {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = ORIGINAL_LABEL;
  }
});

describe("deployCoursePda — mainnet course identity guard", () => {
  it.each([
    ["trackId 0", { trackId: 0 }],
    ["trackLevel 0", { trackLevel: 0 }],
    ["creator == authority", { creatorWallet: AUTHORITY.publicKey.toBase58() }],
    [
      "creator == on-chain Config.backend_signer",
      { creatorWallet: CONFIG_BACKEND_SIGNER.toBase58() },
    ],
    [
      "creator == env backend signer",
      { creatorWallet: ENV_BACKEND_SIGNER.publicKey.toBase58() },
    ],
  ])(
    "refuses %s on an anonymous mainnet host with the label unset, before building a tx",
    async (_, o) => {
      const result = await deploy(o);

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining("Refused on mainnet") as string,
        errorId: MAINNET_ERROR_ID,
      });
      expect(h.createCourse).not.toHaveBeenCalled();
      expect(h.rpc).not.toHaveBeenCalled();
    }
  );

  it("refuses with a distinct cluster-unverified error when the genesis lookup throws, even for a valid course", async () => {
    h.getGenesisHash.mockRejectedValue(new Error("rpc down"));

    const result = await deploy();

    expect(result).toEqual({
      success: false,
      error: expect.stringMatching(/could not verify which cluster/i) as string,
      errorId: CLUSTER_UNVERIFIED_ID,
    });
    expect(h.createCourse).not.toHaveBeenCalled();
  });

  it("trusts the sending connection's genesis over the caller's", async () => {
    const result = await deploy({
      trackId: 0,
      trackLevel: 0,
      genesisHash: DEVNET_GENESIS,
    });

    expect(result.errorId).toBe(MAINNET_ERROR_ID);
    expect(h.createCourse).not.toHaveBeenCalled();
  });

  it("falls back to the caller's genesis only when the live lookup throws", async () => {
    h.getGenesisHash.mockRejectedValue(new Error("rpc down"));

    const result = await deploy({
      trackId: 0,
      trackLevel: 0,
      genesisHash: DEVNET_GENESIS,
    });

    expect(result).toEqual({ success: true, signature: "create-sig" });
    expect(h.getGenesisHash).toHaveBeenCalledTimes(1);
  });

  it("refuses on mainnet when neither the Config nor the env backend signer can be read", async () => {
    h.fetchConfig.mockRejectedValue(new Error("decode failed"));
    h.env.BACKEND_SIGNER_SECRET = undefined;

    const result = await deploy();

    expect(result.errorId).toBe(MAINNET_ERROR_ID);
    expect(h.createCourse).not.toHaveBeenCalled();
  });

  it("ignores allowUnusualCreator on mainnet", async () => {
    const result = await deploy({
      creatorWallet: AUTHORITY.publicKey.toBase58(),
      allowUnusualCreator: true,
    });

    expect(result.errorId).toBe(MAINNET_ERROR_ID);
    expect(h.createCourse).not.toHaveBeenCalled();
  });

  it("sends a mainnet course with a real track, level and instructor", async () => {
    const result = await deploy({ trackId: 3, trackLevel: 2 });

    expect(result).toEqual({ success: true, signature: "create-sig" });
    expect(h.createCourse).toHaveBeenCalledWith(
      expect.objectContaining({ trackId: 3, trackLevel: 2 })
    );
  });

  it("reads the genesis hash on every create, so an RPC that changes chain is seen", async () => {
    const { deployCoursePda } = await import("../admin-signer");
    h.getGenesisHash.mockResolvedValueOnce(DEVNET_GENESIS);
    const first = await deployCoursePda(params({ trackId: 0, trackLevel: 0 }));
    const second = await deployCoursePda(params({ trackId: 0, trackLevel: 0 }));

    expect(first.success).toBe(true);
    expect(second.errorId).toBe(MAINNET_ERROR_ID);
    expect(h.getGenesisHash).toHaveBeenCalledTimes(2);
    expect(h.createCourse).toHaveBeenCalledTimes(1);
  });

  it("leaves devnet unchanged: devnet genesis sends 0/0", async () => {
    h.getGenesisHash.mockResolvedValue(DEVNET_GENESIS);

    const result = await deploy({ trackId: 0, trackLevel: 0 });

    expect(result).toEqual({ success: true, signature: "create-sig" });
    expect(h.createCourse).toHaveBeenCalledWith(
      expect.objectContaining({ trackId: 0, trackLevel: 0 })
    );
    expect(h.fetchConfig).not.toHaveBeenCalled();
  });

  it("leaves localnet unchanged: a loopback RPC serving localnet sends 0/0", async () => {
    h.env.SOLANA_RPC_URL = "http://127.0.0.1:8899";
    h.getGenesisHash.mockResolvedValue(LOCALNET_GENESIS);

    const result = await deploy({ trackId: 0, trackLevel: 0 });

    expect(result).toEqual({ success: true, signature: "create-sig" });
    expect(h.getGenesisHash).toHaveBeenCalledTimes(1);
  });

  it("refuses 0/0 on a loopback RPC that fronts mainnet", async () => {
    h.env.SOLANA_RPC_URL = "http://127.0.0.1:8899";

    const result = await deploy({ trackId: 0, trackLevel: 0 });

    expect(result.errorId).toBe(MAINNET_ERROR_ID);
    expect(h.createCourse).not.toHaveBeenCalled();
  });

  it("leaves devnet's creator == authority handling unchanged (plain error, no error id)", async () => {
    h.getGenesisHash.mockResolvedValue(DEVNET_GENESIS);

    const result = await deploy({
      creatorWallet: AUTHORITY.publicKey.toBase58(),
    });

    expect(result.success).toBe(false);
    expect(result.errorId).toBeUndefined();
    expect(result.error).toMatch(/equals the platform authority/);
    expect(h.createCourse).not.toHaveBeenCalled();
  });

  it("treats a mainnet RPC host as mainnet even with devnet's genesis", async () => {
    h.env.SOLANA_RPC_URL = "https://mainnet.helius-rpc.com/?api-key=x";
    h.getGenesisHash.mockResolvedValue(DEVNET_GENESIS);

    const result = await deploy({ trackId: 0 });

    expect(result.errorId).toBe(MAINNET_ERROR_ID);
  });
});

describe("closeCoursePda — waits for a definitive outcome", () => {
  const BLOCKHASH = Keypair.generate().publicKey.toBase58();
  const LAST_VALID = 250;
  const confirmed = { confirmationStatus: "confirmed", err: null };
  const at = <T>(slot: number, value: T) => ({ context: { slot }, value });
  const height = (blockHeight: number, absoluteSlot: number) => ({
    blockHeight,
    absoluteSlot,
  });
  const never = () => new Promise<never>(() => {});
  const rpcError = () =>
    new SendTransactionError({
      action: "send",
      signature: "",
      transactionMessage: "Internal error",
      logs: [],
    });

  async function close() {
    const { closeCoursePda } = await import("../admin-signer");
    const pending = closeCoursePda("course-speedrun");
    await vi.runAllTimersAsync();
    return pending;
  }

  /** Below the last valid height for `pollsBefore` polls, then past it. */
  function expireAfter(pollsBefore: number, expirySlot = 300) {
    let polls = 0;
    h.getEpochInfo.mockImplementation(async () =>
      ++polls <= pollsBefore
        ? height(LAST_VALID - 10, 200)
        : height(LAST_VALID + 1, expirySlot)
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
    const tx = new Transaction().add(
      new TransactionInstruction({
        keys: [],
        programId: SystemProgram.programId,
        data: Buffer.alloc(0),
      })
    );
    h.closeCourse.mockReturnValue({
      accountsPartial: () => ({ transaction: async () => tx }),
    });
    h.getLatestBlockhashAndContext.mockResolvedValue(
      at(100, { blockhash: BLOCKHASH, lastValidBlockHeight: LAST_VALID })
    );
    h.sendRawTransaction.mockResolvedValue("sent");
    h.getEpochInfo.mockResolvedValue(height(LAST_VALID - 10, 200));
    h.getSignatureStatus.mockResolvedValue(at(200, null));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports a close that confirms as landed", async () => {
    h.getSignatureStatus.mockResolvedValue(at(200, confirmed));

    const result = await close();

    expect(result).toEqual({
      outcome: "landed",
      signature: expect.any(String) as string,
    });
  });

  it("keeps waiting past .rpc()'s 30s and reports a close that lands later as landed", async () => {
    let polls = 0;
    h.getSignatureStatus.mockImplementation(async () =>
      ++polls < 25 ? at(200, null) : at(240, confirmed)
    );

    const result = await close();

    expect(result.outcome).toBe("landed");
    expect(polls).toBe(25);
  });

  it("decides expiry by block height, reading the status with history search", async () => {
    expireAfter(4);
    h.getSignatureStatus.mockResolvedValue(at(301, null));

    const result = await close();

    expect(result).toEqual({
      outcome: "notLanded",
      error: "its blockhash expired before it landed",
    });
    expect(h.getEpochInfo).toHaveBeenCalledTimes(5);
    expect(h.getEpochInfo).toHaveBeenCalledWith({
      commitment: "confirmed",
      minContextSlot: 100,
    });
    expect(h.getSignatureStatus).toHaveBeenLastCalledWith(expect.any(String), {
      searchTransactionHistory: true,
    });
  });

  it("doesn't trust an empty status from a node behind the expiry", async () => {
    expireAfter(0);
    let polls = 0;
    h.getSignatureStatus.mockImplementation(async () =>
      ++polls < 3 ? at(250, null) : at(305, confirmed)
    );

    const result = await close();

    expect(result.outcome).toBe("landed");
  });

  it("lands a close whose send answered with a JSON-RPC error", async () => {
    h.sendRawTransaction.mockRejectedValue(rpcError());
    let polls = 0;
    h.getSignatureStatus.mockImplementation(async () =>
      ++polls < 5 ? at(200, null) : at(240, confirmed)
    );

    const result = await close();

    expect(result.outcome).toBe("landed");
  });

  it("settles a rejected send as not landed only once the blockhash expired, keeping the send error", async () => {
    h.sendRawTransaction.mockRejectedValue(rpcError());
    expireAfter(3);
    h.getSignatureStatus.mockResolvedValue(at(301, null));

    const result = await close();

    expect(result.outcome).toBe("notLanded");
    expect(result).toMatchObject({
      error: expect.stringMatching(
        /Internal error[\s\S]*blockhash expired before it landed/
      ) as string,
    });
    expect(h.getEpochInfo).toHaveBeenCalledTimes(4);
  });

  it("times out a hung status call and keeps polling", async () => {
    h.getSignatureStatus
      .mockImplementationOnce(never)
      .mockResolvedValue(at(240, confirmed));

    const result = await close();

    expect(result.outcome).toBe("landed");
    expect(h.getSignatureStatus).toHaveBeenCalledTimes(2);
  });

  it("holds the deadline when every call hangs, and reports unknown with the signature", async () => {
    h.getEpochInfo.mockImplementation(never);
    const start = Date.now();

    const result = await close();

    expect(result).toEqual({
      outcome: "unknown",
      signature: expect.any(String) as string,
      error: expect.stringMatching(/timed out/) as string,
    });
    expect(Date.now() - start).toBeLessThanOrEqual(90_000);
  });

  it("reports not landed without sending when no blockhash can be fetched", async () => {
    h.getLatestBlockhashAndContext.mockRejectedValue(new Error("rpc down"));

    const result = await close();

    expect(result).toEqual({ outcome: "notLanded", error: "rpc down" });
    expect(h.sendRawTransaction).not.toHaveBeenCalled();
  });
});
