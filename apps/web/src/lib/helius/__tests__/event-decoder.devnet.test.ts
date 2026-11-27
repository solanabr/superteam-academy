/* eslint-disable import/order -- the program id must be set before the decoder
   module reads it at import time. */
import { describe, it, expect, vi } from "vitest";

// Logs in the fixture are real devnet transactions of this program, so it must
// be the configured program here rather than the default from vitest.setup.ts.
const { DEVNET_PROGRAM_ID } = vi.hoisted(() => {
  const DEVNET_PROGRAM_ID = "Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u";
  process.env.NEXT_PUBLIC_PROGRAM_ID = DEVNET_PROGRAM_ID;
  return { DEVNET_PROGRAM_ID };
});

import {
  decodeEventsFromTransaction,
  normalizeEventData,
} from "../event-decoder";
import type { HeliusRawTransaction } from "../types";
import fixture from "./fixtures/devnet-program-logs.json";

interface CapturedTransaction {
  signature: string;
  err: unknown;
  logMessages: string[];
  expectedEvents: { name: string; data: Record<string, unknown> }[];
}

const captured = fixture.transactions as CapturedTransaction[];
const succeeded = captured.filter((entry) => entry.err === null);

function asWebhookEntry(
  signature: string,
  logMessages: string[],
  err: unknown = null
): HeliusRawTransaction {
  return {
    transaction: { signatures: [signature] },
    meta: { logMessages, err },
  } as unknown as HeliusRawTransaction;
}

function decodedEvents(entry: HeliusRawTransaction) {
  return decodeEventsFromTransaction(entry).events.map((event) => ({
    name: event.name,
    data: JSON.parse(JSON.stringify(normalizeEventData(event.data))),
  }));
}

/** Our top-level frame from a captured log, re-based under an outer program. */
function nestedUnderOuterProgram(logMessages: string[], outer: string) {
  const start = logMessages.indexOf(`Program ${DEVNET_PROGRAM_ID} invoke [1]`);
  const end = logMessages.indexOf(
    `Program ${DEVNET_PROGRAM_ID} success`,
    start
  );
  const frame = logMessages
    .slice(start, end + 1)
    .map((line) =>
      line.replace(
        /^(Program \S+ invoke \[)(\d+)(\])$/,
        (_, head: string, depth: string, tail: string) =>
          `${head}${Number(depth) + 1}${tail}`
      )
    );
  return [
    `Program ${outer} invoke [1]`,
    "Program log: Instruction: Outer",
    ...frame,
    `Program ${outer} consumed 90000 of 400000 compute units`,
    `Program ${outer} success`,
  ];
}

describe("decodeEventsFromTransaction with captured devnet logs", () => {
  it("covers every event the webhook acts on", () => {
    const names = new Set(
      succeeded.flatMap((entry) => entry.expectedEvents.map((e) => e.name))
    );
    expect([...names]).toEqual(
      expect.arrayContaining([
        "Enrolled",
        "EnrollmentClosed",
        "LessonCompleted",
        "CourseFinalized",
        "CredentialIssued",
        "AchievementAwarded",
        "XpRewarded",
      ])
    );
  });

  it.each(succeeded.map((entry) => [entry.signature, entry] as const))(
    "decodes %s",
    (signature, entry) => {
      expect(entry.expectedEvents.length).toBeGreaterThan(0);
      expect(
        decodedEvents(asWebhookEntry(signature, entry.logMessages))
      ).toEqual(entry.expectedEvents);
    }
  );

  it.each(succeeded.map((entry) => [entry.signature, entry] as const))(
    "decodes %s when an outer program calls ours",
    (signature, entry) => {
      const logs = nestedUnderOuterProgram(
        entry.logMessages,
        "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
      );
      expect(decodedEvents(asWebhookEntry(signature, logs))).toEqual(
        entry.expectedEvents
      );
    }
  );

  it("drops a captured failed transaction", () => {
    const failed = captured.find((entry) => entry.err !== null);
    expect(failed).toBeDefined();
    expect(
      decodedEvents(
        asWebhookEntry(failed!.signature, failed!.logMessages, failed!.err)
      )
    ).toEqual([]);
  });

  it("does not decode a captured event once a foreign program emits the same bytes", () => {
    const entry = succeeded[0]!;
    const dataLine = entry.logMessages.find((line) =>
      line.startsWith("Program data: ")
    )!;
    const foreign = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
    expect(
      decodedEvents(
        asWebhookEntry(entry.signature, [
          `Program ${foreign} invoke [1]`,
          `Program log: Program ${DEVNET_PROGRAM_ID} invoke [1]`,
          dataLine,
          `Program log: Program ${DEVNET_PROGRAM_ID} success`,
          `Program ${foreign} success`,
        ])
      )
    ).toEqual([]);
  });
});
