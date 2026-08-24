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
// hook an email sign-up's wallet, or `status` to describe a session that is
// loading / expired / absent.
const dynamic = vi.hoisted(() => ({
  account: null as { address: string } | null,
  status: "none" as "valid" | "expired" | "loading" | "none",
  signWithDynamicWallet: vi.fn(),
  startDynamicSocialSignIn: vi.fn(),
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

// The account's linked wallet — the one every enrolment path binds to — plus
// how that wallet was provisioned (#1179).
const auth = vi.hoisted(() => ({
  walletAddress: null as string | null,
  walletKind: null as "embedded" | "external" | null,
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({
    profile: {
      wallet_address: auth.walletAddress,
      wallet_kind: auth.walletKind,
    },
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    values ? `${key}:${Object.values(values).join(",")}` : key,
}));

// `getDynamicSolanaAccount` is NOT mocked here — the hook no longer calls it.
// It reads the composed session state, and the real predicate is exercised in
// lib/dynamic/__tests__/session-state.test.ts (which mocks the SDK, not this
// module) so this suite cannot green-light a broken one.
vi.mock("@/lib/dynamic/solana", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/dynamic/solana")>()),
  signWithDynamicWallet: dynamic.signWithDynamicWallet,
}));

vi.mock("@/hooks/use-dynamic-session-state", () => ({
  useDynamicSessionState: () => ({
    status: dynamic.account ? "valid" : dynamic.status,
    account: dynamic.account,
  }),
}));

vi.mock("@/lib/dynamic/social", () => ({
  startDynamicSocialSignIn: dynamic.startDynamicSocialSignIn,
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
      static from(): unknown {
        return new this();
      }
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
  dynamic.status = "none";
  auth.walletAddress = null;
  auth.walletKind = null;
  vi.unstubAllGlobals();
});

/** Sponsor route responding with a transaction built for `learner`. */
function stubSponsor(learner: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ transaction: btoa("sponsored"), learner }),
    })
  );
}

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
    const key = Keypair.generate().publicKey;
    wallet.publicKey = key satisfies PublicKey;
    auth.walletAddress = key.toBase58();
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

describe("useOnChainEnroll — linked-wallet binding", () => {
  it("aborts when the sponsor built for a different learner", async () => {
    // No linked wallet known client-side (profile still loading), so only the
    // sponsor's own answer can catch this.
    wallet.publicKey = Keypair.generate().publicKey satisfies PublicKey;
    stubSponsor(Keypair.generate().publicKey.toBase58());
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useOnChainEnroll({
        courseId: COURSE_ID,
        userId: "user-1",
        onRequireAuth: vi.fn(),
        onError,
      })
    );

    await act(async () => {
      await result.current.handleEnroll();
    });

    expect(wallet.sendTransaction).not.toHaveBeenCalled();
    expect(wallet.sendRawTransaction).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.enrollError).toContain("enrollMismatch");
  });

  it("never self-pays with a wallet that is not the linked one", async () => {
    wallet.publicKey = Keypair.generate().publicKey satisfies PublicKey;
    auth.walletAddress = Keypair.generate().publicKey.toBase58();
    // Sponsor unavailable — the old code fell straight through to self-pay,
    // which is what mints an enrollment no account can be resolved to.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

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

    expect(wallet.sendTransaction).not.toHaveBeenCalled();
    expect(result.current.enrollError).toContain("enrollMismatch");
  });

  it("does not self-pay when the sponsor refuses and no wallet is linked", async () => {
    // The Google sign-up with Phantom connected and nothing linked: the route
    // 400s ("No wallet linked"), which used to drop straight into self-pay and
    // mint an enrollment the webhook could never resolve to an account.
    wallet.publicKey = Keypair.generate().publicKey satisfies PublicKey;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "No wallet linked to this account" }),
      })
    );
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useOnChainEnroll({
        courseId: COURSE_ID,
        userId: "user-1",
        onRequireAuth: vi.fn(),
        onError,
      })
    );

    await act(async () => {
      await result.current.handleEnroll();
    });

    expect(wallet.sendTransaction).not.toHaveBeenCalled();
    expect(wallet.sendRawTransaction).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.enrollError).toContain("enrollNoLinkedWallet");
  });

  it("proceeds when the signing wallet is the linked one", async () => {
    const key = Keypair.generate().publicKey;
    wallet.publicKey = key satisfies PublicKey;
    auth.walletAddress = key.toBase58();
    stubSponsor(key.toBase58());
    wallet.sendTransaction.mockResolvedValue("mock-signature");
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
    expect(result.current.enrollError).toBeNull();
  });
});

