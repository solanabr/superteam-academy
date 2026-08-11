import { describe, it, expect } from "vitest";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { buildEnrollInstruction } from "../instructions";
import { findCoursePDA, findEnrollmentPDA } from "../pda";

/**
 * The enroll account list is a contract with the on-chain program: the handler
 * reads accounts positionally (`take_accounts!([course, enrollment, learner,
 * payer, system_program] …)`), so an order or flag change here silently
 * mis-binds every enrolment rather than failing loudly.
 *
 * Nothing asserted this before the sponsorship split (#1004) — the whole web
 * suite stayed green while an account was added to the instruction, which is
 * exactly the change that most needs a test.
 */
const PROGRAM_ID = new PublicKey("11111111111111111111111111111112");
const COURSE_ID = "btc-to-sol-evolution";

describe("buildEnrollInstruction", () => {
  const learner = Keypair.generate().publicKey;

  it("lays out the five accounts in the order the program reads them", () => {
    const ix = buildEnrollInstruction(COURSE_ID, learner, PROGRAM_ID);
    const [coursePDA] = findCoursePDA(COURSE_ID, PROGRAM_ID);
    const [enrollmentPDA] = findEnrollmentPDA(COURSE_ID, learner, PROGRAM_ID);

    expect(ix.keys).toHaveLength(5);
    expect(ix.keys[0]).toMatchObject({
      pubkey: coursePDA,
      isSigner: false,
      isWritable: true,
    });
    expect(ix.keys[1]).toMatchObject({
      pubkey: enrollmentPDA,
      isSigner: false,
      isWritable: true,
    });
    expect(ix.keys[4]).toMatchObject({
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    });
    expect(ix.programId).toEqual(PROGRAM_ID);
  });

  it("defaults the payer to the learner, so self-pay is unchanged", () => {
    const ix = buildEnrollInstruction(COURSE_ID, learner, PROGRAM_ID);

    // Both slots are the learner. The runtime merges duplicate metas and takes
    // the union of the flags, so the learner still ends up signer + writable.
    expect(ix.keys[2]!.pubkey).toEqual(learner);
    expect(ix.keys[3]!.pubkey).toEqual(learner);
  });

  it("puts the sponsor in the payer slot and leaves the learner unwritable", () => {
    const sponsor = Keypair.generate().publicKey;
    const ix = buildEnrollInstruction(COURSE_ID, learner, PROGRAM_ID, sponsor);

    // The learner signs (consent + PDA seed) but is never debited...
    expect(ix.keys[2]).toMatchObject({
      pubkey: learner,
      isSigner: true,
      isWritable: false,
    });
    // ...and the sponsor both signs and pays. The signature is what stops a
    // caller naming somebody else's funded account as the payer.
    expect(ix.keys[3]).toMatchObject({
      pubkey: sponsor,
      isSigner: true,
      isWritable: true,
    });
  });

  it("keeps the Enrollment PDA seeded by the LEARNER when sponsored", () => {
    const sponsor = Keypair.generate().publicKey;
    const ix = buildEnrollInstruction(COURSE_ID, learner, PROGRAM_ID, sponsor);
    const [learnerPDA] = findEnrollmentPDA(COURSE_ID, learner, PROGRAM_ID);
    const [sponsorPDA] = findEnrollmentPDA(COURSE_ID, sponsor, PROGRAM_ID);

    // If sponsorship moved the seed to the payer, every sponsored learner would
    // collide on a single enrollment account owned by the sponsor.
    expect(ix.keys[1]!.pubkey).toEqual(learnerPDA);
    expect(ix.keys[1]!.pubkey).not.toEqual(sponsorPDA);
  });
});
