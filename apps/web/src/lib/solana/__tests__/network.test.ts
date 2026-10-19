import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import {
  resolveSolanaNetwork,
  networkFromRpcUrl,
  isMainnetCluster,
  isLoopbackRpc,
  isMainnetFailClosed,
  DEVNET_GENESIS_HASH,
} from "../network";

const ORIGINAL = process.env.NEXT_PUBLIC_SOLANA_NETWORK;

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
});

afterAll(() => {
  if (ORIGINAL === undefined) {
    delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  } else {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = ORIGINAL;
  }
});

describe("resolveSolanaNetwork", () => {
  it("defaults to devnet when the env var is unset", () => {
    expect(resolveSolanaNetwork()).toEqual({
      network: "devnet",
      cluster: "devnet",
      label: "Devnet",
    });
  });

  it("reads NEXT_PUBLIC_SOLANA_NETWORK at call time", () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "devnet";
    expect(resolveSolanaNetwork().label).toBe("Devnet");
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "testnet";
    expect(resolveSolanaNetwork().label).toBe("Testnet");
  });

  it('maps "mainnet" to the explorer cluster "mainnet-beta" with a clean label', () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "mainnet";
    expect(resolveSolanaNetwork()).toEqual({
      network: "mainnet",
      cluster: "mainnet-beta",
      label: "Mainnet",
    });
  });
});

describe("networkFromRpcUrl", () => {
  it("reads devnet out of the host", () => {
    expect(networkFromRpcUrl("https://api.devnet.solana.com")).toBe("devnet");
    expect(networkFromRpcUrl("https://devnet.helius-rpc.com/?api-key=x")).toBe(
      "devnet"
    );
  });

  it("reads mainnet out of the host, including mainnet-beta", () => {
    expect(networkFromRpcUrl("https://api.mainnet-beta.solana.com")).toBe(
      "mainnet"
    );
    expect(networkFromRpcUrl("https://mainnet.helius-rpc.com/?api-key=x")).toBe(
      "mainnet"
    );
  });

  it("says unknown for a host that names no cluster", () => {
    expect(networkFromRpcUrl("https://rpc.internal.example.com")).toBe(
      "unknown"
    );
    expect(networkFromRpcUrl("http://localhost:8899")).toBe("unknown");
  });

  it("says unknown rather than throwing on an unparseable URL", () => {
    expect(networkFromRpcUrl("")).toBe("unknown");
    expect(networkFromRpcUrl("not a url")).toBe("unknown");
  });

  it("ignores cluster names outside the host", () => {
    expect(networkFromRpcUrl("https://rpc.example.com/devnet")).toBe("unknown");
    expect(networkFromRpcUrl("https://rpc.example.com/?net=mainnet")).toBe(
      "unknown"
    );
  });
});

describe("isMainnetCluster", () => {
  it("is true when the label says mainnet, whatever the RPC host", () => {
    for (const label of ["mainnet", "mainnet-beta", " Mainnet "]) {
      process.env.NEXT_PUBLIC_SOLANA_NETWORK = label;
      expect(isMainnetCluster("https://rpc.example.com")).toBe(true);
    }
  });

  it("is true when the RPC host says mainnet, even under a devnet label", () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "devnet";
    expect(isMainnetCluster("https://mainnet.helius-rpc.com/?api-key=x")).toBe(
      true
    );
    delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
    expect(isMainnetCluster("https://api.mainnet-beta.solana.com")).toBe(true);
  });

  it("is false for devnet and localnet", () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "devnet";
    expect(isMainnetCluster("https://api.devnet.solana.com")).toBe(false);
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "localnet";
    expect(isMainnetCluster("http://127.0.0.1:8899")).toBe(false);
    delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
    expect(isMainnetCluster("http://localhost:8899")).toBe(false);
  });
});

describe("isLoopbackRpc", () => {
  it("is true for localhost, 127.x and ::1", () => {
    expect(isLoopbackRpc("http://localhost:8899")).toBe(true);
    expect(isLoopbackRpc("http://127.0.0.1:8899")).toBe(true);
    expect(isLoopbackRpc("http://127.1.2.3:8899")).toBe(true);
    expect(isLoopbackRpc("http://[::1]:8899")).toBe(true);
  });

  it("is false for remote hosts and lookalikes", () => {
    expect(isLoopbackRpc("https://api.devnet.solana.com")).toBe(false);
    expect(isLoopbackRpc("https://127.0.0.1.example.com")).toBe(false);
    expect(isLoopbackRpc("https://localhost.example.com")).toBe(false);
    expect(isLoopbackRpc("not a url")).toBe(false);
  });
});

describe("isMainnetFailClosed", () => {
  const MAINNET_GENESIS = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
  const genesis = (hash: string) => vi.fn(async () => hash);

  it("is true for an anonymous host with an unset label when the genesis is not devnet's", async () => {
    for (const host of [
      "https://staked.helius-rpc.com/?api-key=x",
      "https://rpc.ankr.com/solana",
      "https://rpc.st.academy",
      "https://acme.rpcpool.com",
    ]) {
      expect(await isMainnetFailClosed(host, genesis(MAINNET_GENESIS))).toBe(
        true
      );
    }
  });

  it("is false when an anonymous host answers with devnet's genesis", async () => {
    expect(
      await isMainnetFailClosed(
        "https://rpc.example.com",
        genesis(DEVNET_GENESIS_HASH)
      )
    ).toBe(false);
  });

  it("is true when the genesis lookup throws", async () => {
    const failing = vi.fn(async (): Promise<string> => {
      throw new Error("rpc down");
    });
    expect(await isMainnetFailClosed("https://rpc.example.com", failing)).toBe(
      true
    );
  });

  it("is false for loopback without asking for the genesis", async () => {
    const g = genesis(MAINNET_GENESIS);
    expect(await isMainnetFailClosed("http://127.0.0.1:8899", g)).toBe(false);
    expect(g).not.toHaveBeenCalled();
  });

  it("is true when the label says mainnet, even with devnet's genesis", async () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "mainnet";
    expect(
      await isMainnetFailClosed(
        "https://rpc.example.com",
        genesis(DEVNET_GENESIS_HASH)
      )
    ).toBe(true);
  });
});
