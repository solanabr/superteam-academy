/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the admin-signer import so the module graph loads under vitest. */
import { describe, it, expect, vi } from "vitest";
import { Keypair, PublicKey } from "@solana/web3.js";

// admin-signer is a `server-only` module; neutralize the guard so the pure
// creator-validation helper can be imported under the node test runner.
vi.mock("server-only", () => ({}));

import { CREATOR_DENYLIST, assertCreatorAllowed } from "../admin-signer";

const AUTHORITY = Keypair.generate().publicKey;
const NORMAL = Keypair.generate().publicKey;
const COURSE = "course-abc";

describe("CREATOR_DENYLIST", () => {
  it("every entry is a real, on-curve address (not dead code the off-curve check already stops)", () => {
    for (const { address } of CREATOR_DENYLIST) {
      const pk = new PublicKey(address);
      expect(PublicKey.isOnCurve(pk.toBytes())).toBe(true);
    }
  });

  it("includes the four required well-knowns", () => {
    const addrs = CREATOR_DENYLIST.map((e) => e.address);
    expect(addrs).toContain("11111111111111111111111111111111"); // System
    expect(addrs).toContain("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"); // Token
    expect(addrs).toContain("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"); // Token-2022
    expect(addrs).toContain("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"); // ATA
  });
});

describe("assertCreatorAllowed", () => {
  it("passes a normal wallet", () => {
    expect(() =>
      assertCreatorAllowed(NORMAL, AUTHORITY, COURSE, false)
    ).not.toThrow();
  });

  it.each(CREATOR_DENYLIST)(
    "refuses denylisted $label and names the pubkey",
    ({ address, label }) => {
      const creator = new PublicKey(address);
      let thrown: Error | undefined;
      try {
        assertCreatorAllowed(creator, AUTHORITY, COURSE, false);
      } catch (e) {
        thrown = e as Error;
      }
      expect(thrown).toBeInstanceOf(Error);
      expect(thrown?.message).toContain(address);
      expect(thrown?.message).toContain(label);
      expect(thrown?.message).toContain(COURSE);
    }
  );

  it.each(CREATOR_DENYLIST)(
    "allows denylisted $label when allowUnusualCreator is set",
    ({ address }) => {
      const creator = new PublicKey(address);
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      expect(() =>
        assertCreatorAllowed(creator, AUTHORITY, COURSE, true)
      ).not.toThrow();
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    }
  );

  it("refuses creator == platform authority and names the pubkey", () => {
    let thrown: Error | undefined;
    try {
      assertCreatorAllowed(AUTHORITY, AUTHORITY, COURSE, false);
    } catch (e) {
      thrown = e as Error;
    }
    expect(thrown).toBeInstanceOf(Error);
    expect(thrown?.message).toContain(AUTHORITY.toBase58());
    expect(thrown?.message.toLowerCase()).toContain("authority");
    expect(thrown?.message).toContain(COURSE);
  });

  it("allows creator == authority when allowUnusualCreator is set", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() =>
      assertCreatorAllowed(AUTHORITY, AUTHORITY, COURSE, true)
    ).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
