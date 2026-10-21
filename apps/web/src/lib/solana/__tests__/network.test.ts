import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import {
  resolveSolanaNetwork,
  normalizeNetworkLabel,
  isMainnetLabel,
  clusterFromLabel,
  explorerClusterQuery,
  explorerUrl,
  networkFromRpcUrl,
  isMainnetCluster,
  isLoopbackRpc,
  isMainnetFailClosed,
  ClusterUnverifiedError,
  DEVNET_GENESIS_HASH,
  MAINNET_GENESIS_HASH,
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

describe("resolveSolanaNetwork with either mainnet spelling", () => {
  it.each(["mainnet-beta", " Mainnet-Beta ", "MAINNET"])(
    "%j resolves to the mainnet-beta cluster and a Mainnet label",
    (label) => {
      process.env.NEXT_PUBLIC_SOLANA_NETWORK = label;
      const info = resolveSolanaNetwork();
      expect(info.cluster).toBe("mainnet-beta");
      expect(info.label).toBe("Mainnet");
    }
  );
});

describe("network label helpers", () => {
  it("normalizes case and whitespace, and reads blank as devnet", () => {
    expect(normalizeNetworkLabel(" Mainnet-Beta ")).toBe("mainnet-beta");
    expect(normalizeNetworkLabel("")).toBe("devnet");
    expect(normalizeNetworkLabel("  ")).toBe("devnet");
    expect(normalizeNetworkLabel(undefined)).toBe("devnet");
    expect(normalizeNetworkLabel(null)).toBe("devnet");
  });

  it("treats mainnet and mainnet-beta, in any case, as mainnet", () => {
    for (const label of [
      "mainnet",
      "mainnet-beta",
      "Mainnet",
      "MAINNET-BETA",
      " mainnet-beta\n",
    ]) {
      expect(isMainnetLabel(label)).toBe(true);
      expect(clusterFromLabel(label)).toBe("mainnet-beta");
    }
  });

  it("treats devnet, testnet, blank and unknown labels as not mainnet", () => {
    for (const label of [
      "devnet",
      "Devnet",
      "testnet",
      "",
      undefined,
      "localnet",
    ]) {
      expect(isMainnetLabel(label)).toBe(false);
    }
    expect(clusterFromLabel("devnet")).toBe("devnet");
    expect(clusterFromLabel(" TESTNET ")).toBe("testnet");
    expect(clusterFromLabel(undefined)).toBe("devnet");
    expect(clusterFromLabel("localnet")).toBe("devnet");
  });
});

describe("explorer links", () => {
  it("carries no cluster param on mainnet and the right one elsewhere", () => {
    expect(explorerClusterQuery("mainnet-beta")).toBe("");
    expect(explorerClusterQuery("devnet")).toBe("?cluster=devnet");
    expect(explorerClusterQuery("testnet")).toBe("?cluster=testnet");
  });

  it("builds tx and address links for an explicit cluster", () => {
    expect(explorerUrl("tx", "SIG", "mainnet-beta")).toBe(
      "https://explorer.solana.com/tx/SIG"
    );
    expect(explorerUrl("address", "ADDR", "devnet")).toBe(
      "https://explorer.solana.com/address/ADDR?cluster=devnet"
    );
  });

  it.each([
    ["mainnet", "https://explorer.solana.com/tx/SIG"],
    ["mainnet-beta", "https://explorer.solana.com/tx/SIG"],
    [" Mainnet ", "https://explorer.solana.com/tx/SIG"],
    ["devnet", "https://explorer.solana.com/tx/SIG?cluster=devnet"],
    ["testnet", "https://explorer.solana.com/tx/SIG?cluster=testnet"],
  ])("defaults to the app's cluster (label %j)", (label, expected) => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = label;
    expect(explorerUrl("tx", "SIG")).toBe(expected);
  });

  it("defaults to devnet when the label is unset", () => {
    expect(explorerUrl("address", "ADDR")).toBe(
      "https://explorer.solana.com/address/ADDR?cluster=devnet"
    );
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
  const LOCALNET_GENESIS = "4MpjwXxqwNqkk8xjyRZQ3TGb3x8wGbSCH1ifwCWTLcEf";
  const genesis = (hash: string) => vi.fn(async () => hash);
  const failing = () =>
    vi.fn(async (): Promise<string> => {
      throw new Error("rpc down");
    });

  it("is true for an anonymous host with an unset label when the genesis is not devnet's", async () => {
    for (const host of [
      "https://staked.helius-rpc.com/?api-key=x",
      "https://rpc.ankr.com/solana",
      "https://rpc.st.academy",
      "https://acme.rpcpool.com",
    ]) {
      expect(
        await isMainnetFailClosed(host, genesis(MAINNET_GENESIS_HASH))
      ).toBe(true);
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

  it("is true for a remote host with a genesis that is neither devnet's nor mainnet's", async () => {
    expect(
      await isMainnetFailClosed(
        "https://rpc.example.com",
        genesis(LOCALNET_GENESIS)
      )
    ).toBe(true);
  });

  it("throws ClusterUnverifiedError when the genesis lookup fails", async () => {
    await expect(
      isMainnetFailClosed("https://rpc.example.com", failing())
    ).rejects.toBeInstanceOf(ClusterUnverifiedError);
  });

  it("throws ClusterUnverifiedError on loopback too: the lookup comes first", async () => {
    await expect(
      isMainnetFailClosed("http://127.0.0.1:8899", failing())
    ).rejects.toBeInstanceOf(ClusterUnverifiedError);
  });

  it("is true for a loopback URL that fronts mainnet (tunnel, forked validator)", async () => {
    for (const host of ["http://127.0.0.1:8899", "http://localhost:8899"]) {
      const g = genesis(MAINNET_GENESIS_HASH);
      expect(await isMainnetFailClosed(host, g)).toBe(true);
      expect(g).toHaveBeenCalledTimes(1);
    }
  });

  it("is false for loopback serving localnet or devnet", async () => {
    expect(
      await isMainnetFailClosed(
        "http://127.0.0.1:8899",
        genesis(LOCALNET_GENESIS)
      )
    ).toBe(false);
    expect(
      await isMainnetFailClosed(
        "http://localhost:8899",
        genesis(DEVNET_GENESIS_HASH)
      )
    ).toBe(false);
  });

  it("asks for the genesis on every call, so a changed answer is seen", async () => {
    const g = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce(DEVNET_GENESIS_HASH)
      .mockResolvedValueOnce(MAINNET_GENESIS_HASH);
    expect(await isMainnetFailClosed("https://rpc.example.com", g)).toBe(false);
    expect(await isMainnetFailClosed("https://rpc.example.com", g)).toBe(true);
    expect(g).toHaveBeenCalledTimes(2);
  });

  it("is true when the label says mainnet, even with devnet's genesis or a failing lookup", async () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "mainnet";
    expect(
      await isMainnetFailClosed(
        "https://rpc.example.com",
        genesis(DEVNET_GENESIS_HASH)
      )
    ).toBe(true);
    expect(
      await isMainnetFailClosed("https://rpc.example.com", failing())
    ).toBe(true);
  });
});
