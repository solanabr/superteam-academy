import { describe, it, expect } from "vitest";
import { isAlreadySatisfied, parseProgramError } from "../queue-errors";

// ---------------------------------------------------------------------------
// GATE FINDING 4 (#1255) — terminal-error classification was first-match-in-text.
//
// `parseProgramError` regexes the whole thrown message, and web3.js's
// `SendTransactionError` embeds EVERY instruction's program logs in that
// message (the prod rows carry exactly this shape). Nothing tied the matched
// code to the academy program, so whichever code appeared FIRST decided whether
// a row got resolved as "already satisfied" — and resolving wrongly silently
// drops something we owe.
//
// The fix: `isAlreadySatisfied` takes the academy program id and only resolves
// when the code is attributable to it. Unattributable text fails CLOSED (keep
// retrying, which is recoverable). Serialisation still surfaces the code.
// ---------------------------------------------------------------------------

const OURS = "AcadEmY1111111111111111111111111111111111p";
const THEIRS = "CoREzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz";

describe("terminal classification is scoped to the academy program", () => {
  it("does NOT resolve on a terminal code from an earlier log line when the real failure is ours and non-terminal", () => {
    // 6005 CourseAlreadyFinalized appears first; MintingPaused (6031) is the
    // actual failure. Under first-match-in-text this resolved the row.
    const err = new Error(
      "Simulation failed. \nLogs: \n[\n" +
        '  "Program log: AnchorError occurred. Error Code: CourseAlreadyFinalized. Error Number: 6005.",\n' +
        '  "Program log: AnchorError occurred. Error Code: MintingPaused. Error Number: 6031."\n]'
    );

    // No invoke frame in the text at all → unattributable → fail closed.
    expect(isAlreadySatisfied(err, OURS)).toBeNull();
  });

  it("does NOT resolve a bare inner-program custom code", () => {
    // The live achievement rows: `custom program error: 0x0` on "Instruction 1",
    // which is MPL Core, not the academy program. 0x1781 would collide with
    // 6017 CredentialAlreadyIssued.
    const err = new Error(
      "Simulation failed. \nMessage: Transaction simulation failed: " +
        "Error processing Instruction 1: custom program error: 0x1781."
    );

    expect(isAlreadySatisfied(err, OURS)).toBeNull();
  });

  it("does NOT resolve a terminal code raised inside another program's invoke frame", () => {
    const err = Object.assign(new Error("Transaction failed"), {
      logs: [
        `Program ${OURS} invoke [1]`,
        "Program log: Instruction: IssueCredential",
        `Program ${THEIRS} invoke [2]`,
        "Program log: AnchorError occurred. Error Code: CredentialAlreadyIssued. Error Number: 6017.",
        `Program ${THEIRS} failed: custom program error: 0x1781`,
      ],
    });

    expect(isAlreadySatisfied(err, OURS)).toBeNull();
  });

  it("DOES resolve a terminal code raised inside our own invoke frame", () => {
    const err = Object.assign(new Error("Transaction failed"), {
      logs: [
        `Program ${OURS} invoke [1]`,
        "Program log: Instruction: IssueCredential",
        "Program log: AnchorError occurred. Error Code: CredentialAlreadyIssued. Error Number: 6017.",
        `Program ${OURS} failed: custom program error: 0x1781`,
      ],
    });

    expect(isAlreadySatisfied(err, OURS)).toEqual({
      code: 6017,
      name: "CredentialAlreadyIssued",
    });
  });

  it("DOES resolve when our own failure line carries the code", () => {
    const err = new Error(
      `Transaction simulation failed: Program ${OURS} failed: custom program error: 0x1781`
    );

    expect(isAlreadySatisfied(err, OURS)?.code).toBe(6017);
  });

  it("trusts an AnchorError-shaped throw that names the program", () => {
    const ours = {
      errorCode: { code: "CredentialAlreadyIssued", number: 6017 },
      program: OURS,
    };
    const theirs = { ...ours, program: THEIRS };

    expect(isAlreadySatisfied(ours, OURS)?.code).toBe(6017);
    expect(isAlreadySatisfied(theirs, OURS)).toBeNull();
  });

  it("accepts a PublicKey-shaped program field, not just a string", () => {
    const err = {
      errorCode: { code: "CourseAlreadyFinalized", number: 6005 },
      program: { toBase58: () => OURS },
    };

    expect(isAlreadySatisfied(err, OURS)?.code).toBe(6005);
  });

  it("still reports the code for the operator even when it will not resolve", () => {
    // Attribution gates RESOLUTION only — last_error must stay informative.
    const err = new Error(
      "Error processing Instruction 1: custom program error: 0x1781."
    );

    expect(parseProgramError(err)?.code).toBe(6017);
    expect(isAlreadySatisfied(err, OURS)).toBeNull();
  });
});
