// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Keypair, PublicKey } from "@solana/web3.js";
import messages from "@/messages/en.json";
import { DeployPanel } from "../deploy-panel";

/**
 * The states the owner met in production, each with its own copy and its own
 * (single) thing to do — and none of them showing a raw failure.
 */
const WALLET = Keypair.generate().publicKey.toBase58();
const PROGRAM_ID = "GDDMwNyyx8uB6zrqwBFHjLLG3TBYk2F8Az4yrQC5RzMp";

const h = vi.hoisted(() => ({
  publicKey: null as unknown,
  deployProgram: vi.fn(),
}));

// The lab key signs. `LabKeyNote` reads the same hook.
vi.mock("@/hooks/use-lab-key", () => ({
  useLabKey: () => ({
    status: "ready",
    signer: {
      publicKey: h.publicKey,
      signTransaction: vi.fn(),
      signAllTransactions: vi.fn(),
      signMessage: async () => new Uint8Array(64),
    },
    address: (h.publicKey as PublicKey).toBase58(),
    create: vi.fn(),
    forget: vi.fn(),
  }),
}));

// The lab connection. The wallet-adapter mock below has no
// `useConnection`: a call on the app connection fails the test.
vi.mock("@/lib/solana/lab-connection", () => ({
  useLabConnection: () => ({ connection: { getBalance: async () => 0 } }),
}));

// The lab's devnet check passes here; deploy-lab-connection.test.tsx covers it.
vi.mock("@/hooks/use-lab-devnet-guard", () => {
  const guard = { status: "devnet", ensureDevnet: async () => true };
  return { useLabDevnetGuard: () => guard };
});

vi.mock("@solana/wallet-adapter-react", () => ({}));

vi.mock("@/lib/auth/auth-provider", () => ({
  // No profile: the lab reads no linked wallet.
  useAuth: () => ({ userId: "user-1", isLoading: false }),
}));

vi.mock("@superteam-lms/deploy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@superteam-lms/deploy")>()),
  deployProgram: h.deployProgram,
  resumeDeployment: vi.fn(),
  getCachedBinaryLength: () => null,
  estimateDeployCost: vi.fn(),
  createAirdropRequest: vi.fn(),
}));

vi.mock("@/lib/gamification/celebration", () => ({ celebrate: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

function renderPanel(props?: { isCompleted?: boolean }) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DeployPanel
        buildUuid="build-uuid-123"
        lessonId="lesson-1"
        courseSlug="btc-to-sol-evolution"
        courseId="course-btc-to-sol"
        xpReward={50}
        {...props}
      />
    </NextIntlClientProvider>
  );
}

async function deployAndFail(): Promise<void> {
  renderPanel();
  const button = await screen.findByRole("button", {
    name: "Deploy to Devnet",
  });
  button.click();
  await waitFor(() => expect(h.deployProgram).toHaveBeenCalled());
}

beforeEach(() => {
  h.publicKey = new PublicKey(WALLET);
  h.deployProgram.mockReset();
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

afterEach(() => vi.unstubAllGlobals());

describe("DeployPanel — the states a learner can land in", () => {
  it("offers a rebuild — not a resume — when the build is gone", async () => {
    h.deployProgram.mockRejectedValue(new Error("Build not found: 404"));
    await deployAndFail();

    expect(await screen.findByText("Build expired")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This build is no longer available"
    );
    expect(
      screen.queryByRole("button", { name: "Resume Deployment" })
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Back to the editor" }).length
    ).toBeGreaterThan(0);
  });

  it("keeps an unmapped failure's text behind the details toggle", async () => {
    h.deployProgram.mockRejectedValue(new Error("EPIPE socket hang up"));
    await deployAndFail();

    const raw = await screen.findByText("EPIPE socket hang up");
    expect(raw.closest("details")).not.toBeNull();
    expect(raw).not.toBeVisible();
  });

  it("finishes on a success card carrying the lesson's submit", async () => {
    h.deployProgram.mockResolvedValue({
      programId: PROGRAM_ID,
      programIdPubkey: new PublicKey(PROGRAM_ID),
      totalChunks: 3,
      durationMs: 12_000,
      rentLamports: 1_500_000,
    });
    const requested = vi.fn();
    window.addEventListener("superteam:request-submit", requested);

    renderPanel();
    (await screen.findByRole("button", { name: "Deploy to Devnet" })).click();

    expect(await screen.findByText(PROGRAM_ID)).toBeInTheDocument();
    const submit = await screen.findByRole("button", { name: /Submit lesson/ });
    await waitFor(() => expect(submit).not.toBeDisabled());
    submit.click();
    await waitFor(() => expect(requested).toHaveBeenCalledTimes(1));
    window.removeEventListener("superteam:request-submit", requested);
  });

  it("keeps Submit disabled and never requests a submit while the deploy record fails to save", async () => {
    h.deployProgram.mockResolvedValue({
      programId: PROGRAM_ID,
      programIdPubkey: new PublicKey(PROGRAM_ID),
      totalChunks: 3,
      durationMs: 12_000,
      rentLamports: 1_500_000,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (!init || init.method !== "POST") {
          return { ok: true, json: async () => ({ deployed: false }) };
        }
        if (String(url).includes("/api/deploy/save")) {
          return { ok: false, status: 500, json: async () => ({}) };
        }
        return { ok: true, status: 200, json: async () => ({}) };
      })
    );
    const requested = vi.fn();
    window.addEventListener("superteam:request-submit", requested);

    renderPanel();
    (await screen.findByRole("button", { name: "Deploy to Devnet" })).click();

    expect(await screen.findByText(PROGRAM_ID)).toBeInTheDocument();
    const submit = await screen.findByRole("button", {
      name: /Recording your deploy/,
    });
    expect(submit).toBeDisabled();

    submit.click();
    expect(requested).not.toHaveBeenCalled();
    window.removeEventListener("superteam:request-submit", requested);
  });
});
