import { describe, it, expect } from "vitest";
import { stringify } from "yaml";
import type { RepoTree } from "@/lib/github/types";
import { compileBundle } from "../compile-bundle";
import { ContentValidationError } from "../types";
import { PNG_1X1 } from "./_fixtures";

/**
 * Course translations (academy-courses PR #51): a `courses/<slug>/l10n/<locale>/`
 * overlay holding a `strings.yaml`, translated prose and re-rendered images at
 * their mirrored paths. These pin the compiler's contract: what an overlay
 * may say, what it must bind to, and the sparse `l10n.json` it becomes.
 */

const enc = new TextEncoder();
const yaml = (v: unknown): Uint8Array => enc.encode(stringify(v));
const raw = (s: string): Uint8Array => enc.encode(s);
const SHA = "d".repeat(40);

const LESSON_DIR = "courses/demo/lessons/basics";

function sourceTree(): Record<string, Uint8Array> {
  return {
    "skills.yaml": raw("- slug: pdas\n  label: PDAs\n"),
    "courses/demo/course.yaml": yaml({
      id: "course-demo",
      slug: "demo",
      sourceLocale: "pt-BR",
      title: "Curso Demo",
      description: "Descrição",
      difficulty: "beginner",
      duration: 1,
      xpPerLesson: 10,
      xpReward: 100,
      thumbnail: "assets/banner.png",
      modules: [{ key: "m", title: "Módulo", lessons: ["lesson-basics"] }],
    }),
    "courses/demo/slots.lock.json": raw(
      JSON.stringify({
        version: 1,
        slots: { "lesson-basics": 0 },
        retired: [],
        next: 1,
      })
    ),
    "courses/demo/assets/banner.png": new Uint8Array(PNG_1X1),
    [`${LESSON_DIR}/lesson.yaml`]: yaml({
      id: "lesson-basics",
      slug: "basics",
      title: "Fundamentos",
      skills: ["pdas"],
      blocks: [
        { key: "intro", type: "prose", src: "intro.md" },
        { key: "watch", type: "video", url: "https://youtu.be/x" },
        {
          key: "check",
          type: "quiz",
          questions: [
            {
              id: "q1",
              prompt: "Pergunta?",
              options: [
                { id: "a", label: "Sim", correct: true },
                { id: "b", label: "Não", correct: false, feedback: "Errado." },
              ],
              explanation: "Porque sim.",
            },
          ],
        },
        {
          key: "ex",
          type: "code",
          language: "typescript",
          starter: "ex/starter.ts",
          solution: "ex/solution.ts",
          tests: "ex/tests.json",
          hints: ["Dica um", "Dica dois"],
        },
        { key: "reflect", type: "openEnded", prompt: "O que aprendeu?" },
      ],
    }),
    [`${LESSON_DIR}/intro.md`]: raw("# Olá\n\n![diagrama](assets/d.png)\n"),
    [`${LESSON_DIR}/assets/d.png`]: new Uint8Array(PNG_1X1),
    [`${LESSON_DIR}/ex/starter.ts`]: raw("// s"),
    [`${LESSON_DIR}/ex/solution.ts`]: raw("// sol"),
    [`${LESSON_DIR}/ex/tests.json`]: raw(
      JSON.stringify([
        { id: "t1", description: "soma", input: "", expectedOutput: "" },
      ])
    ),
  };
}

const EN_STRINGS = {
  locale: "en",
  course: {
    title: "Demo Course",
    modules: { m: { title: "Module" } },
  },
  lessons: {
    basics: {
      title: "Basics",
      blocks: {
        check: {
          questions: {
            q1: {
              prompt: "Question?",
              options: { b: { feedback: "Wrong." } },
            },
          },
        },
        ex: {
          hints: { 1: "Hint two" },
          tests: { t1: { description: "adds" } },
        },
        reflect: { prompt: "What did you learn?" },
      },
    },
  },
};

function withOverlay(
  files: Record<string, Uint8Array> = {},
  strings: unknown = EN_STRINGS
): RepoTree {
  const tree = new Map(Object.entries(sourceTree()));
  if (strings !== null) {
    tree.set("courses/demo/l10n/en/strings.yaml", yaml(strings));
  }
  for (const [p, b] of Object.entries(files)) tree.set(p, b);
  return tree;
}

const compile = (tree: RepoTree) =>
  compileBundle(tree, { sha: SHA, compiledAt: null });

const issuesOf = (tree: RepoTree): string[] => {
  try {
    compile(tree);
  } catch (e) {
    if (e instanceof ContentValidationError) return e.issues;
    throw e;
  }
  return [];
};

