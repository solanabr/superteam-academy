import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ComputeBudgetProgram, type Connection } from "@solana/web3.js";
import {
  writeComputeBudgetIxs,
  priorityFeeIx,
  sendAllBounded,
  confirmBatch,
  is429,
  parseRetryAfterMs,
  nextResendInterval,
} from "../deploy";

// ---------------------------------------------------------------------------
// Item 4 — setComputeUnitLimit on the write txs (not the one-off txs)
// ---------------------------------------------------------------------------
describe("compute budget (item 4)", () => {
  const CB = ComputeBudgetProgram.programId.toBase58();

  it("write txs carry an explicit SetComputeUnitLimit AND the price", () => {
    const ixs = writeComputeBudgetIxs();
    expect(ixs).toHaveLength(2);

    // First ix: SetComputeUnitLimit (discriminator 2, u32 LE units).
    const [limitIx, priceIx] = ixs;
    expect(limitIx!.programId.toBase58()).toBe(CB);
    expect(limitIx!.data[0]).toBe(2); // SetComputeUnitLimit discriminator
    expect(limitIx!.data.readUInt32LE(1)).toBe(10_000); // WRITE_CU_LIMIT

    // Second ix: SetComputeUnitPrice (discriminator 3).
    expect(priceIx!.programId.toBase58()).toBe(CB);
    expect(priceIx!.data[0]).toBe(3);
  });

  it("the one-off (buffer/deploy) txs stay price-only — no CU limit reserved-budget change", () => {
    // Surgical scope: the deploy tx needs the full default budget for the
    // loader's ELF verification, so priorityFeeIx must NOT add a limit.
    const ix = priorityFeeIx();
    expect(ix.programId.toBase58()).toBe(CB);
    expect(ix.data[0]).toBe(3); // SetComputeUnitPrice only, never a limit (2)
  });
});

// ---------------------------------------------------------------------------
// Item 3 — bounded-concurrency sender
// ---------------------------------------------------------------------------
describe("sendAllBounded (item 3)", () => {
  /** A connection whose sendRawTransaction tracks peak in-flight and echoes the
   * first byte into the signature, so we can assert both the bound and that
   * signatures stay index-aligned to their input txs. */
  function trackingConnection() {
    let inFlight = 0;
    let maxInFlight = 0;
    const sendRawTransaction = vi.fn(async (raw: Uint8Array) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return `sig-${raw[0]}`;
    });
    return {
      connection: { sendRawTransaction } as unknown as Connection,
      sendRawTransaction,
      peak: () => maxInFlight,
    };
  }

  const txs = (n: number) =>
    Array.from({ length: n }, (_, i) => Uint8Array.of(i));

  it("returns signatures index-aligned to the input txs", async () => {
    const { connection } = trackingConnection();
    const sigs = await sendAllBounded(connection, txs(30), 8);
    expect(sigs).toHaveLength(30);
    // signatures[i] must correspond to serializedTxs[i] — confirmBatch relies on
    // this to rebroadcast the right bytes for a dropped signature.
    for (let i = 0; i < 30; i++) expect(sigs[i]).toBe(`sig-${i}`);
  });

  it("never exceeds the concurrency bound, and saturates it when work remains", async () => {
    const { connection, peak } = trackingConnection();
    await sendAllBounded(connection, txs(30), 8);
    expect(peak()).toBe(8); // exactly saturated, never above
  });

  it("honours the default bound (SEND_CONCURRENCY = 12)", async () => {
    const { connection, peak } = trackingConnection();
    await sendAllBounded(connection, txs(30)); // default concurrency
    expect(peak()).toBe(12);
  });

  it("caps workers at the number of txs when fewer than the bound", async () => {
    const { connection, peak } = trackingConnection();
    const sigs = await sendAllBounded(connection, txs(3), 12);
    expect(peak()).toBe(3);
    expect(sigs).toEqual(["sig-0", "sig-1", "sig-2"]);
  });
});

