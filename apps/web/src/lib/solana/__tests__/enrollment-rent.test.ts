import { describe, it, expect, vi } from "vitest";
import { BorshCoder, Program, type Idl } from "@coral-xyz/anchor";
import type { Provider } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import IDL from "../idl/superteam_academy.json";
import VNEXT_IDL from "../idl/superteam_academy_vnext.json";
import {
  ENROLLMENT_SIZE,
  LEGACY_ENROLLMENT_SIZE,
  enrollmentRentRecipient,
  fetchEnrollmentRentRecipient,
} from "../enrollment-rent";
import { findEnrollmentPDA } from "../pda";

const PROGRAM_ID = new PublicKey("11111111111111111111111111111112");

const ENROLLMENT_DISCRIMINATOR = Buffer.from(
  VNEXT_IDL.accounts.find((a) => a.name === "Enrollment")!.discriminator
);

/**
 * A finalized, credentialed enrollment, Borsh-laid-out by hand: the largest
 * body, exactly 127 bytes.
 */
function enrollmentBody(): Buffer {
  const u64 = (v: bigint) => {
    const b = Buffer.alloc(8);
    b.writeBigUInt64LE(v);
    return b;
  };
  const body = Buffer.concat([
    ENROLLMENT_DISCRIMINATOR,
    Keypair.generate().publicKey.toBuffer(), // course
    u64(1_700_000_000n), // enrolled_at
    Buffer.from([1]), // completed_at: Some
    u64(1_700_500_000n),
    u64(7n), // lesson_flags
    u64(0n),
    u64(0n),
    u64(1n),
    Buffer.from([1]), // credential_asset: Some
    Keypair.generate().publicKey.toBuffer(),
    Buffer.from([3, 0, 0, 0]), // course_gen (`_reserved` in the IDL)
    Buffer.from([254]), // bump
  ]);
  expect(body.length).toBe(LEGACY_ENROLLMENT_SIZE);
  return body;
}

/** The body padded to 127 bytes, optionally followed by the 32-byte payer. */
function enrollmentAccount(payer?: PublicKey): Buffer {
  const body = Buffer.alloc(LEGACY_ENROLLMENT_SIZE);
  enrollmentBody().copy(body);
  return payer ? Buffer.concat([body, payer.toBuffer()]) : body;
}

describe("enrollmentRentRecipient", () => {
  const learner = Keypair.generate().publicKey;

  it("reads the recorded payer from a 159-byte enrollment", () => {
    const sponsor = Keypair.generate().publicKey;
    const data = enrollmentAccount(sponsor);
    expect(data.length).toBe(ENROLLMENT_SIZE);
    expect(enrollmentRentRecipient(data, learner).equals(sponsor)).toBe(true);
  });

  it("refunds the learner for a legacy 127-byte enrollment", () => {
    const data = enrollmentAccount();
    expect(data.length).toBe(LEGACY_ENROLLMENT_SIZE);
    expect(enrollmentRentRecipient(data, learner).equals(learner)).toBe(true);
  });

  it("refuses any other size instead of guessing", () => {
    for (const size of [0, 126, 128, 158, 160]) {
      expect(() =>
        enrollmentRentRecipient(new Uint8Array(size), learner)
      ).toThrow(/Unexpected Enrollment account size/);
    }
  });
});

describe("fetchEnrollmentRentRecipient", () => {
  it("reads the learner's Enrollment PDA", async () => {
    const learner = Keypair.generate().publicKey;
    const sponsor = Keypair.generate().publicKey;
    const getAccountInfo = vi.fn(() =>
      Promise.resolve({ data: enrollmentAccount(sponsor) })
    );
    const connection = { getAccountInfo } as unknown as Connection;

    const recipient = await fetchEnrollmentRentRecipient(
      connection,
      "course-1",
      learner,
      PROGRAM_ID
    );

    expect(recipient.equals(sponsor)).toBe(true);
    const [pda] = findEnrollmentPDA("course-1", learner, PROGRAM_ID);
    expect(getAccountInfo).toHaveBeenCalledWith(pda);
  });

  it("falls back to the learner when there is no enrollment", async () => {
    const learner = Keypair.generate().publicKey;
    const connection = {
      getAccountInfo: () => Promise.resolve(null),
    } as unknown as Connection;
    const recipient = await fetchEnrollmentRentRecipient(
      connection,
      "course-1",
      learner,
      PROGRAM_ID
    );
    expect(recipient.equals(learner)).toBe(true);
  });
});

/**
 * The payer is appended after the Borsh body, so every decoder the app uses
 * must read a 159-byte enrollment exactly as it reads the 127-byte one: the raw
 * snake_case coders (`academy-reads.ts`, `reset-verify.ts`, both IDLs) and the
 * camelCase `program.account.enrollment` path (`academy-program.ts`).
 */
describe("Enrollment decoders ignore the trailing payer", () => {
  const legacy = enrollmentAccount();
  const current = Buffer.concat([
    legacy,
    Keypair.generate().publicKey.toBuffer(),
  ]);

  it.each([
    ["superteam_academy.json", IDL],
    ["superteam_academy_vnext.json", VNEXT_IDL],
  ])("raw BorshCoder over %s", (_name, idl) => {
    const coder = new BorshCoder(idl as unknown as Idl);
    const a = coder.accounts.decode("Enrollment", legacy);
    const b = coder.accounts.decode("Enrollment", current);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    expect(b.bump).toBe(254);
  });

  it("program.account.enrollment (camelCase)", () => {
    const program = new Program(
      VNEXT_IDL as unknown as Idl,
      {
        connection: {} as Connection,
      } as Provider
    );
    const a = program.coder.accounts.decode("enrollment", legacy);
    const b = program.coder.accounts.decode("enrollment", current);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    expect(b.lessonFlags[3].toString()).toBe("1");
  });
});
