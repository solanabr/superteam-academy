import { describe, expect, it, vi, beforeEach } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { enrollWithOnchainTransaction } from "@/lib/progress/client-enrollment";

describe("enrollWithOnchainTransaction course account checks", () => {
  const learner = new PublicKey("11111111111111111111111111111111");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fails before wallet send when course PDA does not exist on-chain", async () => {
    const connection = {
      getAccountInfo: vi.fn().mockResolvedValue(null),
      getLatestBlockhash: vi.fn(),
      confirmTransaction: vi.fn(),
    } as unknown as Parameters<typeof enrollWithOnchainTransaction>[0]["connection"];

    const sendTransaction = vi.fn();

    await expect(
      enrollWithOnchainTransaction({
        courseId: "solana-fundamentals",
        courseSlug: "solana-fundamentals",
        connection,
        learner,
        sendTransaction,
      })
    ).rejects.toThrow("On-chain course account not found for courseId");

    expect(sendTransaction).not.toHaveBeenCalled();
    expect(connection.getLatestBlockhash).not.toHaveBeenCalled();
  });
});
