import { describe, it, expect } from "vitest";
import { projectContent } from "../projector";
import type { ValidatedContent } from "../validate";

function fixture(): ValidatedContent {
  return {
    courses: [
      {
        id: "course-demo",
        slug: "demo",
        title: "Demo",
        description: "d",
        difficulty: "beginner",
        duration: 1,
        xpPerLesson: 10,
        xpReward: 100,
        creator: "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF",
        modules: [{ key: "m", title: "M", lessons: ["lesson-accounts"] }],
      } as never,
    ],
    lessons: [
      {
        dir: "courses/demo/lessons/accounts",
        lesson: {
          id: "lesson-accounts",
          slug: "accounts",
          title: "Accounts",
          skills: ["accounts"],
          blocks: [
            { key: "intro", type: "prose", src: "intro.md" },
            {
              key: "ex",
              type: "code",
              language: "typescript",
              buildType: "standard",
              deployable: false,
              starter: "exercise/starter.ts",
              solution: "exercise/solution.ts",
              tests: "exercise/tests.json",
              hints: [],
            },
          ],
        } as never,
      },
    ],
    achievements: [],
    quests: [],
    paths: [],
    slots: new Map(),
    skills: [],
    prose: new Map([["courses/demo/lessons/accounts/intro.md", "# Accounts"]]),
    code: new Map([
      ["courses/demo/lessons/accounts/exercise/starter.ts", "// starter"],
      ["courses/demo/lessons/accounts/exercise/solution.ts", "// solution"],
    ]),
    idl: new Map(),
    assets: new Map(),
  } as ValidatedContent;
}

const noAsset = (): string | null => null;

