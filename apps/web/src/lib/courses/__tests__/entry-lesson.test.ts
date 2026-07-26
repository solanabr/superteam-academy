import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCourseById, getCourseLessons } from "@/lib/content/queries";
import {
  DEFAULT_SEGMENT,
  SEGMENT_ENTRY_COURSE,
} from "@/lib/courses/learner-segment";
import {
  resolveEntryLessonHref,
  resolveFlagshipLessonHref,
} from "../entry-lesson";

vi.mock("@/lib/content/queries", () => ({
  getCourseById: vi.fn(),
  getCourseLessons: vi.fn(),
}));

const byId = vi.mocked(getCourseById);
const lessonsOf = vi.mocked(getCourseLessons);

const FLAGSHIP = SEGMENT_ENTRY_COURSE[DEFAULT_SEGMENT];

beforeEach(() => {
  byId.mockReset();
  lessonsOf.mockReset();
  // Course present in the bundle; use its id as slug (1:1, arbitrary).
  byId.mockImplementation(
    async (id: string) =>
      ({ slug: id }) as Awaited<ReturnType<typeof getCourseById>>
  );
});

function lesson(slug: string) {
  return { _id: `l-${slug}`, title: slug, slug };
}

describe("resolveEntryLessonHref — F1 sync gating", () => {
  it("deep-links to the first lesson when the course is synced", async () => {
    lessonsOf.mockResolvedValue([lesson("intro"), lesson("second")]);
    const href = await resolveEntryLessonHref("en", "course-x");
    expect(href).toBe("/en/courses/course-x/lessons/intro");
  });

  it("locale-prefixes the deep-link (pt-BR)", async () => {
    lessonsOf.mockResolvedValue([lesson("intro")]);
    const href = await resolveEntryLessonHref("pt-BR", "course-x");
    expect(href).toBe("/pt-BR/courses/course-x/lessons/intro");
  });

  it("falls back to the locale catalog when the course is UNSYNCED", async () => {
    lessonsOf.mockResolvedValue([]); // unsynced / deployment-read-failed
    const href = await resolveEntryLessonHref("es", "course-x");
    expect(href).toBe("/es/courses");
  });

  it("falls back to the locale catalog when the course is ABSENT", async () => {
    byId.mockResolvedValue(null);
    lessonsOf.mockResolvedValue([]);
    const href = await resolveEntryLessonHref("en", "course-x");
    expect(href).toBe("/en/courses");
    // Absent course short-circuits before ever querying lessons.
    expect(lessonsOf).not.toHaveBeenCalled();
  });
});

describe("resolveFlagshipLessonHref — landing deep-link (LX-A1)", () => {
  it("targets the DEFAULT_SEGMENT entry course's first lesson", async () => {
    lessonsOf.mockResolvedValue([lesson("welcome")]);
    const href = await resolveFlagshipLessonHref("en");
    expect(byId).toHaveBeenCalledWith(FLAGSHIP);
    expect(href).toBe(`/en/courses/${FLAGSHIP}/lessons/welcome`);
  });

  it("falls back to the catalog when the flagship course is unsynced", async () => {
    lessonsOf.mockResolvedValue([]);
    const href = await resolveFlagshipLessonHref("pt-BR");
    expect(href).toBe("/pt-BR/courses");
  });
});
