/* eslint-disable import/order -- vi.mock() must be hoisted above the route
   import so the handler graph loads against the stubs. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  decode: vi.fn(),
  handleLessonCompleted: vi.fn(),
}));

// Stub the Anchor coder so we control decode() without crafting Borsh bytes.
vi.mock("@coral-xyz/anchor", () => ({
  BorshEventCoder: class {
    decode(data: string) {
      return h.decode(data);
    }
  },
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: { HELIUS_WEBHOOK_SECRET: "webhook-s3cret" },
}));

// Only LessonCompleted is exercised; the rest must exist for the route's import.
vi.mock("@/lib/helius/event-handlers", () => ({
  handleEnrolled: vi.fn(),
  handleEnrollmentClosed: vi.fn(),
  handleLessonCompleted: (...a: unknown[]) => h.handleLessonCompleted(...a),
  handleCourseFinalized: vi.fn(),
  handleCredentialIssued: vi.fn(),
  handleAchievementAwarded: vi.fn(),
  handleXpRewarded: vi.fn(),
}));

import { UNDECODABLE_CODE } from "@/lib/helius/event-decoder";

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID ?? "";

/** A well-formed entry whose single log line decodes to a LessonCompleted. */
const goodEntry = (signature: string) => ({
  transaction: { signatures: [signature] },
  meta: {
    err: null,
    logMessages: [
      `Program ${PROGRAM_ID} invoke [1]`,
      "Program data: GOOD",
      `Program ${PROGRAM_ID} success`,
    ],
  },
});

const post = async (body: unknown): Promise<Response> => {
  const { POST } = await import("../route");
  return POST(
    new Request("https://app.test/api/webhooks/helius", {
      method: "POST",
      headers: {
        authorization: "Bearer webhook-s3cret",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }) as unknown as NextRequest
  );
};

let warnSpy: ReturnType<typeof vi.spyOn>;

/** The `[HELIUS_DECODE_001]` lines logged so far, with their context arg. */
const undecodableLogs = (): unknown[][] =>
  (warnSpy.mock.calls as unknown[][]).filter(
    (call) => call[0] === `[${UNDECODABLE_CODE}]`
  );

beforeEach(() => {
  h.decode.mockReset();
  h.handleLessonCompleted.mockReset().mockResolvedValue(undefined);
  h.decode.mockImplementation((data: string) =>
    data === "GOOD"
      ? { name: "LessonCompleted", data: { lesson_index: 3 } }
      : null
  );
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/webhooks/helius — an entry with no transaction", () => {
  it("decodes the OTHER entries in a mixed payload", async () => {
    // Middle entry has no `transaction` at all — the shape Helius actually
    // delivered (Sentry SA-2). Before the guard this threw on entry 2 and
    // entry 3 was never reached.
    const res = await post([
      goodEntry("sig-first"),
      { meta: { err: null, logMessages: [] } },
      goodEntry("sig-third"),
    ]);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      received: true,
      processed: 2,
      undecodable: 1,
    });

    const signatures = h.handleLessonCompleted.mock.calls.map((c) => c[1]);
    expect(signatures).toEqual(["sig-first", "sig-third"]);
  });

  it("still returns 200 when EVERY entry is undecodable (no Helius retry)", async () => {
    const res = await post([{}, { meta: null }, { transaction: {} }]);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      received: true,
      processed: 0,
      undecodable: 3,
    });
    expect(h.handleLessonCompleted).not.toHaveBeenCalled();
  });

  it("logs the stable code ONCE with the count, not once per entry", async () => {
    await post([goodEntry("sig-1"), {}, {}, {}]);

    const codeLines = undecodableLogs();
    expect(codeLines).toHaveLength(1);
    expect(codeLines[0]?.[1]).toEqual({ undecodable: 3, total: 4 });
  });

  it("stays silent when every entry decodes", async () => {
    const res = await post([goodEntry("sig-1"), goodEntry("sig-2")]);

    expect(await res.json()).toMatchObject({ processed: 2, undecodable: 0 });
    expect(undecodableLogs()).toHaveLength(0);
  });
});

describe("POST /api/webhooks/helius — empty and degenerate payloads", () => {
  it("accepts an empty array", async () => {
    const res = await post([]);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      received: true,
      processed: 0,
      undecodable: 0,
    });
    expect(h.decode).not.toHaveBeenCalled();
  });

  it("still rejects a non-array body as 400", async () => {
    const res = await post({ transaction: {} });
    expect(res.status).toBe(400);
  });

  it("still rejects an unauthorized caller as 401", async () => {
    const { POST } = await import("../route");
    const res = await POST(
      new Request("https://app.test/api/webhooks/helius", {
        method: "POST",
        headers: { authorization: "Bearer wrong" },
        body: "[]",
      }) as unknown as NextRequest
    );
    expect(res.status).toBe(401);
  });
});