describe("projectContent", () => {
  it("gives each managed doc a deterministic _id equal to its content id", () => {
    const { docs } = projectContent(fixture(), "sha1", noAsset, () => [
      { id: "t", description: "d", input: "", expectedOutput: "1" },
    ]);
    const course = docs.find((d) => d._type === "course")!;
    const lesson = docs.find((d) => d._type === "lesson")!;
    expect(course._id).toBe("course-demo");
    expect(lesson._id).toBe("lesson-accounts");
  });

  it("stamps the sync marker with the sha on every managed doc", () => {
    const { docs } = projectContent(fixture(), "sha1", noAsset, () => []);
    for (const d of docs) {
      expect(d.sync).toEqual({ source: "courses-academy", rev: "sha1" });
    }
  });

  it("resolves prose src → markdown body and uses block.key as _key", () => {
    const { docs } = projectContent(fixture(), "sha1", noAsset, () => []);
    const lesson = docs.find((d) => d._type === "lesson") as unknown as {
      blocks: { _key: string; _type: string; src?: string }[];
    };
    const intro = lesson.blocks.find((b) => b._key === "intro")!;
    expect(intro._type).toBe("prose");
    expect(intro.src).toBe("# Accounts");
  });

  it("rewrites repo-relative image paths in prose src to the resolved CDN url (§9.6)", () => {
    const f = fixture();
    f.prose = new Map([
      [
        "courses/demo/lessons/accounts/intro.md",
        "See ![pixel](assets/pixel.png) here.",
      ],
    ]);
    const cdn = "https://cdn.sanity.io/images/proj/production/abc123-1x1.png";
    const resolveAsset = (repoPath: string): string | null =>
      repoPath === "courses/demo/lessons/accounts/assets/pixel.png"
        ? cdn
        : null;
    const { docs } = projectContent(f, "sha1", resolveAsset, () => []);
    const lesson = docs.find((d) => d._type === "lesson") as unknown as {
      blocks: { _key: string; src?: string }[];
    };
    const intro = lesson.blocks.find((b) => b._key === "intro")!;
    expect(intro.src).toBe(`See ![pixel](${cdn}) here.`);
    expect(intro.src).not.toContain("assets/pixel.png");
  });

  it("resolves code.tests → a testCase[] array", () => {
    const { docs } = projectContent(fixture(), "sha1", noAsset, () => [
      { id: "t1", description: "d", input: "", expectedOutput: "1" },
    ]);
    const lesson = docs.find((d) => d._type === "lesson") as unknown as {
      blocks: { _key: string; tests?: { id: string }[] }[];
    };
    const ex = lesson.blocks.find((b) => b._key === "ex")!;
    expect(ex.tests).toEqual([
      { id: "t1", description: "d", input: "", expectedOutput: "1" },
    ]);
  });

  it("never emits lesson.xpReward and inlines modules with weak lesson refs", () => {
    const { docs } = projectContent(fixture(), "sha1", noAsset, () => []);
    const lesson = docs.find((d) => d._type === "lesson")!;
    expect("xpReward" in lesson).toBe(false);
    const course = docs.find((d) => d._type === "course") as unknown as {
      modules: { lessons: { _ref: string; _weak: boolean }[] }[];
    };
    expect(course.modules[0]!.lessons[0]).toMatchObject({
      _ref: "lesson-accounts",
      _weak: true,
    });
  });

  it("projects course.creator as a plain wallet string, not a weak ref (issue #478)", () => {
    const { docs } = projectContent(fixture(), "sha1", noAsset, () => []);
    const course = docs.find((d) => d._type === "course") as unknown as {
      creator?: string;
      instructor?: unknown;
    };
    expect(course.creator).toBe("B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF");
    expect("instructor" in course).toBe(false);
  });

  it("projects creator as undefined when the course has none", () => {
    const f = fixture();
    (f.courses[0] as unknown as { creator?: string }).creator = undefined;
    const { docs } = projectContent(f, "sha1", noAsset, () => []);
    const course = docs.find((d) => d._type === "course") as unknown as {
      creator?: string;
    };
    // The final committed bundle drops undefined keys entirely (compile-
    // content.ts's stableJson); projectContent itself only guarantees the
    // value is absent, matching the existing prerequisiteCourse pattern.
    expect(course.creator).toBeUndefined();
  });

  it("is deterministic — same input yields deep-equal output", () => {
    const a = projectContent(fixture(), "sha1", noAsset, () => []);
    const b = projectContent(fixture(), "sha1", noAsset, () => []);
    expect(a.docs).toEqual(b.docs);
  });

  it("carries a lesson's skills onto the projected lesson doc (#466 C3)", () => {
    const { docs } = projectContent(fixture(), "sha1", noAsset, () => []);
    const lesson = docs.find((d) => d._type === "lesson") as unknown as {
      skills: string[];
    };
    expect(lesson.skills).toEqual(["accounts"]);
  });

  it("derives course.tags as the sorted, deduplicated union of its lessons' skills, not an authored field (#466 C3)", () => {
    const f = fixture();
    (f.lessons[0]!.lesson as unknown as { skills: string[] }).skills = [
      "cpi",
      "accounts",
    ];
    const { docs } = projectContent(f, "sha1", noAsset, () => []);
    const course = docs.find((d) => d._type === "course") as unknown as {
      tags: string[];
    };
    expect(course.tags).toEqual(["accounts", "cpi"]);
  });

  it("unions and deduplicates skills across every lesson in a course", () => {
    const f = fixture();
    f.courses[0]!.modules = [
      {
        key: "m",
        title: "M",
        lessons: ["lesson-accounts", "lesson-pdas"],
      },
    ] as never;
    f.lessons.push({
      dir: "courses/demo/lessons/pdas",
      lesson: {
        id: "lesson-pdas",
        slug: "pdas",
        title: "PDAs",
        skills: ["pdas", "accounts"],
        blocks: [{ key: "intro", type: "prose", src: "intro.md" }],
      } as never,
    });
    f.prose.set("courses/demo/lessons/pdas/intro.md", "# PDAs");
    const { docs } = projectContent(f, "sha1", noAsset, () => []);
    const course = docs.find((d) => d._type === "course") as unknown as {
      tags: string[];
    };
    expect(course.tags).toEqual(["accounts", "pdas"]);
  });

  it("derives an empty tags array when a course's lessons carry no skills (dangling module ref)", () => {
    const f = fixture();
    f.courses[0]!.modules = [
      { key: "m", title: "M", lessons: ["lesson-missing"] },
    ] as never;
    const { docs } = projectContent(f, "sha1", noAsset, () => []);
    const course = docs.find((d) => d._type === "course") as unknown as {
      tags: string[];
    };
    expect(course.tags).toEqual([]);
  });
});
