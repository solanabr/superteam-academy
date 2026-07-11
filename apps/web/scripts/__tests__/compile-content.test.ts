import { describe, it, expect } from "vitest";
import { ContentValidationError } from "../../src/lib/content-sync/types";
import type { RepoTree } from "../../src/lib/content-sync/types";
import { compileContent, compileBundle } from "../compile-content";

const WALLET = "BEe3xJDobWhxQ7zNrwaYR4zyEtptgmDuKvaLNZukih5R";

const enc = (s: string): Uint8Array => new TextEncoder().encode(s);
/** 1x1-ish placeholder bytes — only the extension/size matter to the pipeline. */
const bin = (n = 8): Uint8Array => new Uint8Array(n).fill(0x89);

/** A minimal, schema-valid courses-academy tree: one of every managed type. */
function validTree(): RepoTree {
  const tree: RepoTree = new Map();
  tree.set(
    "instructors/alice.yaml",
    enc(`id: instructor-alice\nname: Alice\nwallet: ${WALLET}\n`)
  );
  tree.set(
    "courses/intro/course.yaml",
    enc(
      [
        "id: course-intro",
        "slug: intro",
        "title: Intro Course",
        "difficulty: beginner",
        "duration: 1",
        "xpPerLesson: 10",
        "xpReward: 100",
        "instructor: instructor-alice",
        "modules:",
        "  - key: mod-one",
        "    title: Module One",
        "    lessons:",
        "      - lesson-intro-hello",
        "",
      ].join("\n")
    )
  );
  tree.set(
    "courses/intro/slots.lock.json",
    enc(
      `{ "version": 1, "slots": { "lesson-intro-hello": 0 }, "retired": [], "next": 1 }`
    )
  );
  tree.set(
    "courses/intro/lessons/hello/lesson.yaml",
    enc(
      [
        "id: lesson-intro-hello",
        "slug: hello",
        "title: Hello World",
        "blocks:",
        "  - type: prose",
        "    key: intro",
        "    src: intro.md",
        "",
      ].join("\n")
    )
  );
  tree.set(
    "courses/intro/lessons/hello/intro.md",
    enc("# Hello\n\nWelcome.\n")
  );
  tree.set(
    "achievements/first.yaml",
    enc(
      "id: achievement-first\nname: First Steps\ncategory: progress\nxpReward: 10\naward:\n  kind: manual\n"
    )
  );
  tree.set(
    "quests/daily.yaml",
    enc(
      "id: quest-daily\nname: Daily\ntype: lesson\nxpReward: 5\ntargetValue: 1\nresetType: daily\n"
    )
  );
  tree.set(
    "paths/core.yaml",
    enc(
      "id: path-core\nslug: core\ntitle: Core Path\ndifficulty: beginner\ncourses:\n  - course-intro\n"
    )
  );
  return tree;
}

/** validTree with the lesson carrying a code block whose files are all present. */
function treeWithCodeBlock(): RepoTree {
  const tree = validTree();
  tree.set(
    "courses/intro/lessons/hello/lesson.yaml",
    enc(
      [
        "id: lesson-intro-hello",
        "slug: hello",
        "title: Hello World",
        "blocks:",
        "  - type: prose",
        "    key: intro",
        "    src: intro.md",
        "  - type: code",
        "    key: solve",
        "    language: typescript",
        "    starter: starter.ts",
        "    solution: solution.ts",
        "    tests: tests.json",
        "",
      ].join("\n")
    )
  );
  tree.set(
    "courses/intro/lessons/hello/starter.ts",
    enc("export const x = 0;\n")
  );
  tree.set(
    "courses/intro/lessons/hello/solution.ts",
    enc("export const x = 1;\n")
  );
  tree.set(
    "courses/intro/lessons/hello/tests.json",
    enc(
      JSON.stringify([
        { id: "t1", description: "returns 1", input: "", expectedOutput: "1" },
      ])
    )
  );
  return tree;
}

/**
 * validTree with a course thumbnail, an in-lesson markdown image, and an
 * unreferenced-but-present asset — the full asset-pipeline surface.
 */
