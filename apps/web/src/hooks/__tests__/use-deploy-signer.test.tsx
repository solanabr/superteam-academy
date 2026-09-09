// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { Keypair, Transaction } from "@solana/web3.js";
import { isDynamicSessionExpiredError } from "@/lib/dynamic/solana";
import { useDeploySigner, EMBEDDED_BATCH_SIZE } from "../use-deploy-signer";

const ADAPTER_KEY = Keypair.generate().publicKey;
const EMBEDDED_KEY = Keypair.generate().publicKey;
const OTHER_KEY = Keypair.generate().publicKey;

const wallet = vi.hoisted(() => ({
  publicKey: null as unknown,
  signTransaction: vi.fn(),
  signAllTransactions: vi.fn(),
}));

const dynamic = vi.hoisted(() => ({
  account: null as { address: string } | null,
  status: "none" as "valid" | "expired" | "loading" | "none",
  signWithDynamicWallet: vi.fn(),
  signAllWithDynamicWallet: vi.fn(),
  startDynamicSocialSignIn: vi.fn(),
}));

const dynamicEnabled = vi.hoisted(() => ({ value: true }));

const connectionMock = vi.hoisted(() => ({
  getLatestBlockhash: vi.fn(async () => ({
    blockhash: "fresh",
    lastValidBlockHeight: 1,
  })),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: wallet.publicKey,
    signTransaction: wallet.publicKey ? wallet.signTransaction : undefined,
    signAllTransactions: wallet.publicKey
      ? wallet.signAllTransactions
      : undefined,
  }),
  // Only used by the embedded path, to re-stamp a batch whose blockhash the
  // rate-limit backoff has outlived.
  useConnection: () => ({ connection: connectionMock }),
}));

// Only the signing calls are stubbed — `isDynamicSessionExpiredError` is the
// real predicate, so the tests below assert what the app actually matches on.
vi.mock("@/lib/dynamic/solana", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/dynamic/solana")>()),
  signWithDynamicWallet: dynamic.signWithDynamicWallet,
  signAllWithDynamicWallet: dynamic.signAllWithDynamicWallet,
}));

vi.mock("@/lib/dynamic/social", () => ({
  startDynamicSocialSignIn: dynamic.startDynamicSocialSignIn,
}));

vi.mock("@/lib/dynamic/config", () => ({
  isDynamicEnabled: () => dynamicEnabled.value,
}));

vi.mock("@/hooks/use-dynamic-session-state", () => ({
  useDynamicSessionState: () => ({
    status: dynamic.account ? "valid" : dynamic.status,
    account: dynamic.account,
  }),
}));

beforeEach(() => {
  wallet.publicKey = null;
  wallet.signTransaction.mockReset();
  wallet.signAllTransactions.mockReset();
  dynamic.account = null;
  dynamic.status = "none";
  dynamic.signWithDynamicWallet.mockReset();
  dynamic.signAllWithDynamicWallet.mockReset();
  dynamicEnabled.value = true;
});

/** The thrown value, so a test can assert on it with the app's own predicate. */
async function rejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("expected the call to reject");
}

