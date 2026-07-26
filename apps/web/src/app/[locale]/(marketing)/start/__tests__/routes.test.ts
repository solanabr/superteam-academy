import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCourseById, getCourseLessons } from "@/lib/content/queries";
import { SEGMENT_ENTRY_COURSE } from "@/lib/courses/learner-segment";
import { resolveSegmentRoutes } from "../routes";

vi.mock("@/lib/content/queries", () => ({
  getCourseById: vi.fn(),
  getCourseLessons: vi.fn(),
}));

const byId = vi.mocked(getCourseById);
const lessonsOf = vi.mocked(getCourseLessons);

// Use each entry course's id as its slug for the fixtures (1:1, arbitrary).
const FUNDAMENTALS = SEGMENT_ENTRY_COURSE[1];
const ANCHOR = SEGMENT_ENTRY_COURSE[2];

beforeEach(() => {
  byId.mockReset();
  lessonsOf.mockReset();
  // Every entry course is present in the bundle (slug == id).
  byId.mockImplementation(
    async (id: string) =>
      ({ slug: id }) as Awaited<ReturnType<typeof getCourseById>>
  );
});

function lesson(slug: string) {
  return { _id: `l-${slug}`, title: slug, slug };
}

describe("resolveSegmentRoutes — F1 sync gating (funnel must never 404)", () => {
  it("deep-links to the first lesson when the entry course is synced", async () => {
    lessonsOf.mockResolvedValue([lesson("intro"), lesson("second")]);
    const routes = await resolveSegmentRoutes("en");
    expect(routes[1].href).toBe(`/en/courses/${FUNDAMENTALS}/lessons/intro`);
    expect(routes[2].href).toBe(`/en/courses/${ANCHOR}/lessons/intro`);
    expect(routes[1].courseId).toBe(FUNDAMENTALS);
  });

  it("falls back to /courses when the entry course is present but UNSYNCED", async () => {
    // getCourseLessons returns [] for an unsynced course (or a DB-degraded
    // empty deployment map) — the realistic launch state. Must NOT deep-link.
    lessonsOf.mockImplementation(async (slug: string) =>
      slug === ANCHOR ? [] : [lesson("intro")]
    );
    const routes = await resolveSegmentRoutes("en");
    expect(routes[2].href).toBe("/en/courses"); // unsynced anchor → catalog
    expect(routes[1].href).toBe(`/en/courses/${FUNDAMENTALS}/lessons/intro`);
  });

  it("falls back to /courses when the entry course is absent from the bundle", async () => {
    byId.mockResolvedValue(null);
    lessonsOf.mockResolvedValue([]);
    const routes = await resolveSegmentRoutes("en");
    for (const seg of [1, 2, 3] as const) {
      expect(routes[seg].href).toBe("/en/courses");
      // courseId is still carried for E7 analytics even when routing is degraded.
      expect(routes[seg].courseId).toBe(SEGMENT_ENTRY_COURSE[seg]);
    }
  });

  it("falls back to /courses when the whole deployment map is empty (DB degradation)", async () => {
    lessonsOf.mockResolvedValue([]); // getActiveDeployments empty → every course unsynced
    const routes = await resolveSegmentRoutes("en");
    expect(routes[1].href).toBe("/en/courses");
    expect(routes[2].href).toBe("/en/courses");
    expect(routes[3].href).toBe("/en/courses");
  });
});