function treeWithAssets(): RepoTree {
  const tree = validTree();
  tree.set(
    "courses/intro/course.yaml",
    enc(
      [
        "id: course-intro",
        "slug: intro",
        "title: Intro Course",
        "difficulty: beginner",
        "duration: 1",
        "xpPerLesson: 10",
        "xpReward: 100",
        "instructor: instructor-alice",
        "thumbnail: assets/thumb.png",
        "modules:",
        "  - key: mod-one",
        "    title: Module One",
        "    lessons:",
        "      - lesson-intro-hello",
        "",
      ].join("\n")
    )
  );
  tree.set(
    "courses/intro/lessons/hello/intro.md",
    enc("# Hello\n\n![a diagram](assets/diagram.png)\n")
  );
  tree.set("courses/intro/assets/thumb.png", bin());
  tree.set("courses/intro/lessons/hello/assets/diagram.png", bin());
  // present but referenced by nothing — still copied (brief: copy every assets/*).
  tree.set("courses/intro/lessons/hello/assets/extra.svg", enc("<svg/>"));
  return tree;
}

const opts = { sha: "0".repeat(40), compiledAt: "2026-07-10T18:48:30Z" };

describe("compileContent", () => {
  it("emits one JSON module per type with the expected counts", () => {
    const files = compileContent(validTree(), opts);

    const names = [
      "courses.json",
      "lessons.json",
      "instructors.json",
      "achievements.json",
      "quests.json",
      "paths.json",
      "slots.json",
      "meta.json",
    ];
    for (const n of names) expect(files.has(n)).toBe(true);

    const meta = JSON.parse(files.get("meta.json")!) as {
      sha: string;
      compiledAt: string;
      counts: Record<string, number>;
    };
    expect(meta.sha).toBe(opts.sha);
    expect(meta.compiledAt).toBe(opts.compiledAt);
    expect(meta.counts).toEqual({
      courses: 1,
      lessons: 1,
      instructors: 1,
      achievements: 1,
      quests: 1,
      learningPaths: 1,
    });

    expect((JSON.parse(files.get("courses.json")!) as unknown[]).length).toBe(
      1
    );
    expect((JSON.parse(files.get("lessons.json")!) as unknown[]).length).toBe(
      1
    );
  });

  it("strips the sync marker and resolves prose bodies into the projected docs", () => {
    const files = compileContent(validTree(), opts);
    const courses = JSON.parse(files.get("courses.json")!) as Record<
      string,
      unknown
    >[];
    expect(courses[0]!._id).toBe("course-intro");
    expect(courses[0]!.sync).toBeUndefined();
    expect(courses[0]!.onChainStatus).toBeUndefined();

    const lessons = JSON.parse(files.get("lessons.json")!) as {
      blocks: { src: string }[];
    }[];
    expect(lessons[0]!.blocks[0]!.src).toContain("# Hello");
  });

  it("emits each course's slots lockfile keyed by course id", () => {
    const files = compileContent(validTree(), opts);
    const slots = JSON.parse(files.get("slots.json")!) as Record<
      string,
      unknown
    >;
    expect(slots["course-intro"]).toEqual({
      version: 1,
      slots: { "lesson-intro-hello": 0 },
      retired: [],
      next: 1,
    });
  });

  it("is deterministic: same input yields byte-identical output", () => {
    const a = compileContent(validTree(), opts);
    const b = compileContent(validTree(), opts);
    for (const [name, content] of a) {
      expect(b.get(name)).toBe(content);
      expect(content.endsWith("\n")).toBe(true);
    }
  });

  it("fails closed on an invalid doc (no partial output)", () => {
    const tree = validTree();
    tree.set(
      "achievements/first.yaml",
      enc(
        "id: achievement-first\nname: First\ncategory: not-a-category\nxpReward: 10\naward:\n  kind: manual\n"
      )
    );
    expect(() => compileContent(tree, opts)).toThrow(ContentValidationError);
  });

  it("resolves a code block's starter/solution/tests when all files are present", () => {
    const files = compileContent(treeWithCodeBlock(), opts);
    const lessons = JSON.parse(files.get("lessons.json")!) as {
      blocks: { _type: string; starter?: string; tests?: unknown[] }[];
    }[];
    const code = lessons[0]!.blocks.find((b) => b._type === "code")!;
    expect(code.starter).toBe("export const x = 0;\n");
    expect(Array.isArray(code.tests)).toBe(true);
  });

  it("fails closed naming the lesson + file when a code block's starter is absent", () => {
    const tree = treeWithCodeBlock();
    tree.delete("courses/intro/lessons/hello/starter.ts");
    try {
      compileContent(tree, opts);
      expect.unreachable("compileContent should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ContentValidationError);
      const joined = (e as ContentValidationError).issues.join("\n");
      expect(joined).toContain("lesson-intro-hello");
      expect(joined).toContain("starter.ts");
    }
  });

  it("errors naming the course when its slots.lock.json is missing", () => {
    const tree = validTree();
    tree.delete("courses/intro/slots.lock.json");
    try {
      compileContent(tree, opts);
      expect.unreachable("compileContent should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ContentValidationError);
      expect((e as ContentValidationError).issues.join("\n")).toContain(
        "course-intro"
      );
    }
  });
});

describe("compileBundle — asset pipeline", () => {
  it("emits no assets for a tree with no images", () => {
    const { assets } = compileBundle(validTree(), opts);
    expect(assets.size).toBe(0);
  });

  it("copies every assets/* file to its slug-mirrored public path", () => {
    const { assets } = compileBundle(treeWithAssets(), opts);
    expect([...assets.keys()].sort()).toEqual([
      "intro/hello/diagram.png",
      "intro/hello/extra.svg",
      "intro/thumb.png",
    ]);
    // bytes are copied verbatim.
    expect(assets.get("intro/hello/diagram.png")).toEqual(bin());
  });

  it("rewrites the course thumbnail to its public url", () => {
    const { files } = compileBundle(treeWithAssets(), opts);
    const courses = JSON.parse(files.get("courses.json")!) as {
      thumbnail?: string;
    }[];
    expect(courses[0]!.thumbnail).toBe("/content-assets/intro/thumb.png");
  });

  it("rewrites in-lesson markdown image paths to public urls", () => {
    const { files } = compileBundle(treeWithAssets(), opts);
    const lessons = JSON.parse(files.get("lessons.json")!) as {
      blocks: { src: string }[];
    }[];
    expect(lessons[0]!.blocks[0]!.src).toContain(
      "![a diagram](/content-assets/intro/hello/diagram.png)"
    );
  });

  it("is deterministic: same input yields byte-identical files and assets", () => {
    const a = compileBundle(treeWithAssets(), opts);
    const b = compileBundle(treeWithAssets(), opts);
    for (const [name, content] of a.files)
      expect(b.files.get(name)).toBe(content);
    for (const [name, bytes] of a.assets)
      expect(b.assets.get(name)).toEqual(bytes);
  });

  it("fails closed naming the lesson + path when a markdown image is missing", () => {
    const tree = treeWithAssets();
    tree.delete("courses/intro/lessons/hello/assets/diagram.png");
    try {
      compileBundle(tree, opts);
      expect.unreachable("compileBundle should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ContentValidationError);
      const joined = (e as ContentValidationError).issues.join("\n");
      expect(joined).toContain("lesson-intro-hello");
      expect(joined).toContain("assets/diagram.png");
    }
  });

  it("fails closed naming the course when its thumbnail file is missing", () => {
    const tree = treeWithAssets();
    tree.delete("courses/intro/assets/thumb.png");
    try {
      compileBundle(tree, opts);
      expect.unreachable("compileBundle should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ContentValidationError);
      const joined = (e as ContentValidationError).issues.join("\n");
      expect(joined).toContain("course-intro");
      expect(joined).toContain("assets/thumb.png");
    }
  });

  it("rejects an asset with a disallowed extension", () => {
    const tree = treeWithAssets();
    tree.set("courses/intro/lessons/hello/assets/anim.gif", bin());
    try {
      compileBundle(tree, opts);
      expect.unreachable("compileBundle should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ContentValidationError);
      expect((e as ContentValidationError).issues.join("\n")).toContain(
        "anim.gif"
      );
    }
  });

  it("rejects an asset larger than the 1 MiB cap", () => {
    const tree = treeWithAssets();
    tree.set(
      "courses/intro/lessons/hello/assets/huge.png",
      bin(1024 * 1024 + 1)
    );
    try {
      compileBundle(tree, opts);
      expect.unreachable("compileBundle should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ContentValidationError);
      expect((e as ContentValidationError).issues.join("\n")).toContain(
        "huge.png"
      );
    }
  });
});
