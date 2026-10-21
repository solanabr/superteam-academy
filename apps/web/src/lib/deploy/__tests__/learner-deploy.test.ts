import { describe, it, expect, afterEach, vi } from "vitest";
import {
  isLearnerDeployEnabled,
  learnerDeployBlock,
  learnerDeployBlockFromEnv,
} from "../learner-deploy";

const DEVNET_RPC = "https://api.devnet.solana.com";
const MAINNET_RPC = "https://mainnet.helius-rpc.com/?api-key=x";

describe("learnerDeployBlock", () => {
  it('is on only on a non-mainnet cluster with the flag set to "true"', () => {
    expect(
      learnerDeployBlock({
        flag: "true",
        networkLabel: "devnet",
        rpcUrls: [DEVNET_RPC],
      })
    ).toBeNull();
    expect(
      learnerDeployBlock({
        flag: " TRUE ",
        networkLabel: undefined,
        rpcUrls: [DEVNET_RPC, undefined],
      })
    ).toBeNull();
  });

  it.each([undefined, "", "false", "1", "yes", "on"])(
    "is disabled when the flag is %j",
    (flag) => {
      expect(
        learnerDeployBlock({
          flag,
          networkLabel: "devnet",
          rpcUrls: [DEVNET_RPC],
        })
      ).toBe("disabled");
    }
  );

  it.each(["mainnet", "mainnet-beta", " Mainnet-Beta "])(
    "is off on a mainnet label (%j) even with the flag on",
    (networkLabel) => {
      expect(
        learnerDeployBlock({
          flag: "true",
          networkLabel,
          rpcUrls: [DEVNET_RPC],
        })
      ).toBe("mainnet");
    }
  );

  it("is off when any RPC host names mainnet, whatever the label says", () => {
    expect(
      learnerDeployBlock({
        flag: "true",
        networkLabel: "devnet",
        rpcUrls: [DEVNET_RPC, MAINNET_RPC],
      })
    ).toBe("mainnet");
    expect(
      learnerDeployBlock({
        flag: "true",
        networkLabel: "devnet",
        rpcUrls: ["https://api.mainnet-beta.solana.com"],
      })
    ).toBe("mainnet");
  });

  it("names mainnet first when the flag is also off", () => {
    expect(
      learnerDeployBlock({
        flag: undefined,
        networkLabel: "mainnet-beta",
        rpcUrls: [],
      })
    ).toBe("mainnet");
  });
});

describe("learnerDeployBlockFromEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the flag, the label and the browser RPC", () => {
    vi.stubEnv("NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "devnet");
    vi.stubEnv("NEXT_PUBLIC_SOLANA_RPC_URL", DEVNET_RPC);
    expect(learnerDeployBlockFromEnv()).toBeNull();
    expect(isLearnerDeployEnabled()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_SOLANA_RPC_URL", MAINNET_RPC);
    expect(learnerDeployBlockFromEnv()).toBe("mainnet");
    expect(isLearnerDeployEnabled()).toBe(false);
  });

  it("also checks the server RPC it is given", () => {
    vi.stubEnv("NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "devnet");
    vi.stubEnv("NEXT_PUBLIC_SOLANA_RPC_URL", DEVNET_RPC);
    expect(learnerDeployBlockFromEnv(MAINNET_RPC)).toBe("mainnet");
  });

  it("is off by default", () => {
    vi.stubEnv("NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED", "");
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "devnet");
    expect(learnerDeployBlockFromEnv()).toBe("disabled");
    expect(isLearnerDeployEnabled()).toBe(false);
  });
});
