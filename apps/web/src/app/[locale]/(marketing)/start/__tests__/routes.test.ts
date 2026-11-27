import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCourseLessons, getCourseSlugById } from "@/lib/content/queries";
import { entryCourseFor } from "@/lib/courses/learner-segment";
import { resolveSegmentRoutes } from "../routes";

vi.mock("@/lib/content/queries", () => ({
  getCourseSlugById: vi.fn(),
  getCourseLessons: vi.fn(),
}));

// The routing TABLE is mocked with three DISTINCT synthetic entries; this suite
// is about `resolveSegmentRoutes` — that each segment resolves independently and
// that one dead entry degrades only its own segment. The one `null` stands in
// for a locale with no fitting course. The REAL table is asserted against the
// REAL bundle in lib/courses/__tests__/entry-course-live.test.ts — that is where
// a bad entry id is caught, not here.
vi.mock("@/lib/courses/learner-segment", () => ({
  entryCourseFor: (segment: number, locale: string) =>
    locale === "es" && segment === 3 ? null : `course-seg${segment}-entry`,
}));

const slugOf = vi.mocked(getCourseSlugById);
const lessonsOf = vi.mocked(getCourseLessons);

// Use each entry course's id as its slug for the fixtures (1:1, arbitrary).
const SEG1_ENTRY = entryCourseFor(1, "en");
const SEG2_ENTRY = entryCourseFor(2, "en");

beforeEach(() => {
  slugOf.mockReset();
  lessonsOf.mockReset();
  // Every entry course is present in the bundle (slug == id).
  slugOf.mockImplementation((id: string) => id);
});

function lesson(slug: string) {
  return { _id: `l-${slug}`, title: slug, slug };
}

describe("resolveSegmentRoutes — F1 sync gating (funnel must never 404)", () => {
  it("deep-links to the first lesson when the entry course is synced", async () => {
    lessonsOf.mockResolvedValue([lesson("intro"), lesson("second")]);
    const routes = await resolveSegmentRoutes("en");
    expect(routes[1].href).toBe(`/en/courses/${SEG1_ENTRY}/lessons/intro`);
    expect(routes[2].href).toBe(`/en/courses/${SEG2_ENTRY}/lessons/intro`);
    expect(routes[1].courseId).toBe(SEG1_ENTRY);
  });

  it("falls back to /courses when the entry course is present but UNSYNCED", async () => {
    // getCourseLessons returns [] for an unsynced course (or a DB-degraded
    // empty deployment map) — the realistic launch state. Must NOT deep-link.
    lessonsOf.mockImplementation(async (slug: string) =>
      slug === SEG2_ENTRY ? [] : [lesson("intro")]
    );
    const routes = await resolveSegmentRoutes("en");
    expect(routes[2].href).toBe("/en/courses"); // unsynced seg-2 entry → catalog
    expect(routes[1].href).toBe(`/en/courses/${SEG1_ENTRY}/lessons/intro`);
  });

  it("falls back to /courses when the entry course is absent from the bundle", async () => {
    slugOf.mockReturnValue(null);
    lessonsOf.mockResolvedValue([]);
    const routes = await resolveSegmentRoutes("en");
    for (const seg of [1, 2, 3] as const) {
      expect(routes[seg].href).toBe("/en/courses");
      // courseId is still carried for E7 analytics even when routing is degraded.
      expect(routes[seg].courseId).toBe(entryCourseFor(seg, "en"));
    }
  });

  it("routes a segment with no course in this locale to the catalog", async () => {
    lessonsOf.mockResolvedValue([lesson("intro")]);
    const routes = await resolveSegmentRoutes("es");
    expect(routes[3]).toEqual({ courseId: null, href: "/es/courses" });
    expect(routes[1].href).toBe(`/es/courses/${SEG1_ENTRY}/lessons/intro`);
  });

  it("falls back to /courses when the whole deployment map is empty (DB degradation)", async () => {
    lessonsOf.mockResolvedValue([]); // getActiveDeployments empty → every course unsynced
    const routes = await resolveSegmentRoutes("en");
    expect(routes[1].href).toBe("/en/courses");
    expect(routes[2].href).toBe("/en/courses");
    expect(routes[3].href).toBe("/en/courses");
  });
});
