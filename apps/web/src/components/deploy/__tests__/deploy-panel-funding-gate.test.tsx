// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Keypair, LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js";
import messages from "@/messages/en.json";
import { DeployPanel } from "../deploy-panel";

/**
 * The funding gate. The main panel suite switches the gate off wholesale
 * (`getCachedBinaryLength: () => null`), so this suite turns it on: the deploy
 * is offered only when the lab key holds the estimated cost.
 */
const LAB_KEY = Keypair.generate().publicKey;
const COST_LAMPORTS = 1.5 * LAMPORTS_PER_SOL;

const h = vi.hoisted(() => {
  const getBalance = vi.fn();
  return {
    getBalance,
    connection: { getBalance },
    balanceLamports: 0,
    estimateDeployCost: vi.fn(),
  };
});

// The lab connection. The wallet-adapter mock below has no
// `useConnection`: a call on the app connection fails the test.
vi.mock("@/lib/solana/lab-connection", () => ({
  useLabConnection: () => ({ connection: h.connection }),
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

vi.mock("@superteam-lms/deploy", () => ({
  deployProgram: vi.fn(),
  resumeDeployment: vi.fn(),
  // A real cached binary — this is what turns the gate on.
  getCachedBinaryLength: () => 66_704,
  estimateDeployCost: h.estimateDeployCost,
  createAirdropRequest: vi.fn(async () => ({ success: false, error: "no" })),
}));

vi.mock("@/lib/gamification/celebration", () => ({ celebrate: vi.fn() }));

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
  h.balanceLamports = 0;
  h.getBalance.mockReset();
  h.getBalance.mockImplementation(async () => h.balanceLamports);
  h.estimateDeployCost.mockReset();
  h.estimateDeployCost.mockResolvedValue({ totalLamports: COST_LAMPORTS });
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

describe("DeployPanel — funding gate", () => {
  it("blocks the deploy and offers funding when the lab key is short", async () => {
    h.balanceLamports = 0.4 * LAMPORTS_PER_SOL;
    renderPanel();

    const button = await screen.findByRole("button", {
      name: /Not enough SOL/,
    });
    expect(button).toBeDisabled();
    expect(await screen.findByText("Fund Your Wallet")).toBeInTheDocument();
  });

  it("leaves the deploy enabled when the lab key covers the estimate", async () => {
    h.balanceLamports = 2 * LAMPORTS_PER_SOL;
    renderPanel();

    const button = await screen.findByRole("button", {
      name: "Deploy to Devnet",
    });
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.queryByText("Fund Your Wallet")).not.toBeInTheDocument();
    expect(h.estimateDeployCost).toHaveBeenCalledWith(h.connection, 66_704);
  });
});
