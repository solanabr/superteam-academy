import { describe, it, expect } from "vitest";
import { getHeliusBaseUrl, rawWebhookType } from "../helius-webhook-config";

describe("helius-webhook-config network label", () => {
  it.each(["mainnet", "mainnet-beta", " Mainnet-Beta ", "MAINNET"])(
    "targets mainnet for %j",
    (label) => {
      expect(getHeliusBaseUrl(label)).toBe(
        "https://api-mainnet.helius-rpc.com"
      );
      expect(rawWebhookType(label)).toBe("raw");
    }
  );

  it.each(["devnet", "", undefined])("targets devnet for %j", (label) => {
    expect(getHeliusBaseUrl(label)).toBe("https://api-devnet.helius-rpc.com");
    expect(rawWebhookType(label)).toBe("rawDevnet");
  });
});
