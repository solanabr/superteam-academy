// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import messages from "@/messages/en.json";
import { WalletFundingCard } from "../wallet-funding-card";

const EMBEDDED = Keypair.generate().publicKey;

const h = vi.hoisted(() => ({
  publicKey: null as unknown,
  balanceLamports: 0,
  createAirdropRequest: vi.fn(),
}));

vi.mock("@/hooks/use-deploy-signer", () => ({
  useDeploySigner: () => ({
    status: h.publicKey ? "ready" : "none",
    kind: h.publicKey ? "embedded" : null,
    signer: h.publicKey
      ? {
          publicKey: h.publicKey,
          signTransaction: vi.fn(),
          signAllTransactions: vi.fn(),
        }
      : null,
    batchSize: undefined,
    startReauth: vi.fn(),
  }),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useConnection: () => ({
    connection: { getBalance: async () => h.balanceLamports },
  }),
}));

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
  h.publicKey = EMBEDDED;
  h.balanceLamports = 0;
  h.createAirdropRequest.mockReset();
  h.createAirdropRequest.mockResolvedValue({ success: true, newBalance: 2 });
});

describe("WalletFundingCard", () => {
  it("renders for an embedded signer with no wallet-adapter wallet", async () => {
    renderCard();
    expect(await screen.findByText("Fund Your Wallet")).toBeInTheDocument();
    expect(
      screen.getByText(
        `${EMBEDDED.toBase58().slice(0, 4)}...${EMBEDDED.toBase58().slice(-4)}`
      )
    ).toBeInTheDocument();
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
      EMBEDDED.toBase58()
    );
  });

  it("measures against the deploy estimate when one is given", async () => {
    h.balanceLamports = 0.5 * LAMPORTS_PER_SOL;
    renderCard({ requiredLamports: 1.5 * LAMPORTS_PER_SOL });

    // 1.5 needed, 0.5 held — the shortfall is the estimate's, not a flat 5 SOL.
    expect(await screen.findByText("Need ~1.00 more SOL")).toBeInTheDocument();
  });

  it("reports each balance read so the panel's gate can re-evaluate", async () => {
    const onBalance = vi.fn();
    h.balanceLamports = 3 * LAMPORTS_PER_SOL;
    renderCard({ onBalance });

    await waitFor(() =>
      expect(onBalance).toHaveBeenCalledWith(3 * LAMPORTS_PER_SOL)
    );
  });

  it("shows a copyable address when the faucet rate-limits the airdrop", async () => {
    h.createAirdropRequest.mockResolvedValue({
      success: false,
      rateLimited: true,
    });
    renderCard();

    fireEvent.click(
      await screen.findByRole("button", { name: "Request Airdrop" })
    );

    const copyButton = await screen.findByRole("button", {
      name: new RegExp(EMBEDDED.toBase58()),
    });
    expect(copyButton).toHaveTextContent("Copy address");
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
