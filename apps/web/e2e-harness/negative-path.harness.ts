/**
 * SP3-C Task 6 harness (INERT — .harness.ts is excluded from the vitest glob;
 * rename to .test.ts to run). Negative-path evidence for the #402 family:
 * deployCoursePda refusals with a THROWAWAY authority key and an unreachable
 * RPC (127.0.0.1:9) so no transaction can possibly reach devnet regardless of
 * outcome. Post-#427 (merged to main, this branch rebased onto it) the
 * System-program case is now REFUSED PRE-SEND by the denylist — the last test
 * asserts that message, so a denylist regression fails loudly here.
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import { Keypair, PublicKey } from "@solana/web3.js";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    SOLANA_RPC_URL: "http://127.0.0.1:9", // unreachable — nothing leaves this box
    SUPABASE_SERVICE_ROLE_KEY: "unused",
  },
}));

beforeAll(() => {
  // Throwaway authority — NOT the real PROGRAM_AUTHORITY_SECRET.
  const throwaway = Keypair.generate();
  process.env.PROGRAM_AUTHORITY_SECRET = JSON.stringify(
    Array.from(throwaway.secretKey)
  );
});

const base = {
  courseId: "sp3c-negative-path-test",
  lessonCount: 1,
  difficulty: 1,
  xpPerLesson: 10,
  trackId: 0,
  trackLevel: 0,
  creatorRewardXp: 0,
  minCompletionsForReward: 0,
};

describe("#402 negative path — deployCoursePda refusals (branch state)", () => {
  it("missing creatorWallet → refused before any send", async () => {
    const { deployCoursePda } = await import("@/lib/solana/admin-signer");
    const res = await deployCoursePda({ ...base, creatorWallet: undefined });
    expect(res.success).toBe(false);
    console.log("MISSING:", res.error);
    expect(res.error).toMatch(/creatorWallet is required/);
  });

  it("unparseable creatorWallet → refused", async () => {
    const { deployCoursePda } = await import("@/lib/solana/admin-signer");
    const res = await deployCoursePda({
      ...base,
      creatorWallet: "not-a-wallet",
    });
    expect(res.success).toBe(false);
    console.log("UNPARSEABLE:", res.error);
    expect(res.error).toMatch(/not a valid address/);
  });

  it("off-curve creatorWallet (a PDA) → refused", async () => {
    const { deployCoursePda } = await import("@/lib/solana/admin-signer");
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("sp3c")],
      new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111")
    );
    const res = await deployCoursePda({
      ...base,
      creatorWallet: pda.toBase58(),
    });
    expect(res.success).toBe(false);
    console.log("OFF-CURVE:", res.error);
    expect(res.error).toMatch(/off-curve/);
  });

  it("#427 REGRESSION: System program as creator is REFUSED PRE-SEND", async () => {
    const { deployCoursePda } = await import("@/lib/solana/admin-signer");
    const res = await deployCoursePda({
      ...base,
      creatorWallet: "11111111111111111111111111111111",
    });
    expect(res.success).toBe(false);
    console.log("SYSTEM-PROGRAM:", res.error);
    // Post-#427 the denylist catches this BEFORE any transaction is built. A
    // blockhash/network error here (i.e. it reached the RPC) means the denylist
    // regressed — the pre-#427 failure mode. Assert the refusal message, not
    // merely failure, so that regression fails loudly.
    expect(res.error).toMatch(/denylisted well-known/);
    expect(res.error).not.toMatch(/blockhash|fetch failed/);
  });
});
