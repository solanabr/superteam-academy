import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resolveSolanaNetwork, networkFromRpcUrl } from "../network";

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
