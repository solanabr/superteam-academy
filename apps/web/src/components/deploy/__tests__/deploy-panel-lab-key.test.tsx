// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  getCachedBinary,
  setCachedBinary,
  type DeploymentCallbacks,
  type DeploymentState,
  type WalletAdapter,
} from "@superteam-lms/deploy";
import messages from "@/messages/en.json";
import { verifyLabDeployProof } from "@/lib/deploy/lab-deploy-proof";
import { createLabKeypair, readLabKeypair } from "@/lib/solana/lab-keypair";
import { DeployPanel } from "../deploy-panel";

const PROGRAM = Keypair.generate();
const PROGRAM_ID = PROGRAM.publicKey.toBase58();
const BUILD_UUID = "build-uuid-123";
/** 5 chunks at CHUNK_SIZE=900. */
const BINARY = Uint8Array.from({ length: 4500 }, (_, i) => i % 251);

interface EngineParams {
  connection: unknown;
  wallet: WalletAdapter;
  buildUuid?: string;
  state?: DeploymentState;
  callbacks: DeploymentCallbacks;
  programKeypairSecret?: number[];
}

const h = vi.hoisted(() => ({
  userId: "user-1" as string | null,
  guardStatus: "devnet" as "checking" | "devnet" | "refused",
  devnet: true,
  balanceLamports: 10_000_000_000,
  labConnection: {
    getBalance: vi.fn(),
    sendRawTransaction: vi.fn(),
    sendTransaction: vi.fn(),
  },
  wallet: {
    signTransaction: vi.fn(),
    signAllTransactions: vi.fn(),
    signMessage: vi.fn(),
    sendTransaction: vi.fn(),
  },
  deployProgram: vi.fn(),
  resumeDeployment: vi.fn(),
  closeBuffer: vi.fn(),
  estimateDeployCost: vi.fn(),
  trackEvent: vi.fn(),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  // No profile and no linked wallet: the lab needs neither.
  useAuth: () => ({
    userId: h.userId,
    isLoading: false,
    user: null,
    profile: null,
  }),
}));

vi.mock("@/lib/solana/lab-connection", () => ({
  useLabConnection: () => ({ connection: h.labConnection }),
}));

vi.mock("@/hooks/use-lab-devnet-guard", () => ({
  useLabDevnetGuard: () => ({
    status: h.guardStatus,
    ensureDevnet: async () => h.devnet,
  }),
}));

vi.mock("@/lib/solana/lab-guard", () => ({
  verifyLabDevnet: async () => h.devnet,
}));

// A connected extension wallet. The lab must never ask it for anything, and
// there is no `useConnection`: a call on the app connection fails the test.
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: new PublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"),
    ...h.wallet,
  }),
}));

vi.mock("@superteam-lms/deploy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@superteam-lms/deploy")>()),
  deployProgram: h.deployProgram,
  resumeDeployment: h.resumeDeployment,
  closeBuffer: h.closeBuffer,
  estimateDeployCost: h.estimateDeployCost,
  createAirdropRequest: vi.fn(),
}));

vi.mock("@/lib/gamification/celebration", () => ({ celebrate: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent: h.trackEvent }));

const RESULT = {
  programId: PROGRAM_ID,
  programIdPubkey: PROGRAM.publicKey,
  totalChunks: 5,
  durationMs: 1200,
  rentLamports: 5_000_000,
};

function deployState(
  overrides: Partial<DeploymentState> = {}
): DeploymentState {
  return {
    buildUuid: BUILD_UUID,
    bufferKeypairSecret: Array.from(Keypair.generate().secretKey),
    programKeypairSecret: Array.from(PROGRAM.secretKey),
    lastUploadedChunk: 1,
    totalChunks: 5,
    phase: "uploading",
    ...overrides,
  };
}

let fetchMock: ReturnType<typeof vi.fn>;
let postStatus = 200;
const consoleSpies: ReturnType<typeof vi.spyOn>[] = [];

function renderPanel(
  props: Partial<React.ComponentProps<typeof DeployPanel>> = {}
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DeployPanel
        buildUuid={BUILD_UUID}
        lessonId="lesson-1"
        courseSlug="solana-101"
        courseId="course-solana-101"
        programKeypairSecret={Array.from(PROGRAM.secretKey)}
        {...props}
      />
    </NextIntlClientProvider>
  );
}

function labKey(userId = "user-1"): Keypair {
  const key = readLabKeypair(userId);
  if (!key) throw new Error("no lab key in storage");
  return key;
}

/** Every text form a leaked secret could take. */
function secretForms(key: Keypair): string[] {
  const forms: string[] = [];
  for (const bytes of [key.secretKey, key.secretKey.slice(0, 32)]) {
    forms.push(bs58.encode(bytes));
    forms.push(Buffer.from(bytes).toString("hex"));
    forms.push(Buffer.from(bytes).toString("base64"));
    forms.push(JSON.stringify(Array.from(bytes)));
    forms.push(Array.from(bytes).join(","));
  }
  return forms;
}

