// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";

const state = vi.hoisted(() => {
  const getBalance = vi.fn(async () => 0);
  return {
    publicKey: null as { toBase58(): string } | null,
    getBalance,
    // Stable identity: a fresh object per render would churn the fetch
    // callback and re-fire the poll effect.
    connection: { getBalance },
  };
});

// The banner mounts inside the (platform) provider stack (#1097), so its
// hooks always resolve against a live provider — which these mocks model.
vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({ publicKey: state.publicKey }),
  useConnection: () => ({ connection: state.connection }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// IS_DEVNET is read from the env at module scope, so the component must be
// imported after NEXT_PUBLIC_SOLANA_NETWORK is set for each case.
async function renderBanner(network: string | undefined) {
  vi.resetModules();
  if (network === undefined) {
    delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  } else {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = network;
  }
  const { LowSolBanner } = await import("../low-sol-banner");
  return render(<LowSolBanner />);
}

beforeEach(() => {
  vi.useFakeTimers();
  state.publicKey = { toBase58: () => "wallet-1" };
  state.getBalance.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("LowSolBanner balance polling (#1090)", () => {
  it("never calls getBalance on mainnet, even with a connected wallet", async () => {
    await renderBanner("mainnet-beta");
    await act(() => vi.advanceTimersByTimeAsync(120_000));
    expect(state.getBalance).not.toHaveBeenCalled();
  });

  it("never calls getBalance on devnet without a connected wallet", async () => {
    state.publicKey = null;
    await renderBanner("devnet");
    await act(() => vi.advanceTimersByTimeAsync(120_000));
    expect(state.getBalance).not.toHaveBeenCalled();
  });

  it("polls on devnet with a connected wallet", async () => {
    await renderBanner("devnet");
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(state.getBalance).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(state.getBalance).toHaveBeenCalledTimes(2);
  });

  it("shows the faucet link when the devnet balance is low", async () => {
    state.getBalance.mockResolvedValue(1000); // 0.000001 SOL
    const { getByText } = await renderBanner("devnet");
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(getByText("getDevnetSol")).toBeInTheDocument();
  });
});
