import { describe, it, expect, vi } from "vitest";
import {
  coursesById,
  lessonsById,
  achievementsById,
  questsById,
} from "../store";
import {
  projectCourse,
  projectLesson,
  projectAchievement,
  projectCourseSummary,
  projectRecommended,
  projectQuestData,
  projectLearningPath,
  countCourseLessons,
} from "../project";
import type { AchievementDoc, CourseDoc } from "../types";
import goldenCourses from "./fixtures/golden/courses.json";
import goldenCourseBySlug from "./fixtures/golden/course-by-slug.json";
import goldenLessons from "./fixtures/golden/lessons.json";
import goldenAch from "./fixtures/golden/achievements-raw.json";
import goldenQuests from "./fixtures/golden/quests-raw.json";
import goldenPaths from "./fixtures/golden/paths.json";
import goldenSummaries from "./fixtures/golden/course-summaries.json";

vi.mock("server-only", () => ({}));

// Golden fixtures (imported above) = a live capture of the PRE-FLIP GROQ output
// from prod Sanity (public dataset 4e3i2wwc/production). Each projector, fed the
// committed bundle doc, must deep-equal the captured GROQ shape. Divergences
// here mean the locked bundle SHA and prod Sanity have drifted (report, do not
// fudge the fixture) — EXCEPT the documented `instructor` → `creator` delta
// (issue #478): the fixtures were captured pre-migration and hand-edited to
// drop `instructor` / add `creator: null`, since the retired instructor deref
// no longer exists and the bundle carries no `creator` data yet.
const deps = { lessonsById };

function bundleCourse(id: string): CourseDoc {
  const doc = coursesById.get(id);
  if (!doc) throw new Error(`bundle missing course ${id}`);
  return doc;
}

describe("projectCourse — getAllCourses shape (summary module lessons)", () => {
  it("every bundle course has a golden (bundle → golden coverage)", () => {
    expect(coursesById.size).toBe(goldenCourses.length);
  });

  it("projects every prod course byte-identically", () => {
    for (const golden of goldenCourses) {
      const projected = projectCourse(bundleCourse(golden._id), deps);
      expect(projected).toEqual(golden);
    }
  });

  it("creator is null; thumbnail is null (documented deltas)", () => {
    const c = projectCourse(bundleCourse(goldenCourses[0]!._id), deps);
    expect(c.creator).toBeNull();
    expect(c.thumbnail).toBeNull();
  });
});

describe("projectCourse — getCourseBySlug shape (full module lessons)", () => {
  it("projects the course with full blocks[] lessons byte-identically", () => {
    const projected = projectCourse(
      bundleCourse(goldenCourseBySlug._id),
      deps,
      {
        fullLessons: true,
      }
    );
    expect(projected).toEqual(goldenCourseBySlug);
  });

  it("attaches trackCollectionAddress only when supplied (getCourseById)", () => {
    const withAddr = projectCourse(bundleCourse(goldenCourseBySlug._id), deps, {
      trackCollectionAddress: "TrackColl111",
    });
    expect(withAddr.trackCollectionAddress).toBe("TrackColl111");
    const without = projectCourse(bundleCourse(goldenCourseBySlug._id), deps);
    expect("trackCollectionAddress" in without).toBe(false);
  });
});

describe("projectLesson — full blocks[] projection", () => {
  it("every bundle lesson has a golden (bundle → golden coverage)", () => {
    expect(lessonsById.size).toBe(goldenLessons.length);
  });

  it("projects every prod lesson byte-identically", () => {
    for (const golden of goldenLessons) {
      const doc = lessonsById.get(golden._id);
      expect(doc, `bundle missing lesson ${golden._id}`).toBeDefined();
      expect(projectLesson(doc!)).toEqual(golden);
    }
  });

  it("a code block carries solution + tests + all null-filled sibling keys", () => {
    const codeGolden = goldenLessons.find((l) =>
      l.blocks?.some((b) => b._type === "code")
    );
    expect(codeGolden).toBeDefined();
    const projected = projectLesson(lessonsById.get(codeGolden!._id)!);
    const cb = projected.blocks.find((b) => b._type === "code");
    expect(cb).toBeDefined();
    // solution/tests present, quiz-only fields null-filled
    expect((cb as unknown as { solution: string }).solution).toBeTruthy();
    expect(Array.isArray((cb as unknown as { tests: unknown }).tests)).toBe(
      true
    );
    expect((cb as unknown as { questions: unknown }).questions).toBeNull();
  });
});

