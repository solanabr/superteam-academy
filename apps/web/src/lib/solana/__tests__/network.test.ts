import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { resolveSolanaNetwork } from "../network";

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