function transferFrom(payer: PublicKey): Transaction {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: Keypair.generate().publicKey,
      lamports: 1,
    })
  );
  tx.feePayer = payer;
  tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
  return tx;
}

async function clickDeploy() {
  const button = await screen.findByRole("button", {
    name: "Deploy to Devnet",
  });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
}

function clearBinaryCache() {
  (
    globalThis as unknown as { __academyBinaryCache?: Map<string, Uint8Array> }
  ).__academyBinaryCache?.clear();
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  clearBinaryCache();
  setCachedBinary(BUILD_UUID, BINARY);
  h.userId = "user-1";
  h.guardStatus = "devnet";
  h.devnet = true;
  h.balanceLamports = 10_000_000_000;
  postStatus = 200;
  for (const fn of [
    ...Object.values(h.labConnection),
    ...Object.values(h.wallet),
    h.deployProgram,
    h.resumeDeployment,
    h.closeBuffer,
    h.estimateDeployCost,
    h.trackEvent,
  ]) {
    fn.mockReset();
  }
  h.labConnection.getBalance.mockImplementation(async () => h.balanceLamports);
  h.estimateDeployCost.mockResolvedValue({ totalLamports: 1_000_000 });
  h.deployProgram.mockResolvedValue(RESULT);
  h.resumeDeployment.mockResolvedValue(RESULT);
  h.closeBuffer.mockResolvedValue("close-sig");
  fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    if (!init || init.method !== "POST") {
      return { ok: true, json: async () => ({ deployed: false }) };
    }
    return {
      ok: postStatus >= 200 && postStatus < 300,
      status: postStatus,
      json: async () => ({}),
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  for (const method of ["log", "debug", "info", "warn", "error"] as const) {
    consoleSpies.push(vi.spyOn(console, method).mockImplementation(() => {}));
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const spy of consoleSpies.splice(0)) spy.mockRestore();
  // A create clears the "forgotten on this page" mark for the next test.
  for (const id of ["user-1", "user-2"]) createLabKeypair(id);
});

