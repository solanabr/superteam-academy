/* eslint-disable import/order -- vi.mock calls must precede importing admin-signer. */
// deployCoursePda is the one place create_course is sent. These tests pin that
// the mainnet course-identity guard runs before any transaction is built (on a
// refusal `methods.createCourse` is never called) and that the cluster is
// resolved fail-closed from the connection's genesis hash.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Keypair } from "@solana/web3.js";

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
    getGenesisHash: vi.fn<() => Promise<string>>(),
    fetchConfig: vi.fn<() => Promise<unknown>>(),
  };
});

vi.mock("@/lib/env.server", () => ({ serverEnv: h.env }));

vi.mock("@coral-xyz/anchor", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@coral-xyz/anchor")>();
  return {
    ...actual,
    AnchorProvider: class {},
    Program: class {
      methods = { createCourse: h.createCourse };
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
    },
  };
});

vi.mock("../academy-reads", () => ({
  fetchConfig: h.fetchConfig,
  fetchCourse: vi.fn(),
}));

const MAINNET_GENESIS = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
const DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
const MAINNET_ERROR_ID = "COURSE_IDENTITY_001";

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
 * A fresh admin-signer per call: it caches the connection and its genesis hash
 * per process, so each test gets its own module instance.
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

  it("refuses when the genesis lookup throws (fail closed)", async () => {
    h.getGenesisHash.mockRejectedValue(new Error("rpc down"));

    const result = await deploy({ trackId: 0, trackLevel: 0 });

    expect(result.errorId).toBe(MAINNET_ERROR_ID);
    expect(h.createCourse).not.toHaveBeenCalled();
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

  it("looks the genesis hash up once per process", async () => {
    const { deployCoursePda } = await import("../admin-signer");
    await deployCoursePda(params());
    await deployCoursePda(params());

    expect(h.getGenesisHash).toHaveBeenCalledTimes(1);
    expect(h.createCourse).toHaveBeenCalledTimes(2);
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

  it("leaves localnet unchanged: a loopback RPC sends 0/0 without a genesis lookup", async () => {
    h.env.SOLANA_RPC_URL = "http://127.0.0.1:8899";

    const result = await deploy({ trackId: 0, trackLevel: 0 });

    expect(result).toEqual({ success: true, signature: "create-sig" });
    expect(h.getGenesisHash).not.toHaveBeenCalled();
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
