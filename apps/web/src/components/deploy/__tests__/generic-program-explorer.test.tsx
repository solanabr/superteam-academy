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
  startReauth: vi.fn(),
  kind: "embedded" as "embedded" | "adapter",
}));

vi.mock("@/hooks/use-deploy-signer", () => ({
  useDeploySigner: () => ({
    status: "ready",
    kind: h.kind,
    signer: {
      publicKey: WALLET,
      signTransaction: h.signTransaction,
      signAllTransactions: vi.fn(),
    },
    batchSize: h.kind === "embedded" ? 15 : undefined,
    startReauth: h.startReauth,
  }),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: null,
    disconnect: vi.fn(),
    wallet: null,
    select: vi.fn(),
  }),
  useConnection: () => ({
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

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: () => ({ setVisible: vi.fn() }),
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
  h.startReauth.mockReset();
  h.kind = "embedded";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => ({ deployed: false }) }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GenericProgramExplorer — expired Dynamic session", () => {
  it("routes a mid-execute expiry to the re-auth card, not a raw error", async () => {
    const expired = new Error("session expired");
    expired.name = "UnauthorizedError";
    h.signTransaction.mockRejectedValue(expired);

    renderExplorer();

    fireEvent.click(await screen.findByText("Ping"));
    fireEvent.click(await screen.findByRole("button", { name: /Execute/ }));

    // The reauth card takes over the whole widget: an embedded learner has no
    // extension to reconnect, so "Reconnect Wallet" would be a dead end.
    expect(
      await screen.findByRole("button", { name: /Google/i })
    ).toBeInTheDocument();
    expect(screen.queryByText("session expired")).not.toBeInTheDocument();
  });

  it("leaves an adapter's unauthorized_error to the adapter path", async () => {
    // Nothing in the extension wallets throws this today, but the re-auth card
    // is a social sign-in an extension user cannot complete, so the branch is
    // gated on the signer kind rather than on the error alone.
    h.kind = "adapter";
    const unauthorized = Object.assign(new Error("wallet locked"), {
      code: "unauthorized_error",
    });
    h.signTransaction.mockRejectedValue(unauthorized);

    renderExplorer();

    fireEvent.click(await screen.findByText("Ping"));
    fireEvent.click(await screen.findByRole("button", { name: /Execute/ }));

    expect(await screen.findByText("wallet locked")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Google/i })
    ).not.toBeInTheDocument();
  });
});
