import { describe, it, expect } from "vitest";
import {
  ALREADY_SATISFIED_ERROR_CODES,
  isAlreadySatisfied,
  parseProgramError,
  serializeQueueError,
} from "../queue-errors";
import { describeTxError } from "../describe-tx-error";

// ---------------------------------------------------------------------------
// What lands in `pending_onchain_actions.last_error`, and which failures mean
// "already done".
//
// Every string asserted here is one an operator had to read off prod on 21 Sep
// 2026, including the two rows whose entire recorded error was `[object
// Object]` and the two `certificate` rows stuck on CredentialAlreadyIssued.
// ---------------------------------------------------------------------------

describe("serializeQueueError", () => {
  it("never writes [object Object] for a non-Error throw", () => {
    const out = serializeQueueError({ code: -32002, detail: "blockhash" });
    expect(out).not.toContain("[object Object]");
    expect(out).toContain("-32002");
  });

  it("prefers a duck-typed message over the JSON dump", () => {
    expect(
      serializeQueueError({ message: "RPC timed out", code: 408 })
    ).toContain("RPC timed out");
  });

  it("falls back to the key list when the object cannot be JSON-encoded", () => {
    const cyclic: Record<string, unknown> = { logs: undefined, self: null };
    cyclic.self = cyclic;
    const out = serializeQueueError(cyclic);
    expect(out).toContain("keys");
    expect(out).toContain("self");
  });

  it("names the web3.js/Anchor lost-context failure instead of repeating it", () => {
    const out = serializeQueueError(new Error("Unknown action 'undefined'"));
    expect(out).toContain("failed after broadcast");
    expect(out).not.toContain("Unknown action");
  });

  it("appends the program error code, the signature and a log excerpt", () => {
    const err = Object.assign(
      new Error(
        "AnchorError occurred. Error Code: CredentialAlreadyIssued. Error Number: 6017."
      ),
      {
        signature: "SIG123",
        logs: [
          "Program log: noise",
          "Program log: AnchorError caused by account: enrollment",
          "Program failed to complete",
        ],
      }
    );
    const out = serializeQueueError(err);
    expect(out).toContain("[code 6017 CredentialAlreadyIssued]");
    expect(out).toContain("(sig: SIG123)");
    expect(out).toContain("logs:");
    expect(out).toContain("Program failed to complete");
  });

  it("caps the persisted string so a 200-line log cannot fill the column", () => {
    const err = Object.assign(new Error("boom"), {
      logs: Array.from(
        { length: 200 },
        (_, i) => `Program log: line ${i} ${"x".repeat(200)}`
      ),
    });
    expect(serializeQueueError(err).length).toBeLessThanOrEqual(1800);
  });

  it("handles a thrown string, null and undefined without throwing", () => {
    expect(serializeQueueError("plain failure")).toBe("plain failure");
    expect(serializeQueueError(null)).toContain("non-error thrown");
    expect(serializeQueueError(undefined)).toContain("non-error thrown");
  });

  it("is what describeTxError resolves to, so producers serialize identically", () => {
    expect(describeTxError({ code: 1 })).toBe(serializeQueueError({ code: 1 }));
  });
});

describe("parseProgramError", () => {
  it("reads an AnchorError instance's errorCode", () => {
    expect(
      parseProgramError({
        errorCode: { code: "CredentialAlreadyIssued", number: 6017 },
      })
    ).toEqual({ code: 6017, name: "CredentialAlreadyIssued" });
  });

  it("reads the formatted Anchor message", () => {
    expect(
      parseProgramError(
        new Error(
          "AnchorError occurred. Error Code: CourseAlreadyFinalized. Error Number: 6005. Error Message: Course already finalized"
        )
      )
    ).toEqual({ code: 6005, name: "CourseAlreadyFinalized" });
  });

  it("reads a raw hex custom program error from a simulation failure", () => {
    expect(
      parseProgramError(
        new Error(
          "Simulation failed. \nMessage: Transaction simulation failed: Error processing Instruction 1: custom program error: 0x1781."
        )
      )
    ).toEqual({ code: 0x1781, name: "error-6017" });
  });

  it("returns null for an error that carries no program code", () => {
    expect(parseProgramError(new Error("fetch failed"))).toBeNull();
  });
});

// Program attribution (gate finding 4) has its own suite in inner-error.test.ts;
// here the errors are AnchorError-shaped and name our program, so attribution is
// satisfied and these tests stay about WHICH codes count as already-done.
const OURS = "AcadEmY1111111111111111111111111111111111p";

const anchorErr = (code: number, name = `code-${code}`) => ({
  errorCode: { code: name, number: code },
  program: OURS,
});

describe("isAlreadySatisfied", () => {
  it("recognises the already-done codes", () => {
    for (const code of Object.keys(ALREADY_SATISFIED_ERROR_CODES)) {
      expect(isAlreadySatisfied(anchorErr(Number(code)), OURS)).not.toBeNull();
    }
  });

  it("recognises the prod CredentialAlreadyIssued row", () => {
    expect(
      isAlreadySatisfied(anchorErr(6017, "CredentialAlreadyIssued"), OURS)
    ).toEqual({ code: 6017, name: "CredentialAlreadyIssued" });
  });

  it("does NOT treat a terminal-but-unsatisfied error as done", () => {
    // AchievementSupplyExhausted (6023) and the mismatch/minter codes never
    // change on retry either, but the state we owe does not exist — resolving
    // them would silently drop it.
    for (const code of [6015, 6016, 6019, 6023, 6031]) {
      expect(isAlreadySatisfied(anchorErr(code), OURS)).toBeNull();
    }
  });

  it("does not resolve an ordinary transient failure", () => {
    expect(
      isAlreadySatisfied(new Error("blockhash not found"), OURS)
    ).toBeNull();
  });
});
