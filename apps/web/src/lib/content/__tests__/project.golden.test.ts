import { describe, it, expect, vi } from "vitest";
import { buildStore } from "../build-store";
import { localizeCourseView } from "../localize";
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
import type { CourseDoc } from "../types";
import { goldenBundle } from "./fixtures/golden-bundle";

vi.mock("server-only", () => ({}));

/**
 * Golden tests for the content projectors, run over the small fixed bundle in
 * `fixtures/golden-bundle.ts`, never over the live one, so a content release
 * cannot move them. The JSON goldens in `fixtures/golden/` change only when a
 * projector does; after an intended change, regenerate them and review the
 * diff:
 *
 *   pnpm --filter web exec vitest run src/lib/content/__tests__/project.golden.test.ts -u
 *
 * Invariants of the live bundle itself are in `bundle.invariants.test.ts`.
 */

const store = buildStore(goldenBundle);
const deps = { lessonsById: store.lessonsById };
const golden = (name: string) => `./fixtures/golden/${name}.json`;
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

function course(id: string): CourseDoc {
  const doc = store.coursesById.get(id);
  if (!doc) throw new Error(`fixture missing course ${id}`);
  return doc;
}

type Block = Record<string, unknown>;

/** Every key the `blocks[]` projection emits on every block, null when absent. */
const NULL_FILLED_BLOCK_KEYS = [
  "key",
  "_type",
  "produces",
  "consumes",
  "src",
  "url",
  "language",
  "buildType",
  "deployable",
  "starter",
  "solution",
  "tests",
  "hints",
  "questions",
  "prompt",
  "maxWords",
  "amount",
  "network",
  "idl",
];

describe("projectCourse — catalogue shape (summary lessons)", () => {
  const projected = [...store.coursesById.values()].map((c) =>
    projectCourse(c, deps)
  );

  it("matches the golden", async () => {
    await expect(json(projected)).toMatchFileSnapshot(golden("courses"));
  });

  it("drops a module lesson ref that resolves to no lesson (#405)", () => {
    const alpha = projectCourse(course("course-alpha"), deps);
    expect(alpha.modules[0]!.lessons.map((l) => l._id)).toEqual([
      "lesson-alpha-quiz",
      "lesson-alpha-code",
    ]);
  });

  it("projects absent optional fields as null, never undefined", () => {
    const beta = projectCourse(course("course-beta"), deps);
    for (const field of [
      "description",
      "duration",
      "thumbnail",
      "creator",
      "tags",
      "trackId",
      "trackLevel",
    ] as const) {
      expect(beta[field], field).toBeNull();
    }
  });

  it("leaves the on-chain-only fields off the projection", () => {
    const alpha = projectCourse(course("course-alpha"), deps);
    for (const field of [
      "xpPerLesson",
      "creatorRewardXp",
      "minCompletionsForReward",
      "sourceLocale",
    ]) {
      expect(alpha, field).not.toHaveProperty(field);
    }
  });
});

describe("projectCourse — course page shape (full lessons)", () => {
  it("matches the golden", async () => {
    const projected = projectCourse(course("course-alpha"), deps, {
      fullLessons: true,
    });
    await expect(json(projected)).toMatchFileSnapshot(golden("course-by-slug"));
  });

  it("attaches trackCollectionAddress only when supplied (getCourseById)", () => {
    const withAddr = projectCourse(course("course-alpha"), deps, {
      trackCollectionAddress: "TrackColl111",
    });
    expect(withAddr.trackCollectionAddress).toBe("TrackColl111");
    const without = projectCourse(course("course-alpha"), deps);
    expect("trackCollectionAddress" in without).toBe(false);
  });

  it("flags a failed deployment read only when it failed (#931)", () => {
    const failed = projectCourse(course("course-alpha"), deps, {
      deploymentReadFailed: true,
    });
    expect(failed.deploymentReadFailed).toBe(true);
    const fine = projectCourse(course("course-alpha"), deps, {
      deploymentReadFailed: false,
    });
    expect("deploymentReadFailed" in fine).toBe(false);
  });
});

describe("projectLesson — blocks[] projection", () => {
  const projected = [...store.lessonsById.values()].map(projectLesson);
  const blocks = projected.flatMap((l) => l.blocks as unknown as Block[]);
  const block = (key: string): Block => {
    const found = blocks.find((b) => b.key === key);
    if (!found) throw new Error(`fixture missing block ${key}`);
    return found;
  };

  it("matches the golden", async () => {
    await expect(json(projected)).toMatchFileSnapshot(golden("lessons"));
  });

  it("emits every listed key on every block, null when the block lacks it", () => {
    for (const b of blocks) {
      for (const key of NULL_FILLED_BLOCK_KEYS) {
        expect(b, `${String(b.key)}.${key}`).toHaveProperty(key);
      }
    }
    expect(block("intro").questions).toBeNull();
    expect(block("check").src).toBeNull();
  });

  it("a code block carries its solution and tests, with quiz fields null", () => {
    const exercise = block("exercise");
    expect(exercise.solution).toBeTruthy();
    expect(Array.isArray(exercise.tests)).toBe(true);
    expect(exercise.questions).toBeNull();
  });

  it("surfaces a test's failureMessage only when authored (#575)", () => {
    const [authored, bare] = block("exercise").tests as Block[];
    expect(authored!.failureMessage).toBe("Comece do cursor + 1.");
    expect("failureMessage" in bare!).toBe(false);
  });

  it("surfaces tutorNotes and the Parsons fields only on blocks that carry them", () => {
    expect(block("exercise").tutorNotes).toEqual([
      "O erro comum é reaplicar o próprio cursor.",
    ]);
    expect(block("order")).toMatchObject({
      correctOrder: ["l1", "l2"],
      explanation: "You sign what you built.",
    });
    for (const b of blocks.filter((x) => x.key !== "exercise")) {
      expect(b).not.toHaveProperty("tutorNotes");
    }
    for (const b of blocks.filter((x) => x._type !== "parsons")) {
      expect(b).not.toHaveProperty("lines");
      expect(b).not.toHaveProperty("correctOrder");
    }
  });
});

