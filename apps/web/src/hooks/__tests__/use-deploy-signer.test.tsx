// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { Keypair, Transaction } from "@solana/web3.js";
import { useDeploySigner, EMBEDDED_BATCH_SIZE } from "../use-deploy-signer";

const ADAPTER_KEY = Keypair.generate().publicKey;
const EMBEDDED_KEY = Keypair.generate().publicKey;

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

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: wallet.publicKey,
    signTransaction: wallet.publicKey ? wallet.signTransaction : undefined,
    signAllTransactions: wallet.publicKey
      ? wallet.signAllTransactions
      : undefined,
  }),
}));

vi.mock("@/lib/dynamic/solana", () => ({
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

  it("an unparseable embedded address is no wallet, not a crash", () => {
    dynamic.account = { address: "not-a-public-key" };
    const { result } = renderHook(() => useDeploySigner());
    expect(result.current.status).toBe("none");
    expect(result.current.signer).toBeNull();
  });
});
