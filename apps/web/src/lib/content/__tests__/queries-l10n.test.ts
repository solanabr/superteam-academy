import { describe, it, expect, vi } from "vitest";
import type { DeploymentStatus } from "../deployments";

vi.mock("server-only", () => ({}));

/**
 * The query layer in the reader's language (academy-courses PR #51). One
 * PT-BR course with an EN overlay; the reader asks in EN, PT-BR, ES, or not
 * at all. Contract: EN gets the overlay, PT-BR and ES get the source (ES
 * because the course does not ship it), and NO locale — grading, admin —
 * gets the source with no locale fields attached, so those paths cannot
 * even observe that overlays exist.
 */
const h = vi.hoisted(() => {
  const slug = (current: string) => ({ _type: "slug" as const, current });
  const ref = (id: string) => ({ _ref: id, _type: "reference", _weak: true });
  const lessons = [
    {
      _id: "lesson-basics",
      _type: "lesson",
      slug: slug("basics"),
      title: "Fundamentos",
      blocks: [
        { _key: "intro", _type: "prose", src: "# Olá" },
        {
          _key: "ex",
          _type: "code",
          solution: "// segredo",
          hints: ["Dica"],
          tests: [
            { id: "t1", description: "soma", input: "", expectedOutput: "" },
          ],
        },
      ],
    },
  ];
  const courses = [
    {
      _id: "course-demo",
      _type: "course",
      slug: slug("demo"),
      sourceLocale: "pt-BR",
      title: "Curso",
      description: "Descrição",
      difficulty: "beginner",
      xpPerLesson: 10,
      modules: [{ key: "m", title: "Módulo", lessons: [ref("lesson-basics")] }],
    },
  ];
  const l10n = {
    "course-demo": {
      en: {
        course: { title: "Course", modules: { m: { title: "Module" } } },
        lessons: {
          "lesson-basics": {
            title: "Basics",
            blocks: {
              intro: { src: "# Hello" },
              ex: {
                hints: { "0": "Hint" },
                tests: { t1: { description: "adds" } },
              },
            },
          },
        },
      },
    },
  };
  const deploymentRows = [
    { content_id: "course-demo", status: "synced", is_active: true },
  ];
  return { lessons, courses, l10n, deploymentRows };
});

vi.mock("../store", () => ({
  coursesById: new Map(h.courses.map((c) => [c._id, c])),
  coursesBySlug: new Map(h.courses.map((c) => [c.slug.current, c])),
  lessonsById: new Map(h.lessons.map((l) => [l._id, l])),
  lessonsBySlug: new Map(h.lessons.map((l) => [l.slug.current, l])),
  l10nByCourseId: new Map(Object.entries(h.l10n)),
  achievementsById: new Map(),
  questsById: new Map(),
  pathsById: new Map(),
  slotsByCourseId: new Map(),
}));

vi.mock("../deployments", () => {
  const deployMap = new Map(h.deploymentRows.map((r) => [r.content_id, r]));
  return {
    isSynced: (dep: DeploymentStatus | undefined): boolean =>
      dep?.status === "synced" && (dep?.is_active ?? true),
    getActiveDeployments: vi.fn(async () => deployMap),
    getDeploymentById: vi.fn(async () => null),
    getDeploymentByIdSafe: vi.fn(async () => ({ row: null, failed: false })),
  };
});

import * as q from "../queries";

describe("content queries in the reader's language", () => {
  it("getCourseBySlug: EN overlay, PT-BR source, ES falls back to source and says so", async () => {
    const en = (await q.getCourseBySlug("demo", "en"))!;
    expect(en.title).toBe("Course");
    expect(en.description).toBe("Descrição"); // untranslated leaf → source
    expect(en.modules[0]!.title).toBe("Module");
    expect(en.modules[0]!.lessons[0]!.title).toBe("Basics");
    expect(en).toMatchObject({
      sourceLocale: "pt-BR",
      availableLocales: ["pt-BR", "en"],
      locale: "en",
    });

    const pt = (await q.getCourseBySlug("demo", "pt-BR"))!;
    expect(pt.title).toBe("Curso");
    expect(pt.locale).toBe("pt-BR");

    const es = (await q.getCourseBySlug("demo", "es"))!;
    expect(es.title).toBe("Curso");
    expect(es.locale).toBe("pt-BR"); // ≠ requested → the page shows the notice
    expect(es.availableLocales).toEqual(["pt-BR", "en"]);
  });

  it("no locale → the source tree, with no locale fields at all", async () => {
    const none = (await q.getCourseBySlug("demo"))!;
    expect(none.title).toBe("Curso");
    expect(none).not.toHaveProperty("locale");
    expect(none).not.toHaveProperty("sourceLocale");
  });

  it("getLessonBySlug localizes blocks per leaf and never the grader's inputs", async () => {
    const en = (await q.getLessonBySlug("demo", "basics", "en"))!;
    expect(en.title).toBe("Basics");
    const [intro, ex] = en.blocks as unknown as [
      { src: string },
      {
        solution: string;
        hints: string[];
        tests: { description: string; expectedOutput: string }[];
      },
    ];
    expect(intro.src).toBe("# Hello");
    expect(ex.hints).toEqual(["Hint"]);
    expect(ex.tests[0]!.description).toBe("adds");
    expect(ex.tests[0]!.expectedOutput).toBe("");
    expect(ex.solution).toBe("// segredo");

    const src = (await q.getLessonBySlug("demo", "basics"))!;
    expect(src.title).toBe("Fundamentos");
  });

  it("getLessonByIdForGrading takes no locale and always reads the source", async () => {
    const graded = (await q.getLessonByIdForGrading(
      "course-demo",
      "lesson-basics"
    ))!;
    expect(graded.title).toBe("Fundamentos");
  });

  it("summaries: getCourseLessons, getCoursesByIds, getLessonsByIds, getCourseLessonOrders, getRecommendedCourses", async () => {
    expect((await q.getCourseLessons("demo", "en"))[0]!.title).toBe("Basics");
    expect((await q.getCourseLessons("demo"))[0]!.title).toBe("Fundamentos");
    expect((await q.getCoursesByIds(["course-demo"], "en"))[0]!.title).toBe(
      "Course"
    );
    expect((await q.getLessonsByIds(["lesson-basics"], "en"))[0]!.title).toBe(
      "Basics"
    );
    expect((await q.getLessonsByIds(["lesson-basics"], "es"))[0]!.title).toBe(
      "Fundamentos"
    );
    expect(
      (await q.getCourseLessonOrders(["course-demo"], "en"))[0]!.lessons[0]!
        .title
    ).toBe("Basics");
    expect((await q.getRecommendedCourses([], "en"))[0]!.title).toBe("Course");
    expect((await q.getAllCourses("en"))[0]!.title).toBe("Course");
  });

  it("getCourseIdBySlug reports the course's languages for the lesson page's notice", async () => {
    expect(await q.getCourseIdBySlug("demo")).toMatchObject({
      _id: "course-demo",
      sourceLocale: "pt-BR",
      availableLocales: ["pt-BR", "en"],
    });
  });
});
