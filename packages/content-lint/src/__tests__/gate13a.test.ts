import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate13a-capabilities";
import { makeTempRepo } from "./helpers";

function tree(lessonOrder: string[]) {
  return {
    "courses/x/course.yaml": `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
sourceLocale: en
xpPerLesson: 10
xpReward: 100
modules: [{ key: m, title: M, lessons: [${lessonOrder.join(", ")}] }]
`,
    "courses/x/lessons/fund/lesson.yaml": `id: lesson-fund
slug: fund
title: Fund
skills: [wallet-funding]
blocks:
  - { key: fund, type: wallet-funding, amount: 2, network: devnet, produces: funded-wallet }
`,
    "courses/x/lessons/explore/lesson.yaml": `id: lesson-explore
slug: explore
title: Explore
skills: [program-interaction]
blocks:
  - { key: explore, type: program-explorer, idl: program.idl.json, consumes: [funded-wallet] }
`,
  };
}

/**
 * Two courses on one path: `producer` funds a wallet, `consumer` consumes it.
 * `pathCourses` controls the ladder order (and may omit a course entirely).
 */
function ladder(pathCourses: string[]) {
  const course = (id: string, slug: string, lesson: string) =>
    `id: ${id}
slug: ${slug}
title: ${slug}
difficulty: beginner
duration: 1
sourceLocale: en
xpPerLesson: 10
xpReward: 100
modules: [{ key: m, title: M, lessons: [${lesson}] }]
`;
  return {
    "courses/p/course.yaml": course("course-p", "p", "lesson-fund"),
    "courses/p/lessons/fund/lesson.yaml": `id: lesson-fund
slug: fund
title: Fund
skills: [wallet-funding]
blocks:
  - { key: fund, type: wallet-funding, amount: 2, network: devnet, produces: funded-wallet }
`,
    "courses/c/course.yaml": course("course-c", "c", "lesson-explore"),
    "courses/c/lessons/explore/lesson.yaml": `id: lesson-explore
slug: explore
title: Explore
skills: [program-interaction]
blocks:
  - { key: explore, type: program-explorer, idl: program.idl.json, consumes: [funded-wallet] }
`,
    "paths/ladder.yaml": `id: path-ladder
slug: ladder
title: Ladder
difficulty: beginner
courses:
${pathCourses.map((c) => `  - ${c}`).join("\n")}
`,
  };
}

describe("gate 13a — capability ordering", () => {
  it("passes when the producer lesson precedes the consumer in display order", async () => {
    const r = await runLint(
      makeTempRepo(tree(["lesson-fund", "lesson-explore"]))
    );
    expect(r.diagnostics.filter((d) => d.gate === "gate-13a")).toEqual([]);
  });

  it("errors when the consumer precedes the producer in display order", async () => {
    const r = await runLint(
      makeTempRepo(tree(["lesson-explore", "lesson-fund"]))
    );
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-13a" && /funded-wallet/.test(d.message)
      )
    ).toBe(true);
  });

  it("accepts a consumes satisfied by a course earlier on the same learning path", async () => {
    const r = await runLint(makeTempRepo(ladder(["course-p", "course-c"])));
    expect(r.diagnostics.filter((d) => d.gate === "gate-13a")).toEqual([]);
  });

  it("errors when the producing course comes LATER on the path", async () => {
    const r = await runLint(makeTempRepo(ladder(["course-c", "course-p"])));
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-13a" && /funded-wallet/.test(d.message)
      )
    ).toBe(true);
  });

  it("errors when the producing course is not on the consumer's path at all", async () => {
    const r = await runLint(makeTempRepo(ladder(["course-c"])));
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-13a" && /funded-wallet/.test(d.message)
      )
    ).toBe(true);
  });
});
