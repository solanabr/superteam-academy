// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Keypair } from "@solana/web3.js";
import {
  LabKeyStorageError,
  createLabKeypair,
  forgetLabKeypair,
  labKeypairStorageKey,
  readLabKeypair,
  readStoredLabSecret,
  subscribeLabKeypair,
  wasLabKeypairForgotten,
} from "../lab-keypair";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("lab keypair store", () => {
  it("has no key for a user until one is created", () => {
    expect(readLabKeypair("user-1")).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it("creates the key from the platform's secure random source", () => {
    const seed = Uint8Array.from({ length: 32 }, (_, i) => i + 1);
    const random = vi
      .spyOn(crypto, "getRandomValues")
      .mockImplementation((array) => {
        (array as Uint8Array).set(seed);
        return array;
      });

    const key = createLabKeypair("user-1");

    expect(random).toHaveBeenCalledTimes(1);
    expect(key.publicKey.toBase58()).toBe(
      Keypair.fromSeed(seed).publicKey.toBase58()
    );
  });

  it("reads the same key back after the page's memory is gone", () => {
    const created = createLabKeypair("user-1");
    // A reload keeps only what is in storage.
    const stored = localStorage.getItem(labKeypairStorageKey("user-1"));
    localStorage.clear();
    localStorage.setItem(labKeypairStorageKey("user-1"), stored ?? "");

    const read = readLabKeypair("user-1");
    expect(read?.publicKey.toBase58()).toBe(created.publicKey.toBase58());
    expect(Array.from(read?.secretKey ?? [])).toEqual(
      Array.from(created.secretKey)
    );
  });

  it("keeps the key out of session storage", () => {
    createLabKeypair("user-1");
    expect(sessionStorage.length).toBe(0);
  });

  it("stores the secret as a plain 64-byte array a learner can export", () => {
    const created = createLabKeypair("user-1");
    const raw = readStoredLabSecret("user-1");
    expect(JSON.parse(raw ?? "null")).toEqual(Array.from(created.secretKey));
  });

  it("returns the stored key, not a new one, on a second create", () => {
    const first = createLabKeypair("user-1");
    const second = createLabKeypair("user-1");
    expect(second.publicKey.toBase58()).toBe(first.publicKey.toBase58());
  });

  it("gives two accounts on one browser different keys", () => {
    const a = createLabKeypair("user-a");
    const b = createLabKeypair("user-b");
    expect(a.publicKey.toBase58()).not.toBe(b.publicKey.toBase58());
    expect(readLabKeypair("user-a")?.publicKey.toBase58()).toBe(
      a.publicKey.toBase58()
    );
    expect(readLabKeypair("user-b")?.publicKey.toBase58()).toBe(
      b.publicKey.toBase58()
    );
    expect(labKeypairStorageKey("user-a")).not.toBe(
      labKeypairStorageKey("user-b")
    );
  });

  it.each([
    ["text that is not JSON", "not json"],
    ["an array of the wrong length", JSON.stringify([1, 2, 3])],
    ["bytes out of range", JSON.stringify(Array(64).fill(256))],
    [
      "a secret whose public half does not match",
      JSON.stringify(Array(64).fill(7)),
    ],
  ])("treats %s as no key", (_name, raw) => {
    localStorage.setItem(labKeypairStorageKey("user-1"), raw);
    expect(readLabKeypair("user-1")).toBeNull();
  });

  it("replaces an unreadable stored value on create", () => {
    localStorage.setItem(labKeypairStorageKey("user-1"), "not json");
    const created = createLabKeypair("user-1");
    expect(readLabKeypair("user-1")?.publicKey.toBase58()).toBe(
      created.publicKey.toBase58()
    );
  });

  it("refuses to hand out a key it could not store", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage is full");
    });
    expect(() => createLabKeypair("user-1")).toThrow(LabKeyStorageError);
  });

  it("forgets one user's key and leaves the other's", () => {
    createLabKeypair("user-a");
    const b = createLabKeypair("user-b");

    forgetLabKeypair("user-a");

    expect(readLabKeypair("user-a")).toBeNull();
    expect(localStorage.getItem(labKeypairStorageKey("user-a"))).toBeNull();
    expect(readLabKeypair("user-b")?.publicKey.toBase58()).toBe(
      b.publicKey.toBase58()
    );
  });

  it("creates a different key after the old one is forgotten", () => {
    const first = createLabKeypair("user-1");
    forgetLabKeypair("user-1");
    const second = createLabKeypair("user-1");
    expect(second.publicKey.toBase58()).not.toBe(first.publicKey.toBase58());
  });

  it("remembers a forget until the next create", () => {
    createLabKeypair("user-1");
    expect(wasLabKeypairForgotten("user-1")).toBe(false);
    forgetLabKeypair("user-1");
    expect(wasLabKeypairForgotten("user-1")).toBe(true);
    createLabKeypair("user-1");
    expect(wasLabKeypairForgotten("user-1")).toBe(false);
  });

  it("tells subscribers when a key is created or forgotten", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLabKeypair(listener);

    createLabKeypair("user-1");
    expect(listener).toHaveBeenCalledTimes(1);
    forgetLabKeypair("user-1");
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    createLabKeypair("user-1");
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
