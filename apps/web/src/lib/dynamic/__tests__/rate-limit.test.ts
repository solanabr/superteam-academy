import { describe, it, expect, vi } from "vitest";
import { Transaction } from "@solana/web3.js";
import {
  BLOCKHASH_MAX_AGE_MS,
  RATE_LIMIT_MAX_DELAY_MS,
  isDynamicRateLimitError,
  rateLimitDelayMs,
  signAllWithRateLimitBackoff,
} from "../rate-limit";

/**
 * What Dynamic threw in the owner's production deploy: `WalletApiError: Rate
 * limited`. The class is not in the installed SDK (it comes from the WaaS
 * layer loaded at runtime), so the fixtures below mirror the SHAPES the error
 * can arrive in rather than importing a type that does not exist here.
 */
function walletApiRateLimited(): Error {
  const error = new Error("Rate limited");
  error.name = "WalletApiError";
  return error;
}

const txs = (count: number) =>
  Array.from({ length: count }, () => new Transaction());

const options = {
  sleep: async () => {},
  random: () => 0,
};

describe("isDynamicRateLimitError", () => {
  it("matches the WalletApiError the owner's deploy hit", () => {
    expect(isDynamicRateLimitError(walletApiRateLimited())).toBe(true);
  });

  it("matches an APIError carrying a 429", () => {
    const error = Object.assign(new Error("Request failed"), {
      name: "APIError",
      code: "unknown_error",
      status: 429,
    });
    expect(isDynamicRateLimitError(error)).toBe(true);
  });

  it("matches a rate_limit code and a rate-limit name", () => {
    expect(
      isDynamicRateLimitError(
        Object.assign(new Error("nope"), { code: "rate_limit_exceeded" })
      )
    ).toBe(true);
    expect(
      isDynamicRateLimitError(
        Object.assign(new Error("nope"), { name: "MfaRateLimitedError" })
      )
    ).toBe(true);
  });

  it("looks one level into cause, as the WaaS signer wraps failures", () => {
    const wrapped = new Error("Failed to sign");
    wrapped.name = "WaasLoadFailedError";
    wrapped.cause = walletApiRateLimited();
    expect(isDynamicRateLimitError(wrapped)).toBe(true);
  });

  it("does not match an ordinary signing failure", () => {
    const expired = new Error("Session ended before signing");
    expired.name = "UnauthorizedError";
    expect(isDynamicRateLimitError(expired)).toBe(false);
    expect(isDynamicRateLimitError(new Error("Transaction failed"))).toBe(
      false
    );
    expect(isDynamicRateLimitError(null)).toBe(false);
  });

  it("defers to session expiry when a 429 also carries UnauthorizedError", () => {
    const ambiguous = Object.assign(new Error("Unauthorized"), {
      name: "UnauthorizedError",
      status: 429,
    });
    expect(isDynamicRateLimitError(ambiguous)).toBe(false);
  });

  it("defers to session expiry when it arrives wrapped in cause", () => {
    const wrapped = Object.assign(new Error("Rate limited"), {
      name: "WalletApiError",
      status: 429,
      cause: Object.assign(new Error("Session ended"), {
        name: "UnauthorizedError",
      }),
    });
    expect(isDynamicRateLimitError(wrapped)).toBe(false);
  });
});

describe("rateLimitDelayMs", () => {
  it("grows exponentially from 2s and caps at 30s", () => {
    expect(rateLimitDelayMs(0, () => 0)).toBe(1_000);
    expect(rateLimitDelayMs(0, () => 1)).toBe(2_000);
    expect(rateLimitDelayMs(3, () => 1)).toBe(16_000);
    expect(rateLimitDelayMs(20, () => 1)).toBe(RATE_LIMIT_MAX_DELAY_MS);
  });
});

