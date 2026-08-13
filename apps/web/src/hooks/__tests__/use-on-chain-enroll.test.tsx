// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { Keypair, type PublicKey } from "@solana/web3.js";
import { useOnChainEnroll } from "../use-on-chain-enroll";

// Mutable holders read lazily by the mock factories below, so each test can
// shape the wallet state before rendering the hook.
const wallet = vi.hoisted(() => ({
  publicKey: null as unknown,
  setVisible: vi.fn(),
  sendTransaction: vi.fn(),
  confirmTransaction: vi.fn(),
  sendRawTransaction: vi.fn(),
}));

// The Dynamic embedded wallet, absent by default — set `account` to hand the
// hook an email sign-up's wallet.
const dynamic = vi.hoisted(() => ({
  account: null as { address: string } | null,
  signWithDynamicWallet: vi.fn(),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useConnection: () => ({
    connection: {
      confirmTransaction: wallet.confirmTransaction,
      sendRawTransaction: wallet.sendRawTransaction,
    },
  }),
  useWallet: () => ({
    publicKey: wallet.publicKey,
    sendTransaction: wallet.sendTransaction,
  }),
}));

vi.mock("@/lib/dynamic/solana", () => ({
  getDynamicSolanaAccount: () => dynamic.account,
  signWithDynamicWallet: dynamic.signWithDynamicWallet,
}));

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: wallet.setVisible }),
}));

vi.mock("@/lib/solana/instructions", () => ({
  buildEnrollInstruction: vi.fn(() => ({
    keys: [],
    programId: { toBase58: () => "11111111111111111111111111111111" },
    data: Buffer.alloc(0),
  })),
}));

vi.mock("@/lib/solana/program-errors", () => ({
  preflightTransaction: vi.fn(() => Promise.resolve()),
  parseProgramError: vi.fn(() => ({ code: null, fallback: "Enroll failed" })),
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

vi.mock("@/components/ui/toast-container", () => ({ dispatchToast: vi.fn() }));

// The hook wraps the instruction in a real web3.js Transaction; sendTransaction
// is mocked, so the Transaction never needs a blockhash or signatures.
vi.mock("@solana/web3.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/web3.js")>();
  return {
    ...actual,
    Transaction: class {
      add(): this {
        return this;
      }
    },
  };
});

const COURSE_ID = "solana-101";

beforeEach(() => {
  vi.clearAllMocks();
  wallet.publicKey = null;
  dynamic.account = null;
});

describe("useOnChainEnroll — anonymous visitor (#556)", () => {
  it("calls onRequireAuth instead of silently returning when userId is null", async () => {
    const onRequireAuth = vi.fn();
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useOnChainEnroll({
        courseId: COURSE_ID,
        userId: null,
        onRequireAuth,
        onSuccess,
      })
    );

    await act(async () => {
      await result.current.handleEnroll();
    });

    expect(onRequireAuth).toHaveBeenCalledTimes(1);
    // No wallet modal, no transaction, no success — just the auth prompt.
    expect(wallet.setVisible).not.toHaveBeenCalled();
    expect(wallet.sendTransaction).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.isEnrolling).toBe(false);
    expect(result.current.enrollError).toBeNull();
  });
});

describe("useOnChainEnroll — signed-in user (unchanged paths)", () => {
  it("opens the wallet modal (not the auth modal) when signed in without a connected wallet", async () => {
    const onRequireAuth = vi.fn();

    const { result } = renderHook(() =>
      useOnChainEnroll({
        courseId: COURSE_ID,
        userId: "user-1",
        onRequireAuth,
      })
    );

    await act(async () => {
      await result.current.handleEnroll();
    });

    expect(wallet.setVisible).toHaveBeenCalledWith(true);
    expect(onRequireAuth).not.toHaveBeenCalled();
    expect(wallet.sendTransaction).not.toHaveBeenCalled();
  });

  it("sends the enroll transaction and reports success when signed in with a wallet", async () => {
    const onRequireAuth = vi.fn();
    const onSuccess = vi.fn();
    wallet.publicKey = Keypair.generate().publicKey satisfies PublicKey;
    wallet.sendTransaction.mockResolvedValue("mock-signature");
    wallet.confirmTransaction.mockResolvedValue({ value: { err: null } });

    const { result } = renderHook(() =>
      useOnChainEnroll({
        courseId: COURSE_ID,
        userId: "user-1",
        onRequireAuth,
        onSuccess,
      })
    );

    await act(async () => {
      await result.current.handleEnroll();
    });

    expect(wallet.sendTransaction).toHaveBeenCalledTimes(1);
    expect(wallet.confirmTransaction).toHaveBeenCalledWith(
      "mock-signature",
      "confirmed"
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onRequireAuth).not.toHaveBeenCalled();
    expect(result.current.enrollError).toBeNull();
  });
});

describe("useOnChainEnroll — Dynamic embedded wallet", () => {
  it("signs with the embedded wallet instead of opening the connect modal", async () => {
    const onSuccess = vi.fn();
    dynamic.account = { address: Keypair.generate().publicKey.toBase58() };
    dynamic.signWithDynamicWallet.mockResolvedValue({
      serialize: () => new Uint8Array(),
    });
    wallet.sendRawTransaction.mockResolvedValue("dynamic-signature");
    wallet.confirmTransaction.mockResolvedValue({ value: { err: null } });

    const { result } = renderHook(() =>
      useOnChainEnroll({
        courseId: COURSE_ID,
        userId: "user-1",
        onRequireAuth: vi.fn(),
        onSuccess,
      })
    );

    await act(async () => {
      await result.current.handleEnroll();
    });

    // The connect modal was the dead end this path removes.
    expect(wallet.setVisible).not.toHaveBeenCalled();
    expect(wallet.sendTransaction).not.toHaveBeenCalled();
    expect(dynamic.signWithDynamicWallet).toHaveBeenCalledTimes(1);
    expect(wallet.sendRawTransaction).toHaveBeenCalledTimes(1);
    expect(wallet.confirmTransaction).toHaveBeenCalledWith(
      "dynamic-signature",
      "confirmed"
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.enrollError).toBeNull();
  });

  it("prefers a connected wallet-adapter wallet over the embedded one", async () => {
    wallet.publicKey = Keypair.generate().publicKey satisfies PublicKey;
    dynamic.account = { address: Keypair.generate().publicKey.toBase58() };
    wallet.sendTransaction.mockResolvedValue("adapter-signature");
    wallet.confirmTransaction.mockResolvedValue({ value: { err: null } });

    const { result } = renderHook(() =>
      useOnChainEnroll({
        courseId: COURSE_ID,
        userId: "user-1",
        onRequireAuth: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleEnroll();
    });

    expect(wallet.sendTransaction).toHaveBeenCalledTimes(1);
    expect(dynamic.signWithDynamicWallet).not.toHaveBeenCalled();
  });
});
