import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate13e-deploy-card";
import { makeTempRepo } from "./helpers";
import type { Diagnostic } from "../diagnostics";

const COURSE = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
sourceLocale: en
xpPerLesson: 10
xpReward: 100
modules: [{ key: m, title: M, lessons: [lesson-deploy] }]
`;

const DEPLOYABLE = `  - key: build
    type: code
    language: rust
    buildType: buildable
    deployable: true
    starter: program/starter.rs
    solution: program/solution.rs
    tests: program/tests.json
    produces: deployed-program
`;

const CARD = `  - key: deployed
    type: deployed-program-card
    consumes: [deployed-program]
`;

function repo(blocks: string) {
  return makeTempRepo({
    "courses/x/course.yaml": COURSE,
    "courses/x/lessons/deploy/lesson.yaml": `id: lesson-deploy
slug: deploy
title: Deploy
skills: [program-deployment]
blocks:
${blocks}`,
  });
}

const gate13e = (ds: Diagnostic[]) => ds.filter((d) => d.gate === "gate-13e");

describe("gate 13e — a deployable block needs a deployed-program-card", () => {
  it("passes when the card follows the deployable block", async () => {
    const r = await runLint(repo(DEPLOYABLE + CARD));
    expect(gate13e(r.diagnostics)).toEqual([]);
  });

  it("errors when the lesson has no card at all", async () => {
    const r = await runLint(repo(DEPLOYABLE));
    const [d] = gate13e(r.diagnostics);
    expect(d?.severity).toBe("error");
    expect(d?.message).toContain("lesson-deploy");
    expect(d?.message).toContain("uncompletable");
  });

  it("errors when the card comes BEFORE the deployable block", async () => {
    const r = await runLint(repo(CARD + DEPLOYABLE));
    expect(gate13e(r.diagnostics)).toHaveLength(1);
  });

  it("ignores a code block that is not deployable", async () => {
    const r = await runLint(
      repo(DEPLOYABLE.replace("deployable: true", "deployable: false"))
    );
    expect(gate13e(r.diagnostics)).toEqual([]);
  });
});
