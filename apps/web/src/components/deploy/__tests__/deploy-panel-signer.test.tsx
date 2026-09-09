// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { EMBEDDED_BATCH_SIZE } from "@/hooks/use-deploy-signer";
import messages from "@/messages/en.json";
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
    connection: { getBalance: async () => h.balanceLamports },
  }),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({
    profile: { wallet_address: EMBEDDED, wallet_kind: "embedded" },
    isLoading: false,
  }),
}));

vi.mock("@superteam-lms/deploy", () => ({
  deployProgram: h.deployProgram,
  resumeDeployment: vi.fn(),
  getCachedBinaryLength: () => h.binaryLength,
  estimateDeployCost: h.estimateDeployCost,
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
  h.estimateDeployCost.mockReset();
  h.trackEvent.mockReset();
  h.isSessionExpired.mockReset();
  h.isSessionExpired.mockReturnValue(false);
  localStorage.clear();
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

  it("deploys with the embedded signer and its batch size", async () => {
    renderPanel();

    fireEvent.click(
      await screen.findByRole("button", { name: "Deploy to Devnet" })
    );

    await waitFor(() => expect(h.deployProgram).toHaveBeenCalledTimes(1));
    const call = h.deployProgram.mock.calls[0]![0];
    expect(call.batchSize).toBe(EMBEDDED_BATCH_SIZE);
    expect(call.wallet.publicKey.toBase58()).toBe(EMBEDDED);
    expect(h.trackEvent).toHaveBeenCalledWith("deploy_started", {
      signerKind: "embedded",
      batchSize: EMBEDDED_BATCH_SIZE,
    });
  });

  it("takes the mismatch check from the signer's key, not the adapter's", async () => {
    h.publicKey = Keypair.generate().publicKey; // != the linked wallet
    renderPanel();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("wallet mismatch");
  });

  it("a session that expires mid-deploy pauses for re-auth instead of erroring", async () => {
    h.deployProgram.mockRejectedValue(new Error("session gone"));
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
