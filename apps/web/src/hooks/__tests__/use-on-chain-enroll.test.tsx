// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
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

// Phantom Connect state, shaped per test the same way (walletless enrolment).
const phantom = vi.hoisted(() => ({
  enabled: false,
  address: null as string | null,
  connect: vi.fn(),
  signTransaction: vi.fn(),
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

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: wallet.setVisible }),
}));

vi.mock("@/components/auth/phantom-connect-provider", () => ({
  usePhantomConnect: () => ({
    enabled: phantom.enabled,
    status: phantom.address ? "connected" : "idle",
    address: phantom.address,
    connect: phantom.connect,
    disconnect: vi.fn(),
    signTransaction: phantom.signTransaction,
  }),
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

// The walletless branch reads the account's linked wallet before deciding
// whether to provision. Own-row profile row, shaped per test.
const db = vi.hoisted(() => ({
  profile: null as { wallet_address: string | null; prefs: unknown } | null,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: db.profile, error: null }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/components/ui/toast-container", () => ({ dispatchToast: vi.fn() }));

// The hook wraps the instruction in a real web3.js Transaction; sendTransaction
// is mocked, so the Transaction never needs a blockhash or signatures. The
// static `from` covers the sponsored path, which deserializes a base64 tx.
vi.mock("@solana/web3.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/web3.js")>();
  return {
    ...actual,
    Transaction: class {
      add(): this {
        return this;
      }
      serialize(): Uint8Array {
        return new Uint8Array([1]);
      }
      static from(): unknown {
        return new this();
      }
    },
  };
});

const COURSE_ID = "solana-101";

beforeEach(() => {
  vi.clearAllMocks();
  wallet.publicKey = null;
  phantom.enabled = false;
  phantom.address = null;
  db.profile = null;
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Sponsored route responds with a (fake) base64 transaction. */
function stubSponsorRoute(learner = "EmbeddedAddr111"): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ transaction: btoa("tx-bytes"), learner }),
    }))
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

describe("useOnChainEnroll — walletless learner, Phantom Connect enabled", () => {
  it("provisions an embedded wallet instead of opening the install-a-wallet modal", async () => {
    phantom.enabled = true;
    phantom.connect.mockResolvedValue(undefined);

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

    expect(phantom.connect).toHaveBeenCalledWith("google");
    expect(wallet.setVisible).not.toHaveBeenCalled();
    // The redirect drops the click; the marker is what resumes it on return.
    expect(sessionStorage.getItem("pendingEnrollCourseId")).toContain(
      COURSE_ID
    );
  });

  it("sends an extension-linked account to the wallet modal instead of provisioning a second wallet", async () => {
    phantom.enabled = true;
    // A linked wallet exists but is not connected in this browser. A newly
    // provisioned embedded wallet could never be linked (PhantomAuthHandler
    // refuses a second wallet) and so could never sign for this account.
    db.profile = { wallet_address: "ExtensionAddr111", prefs: {} };

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
    expect(phantom.connect).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("pendingEnrollCourseId")).toBeNull();
  });

  it("reconnects (not re-provisions) when the linked wallet is itself Phantom-embedded", async () => {
    phantom.enabled = true;
    // user-wallet scoping means connect("google") surfaces the SAME wallet,
    // so proceeding is safe for an embedded-linked account.
    db.profile = {
      wallet_address: "EmbeddedAddr111",
      prefs: { walletProvider: "phantom-embedded" },
    };
    phantom.connect.mockResolvedValue(undefined);

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

    expect(phantom.connect).toHaveBeenCalledWith("google");
    expect(wallet.setVisible).not.toHaveBeenCalled();
  });

  it("refuses to sign when the sponsored transaction was built for a different linked wallet", async () => {
    phantom.enabled = true;
    phantom.address = "EmbeddedAddr111";
    // Server builds for profiles.wallet_address — here, some other wallet.
    stubSponsorRoute("OtherLinkedAddr222");
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

    // The embedded key is not among the tx's required signers; failing here
    // with the real reason beats an opaque signature error at submission.
    expect(phantom.signTransaction).not.toHaveBeenCalled();
    expect(wallet.sendRawTransaction).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.enrollError).toContain("different wallet");
  });

  it("clears the pending marker when the connect fails before the redirect", async () => {
    phantom.enabled = true;
    phantom.connect.mockRejectedValue(new Error("popup closed"));

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

    expect(sessionStorage.getItem("pendingEnrollCourseId")).toBeNull();
  });

  it("enrolls through the sponsored route with the embedded wallet's signature", async () => {
    phantom.enabled = true;
    phantom.address = "EmbeddedAddr111";
    stubSponsorRoute();
    phantom.signTransaction.mockImplementation(async (tx: unknown) => tx);
    wallet.sendRawTransaction.mockResolvedValue("embedded-signature");
    wallet.confirmTransaction.mockResolvedValue({ value: { err: null } });
    const onSuccess = vi.fn();

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

    expect(phantom.signTransaction).toHaveBeenCalledTimes(1);
    expect(wallet.sendRawTransaction).toHaveBeenCalledTimes(1);
    expect(wallet.confirmTransaction).toHaveBeenCalledWith(
      "embedded-signature",
      "confirmed"
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
    // The adapter-wallet path must not have run.
    expect(wallet.sendTransaction).not.toHaveBeenCalled();
  });

  it("fails with an error (never a self-paid attempt) when sponsorship is unavailable", async () => {
    phantom.enabled = true;
    phantom.address = "EmbeddedAddr111";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) }))
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

    // An embedded wallet holds zero SOL: a self-paid fallback could only
    // produce a confusing "insufficient funds" failure.
    expect(phantom.signTransaction).not.toHaveBeenCalled();
    expect(wallet.sendRawTransaction).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.enrollError).not.toBeNull();
  });
});

describe("useOnChainEnroll — resume after redirect", () => {
  it("completes a pending enrolment once the wallet is ready, without a second click", async () => {
    phantom.enabled = true;
    phantom.address = "EmbeddedAddr111";
    stubSponsorRoute();
    phantom.signTransaction.mockImplementation(async (tx: unknown) => tx);
    wallet.sendRawTransaction.mockResolvedValue("embedded-signature");
    wallet.confirmTransaction.mockResolvedValue({ value: { err: null } });
    const onSuccess = vi.fn();

    sessionStorage.setItem(
      "pendingEnrollCourseId",
      JSON.stringify({ courseId: COURSE_ID, expiresAt: Date.now() + 60_000 })
    );

    renderHook(() =>
      useOnChainEnroll({
        courseId: COURSE_ID,
        userId: "user-1",
        onRequireAuth: vi.fn(),
        onSuccess,
      })
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(sessionStorage.getItem("pendingEnrollCourseId")).toBeNull();
  });

  it("ignores an expired pending marker — no surprise enrolments", async () => {
    phantom.enabled = true;
    phantom.address = "EmbeddedAddr111";
    const onSuccess = vi.fn();

    sessionStorage.setItem(
      "pendingEnrollCourseId",
      JSON.stringify({ courseId: COURSE_ID, expiresAt: Date.now() - 1 })
    );

    renderHook(() =>
      useOnChainEnroll({
        courseId: COURSE_ID,
        userId: "user-1",
        onRequireAuth: vi.fn(),
        onSuccess,
      })
    );

    // The stale marker is consumed but never acted on.
    await waitFor(() =>
      expect(sessionStorage.getItem("pendingEnrollCourseId")).toBeNull()
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(phantom.signTransaction).not.toHaveBeenCalled();
  });
});