// ---------------------------------------------------------------------------
// Item 7 — rebroadcast backoff: pure decision function
// ---------------------------------------------------------------------------
describe("rebroadcast backoff decision (item 7)", () => {
  it("is429 recognises rate-limit shapes and ignores others", () => {
    expect(
      is429(new Error("Server responded with 429 Too Many Requests"))
    ).toBe(true);
    expect(is429(new Error("rate limited, slow down"))).toBe(true);
    expect(is429("429")).toBe(true);
    expect(is429(new Error("blockhash not found"))).toBe(false);
    expect(is429(new Error("Transaction simulation failed"))).toBe(false);
  });

  it("parseRetryAfterMs scrapes an explicit hint, else null", () => {
    expect(parseRetryAfterMs(new Error("429; Retry-After: 3"))).toBe(3000);
    expect(parseRetryAfterMs(new Error("retry after 10 seconds"))).toBe(10_000);
    expect(parseRetryAfterMs(new Error("429 Too Many Requests"))).toBeNull();
  });

  it("a clean cycle relaxes to the base cadence (4s)", () => {
    expect(nextResendInterval(16_000, null)).toBe(4_000);
  });

  it("a 429 doubles the interval (exponential backoff)", () => {
    expect(nextResendInterval(4_000, new Error("429"))).toBe(8_000);
    expect(nextResendInterval(8_000, new Error("too many requests"))).toBe(
      16_000
    );
  });

  it("backoff is capped at MAX_RESEND_INTERVAL_MS (30s)", () => {
    expect(nextResendInterval(20_000, new Error("429"))).toBe(30_000);
  });

  it("honours an explicit Retry-After over exponential backoff", () => {
    expect(nextResendInterval(4_000, new Error("429 Retry-After: 2"))).toBe(
      2_000
    );
  });
});

// ---------------------------------------------------------------------------
// Item 7 — confirmBatch rebroadcast: cap + stagger + backoff, under fake timers
// ---------------------------------------------------------------------------
describe("confirmBatch rebroadcast (item 7)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const sigs = (n: number) => Array.from({ length: n }, (_, i) => `s${i}`);
  const txs = (n: number) =>
    Array.from({ length: n }, (_, i) => Uint8Array.of(i));
  const allNull = (n: number) =>
    Promise.resolve({ value: Array.from({ length: n }, () => null) });

  it("confirms via polling without rebroadcasting when txs land", async () => {
    const sendRawTransaction = vi.fn();
    const getSignatureStatuses = vi.fn(async (pending: string[]) => ({
      value: pending.map(() => ({
        err: null,
        confirmationStatus: "confirmed" as const,
      })),
    }));
    const connection = {
      sendRawTransaction,
      getSignatureStatuses,
    } as unknown as Connection;

    const onConfirmed = vi.fn();
    const p = confirmBatch(connection, txs(3), sigs(3), onConfirmed, 30_000);
    await vi.advanceTimersByTimeAsync(1_000);
    await p;

    expect(onConfirmed).toHaveBeenCalledTimes(3);
    expect(sendRawTransaction).not.toHaveBeenCalled(); // nothing dropped → no resend
  });

  it("caps a resend cycle at MAX_RESENDS_PER_CYCLE (15), not the whole batch", async () => {
    const sendRawTransaction = vi.fn(async () => "ok");
    const getSignatureStatuses = vi.fn(async (pending: string[]) =>
      allNull(pending.length)
    ); // nothing ever confirms → forces a resend, then times out
    const connection = {
      sendRawTransaction,
      getSignatureStatuses,
    } as unknown as Connection;

    const p = confirmBatch(connection, txs(30), sigs(30), undefined, 5_000);
    const guarded = p.catch((e: Error) => e); // expect a timeout rejection
    await vi.advanceTimersByTimeAsync(6_000);
    const err = await guarded;

    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toMatch(/Timed out/);
    // Old code fired all 30 back-to-back per cycle; now one cycle resends <= 15.
    expect(sendRawTransaction.mock.calls.length).toBe(15);
  });

  it("backs off the resend cadence after a 429 (gap grows ~4s → ~8s)", async () => {
    const callTimes: number[] = [];
    const sendRawTransaction = vi.fn(async () => {
      callTimes.push(Date.now());
      throw new Error("Server responded with 429 Too Many Requests");
    });
    const getSignatureStatuses = vi.fn(async (pending: string[]) =>
      allNull(pending.length)
    );
    const connection = {
      sendRawTransaction,
      getSignatureStatuses,
    } as unknown as Connection;

    const p = confirmBatch(connection, txs(1), sigs(1), undefined, 40_000);
    const guarded = p.catch((e: Error) => e);
    await vi.advanceTimersByTimeAsync(41_000);
    await guarded;

    // First resend ~4s; after the 429 the interval doubles, so the next resend
    // is ~8s later (not another ~4s). Prove the gap grew.
    expect(callTimes.length).toBeGreaterThanOrEqual(2);
    expect(callTimes[0]).toBeGreaterThanOrEqual(4_000);
    const firstGap = callTimes[1]! - callTimes[0]!;
    expect(firstGap).toBeGreaterThanOrEqual(7_500); // ~8s, backed off from 4s
  });
});
