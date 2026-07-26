import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate20-originality";
import { makeTempRepo } from "./helpers";

/**
 * A lesson with a single code block. `attribution` is spliced in verbatim (or
 * omitted) so each test drives exactly one declared-adaptation shape.
 */
function codeLesson(attributionYaml: string): Record<string, string> {
  return {
    "courses/x/lessons/a/lesson.yaml": `id: lesson-a
slug: a
title: A
skills: [general]
blocks:
  - key: exercise
    type: code
    language: typescript
    starter: exercise/starter.ts
    solution: exercise/solution.ts
    tests: exercise/tests.json
${attributionYaml}`,
  };
}

const of = (r: Awaited<ReturnType<typeof runLint>>, gate: string) =>
  r.diagnostics.filter((d) => d.gate === gate);

describe("gate 20 — originality & licensing attribution", () => {
  it("says nothing when a code block has no attribution (claimed original)", async () => {
    const r = await runLint(makeTempRepo(codeLesson("")));
    expect(of(r, "gate-20a")).toEqual([]);
    expect(of(r, "gate-20b")).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("passes an Apache-2.0 upstream (LiteSVM)", async () => {
    const r = await runLint(
      makeTempRepo(
        codeLesson(
          `    attribution: { source: LiteSVM, license: Apache-2.0, url: "https://github.com/LiteSVM/litesvm" }\n`
        )
      )
    );
    expect(of(r, "gate-20a")).toEqual([]);
    expect(of(r, "gate-20b")).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("passes an MIT upstream (Trident)", async () => {
    const r = await runLint(
      makeTempRepo(
        codeLesson(`    attribution: { source: Trident, license: MIT }\n`)
      )
    );
    expect(of(r, "gate-20a")).toEqual([]);
    expect(of(r, "gate-20b")).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("errors 20b on a copyleft license (GPL-3.0)", async () => {
    const r = await runLint(
      makeTempRepo(
        codeLesson(
          `    attribution: { source: "some project", license: GPL-3.0 }\n`
        )
      )
    );
    const errs = of(r, "gate-20b");
    expect(errs).toHaveLength(1);
    expect(errs[0]!.severity).toBe("error");
    expect(r.ok).toBe(false);
  });

  it("errors 20b on an unrecognised license", async () => {
    const r = await runLint(
      makeTempRepo(
        codeLesson(
          `    attribution: { source: "some project", license: "WTFPL" }\n`
        )
      )
    );
    expect(of(r, "gate-20b")).toHaveLength(1);
    expect(r.ok).toBe(false);
  });

  it("errors 20a on a forbidden corpus even when the license claims MIT", async () => {
    const r = await runLint(
      makeTempRepo(
        codeLesson(
          `    attribution: { source: sealevel-attacks, license: MIT }\n`
        )
      )
    );
    // The forbidden-corpus gate fires and short-circuits the license gate.
    expect(of(r, "gate-20a")).toHaveLength(1);
    expect(of(r, "gate-20b")).toEqual([]);
    expect(r.ok).toBe(false);
  });

  it("errors 20a when a forbidden corpus is named only in the url", async () => {
    const r = await runLint(
      makeTempRepo(
        codeLesson(
          `    attribution: { source: "an example", license: Apache-2.0, url: "https://github.com/solana-foundation/program-examples" }\n`
        )
      )
    );
    expect(of(r, "gate-20a")).toHaveLength(1);
    expect(r.ok).toBe(false);
  });

  it("errors 20a on the GPL-3.0 live docs (solana.com)", async () => {
    const r = await runLint(
      makeTempRepo(
        codeLesson(
          `    attribution: { source: "cookbook", license: Apache-2.0, url: "https://solana.com/docs" }\n`
        )
      )
    );
    expect(of(r, "gate-20a")).toHaveLength(1);
    expect(r.ok).toBe(false);
  });
});
