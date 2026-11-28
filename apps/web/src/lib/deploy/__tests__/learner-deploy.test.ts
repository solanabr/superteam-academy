import { describe, it, expect, afterEach, vi } from "vitest";
import {
  isLearnerDeployEnabled,
  learnerDeployBlock,
  learnerDeployBlockFromEnv,
} from "../learner-deploy";

const DEVNET_RPC = "https://api.devnet.solana.com";
const MAINNET_RPC = "https://api.mainnet-beta.solana.com";

describe("learnerDeployBlock", () => {
  it('is on with the flag set to "true" and a lab RPC that does not name mainnet', () => {
    expect(
      learnerDeployBlock({ flag: "true", labRpcUrls: [DEVNET_RPC] })
    ).toBeNull();
    expect(
      learnerDeployBlock({
        flag: " TRUE ",
        labRpcUrls: [DEVNET_RPC, undefined],
      })
    ).toBeNull();
  });

  it.each([undefined, "", "false", "1", "yes", "on"])(
    "is disabled when the flag is %j",
    (flag) => {
      expect(learnerDeployBlock({ flag, labRpcUrls: [DEVNET_RPC] })).toBe(
        "disabled"
      );
    }
  );

  it("is off when any lab RPC host names mainnet", () => {
    expect(
      learnerDeployBlock({
        flag: "true",
        labRpcUrls: [DEVNET_RPC, MAINNET_RPC],
      })
    ).toBe("mainnet");
    expect(
      learnerDeployBlock({
        flag: "true",
        labRpcUrls: ["https://mainnet.rpc.example.com"],
      })
    ).toBe("mainnet");
  });

  it("names mainnet first when the flag is also off", () => {
    expect(
      learnerDeployBlock({ flag: undefined, labRpcUrls: [MAINNET_RPC] })
    ).toBe("mainnet");
  });

  it("leaves a host that names no cluster to the genesis check", () => {
    expect(
      learnerDeployBlock({
        flag: "true",
        labRpcUrls: ["https://rpc.example.com"],
      })
    ).toBeNull();
  });
});

describe("learnerDeployBlockFromEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is on when the app is on mainnet and the lab is on devnet", () => {
    vi.stubEnv("NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "mainnet-beta");
    vi.stubEnv("NEXT_PUBLIC_SOLANA_RPC_URL", MAINNET_RPC);
    vi.stubEnv("NEXT_PUBLIC_LAB_RPC_URL", DEVNET_RPC);
    expect(learnerDeployBlockFromEnv()).toBeNull();
    expect(isLearnerDeployEnabled()).toBe(true);
  });

  it.each([undefined, "", "  "])(
    "uses devnet when the lab RPC is %j, so the flag alone turns it on",
    (labRpc) => {
      vi.stubEnv("NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED", "true");
      vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "mainnet-beta");
      vi.stubEnv("NEXT_PUBLIC_SOLANA_RPC_URL", MAINNET_RPC);
      vi.stubEnv("NEXT_PUBLIC_LAB_RPC_URL", labRpc);
      expect(learnerDeployBlockFromEnv()).toBeNull();
      expect(isLearnerDeployEnabled()).toBe(true);
    }
  );

  it("is off when the lab RPC names mainnet", () => {
    vi.stubEnv("NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "devnet");
    vi.stubEnv("NEXT_PUBLIC_SOLANA_RPC_URL", DEVNET_RPC);
    vi.stubEnv("NEXT_PUBLIC_LAB_RPC_URL", MAINNET_RPC);
    expect(learnerDeployBlockFromEnv()).toBe("mainnet");
    expect(isLearnerDeployEnabled()).toBe(false);
  });

  it("also checks the server lab RPC it is given", () => {
    vi.stubEnv("NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_LAB_RPC_URL", DEVNET_RPC);
    expect(learnerDeployBlockFromEnv(DEVNET_RPC)).toBeNull();
    expect(learnerDeployBlockFromEnv(MAINNET_RPC)).toBe("mainnet");
  });

  it("is off by default", () => {
    vi.stubEnv("NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED", "");
    vi.stubEnv("NEXT_PUBLIC_LAB_RPC_URL", DEVNET_RPC);
    expect(learnerDeployBlockFromEnv()).toBe("disabled");
    expect(isLearnerDeployEnabled()).toBe(false);
  });
});