describe("projectAchievement — mapAchievement over the bundle", () => {
  // Prod Sanity carries 12 achievements; the locked bundle carries 10. The two
  // extra prod docs (award:null / admin-granted) are absent from the bundle.
  // Documented divergence — see report. Every SHARED achievement must project
  // identically (bundle doc == prod GROQ doc through the real projector).
  const KNOWN_ABSENT = new Set([
    "achievement-perfect-score",
    "achievement-speed-runner",
  ]);

  it("bundle covers exactly the shared 10; prod's extra 2 are the known set", () => {
    const bundleIds = new Set(achievementsById.keys());
    const missing = goldenAch.all
      .map((a) => a._id)
      .filter((id) => !bundleIds.has(id));
    expect(new Set(missing)).toEqual(KNOWN_ABSENT);
  });

  it("projects each shared achievement identically to prod", () => {
    for (const raw of goldenAch.all) {
      if (KNOWN_ABSENT.has(raw._id)) continue;
      const doc = achievementsById.get(raw._id);
      expect(doc, `bundle missing achievement ${raw._id}`).toBeDefined();
      // Project the bundle doc AND the prod GROQ raw doc through the same
      // projector: equal output proves the underlying content matches. The raw
      // GROQ doc omits `_type` (projectAchievement never reads it).
      expect(projectAchievement(doc!)).toEqual(
        projectAchievement(raw as unknown as AchievementDoc)
      );
    }
  });

  it("award is validated + stripped; anchor-expert = course-completed", () => {
    const anchor = projectAchievement(
      achievementsById.get("achievement-anchor-expert")!
    );
    expect(anchor.award).toEqual({
      kind: "course-completed",
      course: "course-anchor-framework",
    });
    expect(anchor.glyph).toBe("⬡");
    expect(anchor.solTier).toBe(false);
  });
});

describe("projectQuestData — active quests, challenge lessons, module map", () => {
  // Reference transform = the exact getAllQuests JS over the prod GROQ raw.
  const ref = {
    quests: goldenQuests.quests.map((q) => ({
      id: q._id,
      name: q.name,
      description: q.description ?? "",
      type: q.type,
      icon: q.icon ?? "CircleDashed",
      xpReward: q.xpReward,
      targetValue: q.targetValue,
      resetType: q.resetType,
    })),
    challengeLessonIds: (goldenQuests.challengeLessonIds ?? []).filter(Boolean),
    moduleLessonMap: (goldenQuests.moduleLessonMap ?? [])
      .filter((m) => !!m && !!m.lessonIds && m.lessonIds.length > 0)
      .map((m) => ({
        id: m!._id ?? "",
        lessonIds: m!.lessonIds.filter((x): x is string => !!x),
      })),
  };

  const projected = projectQuestData(
    [...questsById.values()],
    [...lessonsById.values()],
    [...coursesById.values()]
  );

  // Order across quests / challengeLessonIds / modules is not contractual (the
  // consumer looks up by id), and GROQ doc order != bundle array order, so
  // compare order-insensitively. lessonIds order WITHIN a module is display
  // order and IS preserved on both sides.
  const byId = <T extends { id: string }>(a: T, b: T) =>
    a.id.localeCompare(b.id);

  it("active quests match prod (order-insensitive)", () => {
    expect([...projected.quests].sort(byId)).toEqual(
      [...ref.quests].sort(byId)
    );
  });

  it("challengeLessonIds match prod (as a set)", () => {
    expect(new Set(projected.challengeLessonIds)).toEqual(
      new Set(ref.challengeLessonIds)
    );
    expect(projected.challengeLessonIds).toHaveLength(
      ref.challengeLessonIds.length
    );
  });

  it("moduleLessonMap matches prod (order-insensitive, lessonIds ordered)", () => {
    expect([...projected.moduleLessonMap].sort(byId)).toEqual(
      [...ref.moduleLessonMap].sort(byId)
    );
  });
});

describe("projectLearningPath — getAllLearningPaths shape", () => {
  it("projects every prod path byte-identically (members from bundle)", () => {
    for (const golden of goldenPaths) {
      const memberCourses = golden.courses.map((c) => bundleCourse(c._id));
      const projected = projectLearningPath(golden, memberCourses, deps);
      expect(projected).toEqual(golden);
    }
  });
});

describe("projectCourseSummary / projectRecommended / countCourseLessons", () => {
  it("projectCourseSummary matches getCoursesByIds", () => {
    for (const golden of goldenSummaries.coursesByIds) {
      const projected = projectCourseSummary(
        bundleCourse(golden._id),
        golden.learningPath
      );
      expect(projected).toEqual(golden);
    }
  });

  it("projectRecommended matches getRecommendedCourses", () => {
    for (const golden of goldenSummaries.recommended) {
      const projected = projectRecommended(
        bundleCourse(golden._id),
        golden.learningPath
      );
      expect(projected).toEqual(golden);
    }
  });

  it("countCourseLessons matches count(modules[].lessons[])", () => {
    for (const golden of goldenSummaries.lessonCounts) {
      expect(countCourseLessons(bundleCourse(golden._id))).toBe(
        golden.totalLessons
      );
    }
  });
});