describe("signAllWithRateLimitBackoff", () => {
  it("retries the throttled sub-batch and keeps the already-signed work", async () => {
    const signAll = vi
      .fn()
      .mockRejectedValueOnce(walletApiRateLimited())
      .mockRejectedValueOnce(walletApiRateLimited())
      .mockImplementation(async (batch: Transaction[]) => batch);
    const waits: number[] = [];

    const all = txs(3);
    const signed = await signAllWithRateLimitBackoff(all, {
      ...options,
      signAll,
      onRateLimitWait: ({ waitMs }) => waits.push(waitMs),
    });

    expect(signed).toEqual(all);
    expect(signAll).toHaveBeenCalledTimes(3);
    // Two waits, the second longer than the first.
    expect(waits).toHaveLength(2);
    expect(waits[1]).toBeGreaterThan(waits[0]!);
  });

  it("reports the attempt number and the wait it is about to take", async () => {
    const signAll = vi
      .fn()
      .mockRejectedValueOnce(walletApiRateLimited())
      .mockImplementation(async (batch: Transaction[]) => batch);
    const onRateLimitWait = vi.fn();

    await signAllWithRateLimitBackoff(txs(1), {
      ...options,
      signAll,
      onRateLimitWait,
    });

    expect(onRateLimitWait).toHaveBeenCalledWith({ attempt: 1, waitMs: 1_000 });
  });

  it("signs in sub-batches and returns them in order", async () => {
    const all = txs(12);
    const seen: Transaction[][] = [];
    const signAll = vi.fn(async (batch: Transaction[]) => {
      seen.push(batch);
      return batch;
    });

    const signed = await signAllWithRateLimitBackoff(all, {
      ...options,
      signAll,
      subBatchSize: 5,
    });

    expect(seen.map((batch) => batch.length)).toEqual([5, 5, 2]);
    // Order is load-bearing: the deploy maps signature i back to chunk i.
    expect(signed).toEqual(all);
  });

  it("gives up on a non-rate-limit error without retrying", async () => {
    const expired = new Error("Dynamic session ended before signing");
    expired.name = "UnauthorizedError";
    const signAll = vi.fn().mockRejectedValue(expired);

    await expect(
      signAllWithRateLimitBackoff(txs(2), { ...options, signAll })
    ).rejects.toBe(expired);
    expect(signAll).toHaveBeenCalledTimes(1);
  });

  it("rethrows once the attempts are spent", async () => {
    const signAll = vi.fn().mockRejectedValue(walletApiRateLimited());

    await expect(
      signAllWithRateLimitBackoff(txs(1), {
        ...options,
        signAll,
        maxAttempts: 3,
      })
    ).rejects.toThrow("Rate limited");
    expect(signAll).toHaveBeenCalledTimes(3);
  });

  it("re-stamps the blockhash and re-signs the batch once waiting outlives it", async () => {
    const all = txs(4);
    for (const tx of all) tx.recentBlockhash = "stale";

    let attempted = 0;
    const signAll = vi.fn(async (batch: Transaction[]) => {
      attempted++;
      // Throttle only the very first sub-batch, so the retry is what crosses
      // the blockhash age threshold.
      if (attempted === 1) throw walletApiRateLimited();
      return batch;
    });

    let clock = 0;
    const signed = await signAllWithRateLimitBackoff(all, {
      ...options,
      signAll,
      subBatchSize: 2,
      // The wait pushes the batch past the window it was signed against.
      sleep: async () => {
        clock += BLOCKHASH_MAX_AGE_MS + 1_000;
      },
      now: () => clock,
      refreshBlockhash: async () => "fresh",
    });

    expect(all.every((tx) => tx.recentBlockhash === "fresh")).toBe(true);
    // Restarted from the first sub-batch, so every transaction carries the new
    // blockhash — none is left signed against the stale one.
    expect(signed).toHaveLength(4);
    expect(signed).toEqual(all);
  });

  it("keeps the blockhash when the waiting stays inside the window", async () => {
    const all = txs(2);
    for (const tx of all) tx.recentBlockhash = "stale";
    const refreshBlockhash = vi.fn(async () => "fresh");
    const signAll = vi
      .fn()
      .mockRejectedValueOnce(walletApiRateLimited())
      .mockImplementation(async (batch: Transaction[]) => batch);

    let clock = 0;
    await signAllWithRateLimitBackoff(all, {
      ...options,
      signAll,
      sleep: async () => {
        clock += 1_000;
      },
      now: () => clock,
      refreshBlockhash,
    });

    expect(refreshBlockhash).not.toHaveBeenCalled();
    expect(all.every((tx) => tx.recentBlockhash === "stale")).toBe(true);
  });
});
