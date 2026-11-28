// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Keypair } from "@solana/web3.js";
import messages from "@/messages/en.json";
import { GenericProgramExplorer } from "../generic-program-explorer";

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

const h = vi.hoisted(() => ({
  signTransaction: vi.fn(),
  hasKey: true,
  walletSign: vi.fn(),
  openWalletModal: vi.fn(),
  disconnect: vi.fn(),
  select: vi.fn(),
}));

// The lab key signs. `LabKeyNote` reads the same hook.
vi.mock("@/hooks/use-lab-key", () => ({
  useLabKey: () => ({
    status: h.hasKey ? "ready" : "missing",
    signer: h.hasKey
      ? {
          publicKey: WALLET,
          signTransaction: h.signTransaction,
          signAllTransactions: vi.fn(),
          signMessage: vi.fn(),
        }
      : null,
    address: h.hasKey ? WALLET.toBase58() : null,
    create: vi.fn(),
    forget: vi.fn(),
  }),
}));

// The lab connection. The wallet-adapter mock below has no
// `useConnection`: a call on the app connection fails the test.
vi.mock("@/lib/solana/lab-connection", () => ({
  useLabConnection: () => ({
    connection: {
      getLatestBlockhash: async () => ({
        blockhash: "11111111111111111111111111111111",
        lastValidBlockHeight: 1,
      }),
      sendRawTransaction: vi.fn(),
      confirmTransaction: vi.fn(),
      getTransaction: vi.fn(),
      getAccountInfo: async () => null,
    },
  }),
}));

// The lab's devnet check passes here; deploy-lab-connection.test.tsx covers it.
vi.mock("@/hooks/use-lab-devnet-guard", () => {
  const guard = { status: "devnet", ensureDevnet: async () => true };
  return { useLabDevnetGuard: () => guard };
});

// A connected extension wallet. The explorer must not sign with it.
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: Keypair.generate().publicKey,
    signTransaction: h.walletSign,
    signAllTransactions: h.walletSign,
    sendTransaction: h.walletSign,
    disconnect: h.disconnect,
    wallet: null,
    select: h.select,
  }),
}));

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: h.openWalletModal }),
}));

function renderExplorer() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <GenericProgramExplorer
        idlJson={IDL}
        courseSlug={COURSE_SLUG}
        courseId="course-btc-to-sol"
      />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    `program-${WALLET.toBase58().slice(0, 8)}-${COURSE_SLUG}`,
    PROGRAM_ID
  );
  h.signTransaction.mockReset();
  h.walletSign.mockReset();
  h.openWalletModal.mockReset();
  h.disconnect.mockReset();
  h.select.mockReset();
  h.hasKey = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => ({ deployed: false }) }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GenericProgramExplorer — the lab key signs", () => {
  it("asks the lab key, not the connected wallet, to sign a call", async () => {
    h.signTransaction.mockRejectedValue(new Error("stop after signing"));

    renderExplorer();

    fireEvent.click(await screen.findByText("Ping"));
    fireEvent.click(await screen.findByRole("button", { name: /Execute/ }));

    expect(await screen.findByText("stop after signing")).toBeInTheDocument();
    expect(h.signTransaction).toHaveBeenCalledTimes(1);
    const tx = h.signTransaction.mock.calls[0]?.[0] as {
      feePayer?: { toBase58: () => string };
    };
    expect(tx.feePayer?.toBase58()).toBe(WALLET.toBase58());
    expect(h.walletSign).not.toHaveBeenCalled();
  });

  it("shows a failure that reads like a wallet fault as an error, and leaves the wallet alone", async () => {
    h.signTransaction.mockRejectedValue(new Error("Wallet not ready"));

    renderExplorer();

    fireEvent.click(await screen.findByText("Ping"));
    fireEvent.click(await screen.findByRole("button", { name: /Execute/ }));

    expect(await screen.findByText("Wallet not ready")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reconnect Wallet" })
    ).not.toBeInTheDocument();
    expect(h.disconnect).not.toHaveBeenCalled();
    expect(h.select).not.toHaveBeenCalled();
    expect(h.openWalletModal).not.toHaveBeenCalled();
  });

  it("offers a new lab key, not a wallet connection, when there is no key", async () => {
    h.hasKey = false;
    localStorage.setItem(`program-${COURSE_SLUG}`, PROGRAM_ID);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ deployed: true, programId: PROGRAM_ID }),
      }))
    );

    renderExplorer();

    expect(
      await screen.findByRole("button", { name: "Create a new lab key" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Connect Wallet" })
    ).not.toBeInTheDocument();
    expect(h.openWalletModal).not.toHaveBeenCalled();
  });
});