describe("l10n overlays — what the bundle becomes", () => {
  it("emits an empty l10n.json and stamps sourceLocale when no course has an overlay", () => {
    const { files } = compile(new Map(Object.entries(sourceTree())));
    expect(JSON.parse(files.get("l10n.json")!)).toEqual({});
    const [course] = JSON.parse(files.get("courses.json")!) as {
      sourceLocale: string;
    }[];
    expect(course!.sourceLocale).toBe("pt-BR");
    expect(JSON.parse(files.get("meta.json")!).counts.l10nCourses).toBe(0);
  });

  it("emits the overlay keyed by course id → locale → lesson ID, sparse, and leaves the source bundle untouched", () => {
    const { files } = compile(withOverlay());
    const l10n = JSON.parse(files.get("l10n.json")!);
    expect(l10n).toEqual({
      "course-demo": {
        en: {
          course: { title: "Demo Course", modules: { m: { title: "Module" } } },
          lessons: {
            "lesson-basics": {
              title: "Basics",
              blocks: {
                check: {
                  questions: {
                    q1: {
                      prompt: "Question?",
                      options: { b: { feedback: "Wrong." } },
                    },
                  },
                },
                ex: {
                  hints: { "1": "Hint two" },
                  tests: { t1: { description: "adds" } },
                },
                reflect: { prompt: "What did you learn?" },
              },
            },
          },
        },
      },
    });
    // The source docs are exactly what they would be without the overlay.
    const [lesson] = JSON.parse(files.get("lessons.json")!) as {
      title: string;
      blocks: { _key: string; prompt?: string }[];
    }[];
    expect(lesson!.title).toBe("Fundamentos");
    expect(lesson!.blocks.find((b) => b._key === "reflect")!.prompt).toBe(
      "O que aprendeu?"
    );
  });

  it("carries a translated .md as the prose block's src, rewritten to public asset urls", () => {
    const { files } = compile(
      withOverlay({
        "courses/demo/l10n/en/lessons/basics/intro.md": raw(
          "# Hello\n\n![diagram](assets/d.png)\n"
        ),
      })
    );
    const l10n = JSON.parse(files.get("l10n.json")!);
    // No localized image → the SOURCE image's public url, per file.
    expect(
      l10n["course-demo"].en.lessons["lesson-basics"].blocks.intro.src
    ).toBe("# Hello\n\n![diagram](/content-assets/demo/basics/d.png)\n");
  });

  it("prefers a localized image at the mirrored path and plans it under <slug>/l10n/<locale>/", () => {
    const { files, assets } = compile(
      withOverlay({
        "courses/demo/l10n/en/lessons/basics/intro.md": raw(
          "# Hello\n\n![diagram](assets/d.png)\n"
        ),
        "courses/demo/l10n/en/lessons/basics/assets/d.png": new Uint8Array(
          PNG_1X1
        ),
        "courses/demo/l10n/en/assets/banner.png": new Uint8Array(PNG_1X1),
      })
    );
    const l10n = JSON.parse(files.get("l10n.json")!);
    const en = l10n["course-demo"].en;
    expect(en.lessons["lesson-basics"].blocks.intro.src).toContain(
      "(/content-assets/demo/l10n/en/basics/d.png)"
    );
    expect(en.course.thumbnail).toBe("/content-assets/demo/l10n/en/banner.png");
    expect(assets.has("demo/l10n/en/basics/d.png")).toBe(true);
    expect(assets.has("demo/l10n/en/banner.png")).toBe(true);
    // The source assets are still there, untouched.
    expect(assets.has("demo/basics/d.png")).toBe(true);
    expect(assets.has("demo/banner.png")).toBe(true);
  });

  it("an overlay folder with only prose (no strings.yaml) is legal", () => {
    const { files } = compile(
      withOverlay(
        {
          "courses/demo/l10n/en/lessons/basics/intro.md": raw("# Hello\n"),
        },
        null
      )
    );
    const l10n = JSON.parse(files.get("l10n.json")!);
    expect(
      l10n["course-demo"].en.lessons["lesson-basics"].blocks.intro.src
    ).toBe("# Hello\n");
    expect(l10n["course-demo"].en.course).toBeUndefined();
  });
});

