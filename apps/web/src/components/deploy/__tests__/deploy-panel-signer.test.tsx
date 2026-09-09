// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  act,
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemInstruction,
} from "@solana/web3.js";
import { EMBEDDED_BATCH_SIZE } from "@/hooks/use-deploy-signer";
import messages from "@/messages/en.json";
import { encryptSessionKey } from "@/lib/deploy/session-key-storage";
import { DeployPanel } from "../deploy-panel";

/**
 * The embedded-wallet deploy path: a learner with no wallet-adapter key and no
 * SOL. The suite next to this one covers the adapter path, which must not
 * change.
 */
const EMBEDDED = Keypair.generate().publicKey.toBase58();
const PROGRAM_ID = "GDDMwNyyx8uB6zrqwBFHjLLG3TBYk2F8Az4yrQC5RzMp";

const h = vi.hoisted(() => ({
  status: "ready" as "resolving" | "none" | "expired" | "ready",
  kind: "embedded" as "adapter" | "embedded" | null,
  publicKey: null as unknown,
  batchSize: undefined as number | undefined,
  startReauth: vi.fn(),
  signTransaction: vi.fn(),
  signAllTransactions: vi.fn(),
  deployProgram: vi.fn(),
  runSessionKeyDeploy: vi.fn(),
  startOverSessionKey: vi.fn(),
  sweepSessionKey: vi.fn(),
  binaryLength: null as number | null,
  estimateDeployCost: vi.fn(),
  balanceLamports: 0,
  trackEvent: vi.fn(),
  isSessionExpired: vi.fn(() => false),
}));

vi.mock("@/hooks/use-deploy-signer", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-deploy-signer")>()),
  useDeploySigner: () => ({
    status: h.status,
    kind: h.status === "ready" ? h.kind : null,
    signer:
      h.status === "ready"
        ? {
            publicKey: h.publicKey,
            signTransaction: h.signTransaction,
            signAllTransactions: h.signAllTransactions,
          }
        : null,
    batchSize: h.status === "ready" ? h.batchSize : undefined,
    startReauth: h.startReauth,
  }),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({ publicKey: null }),
  useConnection: () => ({
    connection: {
      getBalance: async () => h.balanceLamports,
      getLatestBlockhash: async () => ({
        blockhash: "11111111111111111111111111111111",
        lastValidBlockHeight: 1,
      }),
      sendRawTransaction: async () => "fund-sig",
    },
  }),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({
    profile: { wallet_address: EMBEDDED, wallet_kind: "embedded" },
    isLoading: false,
  }),
}));

vi.mock("@superteam-lms/deploy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@superteam-lms/deploy")>()),
  deployProgram: h.deployProgram,
  resumeDeployment: vi.fn(),
  runSessionKeyDeploy: h.runSessionKeyDeploy,
  startOverSessionKey: h.startOverSessionKey,
  sweepSessionKey: h.sweepSessionKey,
  getCachedBinaryLength: () => h.binaryLength,
  estimateDeployCost: h.estimateDeployCost,
  estimateSessionKeyDeployCost: h.estimateDeployCost,
  createAirdropRequest: vi.fn(async () => ({ success: false, error: "no" })),
}));

vi.mock("@/lib/gamification/celebration", () => ({ celebrate: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent: h.trackEvent }));
vi.mock("@/lib/dynamic/solana", () => ({
  isDynamicSessionExpiredError: h.isSessionExpired,
}));

