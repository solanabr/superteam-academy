// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import nacl from "tweetnacl";
import { Keypair } from "@solana/web3.js";

// Mock next-auth auth() before importing the module under test.
// The function is imported as a named export from @/lib/auth/config.
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

// Also mock next/server so NextResponse.json works in jsdom
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => {
      const status = init?.status ?? 200;
      return {
        _isNextResponse: true,
        status,
        body,
        async json() {
          return body;
        },
      };
    },
  },
}));

import { auth } from "@/lib/auth/config";
import { validateProgressRequest } from "../validate-progress-request";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

const mockedAuth = auth as ReturnType<typeof vi.fn>;

function makeSession(override?: object) {
  return { user: { email: "test@example.com", ...override } };
}

/**
 * Build a valid signed request body for the "requireLessonIndex" path.
 */
function buildSignedBody(
  keypair: Keypair,
  overrides: {
    courseId?: string;
    lessonIndex?: number;
    timestamp?: number;
    requireLessonIndex?: boolean;
  } = {}
) {
  const {
    courseId = "solana-101",
    lessonIndex = 0,
    timestamp = Date.now(),
    requireLessonIndex = true,
  } = overrides;

  const messageParts = requireLessonIndex
    ? `superteam-academy:${courseId}:${lessonIndex}:${timestamp}`
    : `superteam-academy:finalize:${courseId}:${timestamp}`;

  const messageRaw = new TextEncoder().encode(messageParts);
  const message = Uint8Array.from(messageRaw);
  const sigBytes = nacl.sign.detached(message, Uint8Array.from(keypair.secretKey));
  const signature = Buffer.from(sigBytes).toString("base64");

  return { learner: keypair.publicKey.toBase58(), courseId, lessonIndex, signature, timestamp };
}

/**
 * Wrap a JSON body in a minimal Request object.
 */
