import { describe, it, expect } from "vitest";
import type { Course } from "@superteam-lms/types";
import {
  gatherCourseQuizQuestions,
  selectTestOutQuestions,
  toPublicQuestion,
  gradeTestOut,
  TEST_OUT_QUESTION_COUNT,
  TEST_OUT_PASS_RATIO,
  type TestOutSelections,
} from "../test-out";

/** Build a course with `n` single-answer quiz questions in one lesson. */
function courseWith(n: number, courseId = "course-x"): Course {
  const questions = Array.from({ length: n }, (_, i) => ({
    id: `q${i}`,
    prompt: `Question ${i}?`,
    multiSelect: false,
    options: [
      { id: "a", label: "Right", correct: true },
      { id: "b", label: "Wrong", correct: false },
    ],
  }));
  return {
    _id: courseId,
    modules: [
      {
        key: "m1",
        title: "Module",
        lessons: [
          {
            _id: "lesson-1",
            title: "Lesson",
            slug: "lesson-1",
            blocks: [{ _type: "quiz", key: "qb", questions }],
          },
        ],
      },
    ],
  } as unknown as Course;
}

const uid = (q: number) => `lesson-1::qb::q${q}`;

describe("gatherCourseQuizQuestions", () => {
  it("flattens every quiz question with a course-unique uid", () => {
    const pool = gatherCourseQuizQuestions(courseWith(3));
    expect(pool.map((p) => p.uid)).toEqual([uid(0), uid(1), uid(2)]);
  });

  it("returns an empty pool for a course with no quiz blocks", () => {
    const course = {
      _id: "c",
      modules: [
        {
          key: "m",
          title: "m",
          lessons: [{ _id: "l", title: "l", slug: "l", blocks: [] }],
        },
      ],
    } as unknown as Course;
    expect(gatherCourseQuizQuestions(course)).toEqual([]);
  });
});

describe("selectTestOutQuestions", () => {
  it("is deterministic for a (user, course) pair", () => {
    const course = courseWith(20);
    const a = selectTestOutQuestions(course, "user-1").map((p) => p.uid);
    const b = selectTestOutQuestions(course, "user-1").map((p) => p.uid);
    expect(a).toEqual(b);
  });

  it("caps the set at TEST_OUT_QUESTION_COUNT", () => {
    expect(selectTestOutQuestions(courseWith(20), "user-1")).toHaveLength(
      TEST_OUT_QUESTION_COUNT
    );
  });

  it("uses the whole pool when smaller than the nominal count", () => {
    expect(selectTestOutQuestions(courseWith(4), "user-1")).toHaveLength(4);
  });

  it("varies the set by user", () => {
    const course = courseWith(20);
    const a = selectTestOutQuestions(course, "user-1").map((p) => p.uid);
    const b = selectTestOutQuestions(course, "user-2").map((p) => p.uid);
    expect(a).not.toEqual(b);
  });
});

describe("toPublicQuestion", () => {
  it("strips the answer key (correct/feedback/explanation)", () => {
    const [pooled] = gatherCourseQuizQuestions(courseWith(1));
    const pub = toPublicQuestion(pooled!);
    expect(pub).toEqual({
      id: uid(0),
      prompt: "Question 0?",
      multiSelect: false,
      options: [
        { id: "a", label: "Right" },
        { id: "b", label: "Wrong" },
      ],
    });
    // No `correct` flag survives on any option.
    expect(JSON.stringify(pub)).not.toContain("correct");
  });
});

describe("gradeTestOut", () => {
  it("passes at exactly the threshold and fails one below it", () => {
    const course = courseWith(5);
    const selected = selectTestOutQuestions(course, "user-1");
    // Map the shuffled selected set back to correct answers by uid.
    const rightAll: TestOutSelections = {};
    for (const p of selected) rightAll[p.uid] = ["a"];

    const required = Math.ceil(5 * TEST_OUT_PASS_RATIO); // 4
    expect(gradeTestOut(selected, rightAll).passed).toBe(true);

    // Knock exactly (5 - (required-1)) answers to wrong → one below threshold.
    const below: TestOutSelections = { ...rightAll };
    let wrong = 0;
    for (const p of selected) {
      if (wrong >= 5 - (required - 1)) break;
      below[p.uid] = ["b"];
      wrong++;
    }
    const belowGrade = gradeTestOut(selected, below);
    expect(belowGrade.correct).toBe(required - 1);
    expect(belowGrade.passed).toBe(false);
  });

  it("scores a missing or malformed selection as wrong (never trusts the client)", () => {
    const course = courseWith(3);
    const selected = selectTestOutQuestions(course, "user-1");
    const grade = gradeTestOut(selected, {}); // nothing answered
    expect(grade).toMatchObject({ total: 3, correct: 0, passed: false });
  });

  it("requires set equality for multi-select questions", () => {
    const course = {
      _id: "c",
      modules: [
        {
          key: "m",
          title: "m",
          lessons: [
            {
              _id: "l",
              title: "l",
              slug: "l",
              blocks: [
                {
                  _type: "quiz",
                  key: "qb",
                  questions: [
                    {
                      id: "q",
                      prompt: "Pick both",
                      multiSelect: true,
                      options: [
                        { id: "a", label: "A", correct: true },
                        { id: "b", label: "B", correct: true },
                        { id: "c", label: "C", correct: false },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    } as unknown as Course;
    const selected = selectTestOutQuestions(course, "u");
    const key = selected[0]!.uid;
    expect(gradeTestOut(selected, { [key]: ["a", "b"] }).passed).toBe(true);
    // A partial (missing one correct option) fails.
    expect(gradeTestOut(selected, { [key]: ["a"] }).passed).toBe(false);
    // An extra (correct set + a wrong option) fails.
    expect(gradeTestOut(selected, { [key]: ["a", "b", "c"] }).passed).toBe(
      false
    );
  });

  it("reports the required count and never passes an empty set", () => {
    expect(gradeTestOut([], {})).toEqual({
      total: 0,
      correct: 0,
      required: 0,
      passed: false,
    });
  });
});

// Guard the public constant against silent drift — the acceptance criteria and
// the UI copy both assume this nominal count.
describe("constants", () => {
  it("keeps the nominal 10-question challenge", () => {
    expect(TEST_OUT_QUESTION_COUNT).toBe(10);
  });
});