function renderPanel() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DeployPanel
        buildUuid="build-uuid-123"
        lessonId="lesson-1"
        courseSlug="btc-to-sol-evolution"
        courseId="course-btc-to-sol"
      />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  h.status = "ready";
  h.kind = "embedded";
  h.publicKey = new PublicKey(EMBEDDED);
  h.batchSize = EMBEDDED_BATCH_SIZE;
  h.binaryLength = null;
  h.balanceLamports = 0;
  h.startReauth.mockReset();
  h.deployProgram.mockReset();
  h.deployProgram.mockResolvedValue({
    programId: PROGRAM_ID,
    programIdPubkey: new PublicKey(PROGRAM_ID),
    totalChunks: 3,
    durationMs: 1000,
    rentLamports: 0,
  });
  h.signTransaction.mockReset();
  h.sweepSessionKey.mockReset();
  h.sweepSessionKey.mockResolvedValue({
    signature: "sweep-sig",
    lamports: 500,
  });
  h.startOverSessionKey.mockReset();
  h.startOverSessionKey.mockResolvedValue({
    closeSignature: "close-sig",
    refund: { signature: "refund-sig", lamports: 500 },
  });
  h.runSessionKeyDeploy.mockReset();
  h.runSessionKeyDeploy.mockResolvedValue({
    programId: PROGRAM_ID,
    programIdPubkey: new PublicKey(PROGRAM_ID),
    totalChunks: 3,
    durationMs: 1000,
    rentLamports: 0,
    sessionKeySecret: Array.from(Keypair.generate().secretKey),
    fundedLamports: 1_300_000_000,
    authoritySignature: "authority-sig",
    refundLamports: 1_000,
    refundError: null,
  });
  h.estimateDeployCost.mockReset();
  h.trackEvent.mockReset();
  h.isSessionExpired.mockReset();
  h.isSessionExpired.mockReturnValue(false);
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      if (!init || init.method !== "POST") {
        return { ok: true, json: async () => ({ deployed: false }) };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DeployPanel — signer resolution", () => {
  it("disables the button while the wallet is still resolving, without asking to connect", async () => {
    h.status = "resolving";
    renderPanel();

    const button = await screen.findByRole("button", {
      name: "Checking your wallet…",
    });
    expect(button).toBeDisabled();
  });

  it("offers Dynamic re-auth — not the connect modal — for an expired session", async () => {
    h.status = "expired";
    renderPanel();

    expect(
      await screen.findByRole("button", { name: /google/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Deploy to Devnet" })
    ).not.toBeInTheDocument();
  });

  it("routes the embedded wallet through the session key, with one wallet signature", async () => {
    renderPanel();

    fireEvent.click(
      await screen.findByRole("button", { name: "Deploy to Devnet" })
    );

    await waitFor(() => expect(h.runSessionKeyDeploy).toHaveBeenCalledTimes(1));
    // The MPC-signed upload batches are gone: nothing goes through
    // deployProgram, and the wallet's only job is the funding transfer.
    expect(h.deployProgram).not.toHaveBeenCalled();
    const call = h.runSessionKeyDeploy.mock.calls[0]![0];
    expect(call.learner.toBase58()).toBe(EMBEDDED);
    expect(call.buildUuid).toBe("build-uuid-123");
    expect(typeof call.fund).toBe("function");
    expect(h.trackEvent).toHaveBeenCalledWith("deploy_started", {
      signerKind: "embedded",
      batchSize: null,
      resumed: false,
    });
  });

  it("funds from the learner with exactly one wallet signature", async () => {
    h.signTransaction.mockResolvedValue({
      serialize: () => new Uint8Array([1, 2, 3]),
    });
    renderPanel();

    fireEvent.click(
      await screen.findByRole("button", { name: "Deploy to Devnet" })
    );
    await waitFor(() => expect(h.runSessionKeyDeploy).toHaveBeenCalledTimes(1));

    const { fund } = h.runSessionKeyDeploy.mock.calls[0]![0];
    const destination = Keypair.generate().publicKey;
    const signature = await fund(1_234_567, destination);

    expect(signature).toBe("fund-sig");
    // One MPC signature for the whole deploy — that is the entire point of the
    // session key — and it pays from the learner into the session key.
    expect(h.signTransaction).toHaveBeenCalledTimes(1);
    const tx = h.signTransaction.mock.calls[0]![0];
    expect(tx.feePayer.toBase58()).toBe(EMBEDDED);
    const transfer = SystemInstruction.decodeTransfer(tx.instructions[0]);
    expect(transfer.fromPubkey.toBase58()).toBe(EMBEDDED);
    expect(transfer.toPubkey.equals(destination)).toBe(true);
    expect(Number(transfer.lamports)).toBe(1_234_567);
  });

  const BUILD = "build-uuid-123";

  it("persists the funding signature before the transfer is broadcast", async () => {
    const sent: string[] = [];
    h.signTransaction.mockImplementation(async () => ({
      signature: Buffer.alloc(64, 7),
      serialize: () => {
        sent.push("broadcast");
        return new Uint8Array([1, 2, 3]);
      },
    }));
    renderPanel();

    fireEvent.click(
      await screen.findByRole("button", { name: "Deploy to Devnet" })
    );
    await waitFor(() => expect(h.runSessionKeyDeploy).toHaveBeenCalledTimes(1));

    const { fund } = h.runSessionKeyDeploy.mock.calls[0]![0];
    const reported: string[] = [];
    await fund(1_000, Keypair.generate().publicKey, (sig: string) =>
      reported.push(sig)
    );

    expect(reported).toHaveLength(1);
    expect(sent).toEqual(["broadcast"]);
  });

  it("a retry after a funded attempt reuses that key instead of funding a new one", async () => {
    // The first attempt funds a key, then throws — a dropped confirmation.
    const secret = Array.from(Keypair.generate().secretKey);
    const sessionPubkey = Keypair.generate().publicKey;
    h.runSessionKeyDeploy.mockImplementation(
      async (params: {
        events: {
          onSessionKey: (s: number[], k: PublicKey) => Promise<void> | void;
          onFundingBroadcast: (info: { signature: string }) => void;
        };
      }) => {
        await params.events.onSessionKey(secret, sessionPubkey);
        params.events.onFundingBroadcast({ signature: "first-fund-sig" });
        throw new Error(
          "Timed out waiting for the funding transfer to confirm."
        );
      }
    );
    renderPanel();

    fireEvent.click(
      await screen.findByRole("button", { name: "Deploy to Devnet" })
    );
    await waitFor(() => expect(h.runSessionKeyDeploy).toHaveBeenCalledTimes(1));

    // Nothing resumable was saved — the buffer never existed — so the learner
    // comes back to a panel offering a plain Deploy. That must not walk away
    // from the key their SOL is already sitting in.
    await screen.findByRole("button", { name: "Start Over" });
    cleanup();
    h.runSessionKeyDeploy.mockReset();
    h.runSessionKeyDeploy.mockResolvedValue({
      programId: PROGRAM_ID,
      programIdPubkey: new PublicKey(PROGRAM_ID),
      totalChunks: 3,
      durationMs: 1000,
      rentLamports: 0,
      sessionKeySecret: secret,
      fundedLamports: 0,
      authoritySignature: "authority-sig",
      refundLamports: 0,
      refundError: null,
    });
    renderPanel();
    // The panel keeps the key and drops the (absent) offset — that rewrite is
    // how we know the restore has run. That string is also true of the FIRST
    // mount's own (identical-shaped) write, so it alone can't prove THIS
    // mount's restore effect — whose decrypt is genuinely async — has
    // finished; flush pending microtasks a few times before moving on so a
    // slow `crypto.subtle.decrypt` under load can't race the click below.
    await waitFor(() =>
      expect(
        sessionStorage.getItem(`deploy-state-${EMBEDDED.slice(0, 8)}-${BUILD}`)
      ).toContain('"deployment":null')
    );
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }
    fireEvent.click(
      await screen.findByRole("button", { name: "Deploy to Devnet" })
    );

    await waitFor(() => expect(h.runSessionKeyDeploy).toHaveBeenCalledTimes(1));
    const retry = h.runSessionKeyDeploy.mock.calls[0]![0];
    expect(retry.persistedSessionKey).toEqual(secret);
    expect(retry.pendingFundingSignature).toBe("first-fund-sig");
  });

  it("takes the mismatch check from the signer's key, not the adapter's", async () => {
    h.publicKey = Keypair.generate().publicKey; // != the linked wallet
    renderPanel();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("wallet mismatch");
  });

  it("a session that expires mid-deploy pauses for re-auth instead of erroring", async () => {
    h.runSessionKeyDeploy.mockRejectedValue(new Error("session gone"));
    h.isSessionExpired.mockReturnValue(true);
    renderPanel();

    fireEvent.click(
      await screen.findByRole("button", { name: "Deploy to Devnet" })
    );

    expect(
      await screen.findByRole("button", { name: /google/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Deployment paused")).toBeInTheDocument();
    expect(h.trackEvent).toHaveBeenCalledWith("deploy_session_expired", {
      signerKind: "embedded",
      phase: "deploy",
    });
  });
});

describe("DeployPanel — funding gate", () => {
  beforeEach(() => {
    h.binaryLength = 4_500;
    h.estimateDeployCost.mockResolvedValue({
      bufferRent: 0,
      programRent: 0,
      programDataRent: 0,
      feeLamports: 0,
      totalLamports: 2 * LAMPORTS_PER_SOL,
    });
  });

  it("blocks the deploy and shows the funding card when the balance is short", async () => {
    renderPanel();

    const button = await screen.findByRole("button", {
      name: /Not enough SOL/,
    });
    expect(button).toBeDisabled();
    expect(screen.getByText("Fund Your Wallet")).toBeInTheDocument();
    expect(h.trackEvent).toHaveBeenCalledWith(
      "deploy_funding_required",
      expect.objectContaining({ signerKind: "embedded" })
    );
  });

  it("enables the deploy once the balance covers the estimate", async () => {
    h.balanceLamports = 3 * LAMPORTS_PER_SOL;
    renderPanel();

    const button = await screen.findByRole("button", {
      name: "Deploy to Devnet",
    });
    expect(button).toBeEnabled();
    expect(screen.queryByText("Fund Your Wallet")).not.toBeInTheDocument();
  });
});

describe("DeployPanel — session-key resume and start over", () => {
  const BUILD = "build-uuid-123";
  const SESSION_SECRET = Array.from(Keypair.generate().secretKey);
  const deployment = {
    buildUuid: BUILD,
    bufferKeypairSecret: Array.from(Keypair.generate().secretKey),
    programKeypairSecret: Array.from(Keypair.generate().secretKey),
    lastUploadedChunk: 12,
    totalChunks: 74,
    phase: "uploading" as const,
  };

  async function seedPausedSession() {
    const session = await encryptSessionKey(SESSION_SECRET, BUILD);
    sessionStorage.setItem(
      `deploy-state-${EMBEDDED.slice(0, 8)}-${BUILD}`,
      JSON.stringify({
        deployment,
        session,
        sessionAddress: "SessionKeyAddress",
      })
    );
  }

  it("resumes from the saved offset with the same session key — no second transfer", async () => {
    await seedPausedSession();
    renderPanel();

    fireEvent.click(
      await screen.findByRole("button", { name: "Resume Deployment" })
    );

    await waitFor(() => expect(h.runSessionKeyDeploy).toHaveBeenCalledTimes(1));
    const call = h.runSessionKeyDeploy.mock.calls[0]![0];
    expect(call.persistedSessionKey).toEqual(SESSION_SECRET);
    expect(call.resumeState).toMatchObject({
      lastUploadedChunk: 12,
      totalChunks: 74,
    });
  });

  it("start over closes the buffer and sweeps the session key back first", async () => {
    await seedPausedSession();
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Start Over" }));

    await waitFor(() => expect(h.startOverSessionKey).toHaveBeenCalledTimes(1));
    const call = h.startOverSessionKey.mock.calls[0]![0];
    expect(call.sessionKeySecret).toEqual(SESSION_SECRET);
    expect(call.bufferKeypairSecret).toEqual(deployment.bufferKeypairSecret);
    expect(call.destination.toBase58()).toBe(EMBEDDED);
    expect(sessionStorage.length).toBe(0);
  });

  it("keeps the stranded key's address after a reload, and offers to copy it", async () => {
    // A reload: the record survives in sessionStorage, but the wrapping nonce
    // died with the page, so the ciphertext no longer decrypts.
    sessionStorage.setItem(
      `deploy-state-${EMBEDDED.slice(0, 8)}-${BUILD}`,
      JSON.stringify({
        deployment,
        session: "dGhpcyBpcyBub3QgZGVjcnlwdGFibGUgYW55IG1vcmU=",
        sessionAddress: "StrandedSessionKeyAddress",
        fundingSignature: "fund-sig",
      })
    );
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    renderPanel();

    // The address is shown, not forgotten — it is the only record of where the
    // learner's SOL went.
    const notice = await screen.findByRole("alert");
    expect(notice).toHaveTextContent("StrandedSessionKeyAddress");
    fireEvent.click(screen.getByRole("button", { name: "Copy address" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("StrandedSessionKeyAddress")
    );

    // And it survives the next reload too.
    const stored = JSON.parse(
      sessionStorage.getItem(`deploy-state-${EMBEDDED.slice(0, 8)}-${BUILD}`)!
    );
    expect(stored).toMatchObject({
      deployment: null,
      session: null,
      sessionAddress: "StrandedSessionKeyAddress",
    });
  });

  it("warns before the transfer that a reload strands the funds", async () => {
    renderPanel();
    await screen.findByRole("button", { name: "Deploy to Devnet" });
    expect(
      screen.getByText(/reloading the page during the upload/i)
    ).toBeInTheDocument();
  });

  it("retries the sweep when start over could not return the SOL", async () => {
    await seedPausedSession();
    h.startOverSessionKey.mockRejectedValueOnce(new Error("rpc down"));
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Start Over" }));

    const retry = await screen.findByRole("button", { name: "Retry refund" });
    expect(screen.getByText(/SessionKeyAddress/)).toBeInTheDocument();

    fireEvent.click(retry);

    // The retry runs the same close-and-sweep, with the key start over was
    // about to throw away — not a no-op on a cleared session.
    await waitFor(() => expect(h.startOverSessionKey).toHaveBeenCalledTimes(2));
    const call = h.startOverSessionKey.mock.calls[1]![0];
    expect(call.sessionKeySecret).toEqual(SESSION_SECRET);
    expect(call.bufferKeypairSecret).toEqual(deployment.bufferKeypairSecret);
    expect(call.destination.toBase58()).toBe(EMBEDDED);
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Retry refund" })
      ).not.toBeInTheDocument()
    );
  });

  it("drops a saved state whose program keypair is not this build's", async () => {
    await seedPausedSession();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DeployPanel
          buildUuid={BUILD}
          lessonId="lesson-1"
          courseSlug="btc-to-sol-evolution"
          courseId="course-btc-to-sol"
          programKeypairSecret={Array.from(Keypair.generate().secretKey)}
        />
      </NextIntlClientProvider>
    );

    // No resume is offered, and the crafted record is gone rather than reused.
    expect(
      await screen.findByRole("button", { name: "Deploy to Devnet" })
    ).toBeInTheDocument();
    expect(sessionStorage.length).toBe(0);
  });
});