describe("DeployPanel — the lab key signs the deploy", () => {
  it("deploys with the lab key as the signer, through the lab connection", async () => {
    renderPanel();
    await clickDeploy();

    await waitFor(() => expect(h.deployProgram).toHaveBeenCalledTimes(1));
    const params = h.deployProgram.mock.calls[0]?.[0] as EngineParams;
    expect(params.connection).toBe(h.labConnection);
    expect(params.wallet.publicKey?.toBase58()).toBe(
      labKey().publicKey.toBase58()
    );
    expect(params.buildUuid).toBe(BUILD_UUID);
  });

  it("signs every transaction locally: a single one and a batch", async () => {
    let single: Transaction | null = null;
    let batch: Transaction[] = [];
    h.deployProgram.mockImplementation(async (params: EngineParams) => {
      const payer = params.wallet.publicKey as PublicKey;
      single = await params.wallet.signTransaction(transferFrom(payer));
      batch = await params.wallet.signAllTransactions([
        transferFrom(payer),
        transferFrom(payer),
      ]);
      return RESULT;
    });

    renderPanel();
    await clickDeploy();

    expect(await screen.findByText(PROGRAM_ID)).toBeInTheDocument();
    const signed = [single as Transaction | null, ...batch];
    expect(signed).toHaveLength(3);
    for (const tx of signed) {
      expect(tx?.feePayer?.toBase58()).toBe(labKey().publicKey.toBase58());
      expect(tx?.verifySignatures()).toBe(true);
    }
  });

  it("never prompts the learner's wallet", async () => {
    renderPanel();
    await clickDeploy();
    expect(await screen.findByText("Deployment recorded")).toBeInTheDocument();

    for (const ask of Object.values(h.wallet)) {
      expect(ask).not.toHaveBeenCalled();
    }
  });

  it("sends no funding transfer, authority transfer or sweep of its own", async () => {
    renderPanel();
    await clickDeploy();
    expect(await screen.findByText("Deployment recorded")).toBeInTheDocument();

    // The deploy engine is the only sender, and it is mocked here.
    expect(h.labConnection.sendRawTransaction).not.toHaveBeenCalled();
    expect(h.labConnection.sendTransaction).not.toHaveBeenCalled();
    expect(h.closeBuffer).not.toHaveBeenCalled();
  });

  it("saves the deploy for a learner with no linked wallet", async () => {
    renderPanel();
    await clickDeploy();
    expect(await screen.findByText("Deployment recorded")).toBeInTheDocument();
  });

  it("starts nothing while the lab key is being forgotten or missing", async () => {
    renderPanel();
    fireEvent.click(
      await screen.findByRole("button", { name: "Forget this key" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Forget key" }));

    const deploy = await screen.findByRole("button", {
      name: "Deploy to Devnet",
    });
    expect(deploy).toBeDisabled();
    expect(readLabKeypair("user-1")).toBeNull();
    fireEvent.click(deploy);
    expect(h.deployProgram).not.toHaveBeenCalled();
  });

  it("deploys with a new key after the old one was forgotten", async () => {
    renderPanel();
    fireEvent.click(
      await screen.findByRole("button", { name: "Forget this key" })
    );
    const before = labKey().publicKey.toBase58();
    fireEvent.click(screen.getByRole("button", { name: "Forget key" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Create a new lab key" })
    );

    await clickDeploy();

    await waitFor(() => expect(h.deployProgram).toHaveBeenCalledTimes(1));
    const params = h.deployProgram.mock.calls[0]?.[0] as EngineParams;
    expect(params.wallet.publicKey?.toBase58()).toBe(
      labKey().publicKey.toBase58()
    );
    expect(params.wallet.publicKey?.toBase58()).not.toBe(before);
  });

  it("signs and sends nothing when the devnet check refuses", async () => {
    h.devnet = false;
    renderPanel();
    await clickDeploy();

    await waitFor(() => expect(h.deployProgram).not.toHaveBeenCalled());
    expect(h.labConnection.sendRawTransaction).not.toHaveBeenCalled();
    expect(
      fetchMock.mock.calls.filter(
        (call) => (call[1] as RequestInit | undefined)?.method === "POST"
      )
    ).toHaveLength(0);
  });
});

describe("DeployPanel — what leaves the browser", () => {
  async function deployAndSave() {
    renderPanel();
    await clickDeploy();
    expect(await screen.findByText("Deployment recorded")).toBeInTheDocument();
    return fetchMock.mock.calls.filter(
      (call) => (call[1] as RequestInit | undefined)?.method === "POST"
    ) as [string, RequestInit][];
  }

  it("sends a proof signed by the lab key for this user, lesson and program", async () => {
    const posts = await deployAndSave();
    expect(posts).toHaveLength(1);
    const body = JSON.parse(posts[0]?.[1].body as string) as Record<
      string,
      unknown
    >;

    expect(Object.keys(body).sort()).toEqual([
      "courseId",
      "labPublicKey",
      "lessonId",
      "programId",
      "signature",
      "timestamp",
    ]);
    expect(body.labPublicKey).toBe(labKey().publicKey.toBase58());
    expect(
      verifyLabDeployProof(
        {
          userId: "user-1",
          courseId: "course-solana-101",
          lessonId: "lesson-1",
          programId: PROGRAM_ID,
        },
        body
      )
    ).toEqual({ ok: true, labPublicKey: labKey().publicKey });
  });

  it("keeps the secret key out of every request, analytics event and log line", async () => {
    await deployAndSave();
    const forms = secretForms(labKey());

    const requests = fetchMock.mock.calls.map((call) => {
      const init = call[1] as RequestInit | undefined;
      return [call[0], JSON.stringify(init?.headers ?? {}), init?.body].join(
        "\n"
      );
    });
    const events = JSON.stringify(h.trackEvent.mock.calls);
    const logs = JSON.stringify(consoleSpies.flatMap((spy) => spy.mock.calls));

    for (const text of [...requests, events, logs]) {
      for (const form of forms) expect(text).not.toContain(form);
    }
    // The page shows the address, never the secret.
    for (const form of forms) {
      expect(document.body.innerHTML).not.toContain(form);
    }
  });
});

describe("DeployPanel — a reload keeps the key and the deploy", () => {
  /** A deploy that stops after two chunks, as a closed tab would leave it. */
  async function interruptDeploy(): Promise<DeploymentState> {
    const state = deployState();
    h.deployProgram.mockImplementation(async (params: EngineParams) => {
      params.callbacks.onStateUpdate(state);
      return new Promise(() => {});
    });
    const view = renderPanel();
    await clickDeploy();
    await waitFor(() => expect(h.deployProgram).toHaveBeenCalledTimes(1));
    view.unmount();
    // A reload drops everything held in memory, the compiled program included.
    clearBinaryCache();
    return state;
  }

  it("offers the interrupted deploy again after a reload, with no build in memory", async () => {
    await interruptDeploy();
    const before = labKey().publicKey.toBase58();

    renderPanel({ buildUuid: "", programKeypairSecret: undefined });

    expect(await screen.findByText("Deployment paused")).toBeInTheDocument();
    expect(labKey().publicKey.toBase58()).toBe(before);
  });

  it("resumes from the saved chunk with the same lab key and the same program", async () => {
    const state = await interruptDeploy();
    const address = labKey().publicKey.toBase58();

    renderPanel({ buildUuid: "", programKeypairSecret: undefined });
    fireEvent.click(
      await screen.findByRole("button", { name: "Resume Deployment" })
    );

    await waitFor(() => expect(h.resumeDeployment).toHaveBeenCalledTimes(1));
    const params = h.resumeDeployment.mock.calls[0]?.[0] as EngineParams;
    expect(params.wallet.publicKey?.toBase58()).toBe(address);
    expect(params.connection).toBe(h.labConnection);
    expect(params.state).toEqual(state);
    // The program came back from storage for the engine to read.
    expect(Array.from(getCachedBinary(BUILD_UUID) ?? [])).toEqual(
      Array.from(BINARY)
    );
    expect(h.deployProgram).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Deployment recorded")).toBeInTheDocument();
    for (const ask of Object.values(h.wallet)) {
      expect(ask).not.toHaveBeenCalled();
    }
  });

  it("does not offer a resume when the program's bytes did not survive", async () => {
    await interruptDeploy();
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i) ?? "";
      if (key.startsWith("deploy-binary-")) sessionStorage.removeItem(key);
    }

    renderPanel({ buildUuid: "", programKeypairSecret: undefined });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByText("Deployment paused")).not.toBeInTheDocument();
  });

  it("takes back the abandoned buffer's rent with the lab key on the next deploy", async () => {
    const state = await interruptDeploy();
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i) ?? "";
      if (key.startsWith("deploy-binary-")) sessionStorage.removeItem(key);
    }
    h.deployProgram.mockReset();
    h.deployProgram.mockResolvedValue(RESULT);
    // The learner builds again, then deploys.
    setCachedBinary("build-2", BINARY);

    renderPanel({ buildUuid: "build-2" });
    await clickDeploy();

    await waitFor(() => expect(h.deployProgram).toHaveBeenCalledTimes(1));
    expect(h.closeBuffer).toHaveBeenCalledTimes(1);
    const close = h.closeBuffer.mock.calls[0]?.[0] as {
      connection: unknown;
      wallet: WalletAdapter;
      bufferKeypairSecret: number[];
    };
    expect(close.connection).toBe(h.labConnection);
    expect(close.wallet.publicKey?.toBase58()).toBe(
      labKey().publicKey.toBase58()
    );
    expect(close.bufferKeypairSecret).toEqual(state.bufferKeypairSecret);
  });

  it("closes the buffer with the lab key on start over", async () => {
    const state = await interruptDeploy();
    renderPanel({ buildUuid: "", programKeypairSecret: undefined });

    fireEvent.click(await screen.findByRole("button", { name: "Start Over" }));

    await waitFor(() => expect(h.closeBuffer).toHaveBeenCalledTimes(1));
    const close = h.closeBuffer.mock.calls[0]?.[0] as {
      wallet: WalletAdapter;
      bufferKeypairSecret: number[];
    };
    expect(close.wallet.publicKey?.toBase58()).toBe(
      labKey().publicKey.toBase58()
    );
    expect(close.bufferKeypairSecret).toEqual(state.bufferKeypairSecret);
    expect(sessionStorage.length).toBe(0);
  });

  it("does not close a buffer on start over when the devnet check refuses", async () => {
    await interruptDeploy();
    h.devnet = false;
    renderPanel({ buildUuid: "", programKeypairSecret: undefined });

    fireEvent.click(await screen.findByRole("button", { name: "Start Over" }));

    await waitFor(() => expect(sessionStorage.length).toBe(0));
    expect(h.closeBuffer).not.toHaveBeenCalled();
  });

  it("does not resume a saved deploy whose program is not this build's", async () => {
    const state = deployState({
      programKeypairSecret: Array.from(Keypair.generate().secretKey),
    });
    createLabKeypair("user-1");
    sessionStorage.setItem(
      `deploy-state-${labKey().publicKey.toBase58().slice(0, 8)}-course-solana-101-lesson-1`,
      JSON.stringify(state)
    );

    renderPanel();

    expect(
      await screen.findByRole("button", { name: "Deploy to Devnet" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Deployment paused")).not.toBeInTheDocument();
  });

  it("hides one account's paused deploy and key from the next account", async () => {
    await interruptDeploy();
    const first = labKey("user-1").publicKey.toBase58();

    h.userId = "user-2";
    setCachedBinary(BUILD_UUID, BINARY);
    renderPanel();

    expect(
      await screen.findByRole("button", { name: "Deploy to Devnet" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Deployment paused")).not.toBeInTheDocument();
    await waitFor(() => expect(readLabKeypair("user-2")).not.toBeNull());
    expect(labKey("user-2").publicKey.toBase58()).not.toBe(first);
  });
});
