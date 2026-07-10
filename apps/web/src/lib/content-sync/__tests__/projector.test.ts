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
        creator: { githubId: "1" },
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
    instructors: [],
    slots: new Map(),
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

  it("is deterministic — same input yields deep-equal output", () => {
    const a = projectContent(fixture(), "sha1", noAsset, () => []);
    const b = projectContent(fixture(), "sha1", noAsset, () => []);
    expect(a.docs).toEqual(b.docs);
  });
});