describe("localized course projection (content i18n)", () => {
  const view = localizeCourseView(
    course("course-alpha"),
    store.l10nByCourseId.get("course-alpha"),
    store.lessonsById,
    "en"
  );
  const projected = projectCourse(
    view.doc,
    { lessonsById: view.lessonsById },
    { fullLessons: true }
  );
  const source = projectCourse(course("course-alpha"), deps, {
    fullLessons: true,
  });
  const lessonBlocks = (c: typeof projected, i: number) =>
    c.modules[0]!.lessons[i]!.blocks as unknown as Block[];

  it("matches the golden", async () => {
    expect(view.locale).toBe("en");
    await expect(json(projected)).toMatchFileSnapshot(
      golden("localized-course")
    );
  });

  it("replaces only the translated leaves, including the localized thumbnail", () => {
    expect(projected.title).toBe("Alpha: from thesis to your first asset");
    expect(projected.thumbnail).not.toBe(source.thumbnail);
    expect(projected.description).toBe(source.description);
    expect(projected.modules[1]!.title).toBe(source.modules[1]!.title);
  });

  it("never changes what the grader reads", () => {
    const [, check] = lessonBlocks(projected, 0);
    const [, srcCheck] = lessonBlocks(source, 0);
    const correct = (b: Block) =>
      (b.questions as { options: { correct: boolean }[] }[]).map((q) =>
        q.options.map((o) => o.correct)
      );
    expect(correct(check!)).toEqual(correct(srcCheck!));

    const [, exercise] = lessonBlocks(projected, 1);
    const [, srcExercise] = lessonBlocks(source, 1);
    expect(exercise!.solution).toBe(srcExercise!.solution);
    expect(exercise!.starter).toBe(srcExercise!.starter);
    const io = (b: Block) =>
      (b.tests as Block[]).map((t) => [t.input, t.expectedOutput]);
    expect(io(exercise!)).toEqual(io(srcExercise!));
  });
});

describe("projectAchievement", () => {
  const projected = [...store.achievementsById.values()].map(
    projectAchievement
  );
  const byId = (id: string) => projected.find((a) => a.id === id)!;

  it("matches the golden", async () => {
    await expect(json(projected)).toMatchFileSnapshot(golden("achievements"));
  });

  it("validates the award and strips keys the schema does not know", () => {
    expect(byId("achievement-alpha-complete").award).toEqual({
      kind: "course-completed",
      course: "course-alpha",
    });
  });

  it("projects an award the schema rejects as null, so it never auto-fires", () => {
    expect(byId("achievement-broken").award).toBeNull();
  });

  it("defaults glyph to the id's last two chars, solTier to false, xpReward to 0", () => {
    expect(byId("achievement-early-bird")).toMatchObject({
      glyph: "RD",
      solTier: false,
      xpReward: 0,
      award: { kind: "manual" },
    });
  });
});

describe("projectQuestData", () => {
  const projected = projectQuestData(
    [...store.questsById.values()],
    [...store.lessonsById.values()],
    [...store.coursesById.values()]
  );

  it("matches the golden", async () => {
    await expect(json(projected)).toMatchFileSnapshot(golden("quests"));
  });

  it("keeps active, non-draft quests and fills the description/icon defaults", () => {
    expect(projected.quests.map((q) => q.id)).toEqual([
      "quest-lesson",
      "quest-streak",
    ]);
    expect(projected.quests[1]).toMatchObject({
      description: "",
      icon: "CircleDashed",
    });
  });

  it("lists every lesson with a code block as a challenge", () => {
    expect(projected.challengeLessonIds).toEqual([
      "lesson-alpha-code",
      "lesson-alpha-deploy",
    ]);
  });

  it("maps modules by <courseId>:<key>, skipping drafts and empty modules", () => {
    expect(projected.moduleLessonMap).toEqual([
      {
        id: "course-alpha:fundamentos",
        lessonIds: [
          "lesson-alpha-quiz",
          "lesson-alpha-retired",
          "lesson-alpha-code",
        ],
      },
      { id: "course-alpha:deploy", lessonIds: ["lesson-alpha-deploy"] },
      { id: "course-beta:order", lessonIds: ["lesson-beta-parsons"] },
    ]);
  });
});

describe("projectLearningPath", () => {
  it("matches the golden (member courses resolved from the store)", async () => {
    const projected = [...store.pathsById.values()].map((p) => {
      const members = (p.courses as { _ref: string }[]).map((r) =>
        course(r._ref)
      );
      return projectLearningPath(p, members, deps);
    });
    await expect(json(projected)).toMatchFileSnapshot(golden("paths"));
  });
});

describe("projectCourseSummary / projectRecommended / countCourseLessons", () => {
  const paths: Record<string, string | null> = {
    "course-alpha": "Comece aqui",
    "course-beta": null,
  };

  it("matches the golden", async () => {
    const summaries = Object.entries(paths).map(([id, path]) => ({
      summary: projectCourseSummary(course(id), path),
      recommended: projectRecommended(course(id), path),
    }));
    await expect(json(summaries)).toMatchFileSnapshot(
      golden("course-summaries")
    );
  });

  it("counts raw module refs, unresolvable ones included (GROQ count semantics)", () => {
    expect(countCourseLessons(course("course-alpha"))).toBe(4);
    expect(countCourseLessons(course("course-beta"))).toBe(1);
  });
});
