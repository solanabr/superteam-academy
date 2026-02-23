import { describe, expect, it } from "vitest";
import { PublicKey } from "@solana/web3.js";
import {
  parsePublicKey,
  readFixedLengthNumberArrayOrNull,
  readNullableBoolean,
  readNullableNumber,
  readOptionalNumber,
  readOptionalPublicKey,
  readOptionalString,
  readRequiredNumber,
  readRequiredPublicKey,
  readRequiredString,
  type JsonObject,
} from "./validation.js";

const VALID_PUBKEY = "11111111111111111111111111111111";

describe("readRequiredString", () => {
  it("returns string when present", () => {
    expect(readRequiredString({ a: "x" }, "a")).toBe("x");
  });
  it("throws when missing", () => {
    expect(() => readRequiredString({}, "a")).toThrow(/a is required/);
  });
  it("throws when not a string", () => {
    expect(() => readRequiredString({ a: 1 }, "a")).toThrow(/a is required/);
    expect(() => readRequiredString({ a: null }, "a")).toThrow(/a is required/);
  });
});

describe("readOptionalString", () => {
  it("returns string when present", () => {
    expect(readOptionalString({ a: "x" }, "a")).toBe("x");
  });
  it("returns defaultValue when missing", () => {
    expect(readOptionalString({}, "a", "def")).toBe("def");
  });
  it("returns undefined when missing and no default", () => {
    expect(readOptionalString({}, "a")).toBeUndefined();
  });
  it("throws when present but not string", () => {
    expect(() => readOptionalString({ a: 1 }, "a")).toThrow(/a must be a string/);
  });
});

describe("readRequiredNumber", () => {
  it("returns number when valid", () => {
    expect(readRequiredNumber({ n: 42 }, "n")).toBe(42);
  });
  it("throws when missing", () => {
    expect(() => readRequiredNumber({}, "n")).toThrow(/n is required/);
  });
  it("throws when not finite", () => {
    expect(() => readRequiredNumber({ n: NaN }, "n")).toThrow(/n must be a finite number/);
    expect(() => readRequiredNumber({ n: Infinity }, "n")).toThrow(/n must be a finite number/);
  });
  it("enforces integer", () => {
    expect(readRequiredNumber({ n: 1 }, "n", { integer: true })).toBe(1);
    expect(() => readRequiredNumber({ n: 1.5 }, "n", { integer: true })).toThrow(/n must be an integer/);
  });
  it("enforces min", () => {
    expect(readRequiredNumber({ n: 10 }, "n", { min: 5 })).toBe(10);
    expect(() => readRequiredNumber({ n: 3 }, "n", { min: 5 })).toThrow(/n must be >= 5/);
  });
});

describe("readOptionalNumber", () => {
  it("returns number when present", () => {
    expect(readOptionalNumber({ n: 42 }, "n")).toBe(42);
  });
  it("returns defaultValue when missing", () => {
    expect(readOptionalNumber({}, "n", { defaultValue: 10 })).toBe(10);
  });
  it("returns undefined when missing and no default", () => {
    expect(readOptionalNumber({}, "n")).toBeUndefined();
  });
  it("enforces min", () => {
    expect(() => readOptionalNumber({ n: -1 }, "n", { min: 0 })).toThrow(/n must be >= 0/);
  });
});

describe("readNullableNumber", () => {
  it("returns number when present", () => {
    expect(readNullableNumber({ n: 42 }, "n")).toBe(42);
  });
  it("returns null when undefined", () => {
    expect(readNullableNumber({}, "n")).toBeNull();
  });
  it("returns null when null", () => {
    expect(readNullableNumber({ n: null }, "n")).toBeNull();
  });
  it("throws when invalid type", () => {
    expect(() => readNullableNumber({ n: "x" }, "n")).toThrow(/n must be a finite number/);
  });
});

describe("readNullableBoolean", () => {
  it("returns boolean when present", () => {
    expect(readNullableBoolean({ b: true }, "b")).toBe(true);
    expect(readNullableBoolean({ b: false }, "b")).toBe(false);
  });
  it("returns null when undefined or null", () => {
    expect(readNullableBoolean({}, "b")).toBeNull();
    expect(readNullableBoolean({ b: null }, "b")).toBeNull();
  });
  it("throws when not boolean", () => {
    expect(() => readNullableBoolean({ b: 1 }, "b")).toThrow(/b must be a boolean/);
  });
});

describe("readFixedLengthNumberArrayOrNull", () => {
  it("returns array when valid", () => {
    const arr = new Array(32).fill(0);
    expect(readFixedLengthNumberArrayOrNull({ a: arr }, "a", 32)).toEqual(arr);
  });
  it("returns null when undefined or null", () => {
    expect(readFixedLengthNumberArrayOrNull({}, "a", 32)).toBeNull();
    expect(readFixedLengthNumberArrayOrNull({ a: null }, "a", 32)).toBeNull();
  });
  it("throws when not array", () => {
    expect(() => readFixedLengthNumberArrayOrNull({ a: "x" }, "a", 32)).toThrow(
      /a must be an array of numbers/
    );
  });
  it("throws when wrong length", () => {
    expect(() =>
      readFixedLengthNumberArrayOrNull({ a: [0, 0] }, "a", 32)
    ).toThrow(/a must have length 32/);
  });
  it("throws when array contains non-number", () => {
    const bad = [...Array(31).fill(0), "x"];
    expect(() => readFixedLengthNumberArrayOrNull({ a: bad }, "a", 32)).toThrow();
  });
});

describe("parsePublicKey", () => {
  it("returns PublicKey for valid base58", () => {
    const pk = parsePublicKey(VALID_PUBKEY, "p");
    expect(pk).toBeInstanceOf(PublicKey);
    expect(pk.toBase58()).toBe(VALID_PUBKEY);
  });
  it("throws when not string", () => {
    expect(() => parsePublicKey(1, "p")).toThrow(/p must be a base58 public key string/);
  });
  it("throws when invalid base58", () => {
    expect(() => parsePublicKey("not-valid", "p")).toThrow(/p is not a valid public key/);
  });
});

describe("readRequiredPublicKey", () => {
  it("returns PublicKey when valid", () => {
    const body: JsonObject = { p: VALID_PUBKEY };
    const pk = readRequiredPublicKey(body, "p");
    expect(pk.toBase58()).toBe(VALID_PUBKEY);
  });
  it("throws when missing", () => {
    expect(() => readRequiredPublicKey({}, "p")).toThrow(/p must be a base58 public key string/);
  });
});

describe("readOptionalPublicKey", () => {
  it("returns PublicKey when present", () => {
    const body: JsonObject = { p: VALID_PUBKEY };
    const pk = readOptionalPublicKey(body, "p");
    expect(pk?.toBase58()).toBe(VALID_PUBKEY);
  });
  it("returns defaultValue when missing", () => {
    const def = new PublicKey(VALID_PUBKEY);
    const pk = readOptionalPublicKey({}, "p", def);
    expect(pk).toBe(def);
  });
  it("returns undefined when missing and no default", () => {
    expect(readOptionalPublicKey({}, "p")).toBeUndefined();
  });
});
