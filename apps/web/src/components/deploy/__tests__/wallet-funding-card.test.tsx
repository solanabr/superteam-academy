// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Keypair, LAMPORTS_PER_SOL, type PublicKey } from "@solana/web3.js";
import messages from "@/messages/en.json";
import { WalletFundingCard } from "../wallet-funding-card";

const LAB_KEY = Keypair.generate().publicKey;

const h = vi.hoisted(() => ({
  publicKey: null as unknown,
  balanceLamports: 0,
  createAirdropRequest: vi.fn(),
  create: vi.fn(),
}));

// The lab key. `LabKeyNote` inside the card reads the same hook.
vi.mock("@/hooks/use-lab-key", () => ({
  useLabKey: () => ({
    status: h.publicKey ? "ready" : "missing",
    signer: h.publicKey
      ? {
          publicKey: h.publicKey,
          signTransaction: vi.fn(),
          signAllTransactions: vi.fn(),
          signMessage: vi.fn(),
        }
      : null,
    address: h.publicKey ? (h.publicKey as PublicKey).toBase58() : null,
    create: h.create,
    forget: vi.fn(),
  }),
}));

// The lab connection. The wallet-adapter mock below has no
// `useConnection`: a call on the app connection fails the test.
vi.mock("@/lib/solana/lab-connection", () => ({
  useLabConnection: () => ({
    connection: { getBalance: async () => h.balanceLamports },
  }),
}));

// The lab's devnet check passes here; deploy-lab-connection.test.tsx covers it.
vi.mock("@/hooks/use-lab-devnet-guard", () => {
  const guard = { status: "devnet", ensureDevnet: async () => true };
  return { useLabDevnetGuard: () => guard };
});

vi.mock("@solana/wallet-adapter-react", () => ({}));

vi.mock("@superteam-lms/deploy", () => ({
  createAirdropRequest: h.createAirdropRequest,
  MAX_RETRY_AFTER_SECONDS: 600,
}));

function renderCard(props?: {
  requiredLamports?: number;
  onBalance?: (lamports: number) => void;
}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <WalletFundingCard {...props} />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  h.publicKey = LAB_KEY;
  h.balanceLamports = 0;
  h.createAirdropRequest.mockReset();
  h.createAirdropRequest.mockResolvedValue({ success: true, newBalance: 2 });
});

describe("WalletFundingCard", () => {
  it("shows the lab key's full address, with no wallet connected", async () => {
    renderCard();
    expect(await screen.findByText("Fund Your Wallet")).toBeInTheDocument();
    expect(screen.getByTestId("lab-key-address").textContent).toBe(
      LAB_KEY.toBase58()
    );
    expect(
      screen.getByText(
        "This is a throwaway devnet key. It holds nothing of value and is never used on mainnet."
      )
    ).toBeInTheDocument();
  });

  it("shows the lab key's devnet balance", async () => {
    h.balanceLamports = 1.25 * LAMPORTS_PER_SOL;
    renderCard();
    expect(await screen.findByText("1.25 SOL")).toBeInTheDocument();
  });

  it("copies the full address", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderCard();
    fireEvent.click(
      await screen.findByRole("button", { name: "Copy address" })
    );
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(LAB_KEY.toBase58())
    );
  });

  it("offers a new key, and no funding, when the key was forgotten", async () => {
    h.publicKey = null;
    renderCard();
    fireEvent.click(
      await screen.findByRole("button", { name: "Create a new lab key" })
    );
    expect(h.create).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Request Airdrop" })
    ).not.toBeInTheDocument();
  });

  it("airdrops to the signer's own address", async () => {
    renderCard();
    fireEvent.click(
      await screen.findByRole("button", { name: "Request Airdrop" })
    );

    await waitFor(() =>
      expect(h.createAirdropRequest).toHaveBeenCalledTimes(1)
    );
    // By address, not by object identity: the card re-derives the key from the
    // signer's address so its `refreshBalance` effect cannot self-sustain.
    // The app connection is NOT passed — the airdrop goes to the public devnet
    // RPC, whose faucet limit is per address rather than per project.
    expect(h.createAirdropRequest.mock.calls[0]![0].toBase58()).toBe(
      LAB_KEY.toBase58()
    );
  });

  it("measures against the deploy estimate when one is given", async () => {
    h.balanceLamports = 0.5 * LAMPORTS_PER_SOL;
    renderCard({ requiredLamports: 1.5 * LAMPORTS_PER_SOL });

    // 1.5 needed, 0.5 held — the shortfall is the estimate's, not a flat 5 SOL.
    expect(await screen.findByText("1.50 SOL")).toBeInTheDocument();
    expect(screen.getByText("0.50 SOL")).toBeInTheDocument();
    expect(screen.getByText("1.00 SOL")).toBeInTheDocument();
    expect(screen.queryByText("Ready for deployment!")).not.toBeInTheDocument();
  });

  it("reports each balance read so the panel's gate can re-evaluate", async () => {
    const onBalance = vi.fn();
    h.balanceLamports = 3 * LAMPORTS_PER_SOL;
    renderCard({ onBalance });

    await waitFor(() =>
      expect(onBalance).toHaveBeenCalledWith(3 * LAMPORTS_PER_SOL)
    );
  });

  it("explains a rate-limited faucet without printing its response", async () => {
    h.createAirdropRequest.mockResolvedValue({
      success: false,
      rateLimited: true,
      retryAfterSeconds: 30,
      error: 'Airdrop failed after 3 attempts: 403 : {"jsonrpc":"2.0"}',
    });
    renderCard();

    fireEvent.click(
      await screen.findByRole("button", { name: "Request Airdrop" })
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "The devnet faucet is busy. Try again in about 30s"
    );
    expect(screen.queryByText(/jsonrpc/)).not.toBeInTheDocument();
  });

  it("copies the address and opens the faucet on the secondary route", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const open = vi.fn();
    vi.stubGlobal("open", open);

    renderCard();
    fireEvent.click(await screen.findByRole("button", { name: "Open faucet" }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(LAB_KEY.toBase58())
    );
    expect(open).toHaveBeenCalledWith(
      "https://faucet.solana.com",
      "_blank",
      "noopener,noreferrer"
    );
    expect(
      await screen.findByText("Address copied — paste it into the faucet.")
    ).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("clamps a hostile retry-after instead of parking the button for a day", async () => {
    h.createAirdropRequest.mockResolvedValue({
      success: false,
      rateLimited: true,
      retryAfterSeconds: 86_400,
    });
    renderCard();

    fireEvent.click(
      await screen.findByRole("button", { name: "Request Airdrop" })
    );

    // The countdown label shows the clamped value, not the raw day-long one.
    expect(
      await screen.findByRole("button", { name: "Request Airdrop (600s)" })
    ).toBeInTheDocument();

    // The faucet link stays usable regardless of the cooldown.
    expect(
      screen.getByRole("link", { name: "faucet.solana.com" })
    ).toHaveAttribute("href", "https://faucet.solana.com");
  });
});
