import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import type { SlotsLockT } from "@superteam-lms/content-schema";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: class extends Error {},
  adminUnauthorizedResponse: () => new Response("{}", { status: 401 }),
  requireAdminAuth: vi.fn(),
}));
vi.mock("@/lib/content-sync/github", () => ({
  createGitHubClient: () => ({
    fetchHeadSha: async () => headSha,
    fetchChecksState: async () => "success",
  }),
}));

// SP2-B: the synced SHA is the committed bundle's pinned SHA (was the Sanity
// `contentSync` singleton), and masks derive from the bundle's `slotsByCourseId`
// (was a runtime GitHub tarball). Both are mocked here as mutable module state.
let syncedSha = "a".repeat(40);
let headSha = "b".repeat(40);
let courses: Array<{ _id: string; title: string }> = [];
let slots = new Map<string, SlotsLockT>();

vi.mock("@/lib/content/meta", () => ({
  get SYNCED_SHA() {
    return syncedSha;
  },
}));
vi.mock("@/lib/content/store", () => ({
  get slotsByCourseId() {
    return slots;
  },
}));
vi.mock("@/lib/sanity/queries", () => ({
  getAllCoursesAdmin: async () => courses,
  COURSES_CACHE_TAG: "courses",
}));
vi.mock("@/lib/solana/academy-reads", () => ({
  // No on-chain account — chain drift is exercised only for the mask assertion.
  fetchCourse: async () => null,
}));

const get = async (): Promise<Response> => {
  const { GET } = await import("../route");
  return GET(
    new Request("https://x/api/admin/content/drift") as unknown as NextRequest
  );
};

beforeEach(() => {
  vi.resetModules();
  syncedSha = "a".repeat(40);
  headSha = "b".repeat(40);
  courses = [];
  slots = new Map();
});

describe("GET /api/admin/content/drift", () => {
  it("computes content drift from the bundle SHA vs GitHub HEAD", async () => {
    // bundle SHA (a…) behind HEAD (b…), CI green → behind + syncable
    const res = await get();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      content: { state: string; canSync: boolean; syncedSha: string };
    };
    expect(body.content.state).toBe("behind");
    expect(body.content.canSync).toBe(true);
    expect(body.content.syncedSha).toBe("a".repeat(40));
  });

  it("derives each course's active_lessons mask from the bundle slots when up to date", async () => {
    // Bundle at HEAD → masks are actionable and sourced from slotsByCourseId.
    syncedSha = "c".repeat(40);
    headSha = "c".repeat(40);
    courses = [{ _id: "course-x", title: "Course X" }];
    slots = new Map<string, SlotsLockT>([
      ["course-x", { version: 1, slots: { "lesson-a": 0 }, retired: [], next: 1 }],
    ]);

    const res = await get();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      content: { state: string };
      courses: Array<{ id: string; activeLessons: string[] | null }>;
    };
    expect(body.content.state).toBe("up_to_date");
    // slot 0 set → mask word0 bit0 → "1", rest "0".
    expect(body.courses[0]?.id).toBe("course-x");
    expect(body.courses[0]?.activeLessons).toEqual(["1", "0", "0", "0"]);
  });
});