describe("useDeploySigner", () => {
  it("prefers the wallet-adapter wallet and keeps the package's default batch size", () => {
    wallet.publicKey = ADAPTER_KEY;
    dynamic.account = { address: EMBEDDED_KEY.toBase58() };

    const { result } = renderHook(() => useDeploySigner());

    expect(result.current.status).toBe("ready");
    expect(result.current.kind).toBe("adapter");
    expect(result.current.signer?.publicKey).toBe(ADAPTER_KEY);
    // undefined = deployProgram keeps BATCH_SIZE, i.e. today's behaviour.
    expect(result.current.batchSize).toBeUndefined();
  });

  it("resolves the Dynamic embedded wallet when there is no adapter", async () => {
    dynamic.account = { address: EMBEDDED_KEY.toBase58() };

    const { result } = renderHook(() => useDeploySigner());

    expect(result.current.status).toBe("ready");
    expect(result.current.kind).toBe("embedded");
    expect(result.current.signer?.publicKey?.toBase58()).toBe(
      EMBEDDED_KEY.toBase58()
    );
    expect(result.current.batchSize).toBe(EMBEDDED_BATCH_SIZE);

    // Both signing entry points route to the Dynamic helpers with the session's
    // own account — never a caller-supplied one.
    const tx = new Transaction();
    dynamic.signWithDynamicWallet.mockResolvedValue(tx);
    dynamic.signAllWithDynamicWallet.mockResolvedValue([tx]);
    await result.current.signer!.signTransaction(tx);
    await result.current.signer!.signAllTransactions([tx]);
    expect(dynamic.signWithDynamicWallet).toHaveBeenCalledWith(
      tx,
      dynamic.account
    );
    expect(dynamic.signAllWithDynamicWallet).toHaveBeenCalledWith(
      [tx],
      dynamic.account
    );
  });

  it("splits an embedded batch into sub-batches, in order", async () => {
    dynamic.account = { address: EMBEDDED_KEY.toBase58() };
    dynamic.signAllWithDynamicWallet.mockImplementation(
      async (txs: Transaction[]) => txs
    );

    const { result } = renderHook(() => useDeploySigner());
    const txs = Array.from({ length: 12 }, () => new Transaction());
    const signed = await result.current.signer!.signAllTransactions(txs);

    // Dynamic throttles the MPC API by signatures asked for at once, so a
    // 15-tx batch goes out five at a time.
    expect(
      dynamic.signAllWithDynamicWallet.mock.calls.map((call) => call[0].length)
    ).toEqual([5, 5, 2]);
    // The deploy maps signature i back to chunk i.
    expect(signed).toEqual(txs);
  });

  it("waits out a rate limit instead of failing the batch", async () => {
    vi.useFakeTimers();
    dynamic.account = { address: EMBEDDED_KEY.toBase58() };
    const rateLimited = new Error("Rate limited");
    rateLimited.name = "WalletApiError";
    dynamic.signAllWithDynamicWallet
      .mockRejectedValueOnce(rateLimited)
      .mockImplementation(async (txs: Transaction[]) => txs);

    const onRateLimitWait = vi.fn();
    const { result } = renderHook(() => useDeploySigner({ onRateLimitWait }));
    const txs = [new Transaction()];
    const pending = result.current.signer!.signAllTransactions(txs);
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toEqual(txs);
    expect(dynamic.signAllWithDynamicWallet).toHaveBeenCalledTimes(2);
    expect(onRateLimitWait).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("waits out a rate limit on the single funding signature too", async () => {
    vi.useFakeTimers();
    dynamic.account = { address: EMBEDDED_KEY.toBase58() };
    const rateLimited = new Error("Rate limited");
    rateLimited.name = "WalletApiError";
    const tx = new Transaction();
    dynamic.signWithDynamicWallet
      .mockRejectedValueOnce(rateLimited)
      .mockResolvedValue(tx);

    const onRateLimitWait = vi.fn();
    const { result } = renderHook(() => useDeploySigner({ onRateLimitWait }));
    // On the session-key deploy this is the ONLY remote signature there is —
    // the funding transfer. Failing it fails the deploy before a lamport moves.
    const pending = result.current.signer!.signTransaction(tx);
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toBe(tx);
    expect(dynamic.signWithDynamicWallet).toHaveBeenCalledTimes(2);
    expect(onRateLimitWait).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("leaves the adapter path unwrapped", async () => {
    wallet.publicKey = ADAPTER_KEY;
    const txs = Array.from({ length: 12 }, () => new Transaction());
    wallet.signAllTransactions.mockResolvedValue(txs);

    const { result } = renderHook(() => useDeploySigner());
    await result.current.signer!.signAllTransactions(txs);

    // An extension wallet signs locally: one popup, no sub-batching, no
    // backoff.
    expect(wallet.signAllTransactions).toHaveBeenCalledWith(txs);
  });

  it("hands back the SAME signer across re-renders while the session is unchanged", () => {
    dynamic.account = { address: EMBEDDED_KEY.toBase58() };

    const { result, rerender } = renderHook(() => useDeploySigner());
    const first = result.current.signer;
    rerender();
    rerender();

    // Referential stability is load-bearing: `WalletFundingCard` keys a
    // `useCallback` on `signer.publicKey` and drives it from an effect, so a
    // fresh object per render is an unbounded `getBalance` poll.
    expect(result.current.signer).toBe(first);
    expect(result.current.signer?.publicKey).toBe(first?.publicKey);
  });

  it("reports `resolving` while the SDK is still initialising", () => {
    dynamic.status = "loading";
    const { result } = renderHook(() => useDeploySigner());
    expect(result.current.status).toBe("resolving");
    expect(result.current.signer).toBeNull();
  });

  it("reports `expired` so callers offer re-auth, not the connect modal", () => {
    dynamic.status = "expired";
    const { result } = renderHook(() => useDeploySigner());
    expect(result.current.status).toBe("expired");
    expect(result.current.kind).toBeNull();
  });

  it("reports `none` when no wallet of either kind exists", () => {
    const { result } = renderHook(() => useDeploySigner());
    expect(result.current.status).toBe("none");
    expect(result.current.signer).toBeNull();
  });

  it("kill switch off: a live Dynamic session is ignored entirely", () => {
    dynamicEnabled.value = false;
    dynamic.account = { address: EMBEDDED_KEY.toBase58() };

    const { result } = renderHook(() => useDeploySigner());

    expect(result.current.status).toBe("none");
    expect(result.current.kind).toBeNull();
    expect(result.current.signer).toBeNull();
  });

  it("refuses to sign once the session moves to a different account", async () => {
    dynamic.account = { address: EMBEDDED_KEY.toBase58() };

    const { result, rerender } = renderHook(() => useDeploySigner());
    const captured = result.current.signer!;
    const advertised = captured.publicKey!.toBase58();

    // The session swaps under an in-flight signer. Without the address check
    // the closure would happily hand the NEW account to the MPC signer while
    // still advertising the old key — a transaction built for A, signed by B.
    dynamic.account = { address: OTHER_KEY.toBase58() };
    rerender();

    const tx = new Transaction();
    await expect(captured.signTransaction(tx)).rejects.toMatchObject({
      name: "UnauthorizedError",
    });
    await expect(captured.signAllTransactions([tx])).rejects.toMatchObject({
      name: "UnauthorizedError",
    });
    expect(dynamic.signWithDynamicWallet).not.toHaveBeenCalled();
    expect(dynamic.signAllWithDynamicWallet).not.toHaveBeenCalled();
    // The advertised identity never mutates either — the swap produces a new
    // signer, it does not repoint the old one.
    expect(captured.publicKey!.toBase58()).toBe(advertised);
    expect(result.current.signer).not.toBe(captured);
    expect(result.current.signer?.publicKey?.toBase58()).toBe(
      OTHER_KEY.toBase58()
    );
  });

  it("raises an expiry both entry points when the session dies mid-flight", async () => {
    dynamic.account = { address: EMBEDDED_KEY.toBase58() };

    const { result, rerender } = renderHook(() => useDeploySigner());
    const captured = result.current.signer!;

    // Session gone between render and signature. The error has to be one
    // `isDynamicSessionExpiredError` recognises, or the caller shows a raw
    // failure instead of the re-auth card.
    dynamic.account = null;
    dynamic.status = "expired";
    rerender();

    const tx = new Transaction();
    expect(
      isDynamicSessionExpiredError(
        await rejection(captured.signTransaction(tx))
      )
    ).toBe(true);
    expect(
      isDynamicSessionExpiredError(
        await rejection(captured.signAllTransactions([tx]))
      )
    ).toBe(true);
  });

  it("an unparseable embedded address is no wallet, not a crash", () => {
    dynamic.account = { address: "not-a-public-key" };
    const { result } = renderHook(() => useDeploySigner());
    expect(result.current.status).toBe("none");
    expect(result.current.signer).toBeNull();
  });
});
