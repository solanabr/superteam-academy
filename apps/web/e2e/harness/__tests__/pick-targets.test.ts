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

  it("fails loudly when no second listed course exists", () => {
    expect(() =>
      pickTargets(
        [course("first", ["quiz"]), course("hidden", [], true)],
        lessons
      )
    ).toThrow("second listed course");
  });
});
