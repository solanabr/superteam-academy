/* eslint-disable import/order -- vi.mock() must sit between the vitest import
   and the module-under-test import (vitest hoists mocks), so imports can't be
   contiguous as import/order wants. */
import { afterEach, describe, it, expect, vi, beforeEach } from "vitest";

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
  LOG_FRAMES_UNTRUSTED_CODE,
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

describe("decodeEventsFromTransaction: program invocation frames", () => {
  const OTHER = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
  const THIRD = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

  const invoke = (id: string, depth: number) =>
    `Program ${id} invoke [${depth}]`;
  const success = (id: string) => `Program ${id} success`;
  const data = (label: string) => `Program data: ${label}`;

  /** Labels handed to the coder, in order. Every label decodes. */
  function decodedLabels(logMessages: string[]): string[] {
    decode.mockImplementation((label: string) => ({
      name: label,
      data: {},
    }));
    return decodeEventsFromTransaction(tx(logMessages)).events.map(
      (event) => event.name
    );
  }

  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  describe("only whole runtime lines open or close a frame", () => {
    it.each([
      ["a Program log line", `Program log: Program ${PROGRAM_ID} invoke [1]`],
      ["trailing text", `Program ${PROGRAM_ID} invoke [1] trailing`],
      ["leading text", ` Program ${PROGRAM_ID} invoke [1]`],
      ["no depth", `Program ${PROGRAM_ID} invoke`],
      ["an empty depth", `Program ${PROGRAM_ID} invoke []`],
      ["a non-numeric depth", `Program ${PROGRAM_ID} invoke [one]`],
      [
        "an embedded newline",
        `Program log: x\nProgram ${PROGRAM_ID} invoke [1]`,
      ],
      ["a trailing newline", `Program ${PROGRAM_ID} invoke [1]\n`],
    ])("does not enter our frame on %s", (_label, line) => {
      expect(
        decodedLabels([invoke(OTHER, 1), line, data("FOREIGN"), success(OTHER)])
      ).toEqual([]);
      expect(decode).not.toHaveBeenCalled();
    });

    it("ignores the same text with no frame open at all", () => {
      expect(
        decodedLabels([
          `Program log: Program ${PROGRAM_ID} invoke [1]`,
          data("X"),
        ])
      ).toEqual([]);
    });

    it.each([
      ["success", `Program log: Program ${PROGRAM_ID} success`],
      ["failed", `Program log: Program ${PROGRAM_ID} failed: custom error`],
      ["trailing text", `Program ${PROGRAM_ID} success trailing`],
      ["a bare failed", `Program ${PROGRAM_ID} failed`],
    ])("does not leave our frame on %s text", (_label, line) => {
      expect(
        decodedLabels([
          invoke(PROGRAM_ID, 1),
          line,
          data("OURS"),
          success(PROGRAM_ID),
        ])
      ).toEqual(["OURS"]);
    });

    it("does not switch frames on invoke text logged by our program", () => {
      expect(
        decodedLabels([
          invoke(PROGRAM_ID, 1),
          `Program log: Program ${OTHER} invoke [2]`,
          data("OURS"),
          success(PROGRAM_ID),
        ])
      ).toEqual(["OURS"]);
    });

    it("decodes only lines that start with the data prefix", () => {
      expect(
        decodedLabels([
          invoke(PROGRAM_ID, 1),
          "Program log: Program data: LOGGED",
          "Program data:NOSPACE",
          data("OURS"),
          success(PROGRAM_ID),
        ])
      ).toEqual(["OURS"]);
    });
  });

  describe("another program's data", () => {
    it("is not decoded after invoke text in its own frame", () => {
      expect(
        decodedLabels([
          invoke(OTHER, 1),
          `Program log: Program ${PROGRAM_ID} invoke [1]`,
          data("FOREIGN"),
          `Program log: Program ${PROGRAM_ID} success`,
          data("FOREIGN_2"),
          success(OTHER),
        ])
      ).toEqual([]);
    });

    it("is not decoded when our real frame opened earlier in the transaction", () => {
      expect(
        decodedLabels([
          invoke(PROGRAM_ID, 1),
          data("OURS"),
          success(PROGRAM_ID),
          invoke(OTHER, 1),
          `Program log: Program ${PROGRAM_ID} invoke [1]`,
          data("FOREIGN"),
          success(OTHER),
        ])
      ).toEqual(["OURS"]);
    });
  });

  describe("nested CPI ordering", () => {
    it("skips data from a program ours calls, then resumes for ours", () => {
      expect(
        decodedLabels([
          invoke(PROGRAM_ID, 1),
          data("BEFORE"),
          invoke(OTHER, 2),
          data("FOREIGN"),
          success(OTHER),
          data("AFTER"),
          success(PROGRAM_ID),
        ])
      ).toEqual(["BEFORE", "AFTER"]);
    });

    it("decodes ours inside an outer program's CPI, and not the outer data around it", () => {
      expect(
        decodedLabels([
          invoke(OTHER, 1),
          data("OUTER_BEFORE"),
          invoke(PROGRAM_ID, 2),
          data("OURS"),
          success(PROGRAM_ID),
          data("OUTER_AFTER"),
          success(OTHER),
        ])
      ).toEqual(["OURS"]);
    });

    it("attributes every level of a deep chain to its own frame", () => {
      expect(
        decodedLabels([
          invoke(OTHER, 1),
          invoke(PROGRAM_ID, 2),
          data("OURS_2"),
          invoke(THIRD, 3),
          data("THIRD_3"),
          invoke(PROGRAM_ID, 4),
          data("OURS_4"),
          success(PROGRAM_ID),
          data("THIRD_3_AFTER"),
          success(THIRD),
          data("OURS_2_AFTER"),
          success(PROGRAM_ID),
          data("OUTER_AFTER"),
          success(OTHER),
        ])
      ).toEqual(["OURS_2", "OURS_4", "OURS_2_AFTER"]);
    });

    it("keeps our frame after ours calls itself", () => {
      expect(
        decodedLabels([
          invoke(PROGRAM_ID, 1),
          invoke(PROGRAM_ID, 2),
          data("INNER"),
          success(PROGRAM_ID),
          data("OUTER"),
          success(PROGRAM_ID),
        ])
      ).toEqual(["INNER", "OUTER"]);
    });

    it("tracks several top-level instructions independently", () => {
      expect(
        decodedLabels([
          invoke(OTHER, 1),
          success(OTHER),
          invoke(PROGRAM_ID, 1),
          data("FIRST"),
          success(PROGRAM_ID),
          invoke(OTHER, 1),
          data("FOREIGN"),
          success(OTHER),
          invoke(PROGRAM_ID, 1),
          data("SECOND"),
          success(PROGRAM_ID),
        ])
      ).toEqual(["FIRST", "SECOND"]);
    });

    it("closes a frame on a failed line", () => {
      expect(
        decodedLabels([
          invoke(PROGRAM_ID, 1),
          invoke(OTHER, 2),
          `Program ${OTHER} failed: custom program error: 0x0`,
          data("OURS"),
          success(PROGRAM_ID),
        ])
      ).toEqual(["OURS"]);
    });
  });

  describe("truncated logs", () => {
    it("keeps events before the marker and decodes nothing after it", () => {
      // The collector drops only lines that overflow its budget, so a shorter
      // line can land after the marker with its enclosing invoke line missing.
      expect(
        decodedLabels([
          invoke(PROGRAM_ID, 1),
          data("BEFORE"),
          "Log truncated",
          data("AFTER"),
          success(PROGRAM_ID),
        ])
      ).toEqual(["BEFORE"]);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toBe(`[${LOG_FRAMES_UNTRUSTED_CODE}]`);
      expect(warn.mock.calls[0]?.[1]).toMatchObject({
        signature: "sig-1",
        reason: "truncated",
      });
    });

    it("decodes events when the array just ends inside our frame", () => {
      expect(decodedLabels([invoke(PROGRAM_ID, 1), data("BEFORE")])).toEqual([
        "BEFORE",
      ]);
      expect(warn).not.toHaveBeenCalled();
    });

    it("does not treat logged marker text as truncation", () => {
      expect(
        decodedLabels([
          invoke(PROGRAM_ID, 1),
          "Program log: Log truncated",
          data("OURS"),
          success(PROGRAM_ID),
        ])
      ).toEqual(["OURS"]);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe("logs that break the stack discipline", () => {
    it.each([
      [
        "an invoke that skips a depth",
        [
          invoke(PROGRAM_ID, 1),
          data("BEFORE"),
          invoke(OTHER, 3),
          data("AFTER"),
        ],
      ],
      [
        "an invoke at a shallower depth",
        [
          invoke(PROGRAM_ID, 1),
          data("BEFORE"),
          invoke(PROGRAM_ID, 1),
          data("AFTER"),
        ],
      ],
      [
        "an exit naming a program that is not current",
        [invoke(PROGRAM_ID, 1), data("BEFORE"), success(OTHER), data("AFTER")],
      ],
    ])("stops decoding at %s", (_label, logMessages) => {
      expect(decodedLabels(logMessages)).toEqual(["BEFORE"]);
      expect(warn.mock.calls[0]?.[1]).toMatchObject({
        signature: "sig-1",
        reason: "malformed",
      });
    });

    it("stops decoding at an exit with no frame open", () => {
      expect(
        decodedLabels([
          success(PROGRAM_ID),
          invoke(PROGRAM_ID, 1),
          data("AFTER"),
        ])
      ).toEqual([]);
    });

    it("stops decoding when the first invoke is not at depth 1", () => {
      expect(decodedLabels([invoke(PROGRAM_ID, 2), data("AFTER")])).toEqual([]);
    });
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
