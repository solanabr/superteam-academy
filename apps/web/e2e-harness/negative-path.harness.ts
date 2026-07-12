/**
 * SP3-C Task 6 harness (UNCOMMITTED). Negative-path evidence for the #402
 * family on THIS branch: deployCoursePda refusals with a THROWAWAY authority
 * key and an unreachable RPC (127.0.0.1:9) so no transaction can possibly
 * reach devnet regardless of outcome.
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

  it("DENYLIST GAP PROBE: System program as creator — refused or network-blocked?", async () => {
    const { deployCoursePda } = await import("@/lib/solana/admin-signer");
    const res = await deployCoursePda({
      ...base,
      creatorWallet: "11111111111111111111111111111111",
    });
    // Either way it must fail here (unreachable RPC guarantees no tx), but the
    // ERROR TEXT tells us whether this branch's validation caught it (a
    // refusal message) or whether only the network stopped it (#427's gap).
    expect(res.success).toBe(false);
    console.log("SYSTEM-PROGRAM:", res.error);
  });
});