describe("l10n overlays — what is refused (fail-closed, every issue named)", () => {
  it("a forbidden filename under l10n/ never ships as a duplicate document", () => {
    const tree = withOverlay({
      "courses/demo/l10n/en/course.yaml": yaml({ id: "course-demo" }),
    });
    const issues = issuesOf(tree);
    expect(
      issues.some(
        (i) => i.includes("l10n/en/course.yaml") && i.includes("forbidden")
      )
    ).toBe(true);
  });

  it("the folder must be a supported locale and must not be the source locale", () => {
    expect(
      issuesOf(withOverlay({}, { ...EN_STRINGS, locale: "pt-BR" }))
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("does not match the folder"),
      ])
    );

    const tree = new Map(Object.entries(sourceTree()));
    tree.set("courses/demo/l10n/pt-BR/strings.yaml", yaml({ locale: "pt-BR" }));
    expect(issuesOf(tree)).toEqual(
      expect.arrayContaining([expect.stringContaining("sourceLocale")])
    );

    const tree2 = new Map(Object.entries(sourceTree()));
    tree2.set("courses/demo/l10n/fr/strings.yaml", yaml({ locale: "en" }));
    expect(issuesOf(tree2)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("not a supported locale"),
      ])
    );
  });

  it("every key must bind to something real: module, lesson, block, question, option, test, index", () => {
    const bad = {
      locale: "en",
      course: { modules: { nope: { title: "x" } } },
      lessons: {
        ghost: { title: "x" },
        basics: {
          blocks: {
            nokey: { prompt: "x" },
            check: {
              questions: {
                q9: { prompt: "x" },
                q1: { options: { z: { label: "x" } } },
              },
            },
            ex: { hints: { 5: "x" }, tests: { t9: { description: "x" } } },
          },
        },
      },
    };
    const issues = issuesOf(withOverlay({}, bad));
    for (const needle of [
      "course.modules.nope",
      "lessons.ghost",
      "blocks.nokey: no such block key",
      "questions.q9",
      "options.z",
      "hints.5",
      "tests.t9",
    ]) {
      expect(
        issues.some((i) => i.includes(needle)),
        needle
      ).toBe(true);
    }
  });

  it("a stanza may only carry the fields its block type actually has", () => {
    const bad = {
      locale: "en",
      lessons: {
        basics: {
          blocks: {
            watch: { prompt: "x" }, // video has no prompt
            reflect: { hints: { 0: "x" } }, // openEnded has no hints
          },
        },
      },
    };
    const issues = issuesOf(withOverlay({}, bad));
    expect(
      issues.some((i) => i.includes('video block has no translatable "prompt"'))
    ).toBe(true);
    expect(
      issues.some((i) =>
        i.includes('openEnded block has no translatable "hints"')
      )
    ).toBe(true);
  });

  it("the strict shape refuses ids, correct flags, solutions and answer keys outright", () => {
    const bad = {
      locale: "en",
      lessons: {
        basics: {
          blocks: {
            check: {
              questions: { q1: { options: { a: { correct: false } } } },
            },
            ex: { solution: "// leaked" },
          },
        },
      },
    };
    const issues = issuesOf(withOverlay({}, bad));
    expect(
      issues.some(
        (i) => i.includes("strings.yaml") && /correct|Unrecognized/.test(i)
      )
    ).toBe(true);
  });

  it("a translated .md must sit at a path some prose block reads", () => {
    const issues = issuesOf(
      withOverlay({
        "courses/demo/l10n/en/lessons/basics/notes.md": raw("# stray"),
        "courses/demo/l10n/en/lessons/ghost/intro.md": raw("# stray"),
      })
    );
    expect(
      issues.filter((i) => i.includes("no prose block in this course reads"))
    ).toHaveLength(2);
  });

  it("a localized image must mirror a source image and obey the source rules", () => {
    const issues = issuesOf(
      withOverlay({
        "courses/demo/l10n/en/lessons/basics/assets/other.png": new Uint8Array(
          PNG_1X1
        ),
        "courses/demo/l10n/en/assets/banner.gif": new Uint8Array(PNG_1X1),
      })
    );
    expect(
      issues.some(
        (i) => i.includes("other.png") && i.includes("does not mirror")
      )
    ).toBe(true);
    expect(
      issues.some((i) => i.includes("banner.gif") && i.includes("not allowed"))
    ).toBe(true);
  });

  it("a translated .md may not reference an image that exists nowhere", () => {
    const issues = issuesOf(
      withOverlay({
        "courses/demo/l10n/en/lessons/basics/intro.md": raw(
          "![x](assets/missing.png)"
        ),
      })
    );
    expect(
      issues.some((i) => i.includes("missing.png") && i.includes("neither"))
    ).toBe(true);
  });
});
