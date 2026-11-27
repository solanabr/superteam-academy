// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { PublicKey } from "@solana/web3.js";
import messages from "@/messages/en.json";
import { DeployPanel } from "../deploy-panel";

const LAB_KEY = new PublicKey("B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF");
const PROGRAM_ID = "GDDMwNyyx8uB6zrqwBFHjLLG3TBYk2F8Az4yrQC5RzMp";

// Controllable mock state shared with the hoisted module mocks.
const h = vi.hoisted(() => ({
  deployProgram: vi.fn(),
  celebrate: vi.fn(),
}));

// The lab connection. The wallet-adapter mock below has no
// `useConnection`: a call on the app connection fails the test.
vi.mock("@/lib/solana/lab-connection", () => ({
  useLabConnection: () => ({ connection: {} }),
}));

// The lab's devnet check passes here; deploy-lab-connection.test.tsx covers it.
vi.mock("@/hooks/use-lab-devnet-guard", () => {
  const guard = { status: "devnet", ensureDevnet: async () => true };
  return { useLabDevnetGuard: () => guard };
});

vi.mock("@solana/wallet-adapter-react", () => ({}));

// The lab key signs. `LabKeyNote` reads the same hook.
vi.mock("@/hooks/use-lab-key", () => ({
  useLabKey: () => ({
    status: "ready",
    signer: {
      publicKey: LAB_KEY,
      signTransaction: vi.fn(),
      signAllTransactions: vi.fn(),
      signMessage: async () => new Uint8Array(64),
    },
    address: (LAB_KEY as PublicKey).toBase58(),
    create: vi.fn(),
    forget: vi.fn(),
  }),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  // No profile: the lab reads no linked wallet.
  useAuth: () => ({ userId: "user-1", isLoading: false }),
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
