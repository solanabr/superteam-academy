import { describe, it, expect } from "vitest";
import messages from "@/messages/en.json";
import { toFriendlyError, type FriendlyErrorKey } from "../friendly-error";

describe("toFriendlyError", () => {
  it("maps a rate-limited airdrop with the faucet's retry-after", () => {
    const friendly = toFriendlyError(
      "Airdrop failed after 3 attempts: 429 Too Many Requests",
      { source: "airdrop", retryAfterSeconds: 42 }
    );
    expect(friendly).toEqual({
      key: "airdropRateLimited",
      params: { seconds: "42" },
      action: "wait",
    });
  });

  it("treats the faucet's 403 as a rate limit, with a default wait", () => {
    const friendly = toFriendlyError(
      'Airdrop failed after 3 attempts: 403 : {"jsonrpc":"2.0","error":{"code":429}}',
      { source: "airdrop" }
    );
    expect(friendly.key).toBe("airdropRateLimited");
    expect(friendly.params.seconds).toBe("60");
    expect(friendly.raw).toBeUndefined();
  });

  it("maps a generic airdrop failure to a retry", () => {
    const friendly = toFriendlyError(new Error("fetch failed"), {
      source: "airdrop",
    });
    expect(friendly.key).toBe("airdropFailed");
    expect(friendly.action).toBe("retry");
  });

  it("maps the wallet service throttle to an automatic wait", () => {
    const friendly = toFriendlyError(new Error("WalletApiError: Rate limited"));
    expect(friendly).toEqual({
      key: "walletRateLimited",
      params: {},
      action: "wait",
    });
  });

  it("maps a dead session to re-authentication", () => {
    expect(toFriendlyError(new Error("Session expired")).key).toBe(
      "sessionExpired"
    );
    expect(toFriendlyError(new Error("user is not authenticated")).action).toBe(
      "reauth"
    );
  });

  it("maps a missing build to a rebuild", () => {
    expect(toFriendlyError("Build not found (404)").key).toBe("buildExpired");
    expect(toFriendlyError("build expired").action).toBe("rebuild");
  });

  it("maps insufficient funds to funding, carrying the shortfall", () => {
    const friendly = toFriendlyError(
      new Error(
        "Attempt to debit an account but found no record of a prior credit"
      ),
      { shortfallSol: 1.5 }
    );
    expect(friendly.key).toBe("insufficientSol");
    expect(friendly.params.amount).toBe("1.50");
    expect(friendly.action).toBe("fund");
  });

  it("maps an expired blockhash or timeout to a resume", () => {
    expect(toFriendlyError("Blockhash not found").action).toBe("resume");
    expect(
      toFriendlyError("Transaction was not confirmed in 30.00 seconds").key
    ).toBe("blockhashExpired");
  });

  it("keeps an unmapped message only as details", () => {
    const friendly = toFriendlyError(new Error("kaboom 7"));
    expect(friendly.key).toBe("unknown");
    expect(friendly.action).toBe("retry");
    expect(friendly.raw).toBe("kaboom 7");
  });

  it("never carries a raw message on a mapped failure", () => {
    const raws = [
      [
        'Airdrop failed after 3 attempts: 403 : {"jsonrpc":"2.0"}',
        { source: "airdrop" as const },
      ],
      ["WalletApiError: Rate limited", {}],
      ["Session expired", {}],
      ["Build not found (404)", {}],
      ["insufficient funds for rent", {}],
      ["Blockhash not found", {}],
    ] as const;
    for (const [message, ctx] of raws) {
      expect(toFriendlyError(message, ctx).raw).toBeUndefined();
    }
  });

  it("has copy for every key it can produce", () => {
    const en: Record<string, string> = messages.deploy.errors;
    const keys: FriendlyErrorKey[] = [
      "airdropRateLimited",
      "airdropFailed",
      "walletRateLimited",
      "sessionExpired",
      "buildExpired",
      "insufficientSol",
      "blockhashExpired",
      "unknown",
    ];
    for (const key of keys) {
      expect(en[key], key).toBeTruthy();
    }
  });
});
