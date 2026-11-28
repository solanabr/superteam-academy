// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { readLabKeypair } from "@/lib/solana/lab-keypair";
import messages from "@/messages/en.json";
import { WalletFundingCard } from "../wallet-funding-card";

/**
 * The card with the REAL `useLabKey` behind it. The sibling suite mocks the
 * hook, so it cannot see a render loop: a key or a signer that changes
 * identity on every render rebuilds `refreshBalance`, and the effect that
 * calls it fires again without end.
 */
const h = vi.hoisted(() => {
  const getBalance = vi.fn();
  return {
    getBalance,
    // One object for the whole suite, like the real provider's context value:
    // the card is only asked to survive its OWN churn.
    connection: { getBalance },
  };
});

// The lab connection. The wallet-adapter mock below has no hooks at all: a
// read of the learner's wallet or of the app connection fails the test.
vi.mock("@/lib/solana/lab-connection", () => ({
  useLabConnection: () => ({ connection: h.connection }),
}));

// The lab's devnet check passes here; deploy-lab-connection.test.tsx covers it.
vi.mock("@/hooks/use-lab-devnet-guard", () => {
  const guard = { status: "devnet", ensureDevnet: async () => true };
  return { useLabDevnetGuard: () => guard };
});
vi.mock("@/lib/solana/lab-guard", () => ({
  verifyLabDevnet: async () => true,
}));

vi.mock("@solana/wallet-adapter-react", () => ({}));

vi.mock("@/lib/auth/auth-provider", () => ({
  // A new object per call, as a context consumer can get.
  useAuth: () => ({ userId: "user-1", isLoading: false }),
}));

vi.mock("@superteam-lms/deploy", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@superteam-lms/deploy")>()),
  createAirdropRequest: vi.fn(),
  MAX_RETRY_AFTER_SECONDS: 600,
}));

function renderCard() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <WalletFundingCard />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
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

  it("reads the balance of the lab key in this browser", async () => {
    renderCard();
    await screen.findByText("Fund Your Wallet");
    expect(h.getBalance.mock.calls[0]![0].toBase58()).toBe(
      readLabKeypair("user-1")?.publicKey.toBase58()
    );
  });
});
