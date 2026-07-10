import { describe, it, expect } from "vitest";
import { stringify } from "yaml";
import { parseAndValidateTree } from "../validate";
import { ContentValidationError } from "../types";
import type { GraderSet } from "../executor-gate";

// A submission "passes" iff its text contains "solve".
const passGraders: GraderSet = {
  js: async (code) => ({ passed: code.includes("solve"), failures: ["fail"] }),
  rust: async (code) => ({
    passed: code.includes("solve"),
    failures: ["fail"],
  }),
  buildable: async (code) => ({
    passed: code.includes("solve"),
    failures: ["fail"],
  }),
};

function tree(files: Record<string, string>): Map<string, Uint8Array> {
  const m = new Map<string, Uint8Array>();
  const enc = new TextEncoder();
  for (const [k, v] of Object.entries(files)) m.set(k, enc.encode(v));
  return m;
}

const courseYaml = stringify({
  id: "course-demo",
  slug: "demo",
  title: "Demo",
  description: "d",
  difficulty: "beginner",
  duration: 1,
  xpPerLesson: 10,
  xpReward: 100,
  modules: [{ key: "m", title: "M", lessons: ["lesson-accounts"] }],
});
const lessonYaml = stringify({
  id: "lesson-accounts",
  slug: "accounts",
  title: "Accounts",
  blocks: [{ key: "intro", type: "prose", src: "intro.md" }],
});

describe("parseAndValidateTree", () => {
  it("validates a well-formed single-course tree", async () => {
    const t = tree({
      "courses/demo/course.yaml": courseYaml,
      "courses/demo/slots.lock.json": JSON.stringify({
        version: 1,
        slots: { "lesson-accounts": 0 },
        retired: [],
        next: 1,
      }),
      "courses/demo/lessons/accounts/lesson.yaml": lessonYaml,
      "courses/demo/lessons/accounts/intro.md": "# Accounts",
    });
    const v = await parseAndValidateTree(t, passGraders);
    expect(v.courses.map((c) => c.id)).toEqual(["course-demo"]);
    expect(v.prose.get("courses/demo/lessons/accounts/intro.md")).toContain(
      "# Accounts"
    );
  });

  it("throws with the Zod issue when a course is malformed", async () => {
    const t = tree({
      "courses/demo/course.yaml": stringify({ id: "NOT-a-course-id" }),
    });
    await expect(parseAndValidateTree(t, passGraders)).rejects.toBeInstanceOf(
      ContentValidationError
    );
  });

  it("throws when a code block's solution fails the executor gate", async () => {
    const withCode = stringify({
      id: "lesson-ex",
      slug: "ex",
      title: "Ex",
      blocks: [
        {
          key: "ex",
          type: "code",
          language: "typescript",
          starter: "exercise/starter.ts",
          solution: "exercise/solution.ts",
          tests: "exercise/tests.json",
        },
      ],
    });
    const t = tree({
      "courses/demo/course.yaml": courseYaml,
      "courses/demo/lessons/ex/lesson.yaml": withCode,
      "courses/demo/lessons/ex/exercise/starter.ts": "// nope",
      "courses/demo/lessons/ex/exercise/solution.ts":
        "// also nope (no keyword)",
      "courses/demo/lessons/ex/exercise/tests.json": JSON.stringify([
        { id: "t", description: "d", input: "", expectedOutput: "1" },
      ]),
    });
    // The executor gate rejects because the reference solution does not "solve".
    await expect(parseAndValidateTree(t, passGraders)).rejects.toBeInstanceOf(
      ContentValidationError
    );
  });

  // Parity with content-lint gate 6 (gate6-executor.ts): rust and buildable
  // blocks are DEFERRED at sync time, not graded. A buildable scaffold that
  // compiles would "pass" the starter-must-fail check (the grader grades on
  // compilation), and the build server is off in prod — so grading them here
  // rejected content that CI accepts. The sync now grades exactly what CI grades.
  it.each([
    { language: "rust", buildType: "standard" },
    { language: "rust", buildType: "buildable" },
  ])(
    "defers a $language/$buildType block even when its starter would pass",
    async ({ language, buildType }) => {
      const withCode = stringify({
        id: "lesson-ex",
        slug: "ex",
        title: "Ex",
        blocks: [
          {
            key: "ex",
            type: "code",
            language,
            buildType,
            deployable: buildType === "buildable",
            starter: "exercise/starter.rs",
            solution: "exercise/solution.rs",
            tests: "exercise/tests.json",
            ...(buildType === "buildable"
              ? { produces: "deployed-program" }
              : {}),
          },
        ],
      });
      const t = tree({
        "courses/demo/course.yaml": courseYaml,
        "courses/demo/lessons/ex/lesson.yaml": withCode,
        // Both "solve" → both would PASS → starter-already-passes would throw
        // if this block were graded. Deferral means it is not.
        "courses/demo/lessons/ex/exercise/starter.rs": "// solve",
        "courses/demo/lessons/ex/exercise/solution.rs": "// solve",
        "courses/demo/lessons/ex/exercise/tests.json": JSON.stringify([
          { id: "t", description: "d", input: "", expectedOutput: "1" },
        ]),
      });
      const v = await parseAndValidateTree(t, passGraders);
      expect(v.lessons.map((l) => l.lesson.id)).toContain("lesson-ex");
    }
  );
});
