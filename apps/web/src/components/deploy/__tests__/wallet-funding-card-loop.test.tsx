// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { Keypair } from "@solana/web3.js";
import messages from "@/messages/en.json";
import { WalletFundingCard } from "../wallet-funding-card";

/**
 * The card with the REAL `useDeploySigner` behind it. The sibling suite mocks
 * the hook, which is exactly why it could not see the render loop that shipped
 * in the first cut of this PR: `parseWalletAddress` minted a new `PublicKey`
 * per render, `refreshBalance` was rebuilt per render, and the effect that
 * calls it fired again — 1559 `getBalance` calls in 1.28 s.
 */
const EMBEDDED = Keypair.generate().publicKey;

const h = vi.hoisted(() => {
  const getBalance = vi.fn();
  return {
    getBalance,
    // One object for the whole suite, like the real ConnectionProvider's
    // context value — the card is only asked to survive its OWN churn.
    connection: { getBalance },
    account: null as { address: string } | null,
  };
});

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({ publicKey: null }),
  useConnection: () => ({ connection: h.connection }),
}));

vi.mock("@/lib/dynamic/solana", () => ({
  signWithDynamicWallet: vi.fn(),
  signAllWithDynamicWallet: vi.fn(),
}));
vi.mock("@/lib/dynamic/social", () => ({
  startDynamicSocialSignIn: vi.fn(),
}));
vi.mock("@/lib/dynamic/config", () => ({ isDynamicEnabled: () => true }));
vi.mock("@/hooks/use-dynamic-session-state", () => ({
  // A fresh account object per call, like `getDynamicSolanaAccount` returns.
  useDynamicSessionState: () => ({
    status: h.account ? "valid" : "none",
    account: h.account ? { ...h.account } : null,
  }),
}));

vi.mock("@superteam-lms/deploy", () => ({
  createAirdropRequest: vi.fn(),
}));

function renderCard() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <WalletFundingCard />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  h.account = { address: EMBEDDED.toBase58() };
  h.getBalance.mockReset();
  h.getBalance.mockResolvedValue(0);
});

describe("WalletFundingCard — balance reads are bounded", () => {
  it("does not re-read the balance forever", async () => {
    const { rerender } = renderCard();
    await screen.findByText("Fund Your Wallet");

    for (let i = 0; i < 5; i++) {
      rerender(
        <NextIntlClientProvider locale="en" messages={messages}>
          <WalletFundingCard />
        </NextIntlClientProvider>
      );
    }

    // Bounded flushes rather than a sleep: a self-sustaining effect loop
    // starves the timer queue, so a sleep would fail by timeout instead of by
    // assertion.
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    expect(h.getBalance.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("reads the balance for the session's own address", async () => {
    renderCard();
    await screen.findByText("Fund Your Wallet");
    expect(h.getBalance.mock.calls[0]![0].toBase58()).toBe(EMBEDDED.toBase58());
  });
});
