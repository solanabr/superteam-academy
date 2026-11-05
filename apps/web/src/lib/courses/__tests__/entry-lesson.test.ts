import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCourseLessons, getCourseSlugById } from "@/lib/content/queries";
import { DEFAULT_SEGMENT, entryCourseFor } from "@/lib/courses/learner-segment";
import {
  resolveEntryLessonHref,
  resolveFlagshipLessonHref,
} from "../entry-lesson";

vi.mock("@/lib/content/queries", () => ({
  getCourseSlugById: vi.fn(),
  getCourseLessons: vi.fn(),
}));

const slugOf = vi.mocked(getCourseSlugById);
const lessonsOf = vi.mocked(getCourseLessons);

const FLAGSHIP = entryCourseFor(DEFAULT_SEGMENT, "en")!;

beforeEach(() => {
  slugOf.mockReset();
  lessonsOf.mockReset();
  // Course present in the bundle; use its id as slug (1:1, arbitrary).
  slugOf.mockImplementation((id: string) => id);
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
    slugOf.mockReturnValue(null);
    lessonsOf.mockResolvedValue([]);
    const href = await resolveEntryLessonHref("en", "course-x");
    expect(href).toBe("/en/courses");
    // Absent course short-circuits before ever querying lessons.
    expect(lessonsOf).not.toHaveBeenCalled();
  });

  it("goes to the locale catalog without a lookup when the table has no course", async () => {
    const href = await resolveEntryLessonHref("es", null);
    expect(href).toBe("/es/courses");
    expect(slugOf).not.toHaveBeenCalled();
    expect(lessonsOf).not.toHaveBeenCalled();
  });
});

describe("resolveFlagshipLessonHref — landing deep-link (LX-A1)", () => {
  it("targets the DEFAULT_SEGMENT entry course's first lesson", async () => {
    lessonsOf.mockResolvedValue([lesson("welcome")]);
    const href = await resolveFlagshipLessonHref("en");
    expect(slugOf).toHaveBeenCalledWith(FLAGSHIP);
    expect(href).toBe(`/en/courses/${FLAGSHIP}/lessons/welcome`);
  });

  it("picks the entry course for the visitor's locale", async () => {
    lessonsOf.mockResolvedValue([lesson("welcome")]);
    const ptEntry = entryCourseFor(DEFAULT_SEGMENT, "pt-BR")!;
    expect(ptEntry).not.toBe(FLAGSHIP);
    const href = await resolveFlagshipLessonHref("pt-BR");
    expect(slugOf).toHaveBeenCalledWith(ptEntry);
    expect(href).toBe(`/pt-BR/courses/${ptEntry}/lessons/welcome`);
  });

  it("falls back to the catalog when the flagship course is unsynced", async () => {
    lessonsOf.mockResolvedValue([]);
    const href = await resolveFlagshipLessonHref("pt-BR");
    expect(href).toBe("/pt-BR/courses");
  });
});
