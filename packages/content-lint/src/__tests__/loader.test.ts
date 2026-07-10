import { describe, it, expect } from "vitest";
import { discover } from "../loader";
import { runLint } from "../lint";
import { makeTempRepo } from "./helpers";

describe("discover", () => {
  it("classifies every content file kind by path", () => {
    const root = makeTempRepo({
      "courses/solana-fundamentals/course.yaml":
        "id: course-solana-fundamentals\n",
      "courses/solana-fundamentals/slots.lock.json": "{}\n",
      "courses/solana-fundamentals/lessons/accounts/lesson.yaml":
        "id: lesson-accounts\n",
      "courses/solana-fundamentals/lessons/accounts/check.quiz.yaml":
        "key: check\n",
      "achievements/first-steps.yaml": "id: achievement-first-steps\n",
      "quests/complete-lesson.yaml": "id: quest-complete-lesson\n",
      "paths/solana-core.yaml": "id: path-solana-core\n",
      "instructors/ana-santos.yaml": "id: instructor-ana-santos\n",
      "README.md": "# ignored\n",
    });
    const kinds = discover(root)
      .map((d) => d.kind)
      .sort();
    expect(kinds).toEqual(
      [
        "achievement",
        "course",
        "instructor",
        "lesson",
        "path",
        "quest",
        "quiz",
        "slots",
      ].sort()
    );
  });

  it("reports a YAML parse error rather than throwing", () => {
    const root = makeTempRepo({
      "instructors/x.yaml": "id: : : broken\n  - [\n",
    });
    const doc = discover(root).find((d) => d.kind === "instructor");
    expect(doc?.parseError).toBeTruthy();
  });
});

describe("runLint (empty)", () => {
  it("is ok on a repo with no content and no checks registered", async () => {
    const root = makeTempRepo({ "README.md": "# empty\n" });
    const result = await runLint(root);
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });
});
