import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema"; // registers the schema check
import { classify, unclassifiedContentFiles } from "../loader";
import { makeTempRepo } from "./helpers";

/**
 * Course translation overlays (academy-courses PR #51):
 * `courses/<slug>/l10n/<locale>/strings.yaml`. Until the linter learned the
 * path, every real overlay drew an "unclassified content file" warning and
 * the content repo told authors to ignore it. Now it is a classified,
 * schema-checked document — and the strict shape is what makes rule 4 (an
 * overlay carries display strings only) a checked invariant at gate 1.
 */

const course = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
sourceLocale: pt-BR
xpPerLesson: 10
xpReward: 100
modules:
  - key: m
    title: M
    lessons: [lesson-a]
`;

const okStrings = `locale: en
course:
  title: X in English
  modules:
    m:
      title: M
lessons:
  a:
    title: A
    blocks:
      check:
        questions:
          q1:
            prompt: Which?
            options:
              b:
                feedback: Not that one.
      ex:
        hints:
          0: First hint
        tests:
          t1:
            description: adds
`;

describe("l10n overlays in content-lint", () => {
  it("classifies strings.yaml, and nothing else under l10n/, as a document", () => {
    expect(classify("courses/x/l10n/en/strings.yaml")).toBe("l10n");
    expect(classify("courses/x/l10n/en/lessons/a/intro.md")).toBeNull();
    expect(classify("courses/x/l10n/en/course.yaml")).toBeNull();
  });

  it("a well-formed overlay draws no diagnostic at all", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/l10n/en/strings.yaml": okStrings,
    });
    expect(unclassifiedContentFiles(root)).toEqual([]);
    const r = await runLint(root);
    expect(r.diagnostics.filter((d) => d.file.includes("l10n"))).toEqual([]);
  });

  it("gate 1 rejects an overlay that carries what a translation must never touch", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/l10n/en/strings.yaml": okStrings.replace(
        "                feedback: Not that one.\n",
        "                feedback: Not that one.\n                correct: true\n"
      ),
    });
    const r = await runLint(root);
    const g1 = r.diagnostics.filter(
      (d) => d.gate === "gate-1" && d.file === "courses/x/l10n/en/strings.yaml"
    );
    expect(g1).toHaveLength(1);
    expect(g1[0]!.message).toMatch(/correct/);
    expect(r.ok).toBe(false);
  });

  it("gate 1 rejects a locale the app does not ship", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/l10n/fr/strings.yaml": okStrings.replace(
        "locale: en",
        "locale: fr"
      ),
    });
    const r = await runLint(root);
    expect(
      r.diagnostics.some(
        (d) => d.gate === "gate-1" && d.file.endsWith("l10n/fr/strings.yaml")
      )
    ).toBe(true);
  });
});
