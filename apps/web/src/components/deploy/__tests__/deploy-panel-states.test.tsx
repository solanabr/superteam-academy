// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Keypair, PublicKey } from "@solana/web3.js";
import messages from "@/messages/en.json";
import { resetDeployFlow } from "@/lib/deploy/flow-store";
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
  isSessionExpired: vi.fn(() => false),
  isRateLimited: vi.fn(() => false),
}));

vi.mock("@/hooks/use-deploy-signer", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-deploy-signer")>()),
  useDeploySigner: () => ({
    status: "ready",
    kind: "embedded",
    signer: {
      publicKey: h.publicKey,
      signTransaction: vi.fn(),
      signAllTransactions: vi.fn(),
    },
    batchSize: 15,
    startReauth: vi.fn(),
  }),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({ publicKey: null }),
  useConnection: () => ({ connection: { getBalance: async () => 0 } }),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({
    profile: { wallet_address: WALLET },
    isLoading: false,
  }),
}));

vi.mock("@superteam-lms/deploy", () => ({
  deployProgram: h.deployProgram,
  resumeDeployment: vi.fn(),
  getCachedBinaryLength: () => null,
  estimateDeployCost: vi.fn(),
  createAirdropRequest: vi.fn(),
}));

vi.mock("@/lib/gamification/celebration", () => ({ celebrate: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/dynamic/solana", () => ({
  isDynamicSessionExpiredError: h.isSessionExpired,
}));
vi.mock("@/lib/dynamic/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/dynamic/rate-limit")>()),
  isDynamicRateLimitError: h.isRateLimited,
}));

function renderPanel(props?: { isCompleted?: boolean }) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DeployPanel
        buildUuid="build-uuid-123"
        lessonId="lesson-1"
        courseSlug="btc-to-sol-evolution"
        courseId="course-btc-to-sol"
        xpReward={50}
        nextLessonHref="/en/courses/btc-to-sol-evolution/lessons/next"
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
  h.isSessionExpired.mockReset().mockReturnValue(false);
  h.isRateLimited.mockReset().mockReturnValue(false);
  resetDeployFlow();
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
  it("shows the stepper above the panel, pointing at the deploy step", async () => {
    renderPanel();
    expect(
      await screen.findByRole("navigation", { name: "Deploy progress" })
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Deploy —/ })).toHaveAttribute(
        "aria-current",
        "step"
      )
    );
  });

  it("pauses with a resume when the wallet service throttles the signer", async () => {
    h.isRateLimited.mockReturnValue(true);
    h.deployProgram.mockRejectedValue(
      new Error("WalletApiError: Rate limited")
    );
    await deployAndFail();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The wallet service is busy"
    );
    expect(screen.queryByText(/WalletApiError/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start Over" })
    ).toBeInTheDocument();
  });

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

  it("pauses for re-auth when the session dies mid-deploy", async () => {
    h.isSessionExpired.mockReturnValue(true);
    h.deployProgram.mockRejectedValue(new Error("session expired"));
    await deployAndFail();

    expect(
      await screen.findByText(/Your sign-in expired mid-deploy/)
    ).toBeInTheDocument();
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

    const submit = await screen.findByRole("button", { name: /Submit lesson/ });
    expect(screen.getByText(PROGRAM_ID)).toBeInTheDocument();
    submit.click();
    await waitFor(() => expect(requested).toHaveBeenCalled());
    window.removeEventListener("superteam:request-submit", requested);
  });
});
