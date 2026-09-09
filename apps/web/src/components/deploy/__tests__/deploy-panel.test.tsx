// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Keypair, PublicKey } from "@solana/web3.js";
import messages from "@/messages/en.json";
import { DeployPanel } from "../deploy-panel";

const CONNECTED = "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF";
const OTHER_WALLET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
const PROGRAM_ID = "GDDMwNyyx8uB6zrqwBFHjLLG3TBYk2F8Az4yrQC5RzMp";

// Controllable mock state shared with the hoisted module mocks.
const h = vi.hoisted(() => ({
  connected: "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF" as string | null,
  linked: "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF" as string | null,
  authLoading: false,
  deployProgram: vi.fn(),
  celebrate: vi.fn(),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: h.connected ? { toBase58: () => h.connected } : null,
    signTransaction: vi.fn(),
    signAllTransactions: vi.fn(),
  }),
  useConnection: () => ({ connection: {} }),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({
    profile: h.linked ? { wallet_address: h.linked } : null,
    isLoading: h.authLoading,
    user: null,
    userId: null,
    refreshProfile: vi.fn(),
  }),
}));

vi.mock("@superteam-lms/deploy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@superteam-lms/deploy")>()),
  deployProgram: h.deployProgram,
  resumeDeployment: vi.fn(),
  // No binary is cached in this suite, so the funding gate reads nothing and
  // never runs — these tests describe the panel with funding already settled.
  getCachedBinaryLength: () => null,
  estimateDeployCost: vi.fn(),
  createAirdropRequest: vi.fn(),
}));

vi.mock("@/lib/gamification/celebration", () => ({ celebrate: h.celebrate }));

// POST status the save route returns; GET (existing-deployment check) always
// reports "not deployed" so the panel starts in its ready state.
let postStatus = 200;

function renderPanel() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DeployPanel
        buildUuid="build-uuid-123"
        lessonId="lesson-1"
        courseSlug="solana-101"
        courseId="course-solana-101"
      />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  h.connected = CONNECTED;
  h.linked = CONNECTED;
  h.authLoading = false;
  h.deployProgram.mockReset();
  h.deployProgram.mockResolvedValue({
    programId: PROGRAM_ID,
    programIdPubkey: new PublicKey(PROGRAM_ID),
    totalChunks: 0,
    durationMs: 0,
    rentLamports: 0,
  });
  h.celebrate.mockClear();
  postStatus = 200;
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      if (!init || init.method !== "POST") {
        return { ok: true, json: async () => ({ deployed: false }) };
      }
      return {
        ok: postStatus >= 200 && postStatus < 300,
        status: postStatus,
        json: async () => ({}),
      };
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DeployPanel — pre-flight wallet check", () => {
  it("warns BEFORE deploy when the connected wallet differs from the linked one", async () => {
    h.linked = OTHER_WALLET; // connected != linked
    renderPanel();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("wallet mismatch");
    // Warn, don't block — the deploy button is still enabled.
    expect(
      screen.getByRole("button", { name: "Deploy to Devnet" })
    ).toBeEnabled();
  });

  it("shows no mismatch warning when connected == linked", () => {
    renderPanel();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("DeployPanel — save outcome after a successful deploy", () => {
  it("records the deploy and shows the recorded confirmation on save success", async () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Deploy to Devnet" }));

    await screen.findByText("Deployment recorded");
    // The POST to the save route actually fired (not swallowed).
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    expect(
      fetchMock.mock.calls.some(
        ([, init]) => (init as RequestInit | undefined)?.method === "POST"
      )
    ).toBe(true);
  });

  it("surfaces a 400 verification rejection instead of swallowing it", async () => {
    postStatus = 400;
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Deploy to Devnet" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Couldn't record this deployment"
      )
    );
    // The on-chain deploy still succeeded — the program id is shown.
    expect(screen.getByText(PROGRAM_ID)).toBeInTheDocument();
  });
});

describe("DeployPanel — saved deploy state is wallet-scoped", () => {
  const BUILD_UUID = "build-uuid-123";

  function seedPausedState(wallet: string) {
    sessionStorage.setItem(
      `deploy-state-${wallet.slice(0, 8)}-${BUILD_UUID}`,
      JSON.stringify({
        buildUuid: BUILD_UUID,
        // Real keypair secrets: the panel now validates saved state before
        // offering a resume, and a malformed one is dropped.
        bufferKeypairSecret: Array.from(Keypair.generate().secretKey),
        programKeypairSecret: Array.from(Keypair.generate().secretKey),
        lastUploadedChunk: 3,
        totalChunks: 10,
        phase: "uploading",
      })
    );
  }

  it("resumes the paused deploy for the wallet that saved it", async () => {
    seedPausedState(CONNECTED);
    renderPanel();

    expect(await screen.findByText("Deployment paused")).toBeInTheDocument();
  });

  it("hides it from a different wallet on the same browser", async () => {
    // The saved buffer is owned by CONNECTED's keypair, so resuming it as
    // OTHER_WALLET would spend the wrong learner's SOL on a deploy that
    // cannot finalize — and it leaks that a deploy is in flight at all.
    seedPausedState(OTHER_WALLET);
    renderPanel();

    expect(
      await screen.findByRole("button", { name: "Deploy to Devnet" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Deployment paused")).not.toBeInTheDocument();
  });
});
