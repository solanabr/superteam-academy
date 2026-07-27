/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { GradeResult } from "@/lib/grading/types";

vi.mock("server-only", () => ({}));

// The server half of the O-4 journey (#819). The E2E (e2e/o4-journey.spec.ts)
// proves the CLIENT sends `replay: true` with the banked proofs; it cannot reach
// the server-side #459 volume gate through its mocked route seam. This test is
// that other half, made OBSERVABLE (not assumed): under a REAL per-user token
// bucket, a NON-replay burst trips the gate exactly at exhaustion while an equal
// replay burst never does — the LX-A4c exemption is the counter arithmetic, not
// just a branch that runs.
//
// It complements gate.test.ts's replay cases (which use a boolean mock to show
// the per-user key is/ isn't queried): here the bucket actually depletes across
// a burst, so the assertion is the OBSERVED divergence in 429 counts.

const {
  getUser,
  singleProfile,
  getLessonByIdForGrading,
  codeGrader,
  isOnChainProgramLive,
  isCourseInMaintenance,
  isPlatformFrozen,
} = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<unknown>>(),
  singleProfile: vi.fn<() => Promise<unknown>>(),
  getLessonByIdForGrading: vi.fn(),
  codeGrader: vi.fn<() => Promise<GradeResult>>(),
  isOnChainProgramLive: vi.fn<() => Promise<boolean>>(),
  isCourseInMaintenance: vi.fn<() => Promise<boolean>>(),
  isPlatformFrozen: vi.fn<() => Promise<boolean>>(),
}));

// A REAL, stateful fixed-window bucket per namespace:key — the point of this
// test. Returns true (limited) once a key has been queried maxTokens times.
// The route only passes maxTokens for the two completion namespaces, so we model
// those: per-user 40, per-IP 1200 (the production sizes). Keyed by namespace+key
// so per-user (user id) and per-IP (client ip) count independently.
const buckets = new Map<string, number>();
const CAPS: Record<string, number> = {
  "lessons:complete": 40,
  "lessons:complete:ip": 1200,
};
function bucketLimited(namespace: string, key: string): boolean {
  const cap = CAPS[namespace];
  if (cap === undefined) return false;
  const id = `${namespace}:${key}`;
  const used = buckets.get(id) ?? 0;
  if (used >= cap) return true; // exhausted → limited
  buckets.set(id, used + 1);
  return false;
}

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: (namespace: string, key: string) =>
    Promise.resolve(bucketLimited(namespace, key)),
  releaseRateLimit: () => Promise.resolve(),
  getClientIp: () => "203.0.113.7",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: singleProfile }) }),
    }),
  }),
}));

vi.mock("@/lib/content/queries", () => ({
  getLessonByIdForGrading,
  getCourseById: vi.fn(),
}));

vi.mock("@/lib/grading/graders", () => ({
  GRADERS: { code: () => codeGrader() },
}));

vi.mock("@/lib/review/schedule-review", () => ({
  captureReviewFailure: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/ai/check-seal", () => ({ openAttestation: () => true }));

vi.mock("@/lib/solana/academy-program", () => ({
  isOnChainProgramLive,
  completeLesson: vi.fn(),
  getConnection: vi.fn(),
  getProgramId: vi.fn(),
}));
vi.mock("@/lib/solana/academy-reads", () => ({
  fetchEnrollment: vi.fn(),
  fetchCourse: vi.fn(),
}));
vi.mock("@/lib/solana/bitmap", () => ({ isLessonComplete: vi.fn() }));
vi.mock("@/lib/courses/lesson-slot", () => ({ getLessonSlot: () => 0 }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));
vi.mock("@/lib/content/deployments", () => ({ isCourseInMaintenance }));
vi.mock("@/lib/platform/freeze", () => ({ isPlatformFrozen }));

import { POST } from "../route";

// A wrong-answer proof: the request runs the whole gate — freeze, volume,
// grading — and stops at grading (403) WITHOUT touching the chain. That keeps
// each call cheap and isolates what we are measuring: whether the VOLUME gate
// let the request through to grading (403) or throttled it (429).
function post(replay: boolean): Promise<Response> {
  return POST(
    new NextRequest("http://localhost/api/lessons/complete", {
      method: "POST",
      body: JSON.stringify({
        lessonId: "lesson-1",
        courseId: "course-1",
        proofs: { c1: { code: "wrong" } },
        ...(replay ? { replay: true } : {}),
      }),
      headers: { "content-type": "application/json" },
    })
  );
}

async function burst(n: number, replay: boolean): Promise<number[]> {
  const statuses: number[] = [];
  // Sequential — a fixed-window counter must see ordered pressure, and the route
  // replays the bank sequentially too (replay-banked.ts).
  for (let i = 0; i < n; i++) statuses.push((await post(replay)).status);
  return statuses;
}

beforeEach(() => {
  vi.clearAllMocks();
  buckets.clear();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "srk";
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  singleProfile.mockResolvedValue({ data: { wallet_address: "wallet-1" } });
  getLessonByIdForGrading.mockResolvedValue({
    blocks: [{ _type: "code", key: "c1" }],
  });
  codeGrader.mockResolvedValue({ ok: false, status: 403 });
  isOnChainProgramLive.mockResolvedValue(false);
  isCourseInMaintenance.mockResolvedValue(false);
  isPlatformFrozen.mockResolvedValue(false);
});

describe("O-4 replay exemption is observable under a real burst (#819 / LX-A4c)", () => {
  const OVER_USER_CAP = 45; // > the 40/hr per-user bucket

  it("a NON-replay burst trips the per-user volume gate at exhaustion", async () => {
    const statuses = await burst(OVER_USER_CAP, /* replay */ false);

    const throttled = statuses.filter((s) => s === 429).length;
    const reachedGrading = statuses.filter((s) => s === 403).length;

    // First 40 pass the per-user gate and reach grading; 41..45 are throttled.
    expect(reachedGrading).toBe(40);
    expect(throttled).toBe(OVER_USER_CAP - 40);
    // The per-user bucket is the one that tripped (it hit its 40 cap); per-IP
    // (1200) is nowhere near, so this 429 is the per-USER limit, as designed.
    expect(buckets.get("lessons:complete:user-1")).toBe(40);
  });

  it("an equal REPLAY burst is NEVER throttled by the per-user gate", async () => {
    const statuses = await burst(OVER_USER_CAP, /* replay */ true);

    const throttled = statuses.filter((s) => s === 429).length;
    const reachedGrading = statuses.filter((s) => s === 403).length;

    // Every replayed completion reaches grading — the learner banks their whole
    // anonymous session in one burst without their own history throttling them.
    expect(throttled).toBe(0);
    expect(reachedGrading).toBe(OVER_USER_CAP);
    // Observable proof of "by construction": the per-user bucket was never even
    // queried for a replay (the route skips it when replay === true), so it
    // stays absent — not merely under-cap.
    expect(buckets.has("lessons:complete:user-1")).toBe(false);
  });

  it("the per-IP burn-rate gate is NOT loosened by replay — it still counts every replay", async () => {
    await burst(OVER_USER_CAP, /* replay */ true);

    // Replay skips ONLY the per-user key; the per-IP key (the one that bounds a
    // Sybil farm's burn rate) is charged on every request, replay or not.
    expect(buckets.get("lessons:complete:ip:203.0.113.7")).toBe(OVER_USER_CAP);
  });
});
