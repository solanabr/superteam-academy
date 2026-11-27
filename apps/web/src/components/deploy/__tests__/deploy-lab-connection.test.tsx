// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import messages from "@/messages/en.json";
import {
  DEVNET_GENESIS_HASH,
  MAINNET_GENESIS_HASH,
} from "@/lib/solana/network";
import { DeployPanel } from "../deploy-panel";
import { GenericProgramExplorer } from "../generic-program-explorer";
import { WalletFundingCard } from "../wallet-funding-card";

/**
 * The lab (funding card, deploy panel, program explorer) talks to the lab
 * connection only. The app connection, which enrolment uses and which can be
 * on mainnet, must receive no call from it. Before the lab signs or sends
 * anything, the lab connection must answer with devnet's genesis hash.
 */
const WALLET = Keypair.generate().publicKey;
const PROGRAM_ID = "GDDMwNyyx8uB6zrqwBFHjLLG3TBYk2F8Az4yrQC5RzMp";
const COURSE_SLUG = "btc-to-sol-evolution";

const IDL = JSON.stringify({
  address: PROGRAM_ID,
  metadata: { name: "ping_program", version: "0.1.0", spec: "0.1.0" },
  instructions: [
    {
      name: "ping",
      discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
      accounts: [{ name: "signer", signer: true, writable: false }],
      args: [],
    },
  ],
  accounts: [],
  types: [],
});

const h = vi.hoisted(() => {
  const makeConnection = () => ({
    getGenesisHash: vi.fn<() => Promise<string>>(),
    getBalance: vi.fn<
      (key: import("@solana/web3.js").PublicKey) => Promise<number>
    >(async () => 0),
    getLatestBlockhash: vi.fn(async () => ({
      blockhash: "11111111111111111111111111111111",
      lastValidBlockHeight: 1,
    })),
    sendRawTransaction: vi.fn(async () => "lab-signature"),
    confirmTransaction: vi.fn(async () => ({ value: { err: null } })),
    getTransaction: vi.fn(async () => null),
    getAccountInfo: vi.fn(async () => null),
  });
  return {
    makeConnection,
    lab: makeConnection(),
    app: makeConnection(),
    signTransaction: vi.fn(),
    deployProgram: vi.fn(),
    estimateDeployCost: vi.fn(),
    createAirdropRequest: vi.fn(),
    binaryLength: null as number | null,
  };
});

vi.mock("@/lib/solana/lab-connection", () => ({
  useLabConnection: () => ({ connection: h.lab }),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: null,
    disconnect: vi.fn(),
    wallet: null,
    select: vi.fn(),
  }),
  useConnection: () => ({ connection: h.app }),
}));

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: vi.fn() }),
}));

vi.mock("@/hooks/use-deploy-signer", () => ({
  useDeploySigner: () => ({
    status: "ready",
    kind: "adapter",
    signer: {
      publicKey: WALLET,
      signTransaction: h.signTransaction,
      signAllTransactions: vi.fn(),
    },
    batchSize: undefined,
    startReauth: vi.fn(),
  }),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({
    profile: { wallet_address: WALLET.toBase58() },
    isLoading: false,
  }),
}));

vi.mock("@superteam-lms/deploy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@superteam-lms/deploy")>()),
  deployProgram: h.deployProgram,
  getCachedBinaryLength: () => h.binaryLength,
  estimateDeployCost: h.estimateDeployCost,
  createAirdropRequest: h.createAirdropRequest,
}));

