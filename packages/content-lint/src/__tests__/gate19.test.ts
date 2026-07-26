import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate19-skills";
import { makeTempRepo } from "./helpers";

function lesson(name: string, skills: string[]): Record<string, string> {
  return {
    [`courses/x/lessons/${name}/lesson.yaml`]: `id: lesson-${name}
slug: ${name}
title: ${name}
skills: [${skills.join(", ")}]
blocks:
  - { key: intro, type: prose, src: intro.md }
`,
  };
}

/** A lesson at an explicit repo-relative directory (e.g. under `courses/_template`). */
function lessonAt(
  dir: string,
  name: string,
  skills: string[]
): Record<string, string> {
  return {
    [`${dir}/lesson.yaml`]: `id: lesson-${name}
slug: ${name}
title: ${name}
skills: [${skills.join(", ")}]
blocks:
  - { key: intro, type: prose, src: intro.md }
`,
  };
}

function registry(slugs: string[]): Record<string, string> {
  return {
    "skills.yaml": slugs.map((s) => `- slug: ${s}`).join("\n") + "\n",
  };
}

const of = (r: Awaited<ReturnType<typeof runLint>>, gate: string) =>
  r.diagnostics.filter((d) => d.gate === gate);

describe("gate 19a — registry resolution", () => {
  it("passes when every lesson skill resolves to skills.yaml", async () => {
    const r = await runLint(
      makeTempRepo({
        ...registry(["pdas", "cpi"]),
        ...lesson("a", ["pdas", "cpi"]),
        ...lesson("b", ["pdas", "cpi"]),
      })
    );
    expect(of(r, "gate-19a")).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("errors on an invented slug, naming the lesson file and the slug", async () => {
    const r = await runLint(
      makeTempRepo({
        ...registry(["pdas"]),
        ...lesson("a", ["pdas", "not-a-real-skill"]),
        ...lesson("b", ["pdas"]),
      })
    );
    const g = of(r, "gate-19a");
    expect(g).toHaveLength(1);
    expect(g[0]?.severity).toBe("error");
    expect(g[0]?.file).toBe("courses/x/lessons/a/lesson.yaml");
    expect(g[0]?.message).toContain("not-a-real-skill");
    expect(r.ok).toBe(false);
  });

  it("errors when skills.yaml is missing but lessons are tagged", async () => {
    const r = await runLint(makeTempRepo({ ...lesson("a", ["pdas"]) }));
    const g = of(r, "gate-19a");
    expect(g.some((d) => /skills\.yaml not found/.test(d.message))).toBe(true);
    expect(r.ok).toBe(false);
  });

  it("errors when skills.yaml is not a valid taxonomy (duplicate slugs)", async () => {
    const r = await runLint(
      makeTempRepo({
        "skills.yaml": "- slug: pdas\n- slug: pdas\n",
        ...lesson("a", ["pdas"]),
        ...lesson("b", ["pdas"]),
      })
    );
    expect(
      of(r, "gate-19a").some((d) =>
        /not a valid skills taxonomy/.test(d.message)
      )
    ).toBe(true);
    expect(r.ok).toBe(false);
  });

  it("emits nothing on a tree with no lessons", async () => {
    const r = await runLint(makeTempRepo({}));
    expect(r.diagnostics.filter((d) => d.gate.startsWith("gate-19"))).toEqual(
      []
    );
  });
});

describe("gate 19b — minimum reuse bar", () => {
  it("errors when a slug is applied to only one lesson", async () => {
    const r = await runLint(
      makeTempRepo({
        ...registry(["pdas", "staking"]),
        ...lesson("a", ["pdas", "staking"]),
        ...lesson("b", ["pdas"]),
      })
    );
    const g = of(r, "gate-19b");
    expect(g).toHaveLength(1);
    expect(g[0]?.severity).toBe("error");
    expect(g[0]?.message).toContain('"staking"');
    expect(g[0]?.message).toContain("courses/x/lessons/a/lesson.yaml");
    expect(r.ok).toBe(false);
  });

  it("grandfathers `oracles` to a warning at one lesson (pending #559)", async () => {
    const r = await runLint(
      makeTempRepo({
        ...registry(["pdas", "oracles"]),
        ...lesson("a", ["pdas", "oracles"]),
        ...lesson("b", ["pdas"]),
      })
    );
    const g = of(r, "gate-19b");
    expect(g).toHaveLength(1);
    expect(g[0]?.severity).toBe("warning");
    expect(g[0]?.message).toContain('"oracles"');
    expect(g[0]?.message).toContain("#559");
    // A grandfathered singleton never fails the lint.
    expect(r.ok).toBe(true);
  });

  it("allows the singleton exceptions at one lesson", async () => {
    const r = await runLint(
      makeTempRepo({
        ...registry(["pdas", "brazil-compliance", "earn-submission"]),
        ...lesson("a", ["pdas", "brazil-compliance"]),
        ...lesson("b", ["pdas", "earn-submission"]),
      })
    );
    expect(of(r, "gate-19b")).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("warns (not errors) on a registry slug applied to no lesson", async () => {
    const r = await runLint(
      makeTempRepo({
        ...registry(["pdas", "dead-entry"]),
        ...lesson("a", ["pdas"]),
        ...lesson("b", ["pdas"]),
      })
    );
    const g = of(r, "gate-19b");
    expect(g).toHaveLength(1);
    expect(g[0]?.severity).toBe("warning");
    expect(g[0]?.message).toContain('"dead-entry"');
    expect(r.ok).toBe(true);
  });

  it("counts a slug repeated within one lesson as a single application", async () => {
    const r = await runLint(
      makeTempRepo({
        ...registry(["pdas"]),
        ...lesson("a", ["pdas", "pdas"]),
      })
    );
    expect(of(r, "gate-19b").some((d) => d.severity === "error")).toBe(true);
  });
});

describe("gate 19c — interleaving-pair vocabulary (warning tier)", () => {
  it("warns when a pair member is missing from the registry", async () => {
    const r = await runLint(
      makeTempRepo({
        ...registry(["cpi"]),
        ...lesson("a", ["cpi"]),
        ...lesson("b", ["cpi"]),
      })
    );
    const g = of(r, "gate-19c");
    expect(
      g.some(
        (d) =>
          d.severity === "warning" &&
          /"signers"/.test(d.message) &&
          /missing from skills\.yaml/.test(d.message)
      )
    ).toBe(true);
    // Warning tier: pairs alone never fail the lint.
    expect(r.ok).toBe(true);
  });

  it("warns when a pair member exists but is under-applied", async () => {
    const r = await runLint(
      makeTempRepo({
        ...registry(["pdas", "account-model"]),
        ...lesson("a", ["pdas", "account-model"]),
        ...lesson("b", ["pdas"]),
      })
    );
    expect(
      of(r, "gate-19c").some(
        (d) =>
          /"account-model"/.test(d.message) && /1 lesson\(s\)/.test(d.message)
      )
    ).toBe(true);
  });

  it("stays silent for a pair whose members both exist with >=2 lessons", async () => {
    const r = await runLint(
      makeTempRepo({
        ...registry(["pdas", "account-model"]),
        ...lesson("a", ["pdas", "account-model"]),
        ...lesson("b", ["pdas", "account-model"]),
      })
    );
    expect(
      of(r, "gate-19c").filter((d) => /"pdas"|"account-model"/.test(d.message))
    ).toEqual([]);
  });
});

describe("gate 19d — facet-only tags are not review-eligible", () => {
  it("notices a denylisted slug in the registry without failing", async () => {
    const r = await runLint(
      makeTempRepo({
        ...registry(["pdas", "typescript"]),
        ...lesson("a", ["pdas", "typescript"]),
        ...lesson("b", ["pdas", "typescript"]),
      })
    );
    const g = of(r, "gate-19d");
    expect(g).toHaveLength(1);
    expect(g[0]?.severity).toBe("notice");
    expect(g[0]?.message).toContain('"typescript"');
    expect(g[0]?.message).toContain("not review-eligible");
    expect(r.ok).toBe(true);
  });

  it("stays silent when no registry slug is denylisted", async () => {
    const r = await runLint(
      makeTempRepo({
        ...registry(["pdas"]),
        ...lesson("a", ["pdas"]),
        ...lesson("b", ["pdas"]),
      })
    );
    expect(of(r, "gate-19d")).toEqual([]);
  });
});

describe("gate 19 — `courses/_template` lessons are excluded from reuse counts", () => {
  it("does not let a _template lesson lift a real singleton to two uses", async () => {
    const r = await runLint(
      makeTempRepo({
        ...registry(["pdas", "staking"]),
        // `staking` is used by exactly one real lesson…
        ...lesson("a", ["pdas", "staking"]),
        ...lesson("b", ["pdas"]),
        // …and a template lesson that must NOT count toward the reuse bar.
        ...lessonAt("courses/_template/lessons/tmpl", "tmpl", [
          "pdas",
          "staking",
        ]),
      })
    );
    const g = of(r, "gate-19b");
    expect(g).toHaveLength(1);
    expect(g[0]?.severity).toBe("error");
    expect(g[0]?.message).toContain('"staking"');
    // Named lesson is the real one, never the template.
    expect(g[0]?.message).toContain("courses/x/lessons/a/lesson.yaml");
    expect(r.ok).toBe(false);
  });
});

describe("gate 19a — skills.yaml file shape", () => {
  it("errors with a parse diagnostic on malformed YAML", async () => {
    const r = await runLint(
      makeTempRepo({
        "skills.yaml": "[unterminated\n",
        ...lesson("a", ["pdas"]),
        ...lesson("b", ["pdas"]),
      })
    );
    const g = of(r, "gate-19a");
    expect(g).toHaveLength(1);
    expect(g[0]?.severity).toBe("error");
    expect(g[0]?.message).toContain("failed to parse");
    expect(r.ok).toBe(false);
  });

  it("errors distinctly when skills.yaml is empty", async () => {
    const r = await runLint(
      makeTempRepo({
        "skills.yaml": "",
        ...lesson("a", ["pdas"]),
        ...lesson("b", ["pdas"]),
      })
    );
    const g = of(r, "gate-19a");
    expect(g).toHaveLength(1);
    expect(g[0]?.severity).toBe("error");
    expect(g[0]?.message).toContain("empty");
    expect(g[0]?.message).not.toContain("not a valid skills taxonomy");
    expect(r.ok).toBe(false);
  });

  it("errors distinctly when skills.yaml is an object, not a list", async () => {
    const r = await runLint(
      makeTempRepo({
        "skills.yaml": "slug: pdas\n",
        ...lesson("a", ["pdas"]),
        ...lesson("b", ["pdas"]),
      })
    );
    const g = of(r, "gate-19a");
    expect(g).toHaveLength(1);
    expect(g[0]?.severity).toBe("error");
    expect(g[0]?.message).toContain("not a valid skills taxonomy");
    expect(g[0]?.message).not.toContain("empty");
    expect(r.ok).toBe(false);
  });
});
