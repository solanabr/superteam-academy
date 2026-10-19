import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { gzipSync } from "node:zlib";
import { describe, it, expect } from "vitest";
import {
  contentImageUrl,
  type AssetManifestEntry,
} from "../../src/lib/content/compile/assets";
import { makeTar } from "../../src/lib/content/compile/__tests__/_fixtures";
import { extractTarball } from "../../src/lib/content/compile/tarball";
import { ContentValidationError } from "../../src/lib/content/compile/types";
import type { RepoTree } from "../../src/lib/github/types";
import { compileContent, compileBundle, writeBundle } from "../compile-content";

const WALLET = "BEe3xJDobWhxQ7zNrwaYR4zyEtptgmDuKvaLNZukih5R";

const enc = (s: string): Uint8Array => new TextEncoder().encode(s);
/** 1x1-ish placeholder bytes — only the extension/size matter to the pipeline. */
const bin = (n = 8): Uint8Array => new Uint8Array(n).fill(0x89);
const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

/** A minimal, schema-valid academy-courses tree: one of every managed type. */
function validTree(): RepoTree {
  const tree: RepoTree = new Map();
  tree.set(
    "courses/intro/course.yaml",
    enc(
      [
        "id: course-intro",
        "slug: intro",
        "title: Intro Course",
        "difficulty: beginner",
        "duration: 1",
        "sourceLocale: en",
        "xpPerLesson: 10",
        "xpReward: 100",
        `creator: ${WALLET}`,
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
        "skills:",
        "  - pdas",
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
  tree.set("skills.yaml", enc("- slug: pdas\n  label: PDAs\n"));
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
        "skills:",
        "  - pdas",
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
 * unreferenced-but-present asset — the full asset-pipeline surface. The
 * thumbnail and the diagram are the same bytes.
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
        "sourceLocale: en",
        "xpPerLesson: 10",
        "xpReward: 100",
        `creator: ${WALLET}`,
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
      "achievements.json",
      "quests.json",
      "paths.json",
      "slots.json",
      "skills.json",
      "l10n.json",
      "meta.json",
      "assets.json",
    ];
    for (const n of names) expect(files.has(n)).toBe(true);
    expect(files.has("instructors.json")).toBe(false);

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
      achievements: 1,
      quests: 1,
      learningPaths: 1,
      // Courses carrying at least one `l10n/` overlay — none in this tree.
      l10nCourses: 0,
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
    expect(courses[0]!.creator).toBe(WALLET);
    expect("instructor" in courses[0]!).toBe(false);

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

  // skills.yaml is a repo-root file — the compiler tolerates its absence
  // (content.skills stays []), but that is only a legal end state for a tree
  // with no tagged lessons: schema requires every lesson to carry >=1 skill
  // (#466 C3), so a real content tree with lessons always ships this file. Use
  // an empty tree (no courses/lessons at all) to isolate "absent → []" from
  // the vocabulary-enforcement concern, which has its own tests below.
  it("emits an empty skills.json when skills.yaml is absent (and no lesson references a skill)", () => {
    const files = compileContent(new Map(), opts);
    expect(JSON.parse(files.get("skills.json")!)).toEqual([]);
  });

  it("loads and emits the canonical skill vocabulary from a root skills.yaml", () => {
    const tree = validTree();
    tree.set(
      "skills.yaml",
      enc("- slug: pdas\n  label: PDAs\n- slug: cpi\n  label: CPIs\n")
    );
    const files = compileContent(tree, opts);
    expect(JSON.parse(files.get("skills.json")!)).toEqual([
      { slug: "pdas", label: "PDAs" },
      { slug: "cpi", label: "CPIs" },
    ]);
  });

  it("fails closed on a malformed skills.yaml", () => {
    const tree = validTree();
    tree.set("skills.yaml", enc("- slug: Not A Slug\n"));
    expect(() => compileContent(tree, opts)).toThrow(ContentValidationError);
  });

  // #466 C3: the allowlist guarantee — a lesson skill slug that is not in the
  // vocabulary fails the compile closed, naming both the lesson and the slug.
  it("fails closed naming the lesson and the bad slug when a skill is not in the vocabulary", () => {
    const tree = validTree();
    tree.set(
      "courses/intro/lessons/hello/lesson.yaml",
      enc(
        [
          "id: lesson-intro-hello",
          "slug: hello",
          "title: Hello World",
          "skills:",
          "  - pdas",
          "  - not-a-real-skill",
          "blocks:",
          "  - type: prose",
          "    key: intro",
          "    src: intro.md",
          "",
        ].join("\n")
      )
    );
    try {
      compileContent(tree, opts);
      expect.unreachable("compileContent should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ContentValidationError);
      const joined = (e as ContentValidationError).issues.join("\n");
      expect(joined).toContain("lesson-intro-hello");
      expect(joined).toContain("not-a-real-skill");
    }
  });

  it("derives course.tags as the sorted, deduplicated union of its lessons' skills", () => {
    const files = compileContent(validTree(), opts);
    const courses = JSON.parse(files.get("courses.json")!) as {
      tags: string[];
    }[];
    expect(courses[0]!.tags).toEqual(["pdas"]);
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
  const thumbUrl = contentImageUrl(sha256(bin()), "png");
  const manifestOf = (files: Map<string, string>): AssetManifestEntry[] =>
    JSON.parse(files.get("assets.json")!) as AssetManifestEntry[];

  it("emits an empty manifest for a tree with no images", () => {
    const { files, imagePaths } = compileBundle(validTree(), opts);
    expect(manifestOf(files)).toEqual([]);
    expect(imagePaths).toEqual([]);
  });

  it("rewrites the course thumbnail to its content-addressed blob url", () => {
    const { files } = compileBundle(treeWithAssets(), opts);
    const courses = JSON.parse(files.get("courses.json")!) as {
      thumbnail?: string;
    }[];
    expect(courses[0]!.thumbnail).toBe(thumbUrl);
    expect(thumbUrl).toMatch(/\/content\/[0-9a-f]{64}\.png$/);
  });

  it("rewrites in-lesson markdown image paths to blob urls", () => {
    const { files } = compileBundle(treeWithAssets(), opts);
    const lessons = JSON.parse(files.get("lessons.json")!) as {
      blocks: { src: string }[];
    }[];
    expect(lessons[0]!.blocks[0]!.src).toContain(`![a diagram](${thumbUrl})`);
  });

  it("lists each referenced blob once, by its smallest repo path", () => {
    const { files, imagePaths } = compileBundle(treeWithAssets(), opts);
    expect(imagePaths).toEqual([
      "courses/intro/assets/thumb.png",
      "courses/intro/lessons/hello/assets/diagram.png",
    ]);
    // Same bytes under two paths share one blob; the unreferenced svg is not
    // in the bundle, so it is not in the manifest either.
    expect(manifestOf(files)).toEqual([
      {
        sha256: sha256(bin()),
        ext: "png",
        size: 8,
        contentType: "image/png",
        path: "courses/intro/assets/thumb.png",
      },
    ]);
  });

  it("keys by bytes and extension, so different bytes get different blobs", () => {
    const tree = treeWithAssets();
    tree.set("courses/intro/lessons/hello/assets/diagram.png", bin(9));
    const { files } = compileBundle(tree, opts);
    expect(manifestOf(files).map((e) => e.sha256)).toEqual(
      [sha256(bin()), sha256(bin(9))].sort()
    );
  });

  it("compiles a streamed tarball exactly like the same tree in memory", async () => {
    const tar = makeTar(
      Object.fromEntries(
        [...treeWithAssets()].map(([p, b]) => [`owner-repo-abc/${p}`, b])
      )
    );
    const streamed = await extractTarball(gzipSync(Buffer.from(tar)), {
      hashImages: true,
    });
    const a = compileBundle(streamed, opts);
    const b = compileBundle(treeWithAssets(), opts);
    expect(a.imagePaths).toEqual(b.imagePaths);
    for (const [name, content] of b.files)
      expect(a.files.get(name)).toBe(content);
  });

  it("routes every image through imageUrl when given one, and emits no manifest", () => {
    const { files } = compileBundle(treeWithAssets(), {
      ...opts,
      imageUrl: (repoPath) => `/preview/${repoPath}`,
    });
    expect(files.has("assets.json")).toBe(false);
    const courses = JSON.parse(files.get("courses.json")!) as {
      thumbnail?: string;
    }[];
    expect(courses[0]!.thumbnail).toBe(
      "/preview/courses/intro/assets/thumb.png"
    );
  });

  it("is deterministic: same input yields byte-identical files", () => {
    const a = compileBundle(treeWithAssets(), opts);
    const b = compileBundle(treeWithAssets(), opts);
    for (const [name, content] of a.files)
      expect(b.files.get(name)).toBe(content);
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
    tree.set("courses/intro/lessons/hello/assets/notes.txt", bin());
    try {
      compileBundle(tree, opts);
      expect.unreachable("compileBundle should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ContentValidationError);
      const joined = (e as ContentValidationError).issues.join("\n");
      expect(joined).toContain("anim.gif");
      expect(joined).toContain("notes.txt");
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

describe("writeBundle", () => {
  it("rebuilds the generated dir from scratch, removing stray committed files", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "compile-content-"));
    const outDir = path.join(root, "generated");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "extra.json"), "{}\n"); // stray module

    try {
      writeBundle(outDir, new Map([["meta.json", "{}\n"]]));

      expect(fs.existsSync(path.join(outDir, "extra.json"))).toBe(false);
      expect(fs.existsSync(path.join(outDir, "meta.json"))).toBe(true);
      expect(fs.existsSync(path.join(outDir, "README.md"))).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