describe("useOnChainEnroll — Dynamic embedded wallet", () => {
  it("signs with the embedded wallet instead of opening the connect modal", async () => {
    const onSuccess = vi.fn();
    const address = Keypair.generate().publicKey.toBase58();
    dynamic.account = { address };
    auth.walletAddress = address;
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

  it("offers re-auth — never the connect modal — when the session expired", async () => {
    // #1179: the whole bug. An embedded learner whose Dynamic JWT died has no
    // extension to connect and no route from that modal back to Dynamic.
    // DELETE the `status === "expired" || isEmbeddedLearner` branch in
    // useOnChainEnroll and this case fails on the FIRST assertion —
    // setVisible(true) is exactly what the old code did here.
    dynamic.status = "expired";
    auth.walletKind = "embedded";

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

    expect(wallet.setVisible).not.toHaveBeenCalled();
    expect(result.current.reauthPrompt).not.toBeNull();
    expect(wallet.sendTransaction).not.toHaveBeenCalled();
    expect(dynamic.signWithDynamicWallet).not.toHaveBeenCalled();

    // The prompt's action is the real social redirect, not a dead button.
    await act(async () => {
      await result.current.reauthPrompt?.start();
    });
    expect(dynamic.startDynamicSocialSignIn).toHaveBeenCalledWith("google");
  });

  it("keeps the connect modal shut while the SDK is still initialising", async () => {
    // The init race: a learner with a perfectly VALID session used to get the
    // connect modal purely because the click beat initialisation.
    dynamic.status = "loading";

    const { result } = renderHook(() =>
      useOnChainEnroll({
        courseId: COURSE_ID,
        userId: "user-1",
        onRequireAuth: vi.fn(),
      })
    );

    expect(result.current.isWalletResolving).toBe(true);

    await act(async () => {
      await result.current.handleEnroll();
    });

    // Neither affordance: no modal, and no prompt claiming a dead session.
    expect(wallet.setVisible).not.toHaveBeenCalled();
    expect(result.current.reauthPrompt).toBeNull();
    expect(result.current.enrollError).toBeNull();
  });

  it("still opens the connect modal for an external-wallet learner", async () => {
    // The unchanged path, pinned: nothing about #1179 may reach the population
    // for whom "connect your wallet" is the correct ask.
    dynamic.status = "none";
    auth.walletKind = "external";

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

    expect(wallet.setVisible).toHaveBeenCalledWith(true);
    expect(result.current.reauthPrompt).toBeNull();
  });

  it("shows re-auth, not a raw error, when the session dies mid-signature", async () => {
    const address = Keypair.generate().publicKey.toBase58();
    dynamic.account = { address };
    auth.walletAddress = address;
    auth.walletKind = "embedded";
    // What the SDK actually throws when the JWT expired between the wallet
    // read and the signing call.
    const unauthorized = Object.assign(new Error("Unauthorized"), {
      name: "UnauthorizedError",
      code: "unauthorized_error",
    });
    dynamic.signWithDynamicWallet.mockRejectedValue(unauthorized);

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useOnChainEnroll({
        courseId: COURSE_ID,
        userId: "user-1",
        onRequireAuth: vi.fn(),
        onError,
      })
    );

    await act(async () => {
      await result.current.handleEnroll();
    });

    expect(result.current.reauthPrompt).not.toBeNull();
    // Not toasted as a program failure, and not reported as an enrol error.
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.enrollError).toBeNull();
  });

  it("prefers a connected wallet-adapter wallet over the embedded one", async () => {
    const key = Keypair.generate().publicKey;
    wallet.publicKey = key satisfies PublicKey;
    auth.walletAddress = key.toBase58();
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