vi.mock("@/lib/gamification/celebration", () => ({ celebrate: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

function withIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

const renderPanel = () =>
  withIntl(
    <DeployPanel
      buildUuid="build-uuid-123"
      lessonId="lesson-1"
      courseSlug={COURSE_SLUG}
      courseId="course-btc-to-sol"
    />
  );

const renderExplorer = () =>
  withIntl(
    <GenericProgramExplorer
      idlJson={IDL}
      courseSlug={COURSE_SLUG}
      courseId="course-btc-to-sol"
    />
  );

/** No method of the app connection was called. */
function expectAppConnectionUntouched() {
  for (const [name, method] of Object.entries(h.app)) {
    expect(method, `app connection ${name}`).not.toHaveBeenCalled();
  }
}

/** A genesis read that stays open until the test settles it. */
function pendingGenesis() {
  let resolve!: (hash: string) => void;
  let reject!: (err: Error) => void;
  h.lab.getGenesisHash.mockReturnValue(
    new Promise<string>((res, rej) => {
      resolve = res;
      reject = rej;
    })
  );
  return { resolve, reject };
}

/** Every way the lab RPC can fail the devnet check. */
const REFUSALS: [string, (g: ReturnType<typeof pendingGenesis>) => void][] = [
  [
    "answers with mainnet's genesis hash",
    (g) => g.resolve(MAINNET_GENESIS_HASH),
  ],
  ["does not answer the genesis read", (g) => g.reject(new Error("rpc down"))],
];

beforeEach(() => {
  // A new object each test: the devnet check is kept per connection.
  h.lab = h.makeConnection();
  h.app = h.makeConnection();
  h.lab.getGenesisHash.mockResolvedValue(DEVNET_GENESIS_HASH);
  h.binaryLength = null;
  h.signTransaction.mockReset();
  h.signTransaction.mockResolvedValue({ serialize: () => Buffer.from([1]) });
  h.deployProgram.mockReset();
  h.deployProgram.mockResolvedValue({
    programId: PROGRAM_ID,
    programIdPubkey: new PublicKey(PROGRAM_ID),
    totalChunks: 3,
    durationMs: 1000,
    rentLamports: 0,
  });
  h.estimateDeployCost.mockReset();
  h.estimateDeployCost.mockResolvedValue({ totalLamports: 1 });
  h.createAirdropRequest.mockReset();
  h.createAirdropRequest.mockResolvedValue({ success: true, newBalance: 2 });
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem(
    `program-${WALLET.toBase58().slice(0, 8)}-${COURSE_SLUG}`,
    PROGRAM_ID
  );
  // jsdom has no scrollIntoView; the explorer scrolls its history into view.
  Element.prototype.scrollIntoView = vi.fn();
  // The app on mainnet: the lab must not follow it.
  vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "mainnet-beta");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === "POST"
        ? { ok: true, status: 200, json: async () => ({}) }
        : { ok: true, json: async () => ({ deployed: false }) }
    )
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("WalletFundingCard on the lab connection", () => {
  it("reads the balance on the lab connection", async () => {
    h.lab.getBalance.mockResolvedValue(3 * LAMPORTS_PER_SOL);
    withIntl(<WalletFundingCard />);

    expect(await screen.findByText("3.00 SOL")).toBeInTheDocument();
    expect(h.lab.getBalance.mock.calls[0]![0].toBase58()).toBe(
      WALLET.toBase58()
    );
    expectAppConnectionUntouched();
  });

  it("says it is on devnet and that the SOL has no value", async () => {
    withIntl(<WalletFundingCard />);
    const note = await screen.findByTestId("lab-network-note");
    expect(note).toHaveTextContent("devnet");
    expect(note).toHaveTextContent("test SOL and has no value");
  });

  it.each(REFUSALS)(
    "shows the paused notice and requests no airdrop when the lab RPC %s",
    async (_name, settle) => {
      const genesis = pendingGenesis();
      withIntl(<WalletFundingCard />);

      // Clicked while the check is still open: the action waits for it.
      fireEvent.click(
        await screen.findByRole("button", { name: "Request Airdrop" })
      );
      settle(genesis);

      expect(await screen.findByRole("status")).toHaveTextContent(
        "Wallet funding is paused"
      );
      expect(
        screen.queryByRole("button", { name: "Request Airdrop" })
      ).not.toBeInTheDocument();
      expect(h.createAirdropRequest).not.toHaveBeenCalled();
      expectAppConnectionUntouched();
    }
  );
});

describe("GenericProgramExplorer on the lab connection", () => {
  it("signs, sends and confirms on the lab connection, and links to devnet", async () => {
    renderExplorer();

    fireEvent.click(await screen.findByText("Ping"));
    fireEvent.click(await screen.findByRole("button", { name: /Execute/ }));

    await waitFor(() =>
      expect(h.lab.sendRawTransaction).toHaveBeenCalledTimes(1)
    );
    await waitFor(() => expect(h.lab.confirmTransaction).toHaveBeenCalled());
    expect(h.lab.getLatestBlockhash).toHaveBeenCalled();
    expect(h.signTransaction).toHaveBeenCalledTimes(1);
    expectAppConnectionUntouched();

    const link = await screen.findByRole("link", { name: /lab-sign/ });
    expect(link).toHaveAttribute(
      "href",
      "https://explorer.solana.com/tx/lab-signature?cluster=devnet"
    );
  });

  it("says it is on devnet and that the SOL has no value", async () => {
    renderExplorer();
    const note = await screen.findByTestId("lab-network-note");
    expect(note).toHaveTextContent("devnet");
    expect(note).toHaveTextContent("test SOL and has no value");
  });

  it.each(REFUSALS)(
    "shows the paused notice, and signs and sends nothing, when the lab RPC %s",
    async (_name, settle) => {
      const genesis = pendingGenesis();
      renderExplorer();

      fireEvent.click(await screen.findByText("Ping"));
      fireEvent.click(await screen.findByRole("button", { name: /Execute/ }));
      settle(genesis);

      expect(await screen.findByRole("status")).toHaveTextContent(
        "Sending transactions from the lesson is coming back soon"
      );
      expect(
        screen.queryByRole("button", { name: /Execute/ })
      ).not.toBeInTheDocument();
      expect(h.signTransaction).not.toHaveBeenCalled();
      expect(h.lab.sendRawTransaction).not.toHaveBeenCalled();
      expectAppConnectionUntouched();
    }
  );
});

describe("DeployPanel on the lab connection", () => {
  it("deploys through the lab connection", async () => {
    renderPanel();

    fireEvent.click(
      await screen.findByRole("button", { name: "Deploy to Devnet" })
    );

    await waitFor(() => expect(h.deployProgram).toHaveBeenCalledTimes(1));
    expect(h.deployProgram.mock.calls[0]![0].connection).toBe(h.lab);
    expect(h.lab.getGenesisHash).toHaveBeenCalledTimes(1);
    expectAppConnectionUntouched();
  });

  it("estimates the cost and reads the balance on the lab connection", async () => {
    h.binaryLength = 1_000;
    renderPanel();

    await waitFor(() => expect(h.estimateDeployCost).toHaveBeenCalled());
    expect(h.estimateDeployCost.mock.calls[0]![0]).toBe(h.lab);
    expect(h.lab.getBalance).toHaveBeenCalled();
    expectAppConnectionUntouched();
  });

  it("says it is on devnet and that the SOL has no value", async () => {
    renderPanel();
    const note = await screen.findByTestId("lab-network-note");
    expect(note).toHaveTextContent("devnet");
    expect(note).toHaveTextContent("test SOL and has no value");
  });

  it.each(REFUSALS)(
    "shows the paused notice and deploys nothing when the lab RPC %s",
    async (_name, settle) => {
      const genesis = pendingGenesis();
      renderPanel();

      fireEvent.click(
        await screen.findByRole("button", { name: "Deploy to Devnet" })
      );
      settle(genesis);

      expect(await screen.findByRole("status")).toHaveTextContent(
        "Deploying from the lesson is coming back soon"
      );
      expect(
        screen.queryByRole("button", { name: "Deploy to Devnet" })
      ).not.toBeInTheDocument();
      expect(h.deployProgram).not.toHaveBeenCalled();
      expect(h.lab.sendRawTransaction).not.toHaveBeenCalled();
      expectAppConnectionUntouched();
    }
  );

  it("starts one deploy when Deploy is clicked twice while the devnet check is open", async () => {
    const genesis = pendingGenesis();
    renderPanel();

    const button = await screen.findByRole("button", {
      name: "Deploy to Devnet",
    });
    fireEvent.click(button);
    fireEvent.click(button);
    genesis.resolve(DEVNET_GENESIS_HASH);

    await waitFor(() => expect(h.deployProgram).toHaveBeenCalled());
    await screen.findByText("Your program is live on Devnet!");
    expect(h.deployProgram).toHaveBeenCalledTimes(1);
  });

  it("shows the paused notice over a finished deploy when the lab RPC is not on devnet", async () => {
    h.lab.getGenesisHash.mockResolvedValue(MAINNET_GENESIS_HASH);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ deployed: true, programId: PROGRAM_ID }),
      }))
    );
    renderPanel();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Deploying from the lesson is coming back soon"
    );
  });
});
