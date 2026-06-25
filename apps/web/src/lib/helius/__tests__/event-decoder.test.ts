/* eslint-disable import/order -- vi.mock() must sit between the vitest import
   and the module-under-test import (vitest hoists mocks), so imports can't be
   contiguous as import/order wants. */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Anchor coder so we control decode() without crafting real Borsh bytes.
const decode = vi.fn();
vi.mock("@coral-xyz/anchor", () => ({
  BorshEventCoder: class {
    decode(data: string) {
      return decode(data);
    }
  },
}));

import {
  decodeEventsFromTransaction,
  normalizeEventData,
} from "../event-decoder";
import type { HeliusRawTransaction } from "../types";

// event-decoder.ts throws at import unless NEXT_PUBLIC_PROGRAM_ID is set;
// vitest.setup.ts provides a fixed test value. Fall back so a dropped setup
// surfaces as a clear assertion failure here, not an opaque module-init error.
const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "";

function tx(
  logMessages: string[],
  opts: { err?: unknown; signatures?: string[] } = {}
): HeliusRawTransaction {
  return {
    transaction: { signatures: opts.signatures ?? ["sig-1"] },
    meta: { logMessages, err: opts.err ?? null },
  } as unknown as HeliusRawTransaction;
}

beforeEach(() => {
  decode.mockReset();
});

describe("decodeEventsFromTransaction", () => {
  it("returns no events for a failed transaction", () => {
    const result = decodeEventsFromTransaction(
      tx([`Program ${PROGRAM_ID} invoke [1]`, "Program data: AAAA"], {
        err: { InstructionError: [0, "Custom"] },
      })
    );
    expect(result.events).toEqual([]);
    expect(result.signature).toBe("sig-1");
    expect(decode).not.toHaveBeenCalled();
  });

  it("decodes only Program data emitted inside our program", () => {
    decode.mockImplementation((data: string) => {
      if (data === "INSIDE") return { name: "XpMinted", data: { amount: 50 } };
      throw new Error(`unexpected decode of ${data}`);
    });

    const result = decodeEventsFromTransaction(
      tx([
        "Program data: OUTSIDE", // before our program is invoked — must be ignored
        `Program ${PROGRAM_ID} invoke [1]`,
        "Program data: INSIDE",
        `Program ${PROGRAM_ID} success`,
        "Program data: AFTER", // after exit — must be ignored
      ])
    );

    expect(decode).toHaveBeenCalledTimes(1);
    expect(decode).toHaveBeenCalledWith("INSIDE");
    expect(result.events).toEqual([{ name: "XpMinted", data: { amount: 50 } }]);
  });

  it("skips entries the coder cannot decode without throwing", () => {
    decode.mockImplementation(() => {
      throw new Error("bad borsh");
    });
    const result = decodeEventsFromTransaction(
      tx([
        `Program ${PROGRAM_ID} invoke [1]`,
        "Program data: GARBAGE",
        `Program ${PROGRAM_ID} success`,
      ])
    );
    expect(result.events).toEqual([]);
  });

  it("defaults the signature to empty string when none present", () => {
    const result = decodeEventsFromTransaction(tx([], { signatures: [] }));
    expect(result.signature).toBe("");
  });
});

describe("normalizeEventData", () => {
  it("converts snake_case keys to camelCase", () => {
    expect(normalizeEventData({ lesson_index: 3 })).toEqual({ lessonIndex: 3 });
  });

  it("converts BN-like values via toNumber()", () => {
    const bn = { toNumber: () => 2000 };
    expect(normalizeEventData({ amount: bn })).toEqual({ amount: 2000 });
  });

  it("converts PublicKey-like values via toBase58()", () => {
    const pk = { toBase58: () => "Abc123" };
    expect(normalizeEventData({ user: pk })).toEqual({ user: "Abc123" });
  });

  it("prefers toBase58 over toNumber when both exist", () => {
    const both = { toBase58: () => "pk", toNumber: () => 1 };
    expect(normalizeEventData({ key: both })).toEqual({ key: "pk" });
  });

  it("passes through primitives unchanged", () => {
    expect(
      normalizeEventData({ flag: true, name: "x", count: 0, missing: null })
    ).toEqual({ flag: true, name: "x", count: 0, missing: null });
  });
});
