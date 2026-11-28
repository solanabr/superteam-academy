import { describe, it, expect, afterEach, vi } from "vitest";
import { LAB_CLUSTER, labExplorerUrl, labRpcUrl } from "../lab";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("labRpcUrl", () => {
  it.each([undefined, "", "  "])(
    "is the public devnet endpoint when NEXT_PUBLIC_LAB_RPC_URL is %j",
    (value) => {
      vi.stubEnv("NEXT_PUBLIC_LAB_RPC_URL", value);
      expect(labRpcUrl()).toBe("https://api.devnet.solana.com");
    }
  );

  it("is the configured endpoint, not the app RPC", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SOLANA_RPC_URL",
      "https://api.mainnet-beta.solana.com"
    );
    vi.stubEnv("NEXT_PUBLIC_LAB_RPC_URL", "https://devnet.rpc.example.com");
    expect(labRpcUrl()).toBe("https://devnet.rpc.example.com");
  });
});

describe("labExplorerUrl", () => {
  it("links to devnet", () => {
    expect(LAB_CLUSTER).toBe("devnet");
    expect(labExplorerUrl("tx", "sig")).toBe(
      "https://explorer.solana.com/tx/sig?cluster=devnet"
    );
    expect(labExplorerUrl("address", "addr")).toBe(
      "https://explorer.solana.com/address/addr?cluster=devnet"
    );
  });

  it("stays on devnet when the app is on mainnet", () => {
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "mainnet-beta");
    expect(labExplorerUrl("tx", "sig")).toBe(
      "https://explorer.solana.com/tx/sig?cluster=devnet"
    );
  });
});
