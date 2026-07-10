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
xpPerLesson: 10
xpReward: 100
creator: { githubId: "1" }
modules: [{ key: m, title: M, lessons: [${lessonOrder.join(", ")}] }]
`,
    "courses/x/lessons/fund/lesson.yaml": `id: lesson-fund
slug: fund
title: Fund
blocks:
  - { key: fund, type: wallet-funding, amount: 2, network: devnet, produces: funded-wallet }
`,
    "courses/x/lessons/explore/lesson.yaml": `id: lesson-explore
slug: explore
title: Explore
blocks:
  - { key: explore, type: program-explorer, idl: program.idl.json, consumes: [funded-wallet] }
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
});
