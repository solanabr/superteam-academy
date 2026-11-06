import { describe, it, expect } from "vitest";
import { pickTargets } from "../fixtures.mjs";

type Block = { _type: string; questions?: unknown[] };

const prose: Block = { _type: "prose" };
const single = (id: string, correct: string) => ({
  id,
  multiSelect: false,
  options: ["a", "b", "c"].map((o) => ({ id: o, correct: o === correct })),
});
const quiz = (...questions: unknown[]): Block => ({ _type: "quiz", questions });
const lesson = (id: string, ...blocks: Block[]) => ({
  _id: id,
  slug: { current: id },
  title: `Title of ${id}`,
  blocks,
});
const course = (slug: string, lessonIds: string[], unlisted?: boolean) => ({
  _id: `course-${slug}`,
  slug: { current: slug },
  modules: [{ lessons: lessonIds.map((id) => ({ _ref: id })) }],
  ...(unlisted ? { unlisted } : {}),
});

const lessons = [
  lesson("hidden-quiz", prose, quiz(single("q1", "a"))),
  lesson("with-code", prose, quiz(single("q1", "a")), { _type: "code" }),
  lesson(
    "multi-select",
    prose,
    quiz({ ...single("q1", "a"), multiSelect: true })
  ),
  lesson("two-quizzes", quiz(single("q1", "a")), quiz(single("q2", "b"))),
  lesson("quiz", prose, quiz(single("q1", "b"), single("q2", "c"))),
];

describe("pickTargets", () => {
  const targets = pickTargets(
    [
      course("hidden", ["hidden-quiz"], true),
      course("first", ["with-code", "multi-select", "two-quizzes", "quiz"]),
      course("unlisted-second", [], true),
      course("third", []),
    ],
    lessons
  );

  it("learns on the first listed lesson finished by one single-answer quiz", () => {
    expect(targets.LEARN_LOOP).toEqual({
      courseId: "course-first",
      courseSlug: "first",
      lessonId: "quiz",
      lessonSlug: "quiz",
      lessonTitle: "Title of quiz",
      answers: [
        ["q1", "b"],
        ["q2", "c"],
      ],
    });
    expect(targets.ACTIVE_COURSE_SLUGS).toEqual(["first"]);
  });

  it("deactivates a listed course, so its absence is down to is_active alone", () => {
    expect(targets.DEACTIVATED_COURSE_SLUG).toBe("third");
    expect(targets.DEPLOYMENTS.map((d) => [d.content_id, d.is_active])).toEqual(
      [
        ["course-first", true],
        ["course-third", false],
      ]
    );
  });

  it("picks a code lesson outside the deactivated course and keeps its course active", () => {
    const { CODE_LESSON, DEPLOYMENTS, ACTIVE_COURSE_SLUGS } = pickTargets(
      [
        course("first", ["quiz"]),
        course("second", []),
        course("third", ["with-code"]),
      ],
      lessons
    );
    expect(CODE_LESSON).toEqual({
      courseSlug: "third",
      lessonSlug: "with-code",
    });
    expect(ACTIVE_COURSE_SLUGS).toEqual(["first", "third"]);
    expect(DEPLOYMENTS.map((d) => [d.content_id, d.is_active])).toEqual([
      ["course-first", true],
      ["course-third", true],
      ["course-second", false],
    ]);
  });

  it("picks the worst layout lessons outside the deactivated course", () => {
    const proseLesson = (id: string, src: string) => ({
      ...lesson(id, { _type: "prose", src } as Block),
    });
    const stepped = lesson("stepped", prose, {
      _type: "quiz",
      questions: [
        {
          id: "q1",
          options: [
            { id: "a", correct: true },
            { id: "b", correct: false },
          ],
        },
        single("q2", "a"),
      ],
    } as Block);
    const twoCode = lesson("two-code", { _type: "code" }, { _type: "code" });
    const { LAYOUT_LESSONS, ACTIVE_COURSE_SLUGS } = pickTargets(
      [
        course("first", ["quiz"]),
        course("deactivated", ["widest-hidden"]),
        course("third", [
          "narrow",
          "wide",
          "short-code",
          "long-code",
          "stepped",
          "with-code",
          "two-code",
        ]),
      ],
      [
        ...lessons,
        stepped,
        twoCode,
        proseLesson("widest-hidden", `| ${"x".repeat(99)} |\n| - |\n`),
        proseLesson("narrow", `| ${"a".repeat(25)} | ${"b".repeat(25)} |\n`),
        proseLesson("wide", `| ${"a".repeat(30)} | ${"b".repeat(30)} |\n`),
        proseLesson("short-code", `See \`${"a".repeat(50)}\` here.`),
        proseLesson("long-code", `See \`${"a".repeat(60)}\` here.`),
      ]
    );
    expect(LAYOUT_LESSONS.table?.lessonSlug).toBe("wide");
    expect(LAYOUT_LESSONS.inlineCode?.lessonSlug).toBe("long-code");
    expect(LAYOUT_LESSONS.steppedQuiz).toMatchObject({
      lessonSlug: "quiz",
      wrongAnswer: ["q1", "a"],
    });
    expect(LAYOUT_LESSONS.singleCode?.lessonSlug).toBe("with-code");
    expect(LAYOUT_LESSONS.twoCode?.lessonSlug).toBe("two-code");
    expect(ACTIVE_COURSE_SLUGS).toEqual(["first", "third"]);
  });

  it("offers no layout lesson when nothing is long enough to break a phone", () => {
    const { LAYOUT_LESSONS } = pickTargets(
      [course("first", ["quiz", "small", "with-code"]), course("second", [])],
      [
        ...lessons,
        lesson("small", {
          _type: "prose",
          src: `| a | b |\n\nSee \`${"a".repeat(49)}\`.`,
        } as Block),
      ]
    );
    expect(LAYOUT_LESSONS.table).toBeNull();
    expect(LAYOUT_LESSONS.inlineCode).toBeNull();
  });

  it("fails loudly when no second listed course exists", () => {
    expect(() =>
      pickTargets(
        [course("first", ["quiz"]), course("hidden", [], true)],
        lessons
      )
    ).toThrow("second listed course");
  });
});
