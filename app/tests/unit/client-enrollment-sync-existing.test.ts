import { describe, expect, it, vi, beforeEach } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { enrollWithOnchainTransaction } from "@/lib/progress/client-enrollment";

describe("enrollWithOnchainTransaction existing enrollment sync", () => {
  const learner = new PublicKey("11111111111111111111111111111111");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncs locally without sending a wallet transaction when enrollment PDA already exists", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const connection = {
      getLatestBlockhash: vi.fn(),
      getAccountInfo: vi.fn().mockResolvedValue({
        owner: new PublicKey("ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"),
      }),
      confirmTransaction: vi.fn(),
    } as unknown as Parameters<typeof enrollWithOnchainTransaction>[0]["connection"];

    const sendTransaction = vi.fn();

    const result = await enrollWithOnchainTransaction({
      courseId: "solana-fundamentals",
      courseSlug: "solana-fundamentals",
      connection,
      learner,
      sendTransaction,
    });

    expect(result.startsWith("existing:")).toBe(true);
    expect(sendTransaction).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/progress/enroll-existing",
      expect.objectContaining({ method: "POST" })
    );
  });
});
