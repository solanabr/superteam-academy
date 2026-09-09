import { describe, it, expect, vi, beforeEach } from "vitest";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * The airdrop must not travel over the app's RPC connection: that endpoint is
 * the platform's keyed Helius devnet key, and Helius meters the faucet per
 * project (1 SOL/day for everyone put together). The public RPC meters per
 * address instead.
 */
const rpc = vi.hoisted(() => ({
  endpoints: [] as string[],
  requestAirdrop: vi.fn(),
  getLatestBlockhash: vi.fn(),
  confirmTransaction: vi.fn(),
  getBalance: vi.fn(),
}));

vi.mock("@solana/web3.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/web3.js")>();
  return {
    ...actual,
    Connection: class {
      constructor(endpoint: string) {
        rpc.endpoints.push(endpoint);
      }
      requestAirdrop = rpc.requestAirdrop;
      getLatestBlockhash = rpc.getLatestBlockhash;
      confirmTransaction = rpc.confirmTransaction;
      getBalance = rpc.getBalance;
    },
  };
});

const {
  createAirdropRequest,
  DEVNET_FAUCET_ENDPOINT,
  MAX_RETRY_AFTER_SECONDS,
} = await import("../airdrop");

const WALLET = Keypair.generate().publicKey;

beforeEach(() => {
  rpc.endpoints.length = 0;
  rpc.requestAirdrop.mockReset().mockResolvedValue("sig");
  rpc.getLatestBlockhash
    .mockReset()
    .mockResolvedValue({ blockhash: "bh", lastValidBlockHeight: 1 });
  rpc.confirmTransaction
    .mockReset()
    .mockResolvedValue({ value: { err: null } });
  rpc.getBalance.mockReset().mockResolvedValue(2 * LAMPORTS_PER_SOL);
});

describe("createAirdropRequest", () => {
  it("requests from the public devnet RPC, not the app's connection", async () => {
    const result = await createAirdropRequest(WALLET);

    expect(rpc.endpoints).toEqual([DEVNET_FAUCET_ENDPOINT]);
    expect(DEVNET_FAUCET_ENDPOINT).toBe("https://api.devnet.solana.com");
    expect(rpc.requestAirdrop).toHaveBeenCalledWith(
      WALLET,
      2 * LAMPORTS_PER_SOL
    );
    expect(result).toMatchObject({ success: true, newBalance: 2 });
  });

  it("honours an endpoint override", async () => {
    await createAirdropRequest(WALLET, 1, {
      endpoint: "http://localhost:8899",
    });
    expect(rpc.endpoints).toEqual(["http://localhost:8899"]);
  });

  it("reports the platform-wide 403 as rate limited rather than retrying it", async () => {
    rpc.requestAirdrop.mockRejectedValue(
      new Error(
        "403 : {'error':'Rate limit exceeded. The devnet faucet has a limit of 1 SOL per project per day'}"
      )
    );

    const result = await createAirdropRequest(WALLET);

    expect(result).toMatchObject({ success: false, rateLimited: true });
    expect(rpc.requestAirdrop).toHaveBeenCalledTimes(1);
  });

  it("surfaces the retry-after the faucet asked for", async () => {
    rpc.requestAirdrop.mockRejectedValue(
      new Error("429 Too Many Requests, retry-after: 45")
    );

    const result = await createAirdropRequest(WALLET);

    expect(result.rateLimited).toBe(true);
    expect(result.retryAfterSeconds).toBe(45);
  });

  it("leaves retryAfterSeconds unset when the faucet does not say", async () => {
    rpc.requestAirdrop.mockRejectedValue(new Error("429 Too Many Requests"));

    const result = await createAirdropRequest(WALLET);

    expect(result.rateLimited).toBe(true);
    expect(result.retryAfterSeconds).toBeUndefined();
  });

  it("caps a hostile retry-after instead of parking the button for a day", async () => {
    rpc.requestAirdrop.mockRejectedValue(
      new Error("429 Too Many Requests, retry-after: 86400")
    );

    const result = await createAirdropRequest(WALLET);

    expect(result.rateLimited).toBe(true);
    expect(result.retryAfterSeconds).toBe(MAX_RETRY_AFTER_SECONDS);
  });

  it("retries transient failures before giving up", async () => {
    rpc.requestAirdrop.mockRejectedValue(new Error("socket hang up"));

    const result = await createAirdropRequest(WALLET);

    expect(result.success).toBe(false);
    expect(result.rateLimited).toBe(false);
    expect(rpc.requestAirdrop).toHaveBeenCalledTimes(3);
  });
});
