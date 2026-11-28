// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  DEVNET_GENESIS_HASH,
  MAINNET_GENESIS_HASH,
} from "@/lib/solana/network";
import { useLabDevnetGuard } from "../use-lab-devnet-guard";

const h = vi.hoisted(() => ({
  connection: { getGenesisHash: (): Promise<string> => Promise.resolve("") },
}));

vi.mock("@/lib/solana/lab-connection", () => ({
  useLabConnection: () => ({ connection: h.connection }),
}));

function labAnswering(read: () => Promise<string>) {
  const getGenesisHash = vi.fn(read);
  // A new object per test: the guard caches per connection.
  h.connection = { getGenesisHash };
  return getGenesisHash;
}

beforeEach(() => {
  labAnswering(async () => DEVNET_GENESIS_HASH);
});

describe("useLabDevnetGuard", () => {
  it("is checking, then devnet, when the lab RPC answers with devnet's genesis hash", async () => {
    const { result } = renderHook(() => useLabDevnetGuard());
    expect(result.current.status).toBe("checking");
    await waitFor(() => expect(result.current.status).toBe("devnet"));
    await expect(result.current.ensureDevnet()).resolves.toBe(true);
  });

  it("refuses when the lab RPC answers with another chain's genesis hash", async () => {
    labAnswering(async () => MAINNET_GENESIS_HASH);
    const { result } = renderHook(() => useLabDevnetGuard());
    await waitFor(() => expect(result.current.status).toBe("refused"));
    await expect(result.current.ensureDevnet()).resolves.toBe(false);
  });

  it("refuses when the genesis hash cannot be read", async () => {
    labAnswering(async () => {
      throw new Error("rpc down");
    });
    const { result } = renderHook(() => useLabDevnetGuard());
    await waitFor(() => expect(result.current.status).toBe("refused"));
  });

  it("reads the genesis hash once for every guard on the page", async () => {
    const getGenesisHash = labAnswering(async () => DEVNET_GENESIS_HASH);
    const first = renderHook(() => useLabDevnetGuard());
    const second = renderHook(() => useLabDevnetGuard());
    await waitFor(() => expect(first.result.current.status).toBe("devnet"));
    await waitFor(() => expect(second.result.current.status).toBe("devnet"));
    await first.result.current.ensureDevnet();
    expect(getGenesisHash).toHaveBeenCalledTimes(1);
  });

  it("turns to refused when a check at action time fails", async () => {
    let settle!: (hash: string) => void;
    labAnswering(() => new Promise<string>((resolve) => (settle = resolve)));
    const { result } = renderHook(() => useLabDevnetGuard());
    expect(result.current.status).toBe("checking");

    await act(async () => {
      const ensured = result.current.ensureDevnet();
      settle(MAINNET_GENESIS_HASH);
      expect(await ensured).toBe(false);
    });
    expect(result.current.status).toBe("refused");
  });
});
