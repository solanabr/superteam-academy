/* eslint-disable import/order -- vi.mock calls must precede importing admin-signer. */
// deployCoursePda is the one place create_course is sent. These tests pin that
// the mainnet course-identity guard runs before any transaction is built: on a
// refusal, `methods.createCourse` is never even called.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Keypair } from "@solana/web3.js";

vi.mock("server-only", () => ({}));

const { env, createCourse, rpc } = vi.hoisted(() => {
  const rpc = vi.fn(async () => "create-sig");
  return {
    env: {
      SOLANA_RPC_URL: "https://api.devnet.solana.com",
      PROGRAM_AUTHORITY_SECRET: "",
      BACKEND_SIGNER_SECRET: "",
    },
    rpc,
    createCourse: vi.fn(() => ({ accountsPartial: () => ({ rpc }) })),
  };
});

vi.mock("@/lib/env.server", () => ({ serverEnv: env }));

vi.mock("@coral-xyz/anchor", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@coral-xyz/anchor")>();
  return {
    ...actual,
    AnchorProvider: class {},
    Program: class {
      methods = { createCourse };
    },
  };
});

import { deployCoursePda } from "../admin-signer";
import { MAINNET_COURSE_IDENTITY_MESSAGE } from "../course-write-params";
import { ERROR_IDS } from "@/constants/errorIds";

const AUTHORITY = Keypair.generate();
const BACKEND_SIGNER = Keypair.generate();
const INSTRUCTOR = Keypair.generate().publicKey.toBase58();
env.PROGRAM_AUTHORITY_SECRET = JSON.stringify(Array.from(AUTHORITY.secretKey));
env.BACKEND_SIGNER_SECRET = JSON.stringify(
  Array.from(BACKEND_SIGNER.secretKey)
);

const DEVNET_RPC = "https://devnet.helius-rpc.com/?api-key=x";
const MAINNET_RPC = "https://mainnet.helius-rpc.com/?api-key=x";

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

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("deployCoursePda — mainnet course identity guard", () => {
  it.each([
    ["trackId 0", { trackId: 0 }],
    ["trackLevel 0", { trackLevel: 0 }],
    ["creator == authority", { creatorWallet: AUTHORITY.publicKey.toBase58() }],
    [
      "creator == backend signer",
      { creatorWallet: BACKEND_SIGNER.publicKey.toBase58() },
    ],
  ])("refuses %s on mainnet without building a transaction", async (_, o) => {
    env.SOLANA_RPC_URL = MAINNET_RPC;

    const result = await deployCoursePda(params(o));

    expect(result).toEqual({
      success: false,
      error: MAINNET_COURSE_IDENTITY_MESSAGE,
      errorId: ERROR_IDS.MAINNET_COURSE_IDENTITY_REFUSED,
    });
    expect(createCourse).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("ignores allowUnusualCreator on mainnet", async () => {
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "mainnet");
    env.SOLANA_RPC_URL = "https://rpc.example.com";

    const result = await deployCoursePda(
      params({
        creatorWallet: AUTHORITY.publicKey.toBase58(),
        allowUnusualCreator: true,
      })
    );

    expect(result.errorId).toBe(ERROR_IDS.MAINNET_COURSE_IDENTITY_REFUSED);
    expect(createCourse).not.toHaveBeenCalled();
  });

  it("sends a mainnet course with a real track, level and instructor", async () => {
    env.SOLANA_RPC_URL = MAINNET_RPC;

    const result = await deployCoursePda(params({ trackId: 3, trackLevel: 2 }));

    expect(result).toEqual({ success: true, signature: "create-sig" });
    expect(createCourse).toHaveBeenCalledWith(
      expect.objectContaining({ trackId: 3, trackLevel: 2 })
    );
  });

  it("leaves devnet unchanged: 0/0 is sent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "devnet");
    env.SOLANA_RPC_URL = DEVNET_RPC;

    const result = await deployCoursePda(params({ trackId: 0, trackLevel: 0 }));

    expect(result).toEqual({ success: true, signature: "create-sig" });
    expect(createCourse).toHaveBeenCalledWith(
      expect.objectContaining({ trackId: 0, trackLevel: 0 })
    );
  });

  it("leaves devnet's creator == authority handling unchanged (plain error, no error id)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "devnet");
    env.SOLANA_RPC_URL = DEVNET_RPC;

    const result = await deployCoursePda(
      params({ creatorWallet: AUTHORITY.publicKey.toBase58() })
    );

    expect(result.success).toBe(false);
    expect(result.errorId).toBeUndefined();
    expect(result.error).toMatch(/equals the platform authority/);
    expect(createCourse).not.toHaveBeenCalled();
  });
});
