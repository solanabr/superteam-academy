import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { getHeliusBaseUrl, rawWebhookType } from "../helius-webhook-config";

const DEVNET_RPC = "https://devnet.helius-rpc.com/?api-key=x";
const MAINNET_RPC = "https://mainnet.helius-rpc.com/?api-key=x";

describe("helius-webhook-config cluster", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it.each(["mainnet", "mainnet-beta", " Mainnet-Beta ", "MAINNET"])(
    "targets mainnet for the label %j",
    (label) => {
      expect(getHeliusBaseUrl(label, MAINNET_RPC)).toBe(
        "https://api-mainnet.helius-rpc.com"
      );
      expect(rawWebhookType(label, MAINNET_RPC)).toBe("raw");
      expect(warn).not.toHaveBeenCalled();
    }
  );

  it.each(["devnet", "", undefined])(
    "targets devnet for the label %j on a devnet RPC",
    (label) => {
      expect(getHeliusBaseUrl(label, DEVNET_RPC)).toBe(
        "https://api-devnet.helius-rpc.com"
      );
      expect(rawWebhookType(label, DEVNET_RPC)).toBe("rawDevnet");
    }
  );

  it("targets mainnet and warns when the label says devnet but the RPC is mainnet", () => {
    expect(getHeliusBaseUrl("devnet", MAINNET_RPC)).toBe(
      "https://api-mainnet.helius-rpc.com"
    );
    expect(rawWebhookType("devnet", MAINNET_RPC)).toBe("raw");
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("targets mainnet when the label says so and the RPC names no cluster", () => {
    expect(rawWebhookType("mainnet", "https://rpc.example.com")).toBe("raw");
    expect(warn).not.toHaveBeenCalled();
  });
});