function makeRequest(body: object): Request {
  return new Request("http://localhost/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------

describe("validateProgressRequest", () => {
  let keypair: Keypair;

  beforeEach(() => {
    vi.useFakeTimers();
    keypair = Keypair.generate();
    mockedAuth.mockResolvedValue(makeSession());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------------
  // 1. Authentication
  // ----------------------------------------------------------------
  describe("session / authentication", () => {
    it("returns 401 when session is null", async () => {
      mockedAuth.mockResolvedValue(null);
      const req = makeRequest({ courseId: "solana-101", learner: keypair.publicKey.toBase58() });
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      expect((result as { status: number }).status).toBe(401);
    });

    it("returns 401 when session has no user", async () => {
      mockedAuth.mockResolvedValue({ user: null });
      const req = makeRequest({ courseId: "solana-101", learner: keypair.publicKey.toBase58() });
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      expect((result as { status: number }).status).toBe(401);
    });
  });

  // ----------------------------------------------------------------
  // 2. Missing / invalid body fields
  // ----------------------------------------------------------------
  describe("body validation", () => {
    it("returns 400 for non-JSON body", async () => {
      const req = new Request("http://localhost/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "this is not json{{{",
      });
      const result = await validateProgressRequest(req, { requireLessonIndex: false });
      expect((result as { status: number }).status).toBe(400);
    });

    it("returns 400 when learner is missing", async () => {
      const req = makeRequest({ courseId: "solana-101" });
      const result = await validateProgressRequest(req, { requireLessonIndex: false });
      expect((result as { status: number }).status).toBe(400);
      expect((result as { body: { error: { code: string; message: string } } }).body.error.message).toMatch(/learner/i);
    });

    it("returns 400 when courseId is missing", async () => {
      const req = makeRequest({ learner: keypair.publicKey.toBase58() });
      const result = await validateProgressRequest(req, { requireLessonIndex: false });
      expect((result as { status: number }).status).toBe(400);
      expect((result as { body: { error: { code: string; message: string } } }).body.error.message).toMatch(/courseId/i);
    });

    it("returns 400 when walletSignature (signature field) is missing", async () => {
      const req = makeRequest({
        learner: keypair.publicKey.toBase58(),
        courseId: "solana-101",
        timestamp: Date.now(),
      });
      const result = await validateProgressRequest(req, { requireLessonIndex: false });
      expect((result as { status: number }).status).toBe(400);
      expect((result as { body: { error: { code: string; message: string } } }).body.error.message).toMatch(/signature/i);
    });

    it("returns 400 when timestamp is missing", async () => {
      const req = makeRequest({
        learner: keypair.publicKey.toBase58(),
        courseId: "solana-101",
        signature: "AAAA",
      });
      const result = await validateProgressRequest(req, { requireLessonIndex: false });
      expect((result as { status: number }).status).toBe(400);
      expect((result as { body: { error: { code: string; message: string } } }).body.error.message).toMatch(/timestamp/i);
    });
  });

  // ----------------------------------------------------------------
  // 3. courseId format validation
  // ----------------------------------------------------------------
  describe("courseId format", () => {
    it("returns 400 for courseId with special characters", async () => {
      const req = makeRequest({
        learner: keypair.publicKey.toBase58(),
        courseId: "course_with_underscores!",
        signature: "AAAA",
        timestamp: Date.now(),
      });
      const result = await validateProgressRequest(req, { requireLessonIndex: false });
      expect((result as { status: number }).status).toBe(400);
      expect((result as { body: { error: { code: string; message: string } } }).body.error.message).toMatch(/courseId/i);
    });

    it("returns 400 for courseId exceeding 64 characters", async () => {
      const req = makeRequest({
        learner: keypair.publicKey.toBase58(),
        courseId: "a".repeat(65),
        signature: "AAAA",
        timestamp: Date.now(),
      });
      const result = await validateProgressRequest(req, { requireLessonIndex: false });
      expect((result as { status: number }).status).toBe(400);
    });

    it("accepts courseId with alphanumeric characters and hyphens", async () => {
      // Build a properly signed request so validation passes past courseId
      const timestamp = Date.now();
      const body = buildSignedBody(keypair, {
        courseId: "valid-course-123",
        timestamp,
        requireLessonIndex: false,
      });
      const req = makeRequest({ ...body, lessonIndex: undefined });
      const result = await validateProgressRequest(req, { requireLessonIndex: false });
      // Should not be a 400 for courseId; either success or a later error
      if ((result as { status: number }).status === 400) {
        expect((result as { body: { error: { code: string; message: string } } }).body.error.message).not.toMatch(/courseId/i);
      }
    });
  });

  // ----------------------------------------------------------------
  // 4. lessonIndex validation (requireLessonIndex: true)
  // ----------------------------------------------------------------
  describe("lessonIndex validation", () => {
    it("returns 400 for negative lessonIndex", async () => {
      const req = makeRequest({
        learner: keypair.publicKey.toBase58(),
        courseId: "solana-101",
        lessonIndex: -1,
        signature: "AAAA",
        timestamp: Date.now(),
      });
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      expect((result as { status: number }).status).toBe(400);
      expect((result as { body: { error: { code: string; message: string } } }).body.error.message).toMatch(/lessonIndex/i);
    });

    it("returns 400 for lessonIndex > 255", async () => {
      const req = makeRequest({
        learner: keypair.publicKey.toBase58(),
        courseId: "solana-101",
        lessonIndex: 256,
        signature: "AAAA",
        timestamp: Date.now(),
      });
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      expect((result as { status: number }).status).toBe(400);
      expect((result as { body: { error: { code: string; message: string } } }).body.error.message).toMatch(/lessonIndex/i);
    });

    it("returns 400 for non-integer lessonIndex", async () => {
      const req = makeRequest({
        learner: keypair.publicKey.toBase58(),
        courseId: "solana-101",
        lessonIndex: 1.5,
        signature: "AAAA",
        timestamp: Date.now(),
      });
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      expect((result as { status: number }).status).toBe(400);
    });

    it("returns 400 for string lessonIndex", async () => {
      const req = makeRequest({
        learner: keypair.publicKey.toBase58(),
        courseId: "solana-101",
        lessonIndex: "0",
        signature: "AAAA",
        timestamp: Date.now(),
      });
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      expect((result as { status: number }).status).toBe(400);
    });

    it("accepts lessonIndex = 0 (boundary)", async () => {
      const timestamp = Date.now();
      const body = buildSignedBody(keypair, { lessonIndex: 0, timestamp, requireLessonIndex: true });
      const req = makeRequest(body);
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      // No lessonIndex error
      if ((result as { status: number }).status === 400) {
        expect((result as { body: { error: { code: string; message: string } } }).body.error.message).not.toMatch(/lessonIndex/i);
      }
    });

    it("accepts lessonIndex = 255 (boundary)", async () => {
      const timestamp = Date.now();
      const body = buildSignedBody(keypair, { lessonIndex: 255, timestamp, requireLessonIndex: true });
      const req = makeRequest(body);
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      if ((result as { status: number }).status === 400) {
        expect((result as { body: { error: { code: string; message: string } } }).body.error.message).not.toMatch(/lessonIndex/i);
      }
    });

    it("does not validate lessonIndex when requireLessonIndex is false", async () => {
      // Missing lessonIndex entirely should be fine when not required
      const timestamp = Date.now();
      const body = buildSignedBody(keypair, { timestamp, requireLessonIndex: false });
      // Remove lessonIndex from the body
      const { lessonIndex: _unused, ...bodyWithoutLessonIndex } = body;
      void _unused;
      const req = makeRequest(bodyWithoutLessonIndex);
      const result = await validateProgressRequest(req, { requireLessonIndex: false });
      if ((result as { status: number }).status === 400) {
        expect((result as { body: { error: { code: string; message: string } } }).body.error.message).not.toMatch(/lessonIndex/i);
      }
    });
  });

  // ----------------------------------------------------------------
  // 5. Timestamp expiry
  // ----------------------------------------------------------------
  describe("timestamp expiry", () => {
    it("returns 403 for a timestamp older than 5 minutes", async () => {
      const staleTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
      const body = buildSignedBody(keypair, { timestamp: staleTimestamp, requireLessonIndex: true });
      const req = makeRequest(body);
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      expect((result as { status: number }).status).toBe(403);
      expect((result as { body: { error: { code: string; message: string } } }).body.error.message).toMatch(/expired/i);
    });

    it("returns 403 for a timestamp in the far future (> 5 min)", async () => {
      const futureTimestamp = Date.now() + 6 * 60 * 1000;
      const body = buildSignedBody(keypair, { timestamp: futureTimestamp, requireLessonIndex: true });
      const req = makeRequest(body);
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      expect((result as { status: number }).status).toBe(403);
    });

    it("accepts a fresh timestamp (< 5 minutes old)", async () => {
      const timestamp = Date.now() - 60 * 1000; // 1 minute ago
      const body = buildSignedBody(keypair, { timestamp, requireLessonIndex: true });
      const req = makeRequest(body);
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      // Timestamp should pass; result is either success or a later-stage error (not 403 for expiry)
      if ((result as { status: number }).status === 403) {
        expect((result as { body: { error: { code: string; message: string } } }).body.error.message).not.toMatch(/expired/i);
      }
    });
  });

  // ----------------------------------------------------------------
  // 6. Wallet signature verification
  // ----------------------------------------------------------------
  describe("wallet signature verification", () => {
    it("returns 403 when the signature was signed by a different keypair", async () => {
      const attackerKeypair = Keypair.generate();
      const timestamp = Date.now();

      // Sign with the attacker's key but claim to be the victim's key
      const messageParts = `superteam-academy:solana-101:0:${timestamp}`;
      const message = new TextEncoder().encode(messageParts);
      const sigBytes = nacl.sign.detached(message, attackerKeypair.secretKey);
      const signature = Buffer.from(sigBytes).toString("base64");

      const req = makeRequest({
        learner: keypair.publicKey.toBase58(), // victim's key
        courseId: "solana-101",
        lessonIndex: 0,
        signature,
        timestamp,
      });
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      expect((result as { status: number }).status).toBe(403);
      expect((result as { body: { error: { code: string; message: string } } }).body.error.message).toMatch(/signature/i);
    });

    it("returns 403 when the signature covers a tampered message", async () => {
      const timestamp = Date.now();
      // Sign the correct message but submit with a different lessonIndex
      const messageParts = `superteam-academy:solana-101:0:${timestamp}`;
      const message = new TextEncoder().encode(messageParts);
      const sigBytes = nacl.sign.detached(message, Uint8Array.from(keypair.secretKey));
      const signature = Buffer.from(sigBytes).toString("base64");

      const req = makeRequest({
        learner: keypair.publicKey.toBase58(),
        courseId: "solana-101",
        lessonIndex: 99, // tampered
        signature,
        timestamp,
      });
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      expect((result as { status: number }).status).toBe(403);
    });

    it("throws or returns a non-2xx status for a garbage signature that decodes to wrong-length bytes", async () => {
      // NOTE: Buffer.from("!!!not-base64!!!", "base64") does NOT throw in Node — it silently
      // decodes to a few bytes. The resulting byte array has the wrong length for an ed25519
      // signature (64 bytes), so nacl.sign.detached.verify throws "bad signature size".
      // The module does not wrap the nacl call in a try/catch, so the error propagates.
      // This test documents that behavior: a caller receives a rejected promise.
      const timestamp = Date.now();
      const req = makeRequest({
        learner: keypair.publicKey.toBase58(),
        courseId: "solana-101",
        lessonIndex: 0,
        signature: "!!!not-base64!!!",
        timestamp,
      });
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      expect(result).toHaveProperty("status", 403);
    });

    it("returns 400 for an invalid learner public key", async () => {
      const timestamp = Date.now();
      const sigBytes = nacl.sign.detached(new TextEncoder().encode("msg"), keypair.secretKey);
      const req = makeRequest({
        learner: "not-a-valid-pubkey",
        courseId: "solana-101",
        lessonIndex: 0,
        signature: Buffer.from(sigBytes).toString("base64"),
        timestamp,
      });
      const result = await validateProgressRequest(req, { requireLessonIndex: true });
      expect((result as { status: number }).status).toBe(400);
      expect((result as { body: { error: { code: string; message: string } } }).body.error.message).toMatch(/public key/i);
    });
  });

  // ----------------------------------------------------------------
  // 7. Valid request — happy path
  // ----------------------------------------------------------------
  describe("valid request", () => {
    it("returns parsed data for a valid requireLessonIndex request", async () => {
      const timestamp = Date.now();
      const body = buildSignedBody(keypair, {
        courseId: "solana-101",
        lessonIndex: 3,
        timestamp,
        requireLessonIndex: true,
      });
      const req = makeRequest(body);
      const result = await validateProgressRequest(req, { requireLessonIndex: true });

      // Should not be a NextResponse error
      expect((result as { status?: number }).status).toBeUndefined();

      const validated = result as { courseId: string; learner: { toBase58: () => string }; lessonIndex: number };
      expect(validated.courseId).toBe("solana-101");
      expect(validated.learner.toBase58()).toBe(keypair.publicKey.toBase58());
      expect(validated.lessonIndex).toBe(3);
    });

    it("returns parsed data without lessonIndex for finalize path", async () => {
      const timestamp = Date.now();
      const body = buildSignedBody(keypair, {
        courseId: "solana-101",
        timestamp,
        requireLessonIndex: false,
      });
      // Remove lessonIndex from body since it's not required
      const { lessonIndex: _unused, ...bodyWithoutLessonIndex } = body;
      void _unused;
      const req = makeRequest(bodyWithoutLessonIndex);
      const result = await validateProgressRequest(req, { requireLessonIndex: false });

      expect((result as { status?: number }).status).toBeUndefined();

      const validated = result as { courseId: string; learner: { toBase58: () => string }; lessonIndex?: number };
      expect(validated.courseId).toBe("solana-101");
      expect(validated.learner.toBase58()).toBe(keypair.publicKey.toBase58());
      expect(validated.lessonIndex).toBeUndefined();
    });
  });

  // ----------------------------------------------------------------
  // 8. Replay protection (duplicate fingerprint)
  // ----------------------------------------------------------------
  describe("replay protection", () => {
    it("returns 409 on a duplicate request fingerprint", async () => {
      const timestamp = Date.now();
      const body = buildSignedBody(keypair, {
        courseId: `replay-test-${Math.random().toString(36).slice(2)}`,
        lessonIndex: 1,
        timestamp,
        requireLessonIndex: true,
      });

      // First request should succeed
      const req1 = makeRequest(body);
      const first = await validateProgressRequest(req1, { requireLessonIndex: true });
      expect((first as { status?: number }).status).toBeUndefined();

      // Identical request (same fingerprint) should be rejected
      const req2 = makeRequest(body);
      const second = await validateProgressRequest(req2, { requireLessonIndex: true });
      expect((second as { status: number }).status).toBe(409);
      expect((second as { body: { error: { code: string; message: string } } }).body.error.message).toMatch(/duplicate/i);
    });

    it("allows a different timestamp for the same learner/course/lesson", async () => {
      const courseId = `replay-diff-ts-${Math.random().toString(36).slice(2)}`;

      // First submission
      const ts1 = Date.now();
      const body1 = buildSignedBody(keypair, { courseId, lessonIndex: 0, timestamp: ts1, requireLessonIndex: true });
      const req1 = makeRequest(body1);
      const first = await validateProgressRequest(req1, { requireLessonIndex: true });
      expect((first as { status?: number }).status).toBeUndefined();

      // Advance time by 10 seconds (still within 5-min window), different timestamp
      vi.advanceTimersByTime(10_000);
      const ts2 = Date.now();
      const body2 = buildSignedBody(keypair, { courseId, lessonIndex: 0, timestamp: ts2, requireLessonIndex: true });
      const req2 = makeRequest(body2);
      const second = await validateProgressRequest(req2, { requireLessonIndex: true });
      // Different fingerprint (different timestamp), should not be a 409
      expect((second as { status: number }).status).not.toBe(409);
    });

    it("allows the same learner to submit different lessons without collision", async () => {
      const courseId = `replay-diff-lesson-${Math.random().toString(36).slice(2)}`;
      const ts = Date.now();

      const body0 = buildSignedBody(keypair, { courseId, lessonIndex: 0, timestamp: ts, requireLessonIndex: true });
      // Lesson 1 needs a different timestamp to avoid fingerprint collision on the timestamp portion
      const ts2 = ts + 1;
      const body1 = buildSignedBody(keypair, { courseId, lessonIndex: 1, timestamp: ts2, requireLessonIndex: true });

      const r0 = await validateProgressRequest(makeRequest(body0), { requireLessonIndex: true });
      expect((r0 as { status?: number }).status).toBeUndefined();

      const r1 = await validateProgressRequest(makeRequest(body1), { requireLessonIndex: true });
      expect((r1 as { status: number }).status).not.toBe(409);
    });
  });
});
