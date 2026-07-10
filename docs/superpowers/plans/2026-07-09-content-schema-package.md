# `packages/content-schema` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@superteam-lms/content-schema` — the single Zod source of truth for course content (blocks, lessons, courses, achievements, quests, paths, slots), which every later subsystem consumes.

**Architecture:** A dependency-free TypeScript package (no build step; `main` points at `src/index.ts`, matching `packages/types`). Blocks are a Zod `discriminatedUnion` on `type`. A `BLOCK_REGISTRY` object, constrained by `satisfies Record<BlockType, BlockMeta>`, declares each block's `graded` and `required` axes so the completion gate can dispatch on it and fail closed on unknown types. A generator emits JSON Schema via zod v4's native `z.toJSONSchema()` for editor autocomplete in `academy-courses`.

**Tech Stack:** TypeScript 5.7 (strict, `noUncheckedIndexedAccess`), zod 4.4.3, vitest 4, pnpm workspaces, turbo.

**Spec:** `docs/superpowers/specs/2026-07-09-course-content-standard-design.md` — this plan implements §4 (content standard), §4.9 (capability keys), §4.10 (award kinds), §6.2 gates 1–2, 7, 8–13c (the schema-expressible subset), and §16.2 (JSON Schema generation).

## Global Constraints

- Package name: `@superteam-lms/content-schema`. Private, version `0.0.1`.
- No build step. `"main": "./src/index.ts"`, `"types": "./src/index.ts"` — copy `packages/types/package.json`.
- Runtime-agnostic: **never use `Buffer`**. Byte length is `new TextEncoder().encode(s).length`.
- `MAX_XP_PER_MINT = 5000` — mirrors `onchain-academy/programs/onchain-academy/src/utils.rs:15`.
- `MAX_COURSE_ID_BYTES = 32` — PDA seed limit, `MAX_COURSE_ID_LEN` in `state/course.rs`.
- `MAX_LESSON_SLOTS = 256` — `Enrollment.lesson_flags` is `[u64; 4]`.
- `QUEST_TYPES` must equal the SQL `CHECK` in `get_daily_quest_state`: `lesson`, `lesson_batch`, `challenge`, `login_streak`, `module`.
- Sanity `_id` charset is `a-zA-Z0-9._-`, no leading `-`. Our ids are the stricter `[a-z0-9-]`.
- TDD: every task writes the failing test first, runs it, implements, runs it, commits.
- Test command throughout: `pnpm --filter @superteam-lms/content-schema test`.

## Amendment A to the spec

The spec (§4.9) models widgets as one block type with a `widget` discriminator field. **This plan hoists each widget to a first-class block type** — `wallet-funding`, `program-explorer`, `deployed-program-card`.

Why: the block type then *is* the renderer-registry key, so spec gate 13b ("a widget's `widget` value is a key in the renderer registry") is enforced by the discriminated union itself rather than by a separate check. It also avoids nesting a `discriminatedUnion` inside a `discriminatedUnion`, which zod cannot express without an intersection.

**Action:** after Task 9 lands, amend spec §4.9 and gate 13b in a follow-up commit. Do not silently diverge.

## File Structure

```
packages/content-schema/
├── package.json                    new — pkg manifest, no build step
├── tsconfig.json                   new — copy of packages/types/tsconfig.json
├── vitest.config.ts                new — node env, globals
├── scripts/
│   └── generate-json-schema.ts     new — z.toJSONSchema → schema/*.json
└── src/
    ├── index.ts                    new — the public barrel
    ├── constants.ts                new — MAX_XP_PER_MINT, QUEST_TYPES, …
    ├── ids.ts                      new — CourseId, LessonId, AchievementId, …
    ├── capabilities.ts             new — CapabilityKey enum
    ├── blocks/
    │   ├── prose.ts                new
    │   ├── video.ts                new
    │   ├── code.ts                 new
    │   ├── quiz.ts                 new
    │   ├── open-ended.ts           new
    │   ├── widgets.ts              new — 3 widget block types
    │   └── index.ts                new — Block union + BLOCK_REGISTRY
    ├── lesson.ts                   new — Lesson (blocks[])
    ├── course.ts                   new — Course (inline modules)
    ├── achievement.ts              new — Award discriminated union
    ├── quest.ts                    new
    ├── path.ts                     new — LearningPath
    ├── instructor.ts               new
    ├── slots.ts                    new — slots.lock.json
    └── __tests__/
        ├── ids.test.ts             new
        ├── blocks.test.ts          new
        ├── quiz.test.ts            new
        ├── registry.test.ts        new
        ├── lesson.test.ts          new
        ├── course.test.ts          new
        ├── achievement.test.ts     new
        ├── quest.test.ts           new
        ├── slots.test.ts           new
        └── json-schema.test.ts     new
```

Each block lives in its own file so adding a block type touches exactly one new file plus `blocks/index.ts`.

---

### Task 1: Scaffold the package

**Files:**
- Create: `packages/content-schema/package.json`
- Create: `packages/content-schema/tsconfig.json`
- Create: `packages/content-schema/vitest.config.ts`
- Create: `packages/content-schema/src/constants.ts`
- Create: `packages/content-schema/src/index.ts`
- Test: `packages/content-schema/src/__tests__/constants.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MAX_XP_PER_MINT: 5000`, `MAX_COURSE_ID_BYTES: 32`, `MAX_LESSON_ID_BYTES: 128`, `MAX_LESSON_SLOTS: 256`, `QUEST_TYPES: readonly string[]`, `COMMUNITY_STATS: readonly string[]`, `DIFFICULTIES: readonly string[]`.

- [ ] **Step 1: Write the failing test**

`packages/content-schema/src/__tests__/constants.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  MAX_XP_PER_MINT,
  MAX_COURSE_ID_BYTES,
  MAX_LESSON_SLOTS,
  QUEST_TYPES,
} from "../constants";

describe("constants", () => {
  it("mirrors the on-chain XP mint ceiling", () => {
    // onchain-academy/programs/onchain-academy/src/utils.rs:15
    expect(MAX_XP_PER_MINT).toBe(5000);
  });

  it("mirrors the PDA seed limit", () => {
    // state/course.rs: MAX_COURSE_ID_LEN
    expect(MAX_COURSE_ID_BYTES).toBe(32);
  });

  it("mirrors the enrollment bitmap width", () => {
    // state/enrollment.rs: lesson_flags: [u64; 4]
    expect(MAX_LESSON_SLOTS).toBe(256);
  });

  it("matches the SQL quest-type enum exactly", () => {
    // supabase/schema.sql: get_daily_quest_state IF/ELSIF chain
    expect([...QUEST_TYPES]).toEqual([
      "lesson",
      "lesson_batch",
      "challenge",
      "login_streak",
      "module",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-schema test`
Expected: FAIL — the package does not exist yet (`No projects matched the filter`).

- [ ] **Step 3: Create the package files**

`packages/content-schema/package.json`:

```json
{
  "name": "@superteam-lms/content-schema",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "schema:generate": "tsx scripts/generate-json-schema.ts",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "tsx": "^4.21.0",
    "typescript": "^5.7.0",
    "vitest": "^4.0.18"
  }
}
```

`packages/content-schema/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["src/**/*.ts", "scripts/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

`packages/content-schema/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

`packages/content-schema/src/constants.ts`:

```ts
/**
 * Values mirrored from systems outside this package. Each carries the source it
 * mirrors; a change there is a breaking change here, caught by constants.test.ts.
 */

/** onchain-academy/programs/onchain-academy/src/utils.rs:15 */
export const MAX_XP_PER_MINT = 5000;

/** state/course.rs: MAX_COURSE_ID_LEN — the PDA seed byte limit. */
export const MAX_COURSE_ID_BYTES = 32;

/** Sanity `_id` hard limit is 128 chars; lesson ids are Supabase keys, not seeds. */
export const MAX_LESSON_ID_BYTES = 128;

/** state/enrollment.rs: lesson_flags is [u64; 4] = 256 bits. */
export const MAX_LESSON_SLOTS = 256;

/** supabase/schema.sql: the IF/ELSIF chain in get_daily_quest_state. */
export const QUEST_TYPES = [
  "lesson",
  "lesson_batch",
  "challenge",
  "login_streak",
  "module",
] as const;

/** Fields of UserState sourced from the community_stats view. */
export const COMMUNITY_STATS = [
  "totalThreads",
  "totalAnswers",
  "acceptedAnswers",
  "totalCommunityXp",
] as const;

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

export const ACHIEVEMENT_CATEGORIES = [
  "progress",
  "streaks",
  "skills",
  "community",
  "special",
] as const;
```

`packages/content-schema/src/index.ts`:

```ts
export * from "./constants";
```

- [ ] **Step 4: Install and run the test**

Run: `pnpm install && pnpm --filter @superteam-lms/content-schema test`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-schema
git commit -m "feat(content-schema): scaffold package with cross-system constants"
```

---

### Task 2: Identifier schemas

**Files:**
- Create: `packages/content-schema/src/ids.ts`
- Modify: `packages/content-schema/src/index.ts`
- Test: `packages/content-schema/src/__tests__/ids.test.ts`

**Interfaces:**
- Consumes: `MAX_COURSE_ID_BYTES`, `MAX_LESSON_ID_BYTES` from `./constants`.
- Produces: `byteLength(s: string): number`; Zod schemas `CourseId`, `LessonId`, `AchievementId`, `PathId`, `InstructorId`, `QuestId`, `BlockKey`, `ModuleKey`; inferred types `CourseIdT`, `LessonIdT`, `AchievementIdT`, `PathIdT`.

- [ ] **Step 1: Write the failing test**

`packages/content-schema/src/__tests__/ids.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { CourseId, LessonId, AchievementId, PathId, BlockKey, byteLength } from "../ids";

describe("byteLength", () => {
  it("counts UTF-8 bytes, not code units", () => {
    expect(byteLength("abc")).toBe(3);
    expect(byteLength("é")).toBe(2);
  });
});

describe("CourseId", () => {
  it("accepts a conventional id", () => {
    expect(CourseId.parse("course-solana-fundamentals")).toBe("course-solana-fundamentals");
  });

  it("accepts the longest live id (29 bytes)", () => {
    expect(CourseId.parse("course-building-first-program")).toBeTruthy();
  });

  it("rejects an id over the 32-byte PDA seed limit", () => {
    // 33 bytes
    const tooLong = "course-" + "a".repeat(26);
    expect(byteLength(tooLong)).toBe(33);
    expect(CourseId.safeParse(tooLong).success).toBe(false);
  });

  it("rejects a missing prefix", () => {
    expect(CourseId.safeParse("solana-fundamentals").success).toBe(false);
  });

  it("rejects uppercase and underscores", () => {
    expect(CourseId.safeParse("course-Solana").success).toBe(false);
    expect(CourseId.safeParse("course-solana_x").success).toBe(false);
  });

  it("rejects the legacy Studio-generated id", () => {
    // aD45H1NEbb1bqELwloGCqI — migrated to course-solana-101 per spec §15.5
    expect(CourseId.safeParse("aD45H1NEbb1bqELwloGCqI").success).toBe(false);
  });
});

describe("AchievementId", () => {
  it("requires the achievement- prefix and fits the seed limit", () => {
    expect(AchievementId.parse("achievement-first-steps")).toBeTruthy();
    expect(AchievementId.safeParse("first-steps").success).toBe(false);
    expect(AchievementId.safeParse("achievement-" + "a".repeat(21)).success).toBe(false);
  });
});

describe("LessonId", () => {
  it("requires the lesson- prefix", () => {
    expect(LessonId.parse("lesson-accounts")).toBeTruthy();
    expect(LessonId.safeParse("accounts").success).toBe(false);
  });
});

describe("PathId", () => {
  it("uses the path- prefix, not learningPath-", () => {
    expect(PathId.parse("path-solana-core")).toBeTruthy();
    expect(PathId.safeParse("learningPath-solana-core").success).toBe(false);
  });
});

describe("BlockKey", () => {
  it("accepts kebab-case keys", () => {
    expect(BlockKey.parse("intro")).toBe("intro");
    expect(BlockKey.parse("check-accounts")).toBe("check-accounts");
    expect(BlockKey.safeParse("Intro").success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/ids.test.ts`
Expected: FAIL — `Cannot find module '../ids'`.

- [ ] **Step 3: Implement `src/ids.ts`**

```ts
import { z } from "zod";
import { MAX_COURSE_ID_BYTES, MAX_LESSON_ID_BYTES } from "./constants";

/**
 * UTF-8 byte length. Deliberately not `Buffer.byteLength` — this package is
 * imported by browser bundles as well as CI scripts.
 */
export function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

/**
 * Ids are the stricter `[a-z0-9-]`, a subset of Sanity's `a-zA-Z0-9._-`.
 * Course and achievement ids become PDA seeds verbatim (see the project rule:
 * never strip an id before using it as a seed), so they carry a byte cap.
 */
const SEGMENT = "[a-z0-9]+(?:-[a-z0-9]+)*";

function prefixedId(prefix: string, maxBytes: number) {
  const re = new RegExp(`^${prefix}-${SEGMENT}$`);
  return z
    .string()
    .regex(re, `must match ${prefix}-<kebab-case-slug>`)
    .refine((v) => byteLength(v) <= maxBytes, {
      message: `must be at most ${maxBytes} UTF-8 bytes`,
    });
}

/** PDA seed. `["course", course_id.as_bytes()]` */
export const CourseId = prefixedId("course", MAX_COURSE_ID_BYTES);

/** PDA seed. `["achievement", achievement_id.as_bytes()]` */
export const AchievementId = prefixedId("achievement", MAX_COURSE_ID_BYTES);

/** Supabase `user_progress.lesson_id`. Not a seed — the wider cap applies. */
export const LessonId = prefixedId("lesson", MAX_LESSON_ID_BYTES);

/** Note the `path-` prefix, which deliberately does not match the type name. */
export const PathId = prefixedId("path", MAX_LESSON_ID_BYTES);

export const InstructorId = prefixedId("instructor", MAX_LESSON_ID_BYTES);
export const QuestId = prefixedId("quest", MAX_LESSON_ID_BYTES);

/** Stable within a lesson; becomes the Sanity array item `_key`. */
export const BlockKey = z.string().regex(new RegExp(`^${SEGMENT}$`), "must be kebab-case");

/** Stable within a course; modules are inline objects, not documents. */
export const ModuleKey = BlockKey;

export type CourseIdT = z.infer<typeof CourseId>;
export type LessonIdT = z.infer<typeof LessonId>;
export type AchievementIdT = z.infer<typeof AchievementId>;
export type PathIdT = z.infer<typeof PathId>;
```

Append to `src/index.ts`:

```ts
export * from "./ids";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/ids.test.ts`
Expected: PASS — 11 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-schema/src/ids.ts \
        packages/content-schema/src/__tests__/ids.test.ts \
        packages/content-schema/src/index.ts
git commit -m "feat(content-schema): id schemas with PDA seed byte caps"
```

---

### Task 3: Capability keys and the block base

**Files:**
- Create: `packages/content-schema/src/capabilities.ts`
- Create: `packages/content-schema/src/blocks/prose.ts`
- Create: `packages/content-schema/src/blocks/video.ts`
- Modify: `packages/content-schema/src/index.ts`
- Test: `packages/content-schema/src/__tests__/blocks.test.ts`

**Interfaces:**
- Consumes: `BlockKey` from `../ids`.
- Produces: `CAPABILITY_KEYS`, `CapabilityKey` (Zod), `blockBase` (a plain object of shared Zod fields: `key`, `produces?`, `consumes?`), `ProseBlock`, `VideoBlock`.

- [ ] **Step 1: Write the failing test**

`packages/content-schema/src/__tests__/blocks.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ProseBlock } from "../blocks/prose";
import { VideoBlock } from "../blocks/video";

describe("ProseBlock", () => {
  it("accepts a markdown source path", () => {
    const b = ProseBlock.parse({ type: "prose", key: "intro", src: "intro.md" });
    expect(b.src).toBe("intro.md");
  });

  it("rejects a non-markdown source", () => {
    expect(ProseBlock.safeParse({ type: "prose", key: "intro", src: "intro.txt" }).success).toBe(false);
  });

  it("rejects an absolute or escaping path", () => {
    expect(ProseBlock.safeParse({ type: "prose", key: "i", src: "/etc/passwd.md" }).success).toBe(false);
    expect(ProseBlock.safeParse({ type: "prose", key: "i", src: "../other.md" }).success).toBe(false);
  });

  it("rejects an unknown discriminator", () => {
    expect(ProseBlock.safeParse({ type: "prosé", key: "i", src: "i.md" }).success).toBe(false);
  });
});

describe("VideoBlock", () => {
  it("accepts an https url", () => {
    const b = VideoBlock.parse({ type: "video", key: "v", url: "https://youtu.be/abc" });
    expect(b.url).toContain("youtu.be");
  });

  it("rejects http", () => {
    expect(VideoBlock.safeParse({ type: "video", key: "v", url: "http://youtu.be/abc" }).success).toBe(false);
  });
});

describe("capability keys", () => {
  it("rejects produces on prose and video — they create nothing", () => {
    expect(ProseBlock.safeParse({
      type: "prose", key: "i", src: "i.md", produces: "funded-wallet",
    }).success).toBe(false);
    expect(VideoBlock.safeParse({
      type: "video", key: "v", url: "https://youtu.be/abc", produces: "deployed-program",
    }).success).toBe(false);
  });

  it("are a closed set", () => {
    const ok = ProseBlock.safeParse({
      type: "prose", key: "i", src: "i.md", consumes: ["funded-wallet"],
    });
    expect(ok.success).toBe(true);

    const bad = ProseBlock.safeParse({
      type: "prose", key: "i", src: "i.md", consumes: ["made-up"],
    });
    expect(bad.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/blocks.test.ts`
Expected: FAIL — `Cannot find module '../blocks/prose'`.

- [ ] **Step 3: Implement**

`packages/content-schema/src/capabilities.ts`:

```ts
import { z } from "zod";

/**
 * Per-learner state that one block produces and a later block consumes.
 * Closed set so CI can verify ordering (spec §4.9): every `consumes: X` must be
 * preceded, by slot order within the course, by a block that `produces: X`.
 */
export const CAPABILITY_KEYS = ["funded-wallet", "deployed-program"] as const;

export const CapabilityKey = z.enum(CAPABILITY_KEYS);
export type CapabilityKeyT = z.infer<typeof CapabilityKey>;
```

`packages/content-schema/src/blocks/base.ts`:

```ts
import { z } from "zod";
import { BlockKey } from "../ids";
import { CapabilityKey } from "../capabilities";

/**
 * Fields shared by every block. Spread into each block's `z.object({...})` —
 * not a base schema to extend, because `discriminatedUnion` requires plain
 * object members.
 */
export const blockBase = {
  key: BlockKey,
  produces: CapabilityKey.optional(),
  consumes: z.array(CapabilityKey).nonempty().optional(),
};

/** A path relative to the lesson directory. No escaping, no absolutes. */
export function relativePath(extension: `.${string}`) {
  return z
    .string()
    .refine((p) => !p.startsWith("/"), { message: "must be relative to the lesson directory" })
    .refine((p) => !p.split("/").includes(".."), { message: "must not escape the lesson directory" })
    .refine((p) => p.endsWith(extension), { message: `must end with ${extension}` });
}
```

`packages/content-schema/src/blocks/prose.ts`:

```ts
import { z } from "zod";
import { blockBase, relativePath } from "./base";

export const ProseBlock = z.object({
  type: z.literal("prose"),
  ...blockBase,
  /** Prose can never produce a capability (gate 13a, local half). */
  produces: z.never().optional(),
  src: relativePath(".md"),
});

export type ProseBlockT = z.infer<typeof ProseBlock>;
```

`packages/content-schema/src/blocks/video.ts`:

```ts
import { z } from "zod";
import { blockBase } from "./base";

export const VideoBlock = z.object({
  type: z.literal("video"),
  ...blockBase,
  /** Video can never produce a capability (gate 13a, local half). */
  produces: z.never().optional(),
  /** YouTube or Vimeo. `lesson-client.tsx` resolves the embed via getEmbedUrl. */
  url: z.url().refine((u) => u.startsWith("https://"), { message: "must be https" }),
});

export type VideoBlockT = z.infer<typeof VideoBlock>;
```

Append to `src/index.ts`:

```ts
export * from "./capabilities";
export * from "./blocks/prose";
export * from "./blocks/video";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/blocks.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-schema/src/capabilities.ts packages/content-schema/src/blocks \
        packages/content-schema/src/__tests__/blocks.test.ts packages/content-schema/src/index.ts
git commit -m "feat(content-schema): capability keys, prose and video blocks"
```

---

### Task 4: The `code` block

**Files:**
- Create: `packages/content-schema/src/blocks/code.ts`
- Modify: `packages/content-schema/src/index.ts`
- Test: `packages/content-schema/src/__tests__/code.test.ts`

**Interfaces:**
- Consumes: `blockBase`, `relativePath` from `./base`.
- Produces: `CodeBlock`, `CodeBlockT`, `TestCase`, `TestCaseT`, `LANGUAGES`, `BUILD_TYPES`.

`language`, `buildType` and `deployable` move here from the lesson (spec §4.9).

- [ ] **Step 1: Write the failing test**

`packages/content-schema/src/__tests__/code.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { CodeBlock } from "../blocks/code";

const valid = {
  type: "code" as const,
  key: "exercise",
  language: "typescript" as const,
  starter: "exercise/starter.ts",
  solution: "exercise/solution.ts",
  tests: "exercise/tests.json",
};

describe("CodeBlock", () => {
  it("accepts a typescript exercise", () => {
    expect(CodeBlock.parse(valid).language).toBe("typescript");
  });

  it("defaults buildType to standard and deployable to false", () => {
    const b = CodeBlock.parse(valid);
    expect(b.buildType).toBe("standard");
    expect(b.deployable).toBe(false);
  });

  it("requires tests to be .json, not .yaml", () => {
    // spec §4.2: expectedOutput has exact byte semantics; YAML coerces 1.0 -> 1
    expect(CodeBlock.safeParse({ ...valid, tests: "exercise/tests.yaml" }).success).toBe(false);
  });

  it("rejects buildable on a typescript exercise", () => {
    const r = CodeBlock.safeParse({ ...valid, buildType: "buildable" });
    expect(r.success).toBe(false);
  });

  it("accepts buildable on a rust exercise", () => {
    const r = CodeBlock.safeParse({
      ...valid,
      language: "rust",
      starter: "exercise/starter.rs",
      solution: "exercise/solution.rs",
      buildType: "buildable",
    });
    expect(r.success).toBe(true);
  });

  it("rejects deployable unless buildable", () => {
    const r = CodeBlock.safeParse({ ...valid, language: "rust", deployable: true });
    expect(r.success).toBe(false);
  });

  it("accepts deployable on a buildable rust exercise, and it may produce a program", () => {
    const r = CodeBlock.parse({
      ...valid,
      language: "rust",
      starter: "s.rs",
      solution: "x.rs",
      buildType: "buildable",
      deployable: true,
      consumes: ["funded-wallet"],
      produces: "deployed-program",
    });
    expect(r.produces).toBe("deployed-program");
  });

  it("requires the starter and solution extensions to match the language", () => {
    const r = CodeBlock.safeParse({ ...valid, language: "rust" });
    expect(r.success).toBe(false); // .ts files declared as rust
  });

  it("rejects produces on a non-deployable code block", () => {
    const r = CodeBlock.safeParse({ ...valid, produces: "deployed-program" });
    expect(r.success).toBe(false); // a standard TS exercise deploys nothing
  });

  it("rejects a code block producing a capability it cannot create", () => {
    const r = CodeBlock.safeParse({
      ...valid,
      language: "rust",
      starter: "s.rs",
      solution: "x.rs",
      buildType: "buildable",
      deployable: true,
      produces: "funded-wallet",
    });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/code.test.ts`
Expected: FAIL — `Cannot find module '../blocks/code'`.

- [ ] **Step 3: Implement `src/blocks/code.ts`**

```ts
import { z } from "zod";
import { blockBase, relativePath } from "./base";

export const LANGUAGES = ["typescript", "rust"] as const;
export const BUILD_TYPES = ["standard", "buildable"] as const;

const EXT: Record<(typeof LANGUAGES)[number], string> = {
  typescript: ".ts",
  rust: ".rs",
};

/**
 * A single graded case. Lives in `tests.json`, not the block, because
 * `expectedOutput` is compared byte-for-byte and YAML coerces `1.0` to `1`.
 */
export const TestCase = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  input: z.string(),
  expectedOutput: z.string(),
});
export type TestCaseT = z.infer<typeof TestCase>;

export const CodeBlock = z
  .object({
    type: z.literal("code"),
    ...blockBase,
    language: z.enum(LANGUAGES),
    /** `buildable` compiles via the Anchor build server; `standard` runs in the isolate/Playground. */
    buildType: z.enum(BUILD_TYPES).default("standard"),
    /** Shows the Deploy-to-Devnet panel after a successful build. */
    deployable: z.boolean().default(false),
    starter: z.string().min(1),
    solution: z.string().min(1),
    tests: relativePath(".json"),
    hints: z.array(z.string().min(1)).default([]),
  })
  .refine((b) => b.buildType !== "buildable" || b.language === "rust", {
    message: "buildType 'buildable' requires language 'rust'",
    path: ["buildType"],
  })
  .refine((b) => !b.deployable || b.buildType === "buildable", {
    message: "deployable requires buildType 'buildable'",
    path: ["deployable"],
  })
  .refine((b) => b.starter.endsWith(EXT[b.language]), {
    message: "starter extension must match language",
    path: ["starter"],
  })
  .refine((b) => b.solution.endsWith(EXT[b.language]), {
    message: "solution extension must match language",
    path: ["solution"],
  })
  // Gate 13a's local half (PR #350 review): a capability may only be produced by
  // a block type that can actually create it. A code block can only ever produce
  // `deployed-program`, and only when it is deployable — otherwise a stray
  // `produces:` satisfies the CI ordering check with a producer that produces
  // nothing.
  .refine((b) => b.produces === undefined || b.produces === "deployed-program", {
    message: "a code block may only produce 'deployed-program'",
    path: ["produces"],
  })
  .refine((b) => b.produces !== "deployed-program" || b.deployable, {
    message: "only a deployable code block may produce 'deployed-program'",
    path: ["produces"],
  });

export type CodeBlockT = z.infer<typeof CodeBlock>;
```

Append to `src/index.ts`:

```ts
export * from "./blocks/code";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/code.test.ts`
Expected: PASS — 10 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-schema/src/blocks/code.ts \
        packages/content-schema/src/__tests__/code.test.ts \
        packages/content-schema/src/index.ts
git commit -m "feat(content-schema): code block with language/buildType/deployable invariants"
```

---

### Task 5: The `quiz` block

**Files:**
- Create: `packages/content-schema/src/blocks/quiz.ts`
- Modify: `packages/content-schema/src/index.ts`
- Test: `packages/content-schema/src/__tests__/quiz.test.ts`

**Interfaces:**
- Consumes: `blockBase` from `./base`.
- Produces: `QuizBlock`, `QuizBlockT`, `QuizQuestion`, `QuizOption`.

Modeled on what edX OLX and IMS QTI agree on (spec §4.5): correctness keyed to stable option ids, multi-select as a **set**, per-option feedback distinct from a general explanation. `correctIndex` is deliberately absent.

- [ ] **Step 1: Write the failing test**

`packages/content-schema/src/__tests__/quiz.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { QuizBlock } from "../blocks/quiz";

const q = (over: Record<string, unknown> = {}) => ({
  type: "quiz" as const,
  key: "check",
  questions: [
    {
      id: "q1",
      prompt: "Which accounts store state?",
      multiSelect: false,
      options: [
        { id: "a", label: "Data accounts", correct: true },
        { id: "b", label: "Instructions", correct: false, feedback: "Those are inputs." },
      ],
      explanation: "Data accounts hold state.",
      ...over,
    },
  ],
});

describe("QuizBlock", () => {
  it("accepts a single-select question", () => {
    expect(QuizBlock.parse(q()).questions[0]!.id).toBe("q1");
  });

  it("keeps per-option feedback and the general explanation as separate channels", () => {
    const b = QuizBlock.parse(q());
    expect(b.questions[0]!.options[1]!.feedback).toBe("Those are inputs.");
    expect(b.questions[0]!.explanation).toBe("Data accounts hold state.");
  });

  it("rejects a question with no correct option", () => {
    const bad = q({ options: [{ id: "a", label: "x", correct: false }] });
    expect(QuizBlock.safeParse(bad).success).toBe(false);
  });

  it("rejects two correct options when multiSelect is false", () => {
    const bad = q({
      options: [
        { id: "a", label: "x", correct: true },
        { id: "b", label: "y", correct: true },
      ],
    });
    expect(QuizBlock.safeParse(bad).success).toBe(false);
  });

  it("accepts two correct options when multiSelect is true", () => {
    const ok = q({
      multiSelect: true,
      options: [
        { id: "a", label: "x", correct: true },
        { id: "b", label: "y", correct: true },
      ],
    });
    expect(QuizBlock.safeParse(ok).success).toBe(true);
  });

  it("rejects duplicate option ids", () => {
    const bad = q({
      options: [
        { id: "a", label: "x", correct: true },
        { id: "a", label: "y", correct: false },
      ],
    });
    expect(QuizBlock.safeParse(bad).success).toBe(false);
  });

  it("rejects duplicate question ids", () => {
    const one = QuizBlock.parse(q()).questions[0]!;
    const bad = { type: "quiz", key: "check", questions: [one, one] };
    expect(QuizBlock.safeParse(bad).success).toBe(false);
  });

  it("requires at least one question", () => {
    expect(QuizBlock.safeParse({ type: "quiz", key: "check", questions: [] }).success).toBe(false);
  });

  it("rejects produces — a quiz creates nothing", () => {
    expect(QuizBlock.safeParse({ ...q(), produces: "funded-wallet" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/quiz.test.ts`
Expected: FAIL — `Cannot find module '../blocks/quiz'`.

- [ ] **Step 3: Implement `src/blocks/quiz.ts`**

```ts
import { z } from "zod";
import { blockBase } from "./base";

const unique = <T>(xs: readonly T[]) => new Set(xs).size === xs.length;

/**
 * Correctness is keyed to a stable option `id`, never an array index — both edX
 * OLX (`<choice name="a" correct="true">`) and IMS QTI (`<simpleChoice
 * identifier="ChoiceA">`) do this, because reordering options must not silently
 * change the answer.
 */
export const QuizOption = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  correct: z.boolean(),
  /** Shown when the learner picks this specific option. OLX `<choicehint>`. */
  feedback: z.string().min(1).optional(),
});

export const QuizQuestion = z
  .object({
    id: z.string().min(1),
    prompt: z.string().min(1),
    /** true → correctness is a SET of option ids (QTI `cardinality="multiple"`). */
    multiSelect: z.boolean().default(false),
    options: z.array(QuizOption).min(2),
    /** Shown after submission regardless of choice. OLX `<solution>`. */
    explanation: z.string().min(1).optional(),
  })
  .refine((q) => unique(q.options.map((o) => o.id)), {
    message: "option ids must be unique within a question",
    path: ["options"],
  })
  .refine((q) => q.options.some((o) => o.correct), {
    message: "at least one option must be correct",
    path: ["options"],
  })
  .refine((q) => q.multiSelect || q.options.filter((o) => o.correct).length === 1, {
    message: "exactly one option must be correct when multiSelect is false",
    path: ["options"],
  });

export const QuizBlock = z
  .object({
    type: z.literal("quiz"),
    ...blockBase,
    /** A quiz can never produce a capability (gate 13a, local half). */
    produces: z.never().optional(),
    questions: z.array(QuizQuestion).min(1),
  })
  .refine((b) => unique(b.questions.map((q) => q.id)), {
    message: "question ids must be unique within a quiz",
    path: ["questions"],
  });

export type QuizBlockT = z.infer<typeof QuizBlock>;
```

Append to `src/index.ts`:

```ts
export * from "./blocks/quiz";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/quiz.test.ts`
Expected: PASS — 9 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-schema/src/blocks/quiz.ts \
        packages/content-schema/src/__tests__/quiz.test.ts \
        packages/content-schema/src/index.ts
git commit -m "feat(content-schema): quiz block keyed on stable option ids, not indices"
```

---

### Task 6: The `openEnded` block and the three widget blocks

**Files:**
- Create: `packages/content-schema/src/blocks/open-ended.ts`
- Create: `packages/content-schema/src/blocks/widgets.ts`
- Modify: `packages/content-schema/src/index.ts`
- Test: `packages/content-schema/src/__tests__/widgets.test.ts`

**Interfaces:**
- Consumes: `blockBase`, `relativePath`.
- Produces: `OpenEndedBlock`, `WalletFundingBlock`, `ProgramExplorerBlock`, `DeployedProgramCardBlock`.

Per **Amendment A**, each widget is a first-class block type.

- [ ] **Step 1: Write the failing test**

`packages/content-schema/src/__tests__/widgets.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { OpenEndedBlock } from "../blocks/open-ended";
import {
  WalletFundingBlock,
  ProgramExplorerBlock,
  DeployedProgramCardBlock,
} from "../blocks/widgets";

describe("OpenEndedBlock", () => {
  it("accepts a reflection prompt", () => {
    const b = OpenEndedBlock.parse({
      type: "openEnded", key: "reflect", prompt: "What did you learn?", maxWords: 150,
    });
    expect(b.maxWords).toBe(150);
  });

  it("defaults maxWords", () => {
    const b = OpenEndedBlock.parse({ type: "openEnded", key: "r", prompt: "p" });
    expect(b.maxWords).toBe(200);
  });

  it("caps maxWords so one AI reply stays cheap", () => {
    expect(OpenEndedBlock.safeParse({ type: "openEnded", key: "r", prompt: "p", maxWords: 5000 }).success).toBe(false);
  });

  it("rejects produces — a reflection creates nothing", () => {
    expect(OpenEndedBlock.safeParse({ type: "openEnded", key: "r", prompt: "p", produces: "funded-wallet" }).success).toBe(false);
  });
});

describe("WalletFundingBlock", () => {
  it("carries config that is hardcoded in the component today", () => {
    const b = WalletFundingBlock.parse({
      type: "wallet-funding", key: "fund", amount: 2, network: "devnet", produces: "funded-wallet",
    });
    expect(b.amount).toBe(2);
    expect(b.produces).toBe("funded-wallet");
  });

  it("rejects a mainnet airdrop", () => {
    expect(WalletFundingBlock.safeParse({
      type: "wallet-funding", key: "f", amount: 2, network: "mainnet-beta",
    }).success).toBe(false);
  });
});

describe("ProgramExplorerBlock", () => {
  it("requires an idl file and consumes a deployed program", () => {
    const b = ProgramExplorerBlock.parse({
      type: "program-explorer", key: "explore", idl: "program.idl.json", consumes: ["deployed-program"],
    });
    expect(b.idl).toBe("program.idl.json");
  });

  it("rejects an inline idl string", () => {
    expect(ProgramExplorerBlock.safeParse({
      type: "program-explorer", key: "e", idl: '{"instructions":[]}',
    }).success).toBe(false);
  });
});

describe("DeployedProgramCardBlock", () => {
  it("exists, unlike its predecessor", () => {
    const b = DeployedProgramCardBlock.parse({
      type: "deployed-program-card", key: "card", consumes: ["deployed-program"],
    });
    expect(b.consumes).toEqual(["deployed-program"]);
  });
});

describe("per-type produces constraints (gate 13a, local half)", () => {
  it("rejects wallet-funding producing anything but funded-wallet", () => {
    expect(WalletFundingBlock.safeParse({
      type: "wallet-funding", key: "f", produces: "deployed-program",
    }).success).toBe(false);
  });

  it("rejects produces on pure consumers", () => {
    expect(ProgramExplorerBlock.safeParse({
      type: "program-explorer", key: "e", idl: "program.idl.json", produces: "funded-wallet",
    }).success).toBe(false);
    expect(DeployedProgramCardBlock.safeParse({
      type: "deployed-program-card", key: "c", produces: "deployed-program",
    }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/widgets.test.ts`
Expected: FAIL — `Cannot find module '../blocks/open-ended'`.

- [ ] **Step 3: Implement**

`packages/content-schema/src/blocks/open-ended.ts`:

```ts
import { z } from "zod";
import { blockBase } from "./base";

/**
 * A reflection: one learner message, one AI reply, feedback only. Never graded,
 * never mints XP (spec D5). `required` in the registry, satisfied by a sealed
 * attestation that the server saw a submission.
 */
export const OpenEndedBlock = z.object({
  type: z.literal("openEnded"),
  ...blockBase,
  /** A reflection can never produce a capability (gate 13a, local half). */
  produces: z.never().optional(),
  prompt: z.string().min(1),
  /** Bounds one cache-shaped Gemini call. */
  maxWords: z.number().int().min(20).max(500).default(200),
});

export type OpenEndedBlockT = z.infer<typeof OpenEndedBlock>;
```

`packages/content-schema/src/blocks/widgets.ts`:

```ts
import { z } from "zod";
import { blockBase, relativePath } from "./base";

/**
 * Each widget is its own block type (Amendment A), so the block type IS the
 * renderer-registry key. A widget that renders nothing cannot exist: the union
 * rejects a type with no member, which is exactly the `deployed-program-card`
 * failure mode this replaces.
 */

export const WalletFundingBlock = z.object({
  type: z.literal("wallet-funding"),
  ...blockBase,
  /** Gate 13a local half: funding a wallet can only ever produce `funded-wallet`. */
  produces: z.literal("funded-wallet").optional(),
  /** SOL. Hardcoded to 2 in wallet-funding-card.tsx today. */
  amount: z.number().positive().max(5).default(2),
  network: z.literal("devnet").default("devnet"),
});

export const ProgramExplorerBlock = z.object({
  type: z.literal("program-explorer"),
  ...blockBase,
  /** A pure consumer — it can never produce a capability. */
  produces: z.never().optional(),
  /**
   * A real file, not a textarea. CI asserts it parses, has a non-empty
   * `instructions` array, and that `metadata.name` matches the keypair-storage
   * key `generic-program-explorer.tsx` looks for.
   */
  idl: relativePath(".json"),
});

export const DeployedProgramCardBlock = z.object({
  type: z.literal("deployed-program-card"),
  ...blockBase,
  /** A pure consumer — it can never produce a capability. */
  produces: z.never().optional(),
});

export type WalletFundingBlockT = z.infer<typeof WalletFundingBlock>;
export type ProgramExplorerBlockT = z.infer<typeof ProgramExplorerBlock>;
export type DeployedProgramCardBlockT = z.infer<typeof DeployedProgramCardBlock>;
```

Append to `src/index.ts`:

```ts
export * from "./blocks/open-ended";
export * from "./blocks/widgets";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/widgets.test.ts`
Expected: PASS — 11 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-schema/src/blocks/open-ended.ts \
        packages/content-schema/src/blocks/widgets.ts \
        packages/content-schema/src/__tests__/widgets.test.ts \
        packages/content-schema/src/index.ts
git commit -m "feat(content-schema): openEnded reflection and first-class widget blocks"
```

---

### Task 7: The block union and the registry

**Files:**
- Create: `packages/content-schema/src/blocks/index.ts`
- Modify: `packages/content-schema/src/index.ts`
- Test: `packages/content-schema/src/__tests__/registry.test.ts`

**Interfaces:**
- Consumes: all six block modules.
- Produces: `Block` (Zod discriminated union), `BlockT`, `BlockType` (union of literals), `BlockMeta`, `BLOCK_REGISTRY: Record<BlockType, BlockMeta>`, `isGraded(t)`, `isRequired(t)`.

This is the file that makes the completion gate fail closed: a block type absent from `BLOCK_REGISTRY` is a **type error**, and a block type absent from `GRADERS` (Plan 6) is a runtime 503.

- [ ] **Step 1: Write the failing test**

`packages/content-schema/src/__tests__/registry.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { Block, BLOCK_REGISTRY, isGraded, isRequired } from "../blocks";

describe("Block union", () => {
  it("discriminates on `type`", () => {
    expect(Block.parse({ type: "prose", key: "i", src: "i.md" }).type).toBe("prose");
    expect(Block.parse({ type: "quiz", key: "q", questions: [{
      id: "q1", prompt: "p", options: [
        { id: "a", label: "x", correct: true },
        { id: "b", label: "y", correct: false },
      ],
    }] }).type).toBe("quiz");
  });

  it("rejects an unknown block type", () => {
    expect(Block.safeParse({ type: "podcast", key: "p" }).success).toBe(false);
  });
});

describe("BLOCK_REGISTRY", () => {
  it("has an entry for every member of the union", () => {
    const types = ["prose", "video", "code", "quiz", "openEnded",
                   "wallet-funding", "program-explorer", "deployed-program-card"];
    expect(Object.keys(BLOCK_REGISTRY).sort()).toEqual([...types].sort());
  });

  it("marks exactly code and quiz as graded", () => {
    const graded = Object.keys(BLOCK_REGISTRY).filter((t) => isGraded(t as never));
    expect(graded.sort()).toEqual(["code", "quiz"]);
  });

  it("marks code, quiz and openEnded as required", () => {
    const required = Object.keys(BLOCK_REGISTRY).filter((t) => isRequired(t as never));
    expect(required.sort()).toEqual(["code", "openEnded", "quiz"]);
  });

  it("never marks a block graded without also marking it required", () => {
    for (const [type, meta] of Object.entries(BLOCK_REGISTRY)) {
      if (meta.graded) expect(meta.required, `${type} is graded but not required`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/registry.test.ts`
Expected: FAIL — `Cannot find module '../blocks'`.

- [ ] **Step 3: Implement `src/blocks/index.ts`**

```ts
import { z } from "zod";
import { ProseBlock } from "./prose";
import { VideoBlock } from "./video";
import { CodeBlock } from "./code";
import { QuizBlock } from "./quiz";
import { OpenEndedBlock } from "./open-ended";
import {
  WalletFundingBlock,
  ProgramExplorerBlock,
  DeployedProgramCardBlock,
} from "./widgets";

export * from "./base";
export * from "./prose";
export * from "./video";
export * from "./code";
export * from "./quiz";
export * from "./open-ended";
export * from "./widgets";

/**
 * `CodeBlock` and `QuizBlock` carry `.refine()`, so they are ZodEffects rather
 * than ZodObject. `z.discriminatedUnion` in zod 4 accepts them because the
 * discriminator is still statically resolvable through the effect.
 */
export const Block = z.discriminatedUnion("type", [
  ProseBlock,
  VideoBlock,
  CodeBlock,
  QuizBlock,
  OpenEndedBlock,
  WalletFundingBlock,
  ProgramExplorerBlock,
  DeployedProgramCardBlock,
]);

export type BlockT = z.infer<typeof Block>;
export type BlockType = BlockT["type"];

export interface BlockMeta {
  /** A deterministic grader returns pass/fail; failing blocks lesson completion. */
  graded: boolean;
  /** The learner must interact before the lesson can complete. */
  required: boolean;
}

/**
 * `satisfies` makes an unregistered block type a compile error. The completion
 * gate (Plan 6) dispatches on this: a block with no registered grader is DENIED,
 * so an unknown type fails closed — the inverse of today's
 * `if (answerKey.type === "challenge")`, which lets unknown types through.
 */
export const BLOCK_REGISTRY = {
  prose: { graded: false, required: false },
  video: { graded: false, required: false },
  code: { graded: true, required: true },
  quiz: { graded: true, required: true },
  openEnded: { graded: false, required: true },
  "wallet-funding": { graded: false, required: false },
  "program-explorer": { graded: false, required: false },
  "deployed-program-card": { graded: false, required: false },
} satisfies Record<BlockType, BlockMeta>;

export const isGraded = (t: BlockType): boolean => BLOCK_REGISTRY[t].graded;
export const isRequired = (t: BlockType): boolean => BLOCK_REGISTRY[t].required;
```

Replace the individual block exports in `src/index.ts` with:

```ts
export * from "./constants";
export * from "./ids";
export * from "./capabilities";
export * from "./blocks";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/registry.test.ts && pnpm --filter @superteam-lms/content-schema typecheck`
Expected: PASS — 6 tests; `tsc` exits 0.

Verified against zod 4.4.3 before this plan was written: `discriminatedUnion` accepts a `.refine()`d member (a `ZodEffects`) and still enforces the refinement — `U.safeParse({type:"code", lang:"bad"})` fails. No fallback is needed.

- [ ] **Step 5: Commit**

```bash
git add packages/content-schema/src/blocks/index.ts \
        packages/content-schema/src/__tests__/registry.test.ts \
        packages/content-schema/src/index.ts
git commit -m "feat(content-schema): block union + registry; unknown types fail closed"
```

---

### Task 8: Lesson and course

**Files:**
- Create: `packages/content-schema/src/lesson.ts`
- Create: `packages/content-schema/src/course.ts`
- Modify: `packages/content-schema/src/index.ts`
- Test: `packages/content-schema/src/__tests__/lesson.test.ts`
- Test: `packages/content-schema/src/__tests__/course.test.ts`

**Interfaces:**
- Consumes: `Block` from `./blocks`; `CourseId`, `LessonId`, `InstructorId`, `ModuleKey` from `./ids`; `DIFFICULTIES` from `./constants`.
- Produces: `Lesson`, `LessonT`, `Course`, `CourseT`, `CourseModule`.

Modules are **inline objects**, not documents (spec §10.1). `lesson.xpReward` deliberately does not exist.

- [ ] **Step 1: Write the failing tests**

`packages/content-schema/src/__tests__/lesson.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { Lesson } from "../lesson";

const base = {
  id: "lesson-accounts",
  slug: "accounts",
  title: "Accounts",
  blocks: [{ type: "prose", key: "intro", src: "intro.md" }],
};

describe("Lesson", () => {
  it("accepts a prose-only lesson", () => {
    expect(Lesson.parse(base).blocks).toHaveLength(1);
  });

  it("rejects duplicate block keys", () => {
    const bad = { ...base, blocks: [
      { type: "prose", key: "intro", src: "a.md" },
      { type: "prose", key: "intro", src: "b.md" },
    ] };
    expect(Lesson.safeParse(bad).success).toBe(false);
  });

  it("requires at least one block", () => {
    expect(Lesson.safeParse({ ...base, blocks: [] }).success).toBe(false);
  });

  it("has no xpReward field — XP is course.xpPerLesson", () => {
    const parsed = Lesson.parse({ ...base, xpReward: 50 });
    expect("xpReward" in parsed).toBe(false);
  });

  it("accepts a consumes with no in-lesson producer (the producer may be an earlier lesson)", () => {
    // Cross-lesson/course ordering by DISPLAY order is checked by the linter
    // (Plan 2), not here — within a single lesson a dangling consumes is legal.
    const ok = { ...base, blocks: [
      { type: "deployed-program-card", key: "card", consumes: ["deployed-program"] },
    ] };
    expect(Lesson.safeParse(ok).success).toBe(true);
  });
});
```

`packages/content-schema/src/__tests__/course.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { Course } from "../course";

const base = {
  id: "course-solana-fundamentals",
  slug: "solana-fundamentals",
  title: "Solana Fundamentals",
  difficulty: "beginner",
  duration: 6,
  xpPerLesson: 10,
  xpReward: 600,
  creator: { githubId: "12345678" },
  modules: [{ key: "basics", title: "The Basics", lessons: ["lesson-accounts"] }],
};

describe("Course", () => {
  it("accepts a minimal course with inline modules", () => {
    expect(Course.parse(base).modules[0]!.key).toBe("basics");
  });

  it("enforces the on-chain xpPerLesson range", () => {
    expect(Course.safeParse({ ...base, xpPerLesson: 0 }).success).toBe(false);
    expect(Course.safeParse({ ...base, xpPerLesson: 101 }).success).toBe(false);
    expect(Course.safeParse({ ...base, xpPerLesson: 100 }).success).toBe(true);
  });

  it("rejects duplicate module keys", () => {
    const bad = { ...base, modules: [base.modules[0], base.modules[0]] };
    expect(Course.safeParse(bad).success).toBe(false);
  });

  it("rejects the same lesson appearing twice across modules", () => {
    const bad = { ...base, modules: [
      { key: "a", title: "A", lessons: ["lesson-accounts"] },
      { key: "b", title: "B", lessons: ["lesson-accounts"] },
    ] };
    expect(Course.safeParse(bad).success).toBe(false);
  });

  it("requires a numeric githubId string", () => {
    expect(Course.safeParse({ ...base, creator: { githubId: "octocat" } }).success).toBe(false);
  });

  it("rejects more lessons than the on-chain bitmap can hold", () => {
    const lessons = Array.from({ length: 257 }, (_, i) => `lesson-l${i}`);
    const bad = { ...base, modules: [{ key: "m", title: "M", lessons }] };
    expect(Course.safeParse(bad).success).toBe(false);
  });

  it("rejects a course that can never be finalized (xpPerLesson × lessonCount > 10000)", () => {
    // 101 lessons × 100 xp = 10100 → bonus 5050 > MAX_XP_PER_MINT → finalize reverts forever
    const lessons = Array.from({ length: 101 }, (_, i) => `lesson-l${i}`);
    const bad = { ...base, xpPerLesson: 100, modules: [{ key: "m", title: "M", lessons }] };
    expect(Course.safeParse(bad).success).toBe(false);
  });

  it("accepts the boundary (product exactly 10000)", () => {
    const lessons = Array.from({ length: 100 }, (_, i) => `lesson-l${i}`);
    const ok = { ...base, xpPerLesson: 100, modules: [{ key: "m", title: "M", lessons }] };
    expect(Course.safeParse(ok).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/lesson.test.ts src/__tests__/course.test.ts`
Expected: FAIL — `Cannot find module '../lesson'`.

- [ ] **Step 3: Implement**

`packages/content-schema/src/lesson.ts`:

Note the deliberate absence of `.strict()`. The test asserts a stray `xpReward:`
is **dropped**, not that parsing fails — zod strips unknown keys by default. The
linter (Plan 2) surfaces stripped keys as warnings so an author who typed
`xpReward` learns it does nothing, rather than having their PR rejected outright.

```ts
import { z } from "zod";
import { LessonId } from "./ids";
import { Block } from "./blocks";

const unique = <T>(xs: readonly T[]) => new Set(xs).size === xs.length;

/**
 * The lesson is the atomic completable unit: `complete_lesson` flips one bit of
 * the on-chain bitmap. Blocks are ordered; block results are transient and never
 * persisted per-block.
 *
 * There is no `xpReward`. Per-lesson XP is `course.xpPerLesson`, held in the
 * Course PDA. Zod strips unknown keys, so a stray `xpReward:` is dropped rather
 * than honoured — 76 seed lessons carry one today and nothing reads it. The
 * linter (Plan 2) reports stripped keys as warnings so authors are not confused.
 */
export const Lesson = z
  .object({
    id: LessonId,
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    blocks: z.array(Block).min(1),
  })
  .refine((l) => unique(l.blocks.map((b) => b.key)), {
    message: "block keys must be unique within a lesson",
    path: ["blocks"],
  });

export type LessonT = z.infer<typeof Lesson>;
```

`packages/content-schema/src/course.ts`:

```ts
import { z } from "zod";
import { CourseId, LessonId, InstructorId, ModuleKey } from "./ids";
import { DIFFICULTIES, MAX_LESSON_SLOTS, MAX_XP_PER_MINT } from "./constants";

const unique = <T>(xs: readonly T[]) => new Set(xs).size === xs.length;

/** Inline object, not a document — modules are never reused across courses. */
export const CourseModule = z.object({
  key: ModuleKey,
  title: z.string().min(1),
  description: z.string().optional(),
  lessons: z.array(LessonId).min(1),
});

export const Course = z
  .object({
    id: CourseId,
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    description: z.string().optional(),
    difficulty: z.enum(DIFFICULTIES),
    duration: z.number().nonnegative(),
    /**
     * Stored in the Course PDA. On-chain, `create_course` does NOT bound this;
     * the only chain ceiling is `complete_lesson.rs:30` (xp_per_lesson ≤ 5000).
     * This 1..100 range is a product policy the Zod schema alone enforces —
     * plus the finalize-invariant refine below (xpPerLesson × lessonCount ≤ 10000).
     */
    xpPerLesson: z.number().int().min(1).max(100),
    /** Completion bonus is derived on-chain; this is the catalogue display value. */
    xpReward: z.number().int().min(0).max(MAX_XP_PER_MINT),
    creatorRewardXp: z.number().int().min(0).max(MAX_XP_PER_MINT).default(0),
    minCompletionsForReward: z.number().int().min(0).default(0),
    trackId: z.number().int().min(0).default(0),
    trackLevel: z.number().int().min(0).default(0),
    tags: z.array(z.string().min(1)).default([]),
    /** Resolved at sync time: github_id → profiles.wallet_address → Course.creator. */
    creator: z.object({ githubId: z.string().regex(/^\d+$/, "must be the numeric GitHub user id") }),
    instructor: InstructorId.optional(),
    prerequisiteCourse: CourseId.optional(),
    modules: z.array(CourseModule).min(1),
  })
  .refine((c) => unique(c.modules.map((m) => m.key)), {
    message: "module keys must be unique within a course",
    path: ["modules"],
  })
  .refine((c) => unique(c.modules.flatMap((m) => m.lessons)), {
    message: "a lesson may appear in only one module",
    path: ["modules"],
  })
  .refine((c) => c.modules.flatMap((m) => m.lessons).length <= MAX_LESSON_SLOTS, {
    message: `a course may hold at most ${MAX_LESSON_SLOTS} lessons (Enrollment.lesson_flags is [u64; 4])`,
    path: ["modules"],
  })
  // The finalize XP invariant (spec §5.2 / gate 5a): finalize_course.rs computes
  // bonus = xp_per_lesson * liveLessonCount / 2 and reverts if bonus > 5000, so
  // xpPerLesson * lessonCount must be <= 2 * MAX_XP_PER_MINT (10000). Violate it
  // and EVERY learner's finalize reverts forever — no bonus, no credential,
  // total_completions frozen, creator rewards dead.
  .refine(
    (c) => c.xpPerLesson * c.modules.flatMap((m) => m.lessons).length <= 2 * MAX_XP_PER_MINT,
    {
      message: `xpPerLesson × lessonCount must be ≤ ${2 * MAX_XP_PER_MINT} (finalize_course bonus ≤ MAX_XP_PER_MINT); above it, no learner can finalize`,
      path: ["xpPerLesson"],
    },
  )
  .refine((c) => c.prerequisiteCourse !== c.id, {
    message: "a course cannot be its own prerequisite",
    path: ["prerequisiteCourse"],
  });

export type CourseT = z.infer<typeof Course>;
export type CourseModuleT = z.infer<typeof CourseModule>;
```

Append to `src/index.ts`:

```ts
export * from "./lesson";
export * from "./course";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/lesson.test.ts src/__tests__/course.test.ts`
Expected: PASS — 13 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-schema/src/lesson.ts packages/content-schema/src/course.ts \
        packages/content-schema/src/__tests__/lesson.test.ts \
        packages/content-schema/src/__tests__/course.test.ts \
        packages/content-schema/src/index.ts
git commit -m "feat(content-schema): lesson (blocks) and course (inline modules)"
```

---

### Task 9: Achievement award kinds, quest, path, instructor

**Files:**
- Create: `packages/content-schema/src/achievement.ts`
- Create: `packages/content-schema/src/quest.ts`
- Create: `packages/content-schema/src/path.ts`
- Create: `packages/content-schema/src/instructor.ts`
- Modify: `packages/content-schema/src/index.ts`
- Test: `packages/content-schema/src/__tests__/achievement.test.ts`
- Test: `packages/content-schema/src/__tests__/quest.test.ts`

**Interfaces:**
- Consumes: ids, `MAX_XP_PER_MINT`, `QUEST_TYPES`, `COMMUNITY_STATS`, `ACHIEVEMENT_CATEGORIES`, `DIFFICULTIES`.
- Produces: `Award` (discriminated union on `kind`), `AWARD_KINDS`, `AwardKind`, `Achievement`, `Quest`, `LearningPath`, `Instructor`.

`Award` is the schema half of spec D9. Plan 7 implements `PREDICATES satisfies Record<AwardKind, Predicate>` against these kinds.

- [ ] **Step 1: Write the failing tests**

`packages/content-schema/src/__tests__/achievement.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { Achievement, Award, AWARD_KINDS } from "../achievement";

const base = {
  id: "achievement-first-steps",
  name: "First Steps",
  category: "progress",
  xpReward: 50,
};

describe("Award", () => {
  it("covers every kind the code must implement", () => {
    expect([...AWARD_KINDS].sort()).toEqual([
      "community-stat", "course-completed", "lessons-completed",
      "lessons-completed-in-course", "manual", "path-completed",
      "streak", "user-number",
    ]);
  });

  it("accepts course-completed with a real course id", () => {
    expect(Award.parse({ kind: "course-completed", course: "course-anchor-framework" }).kind)
      .toBe("course-completed");
  });

  it("rejects course-completed without a course", () => {
    expect(Award.safeParse({ kind: "course-completed" }).success).toBe(false);
  });

  it("accepts path-completed, replacing the hardcoded SOLANA_DEV_PATH_COURSES", () => {
    expect(Award.safeParse({ kind: "path-completed", path: "path-solana-core" }).success).toBe(true);
  });

  it("rejects an unknown kind", () => {
    expect(Award.safeParse({ kind: "vibes" }).success).toBe(false);
  });

  it("accepts manual with no parameters", () => {
    expect(Award.parse({ kind: "manual" }).kind).toBe("manual");
  });

  it("restricts community-stat to real UserState fields", () => {
    expect(Award.safeParse({ kind: "community-stat", stat: "acceptedAnswers", gte: 5 }).success).toBe(true);
    expect(Award.safeParse({ kind: "community-stat", stat: "vibes", gte: 5 }).success).toBe(false);
  });
});

describe("Achievement", () => {
  it("requires an award kind — no achievement may be unearnable by accident", () => {
    expect(Achievement.safeParse(base).success).toBe(false);
  });

  it("accepts a declarative achievement", () => {
    const a = Achievement.parse({ ...base, award: { kind: "lessons-completed", gte: 1 } });
    expect(a.award.kind).toBe("lessons-completed");
  });

  it("caps xpReward at the on-chain mint ceiling", () => {
    expect(Achievement.safeParse({ ...base, award: { kind: "manual" }, xpReward: 5001 }).success).toBe(false);
    expect(Achievement.safeParse({ ...base, award: { kind: "manual" }, xpReward: 0 }).success).toBe(false);
  });
});
```

`packages/content-schema/src/__tests__/quest.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { Quest } from "../quest";

const base = {
  id: "quest-complete-lesson",
  name: "Complete a Lesson",
  type: "lesson",
  xpReward: 25,
  targetValue: 1,
  resetType: "daily",
};

describe("Quest", () => {
  it("accepts a daily lesson quest", () => {
    expect(Quest.parse(base).type).toBe("lesson");
  });

  it("rejects targetValue 0 — get_daily_quest_state has no guard and would mint free XP daily", () => {
    expect(Quest.safeParse({ ...base, targetValue: 0 }).success).toBe(false);
  });

  it("rejects a type the SQL function does not implement", () => {
    expect(Quest.safeParse({ ...base, type: "vibes" }).success).toBe(false);
  });

  it("caps xpReward at MAX_XP_PER_MINT, above which reward_xp reverts forever", () => {
    expect(Quest.safeParse({ ...base, xpReward: 5001 }).success).toBe(false);
    expect(Quest.safeParse({ ...base, xpReward: 5000 }).success).toBe(true);
  });

  it("defaults active to true", () => {
    expect(Quest.parse(base).active).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/achievement.test.ts src/__tests__/quest.test.ts`
Expected: FAIL — `Cannot find module '../achievement'`.

- [ ] **Step 3: Implement**

`packages/content-schema/src/achievement.ts`:

```ts
import { z } from "zod";
import { AchievementId, CourseId, PathId } from "./ids";
import { ACHIEVEMENT_CATEGORIES, COMMUNITY_STATS, MAX_XP_PER_MINT } from "./constants";

/**
 * Unlock logic is content, not TypeScript (spec D9). Today `event-handlers.ts:76`
 * hardcodes SOLANA_DEV_PATH_COURSES — four course ids matching no learningPath in
 * the dataset — and `allTestsPassedFirstTry` is hardcoded false at both UserState
 * construction sites, making `achievement-perfect-score` unreachable.
 *
 * Plan 7 implements `PREDICATES satisfies Record<AwardKind, Predicate>` against
 * exactly these kinds, so a kind with no predicate is a compile error.
 */
export const Award = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("lessons-completed"), gte: z.number().int().min(1) }),
  z.object({
    kind: z.literal("lessons-completed-in-course"),
    course: CourseId,
    gte: z.number().int().min(1),
  }),
  z.object({ kind: z.literal("course-completed"), course: CourseId }),
  z.object({ kind: z.literal("path-completed"), path: PathId }),
  z.object({ kind: z.literal("streak"), days: z.number().int().min(1) }),
  z.object({ kind: z.literal("user-number"), lte: z.number().int().min(1) }),
  z.object({
    kind: z.literal("community-stat"),
    stat: z.enum(COMMUNITY_STATS),
    gte: z.number().int().min(1),
  }),
  /** Admin-granted. `bug-hunter` is this by design (achievements.ts:60). */
  z.object({ kind: z.literal("manual") }),
]);

export type AwardT = z.infer<typeof Award>;
export type AwardKind = AwardT["kind"];

export const AWARD_KINDS = [
  "lessons-completed",
  "lessons-completed-in-course",
  "course-completed",
  "path-completed",
  "streak",
  "user-number",
  "community-stat",
  "manual",
] as const satisfies readonly AwardKind[];

export const Achievement = z.object({
  id: AchievementId,
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  glyph: z.string().min(1).max(2).optional(),
  solTier: z.boolean().default(false),
  category: z.enum(ACHIEVEMENT_CATEGORIES),
  xpReward: z.number().int().min(1).max(MAX_XP_PER_MINT),
  maxSupply: z.number().int().min(0).default(0),
  metadataUri: z.url().optional(),
  /** Required. An achievement with no award kind cannot be earned. */
  award: Award,
});

export type AchievementT = z.infer<typeof Achievement>;
```

`packages/content-schema/src/quest.ts`:

```ts
import { z } from "zod";
import { QuestId } from "./ids";
import { MAX_XP_PER_MINT, QUEST_TYPES } from "./constants";

/**
 * `get_daily_quest_state` branches on `type` with an IF/ELSIF chain and no final
 * ELSE, so an unknown type computes `v_current = 0` and silently never awards.
 * It also compares `v_current >= v_target` with no guard, so `targetValue: 0`
 * completes every day and mints free XP. Sanity's `required().min(1)` never runs
 * on programmatic writes. This schema is the only gate.
 */
export const Quest = z.object({
  id: QuestId,
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(QUEST_TYPES),
  icon: z.string().optional(),
  xpReward: z.number().int().min(1).max(MAX_XP_PER_MINT),
  targetValue: z.number().int().min(1),
  // NOTE: get_daily_quest_state assigns v_reset_type (schema.sql:34) but NEVER
  // reads it — v_period is set by other branches — so this field currently has
  // no behavioural effect. It is kept because the DailyQuest type and the RPC
  // signature carry it; wiring or dropping it is a Supabase+app change tracked
  // as a bug (spec §14.13), not a content-schema change.
  resetType: z.enum(["daily", "multi_day"]),
  active: z.boolean().default(true),
});

export type QuestT = z.infer<typeof Quest>;
```

`packages/content-schema/src/path.ts`:

```ts
import { z } from "zod";
import { CourseId, PathId } from "./ids";
import { DIFFICULTIES } from "./constants";

/**
 * `path-infrastructure` and `path-security` are live today with zero courses and
 * render as empty shelves. A path is either populated or explicitly a draft.
 */
export const LearningPath = z
  .object({
    id: PathId,
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    description: z.string().optional(),
    tag: z.string().optional(),
    order: z.number().int().min(0).default(0),
    difficulty: z.enum(DIFFICULTIES),
    draft: z.boolean().default(false),
    courses: z.array(CourseId).default([]),
  })
  .refine((p) => p.draft || p.courses.length >= 1, {
    message: "a non-draft learning path must contain at least one course",
    path: ["courses"],
  });

export type LearningPathT = z.infer<typeof LearningPath>;
```

`packages/content-schema/src/instructor.ts`:

```ts
import { z } from "zod";
import { InstructorId } from "./ids";

export const Instructor = z.object({
  id: InstructorId,
  name: z.string().min(1),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  socialLinks: z
    .object({ twitter: z.string().optional(), github: z.string().optional() })
    .default({}),
});

export type InstructorT = z.infer<typeof Instructor>;
```

Append to `src/index.ts`:

```ts
export * from "./achievement";
export * from "./quest";
export * from "./path";
export * from "./instructor";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @superteam-lms/content-schema test && pnpm --filter @superteam-lms/content-schema typecheck`
Expected: PASS — 15 new tests; `tsc` exits 0.

- [ ] **Step 5: Commit**

```bash
git add packages/content-schema/src/achievement.ts packages/content-schema/src/quest.ts \
        packages/content-schema/src/path.ts packages/content-schema/src/instructor.ts \
        packages/content-schema/src/__tests__/achievement.test.ts \
        packages/content-schema/src/__tests__/quest.test.ts \
        packages/content-schema/src/index.ts
git commit -m "feat(content-schema): declarative award kinds, quest/path/instructor schemas"
```

---

### Task 10: `slots.lock.json`

**Files:**
- Create: `packages/content-schema/src/slots.ts`
- Modify: `packages/content-schema/src/index.ts`
- Test: `packages/content-schema/src/__tests__/slots.test.ts`

**Interfaces:**
- Consumes: `LessonId`, `MAX_LESSON_SLOTS`.
- Produces: `SlotsLock`, `SlotsLockT`, `assignSlots(existing, lessonIds): SlotsLockT`.

A slot is a permanent on-chain bitmap position, distinct from display order. Never renumbered, never reused.

- [ ] **Step 1: Write the failing test**

`packages/content-schema/src/__tests__/slots.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { SlotsLock, assignSlots } from "../slots";

const lock = {
  version: 1,
  slots: { "lesson-a": 0, "lesson-b": 1 },
  retired: [] as number[],
  next: 2,
};

describe("SlotsLock", () => {
  it("accepts a well-formed lockfile", () => {
    expect(SlotsLock.parse(lock).next).toBe(2);
  });

  it("rejects a duplicate slot number", () => {
    expect(SlotsLock.safeParse({ ...lock, slots: { "lesson-a": 0, "lesson-b": 0 } }).success).toBe(false);
  });

  it("rejects a live slot that is also retired", () => {
    expect(SlotsLock.safeParse({ ...lock, retired: [1] }).success).toBe(false);
  });

  it("rejects next <= any assigned or retired slot", () => {
    expect(SlotsLock.safeParse({ ...lock, next: 1 }).success).toBe(false);
  });

  it("rejects a slot beyond the on-chain bitmap", () => {
    expect(SlotsLock.safeParse({
      version: 1, slots: { "lesson-a": 256 }, retired: [], next: 257,
    }).success).toBe(false);
  });
});

describe("assignSlots", () => {
  it("assigns dense slots from live order on first run", () => {
    const out = assignSlots(null, ["lesson-a", "lesson-b", "lesson-c"]);
    expect(out.slots).toEqual({ "lesson-a": 0, "lesson-b": 1, "lesson-c": 2 });
    expect(out.next).toBe(3);
  });

  it("never renumbers an existing lesson when the order changes", () => {
    const out = assignSlots(lock, ["lesson-b", "lesson-a"]);
    expect(out.slots).toEqual({ "lesson-a": 0, "lesson-b": 1 });
  });

  it("appends a new lesson at next, and advances next", () => {
    const out = assignSlots(lock, ["lesson-a", "lesson-c", "lesson-b"]);
    expect(out.slots["lesson-c"]).toBe(2);
    expect(out.next).toBe(3);
  });

  it("retires a removed lesson's slot and never reuses it", () => {
    const out = assignSlots(lock, ["lesson-a"]);
    expect(out.slots).toEqual({ "lesson-a": 0 });
    expect(out.retired).toEqual([1]);
    const after = assignSlots(out, ["lesson-a", "lesson-d"]);
    expect(after.slots["lesson-d"]).toBe(2); // NOT 1
  });

  it("throws when the course exceeds the bitmap", () => {
    const ids = Array.from({ length: 257 }, (_, i) => `lesson-l${i}`);
    expect(() => assignSlots(null, ids)).toThrow(/at most 256/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/slots.test.ts`
Expected: FAIL — `Cannot find module '../slots'`.

- [ ] **Step 3: Implement `src/slots.ts`**

```ts
import { z } from "zod";
import { MAX_LESSON_SLOTS } from "./constants";
import { LessonId } from "./ids";

/**
 * A slot is a permanent on-chain bitmap position, decoupled from display order.
 * Assigned once, never renumbered, never reused. This is what makes reordering,
 * regrouping, inserting and deleting lessons safe for enrolled learners.
 *
 * Machine-owned: `pnpm content:slots` regenerates it and CI fails on a diff.
 */
const Slot = z.number().int().min(0).max(MAX_LESSON_SLOTS - 1);

export const SlotsLock = z
  .object({
    version: z.literal(1),
    slots: z.record(LessonId, Slot),
    retired: z.array(Slot).default([]),
    next: z.number().int().min(0).max(MAX_LESSON_SLOTS),
  })
  .refine((l) => {
    const used = Object.values(l.slots);
    return new Set(used).size === used.length;
  }, { message: "a slot may be assigned to only one lesson", path: ["slots"] })
  .refine((l) => {
    const live = new Set(Object.values(l.slots));
    return l.retired.every((r) => !live.has(r));
  }, { message: "a retired slot cannot also be live", path: ["retired"] })
  .refine((l) => {
    const all = [...Object.values(l.slots), ...l.retired];
    return all.every((s) => s < l.next);
  }, { message: "next must exceed every assigned and retired slot", path: ["next"] });

export type SlotsLockT = z.infer<typeof SlotsLock>;

/**
 * Reconcile a lockfile against the course's current lesson list.
 *
 * MIGRATION NOTE: on first run for an already-deployed course, `lessonIds` MUST
 * be the course's LIVE flattened `modules[].lessons[]` order. Existing
 * `Enrollment.lesson_flags` bits were set by array position and the enrollments
 * survive migration (spec §15.3).
 */
export function assignSlots(
  existing: SlotsLockT | null,
  lessonIds: readonly string[],
): SlotsLockT {
  if (lessonIds.length > MAX_LESSON_SLOTS) {
    throw new Error(`a course may hold at most ${MAX_LESSON_SLOTS} lessons`);
  }

  const prev = existing ?? { version: 1 as const, slots: {}, retired: [], next: 0 };
  const slots: Record<string, number> = {};
  let next = prev.next;

  for (const id of lessonIds) {
    const kept = prev.slots[id];
    if (kept !== undefined) {
      slots[id] = kept;
    } else {
      if (next >= MAX_LESSON_SLOTS) {
        throw new Error(`slot space exhausted: a course may hold at most ${MAX_LESSON_SLOTS} lessons`);
      }
      slots[id] = next;
      next += 1;
    }
  }

  const live = new Set(lessonIds);
  const newlyRetired = Object.entries(prev.slots)
    .filter(([id]) => !live.has(id))
    .map(([, slot]) => slot);

  const retired = [...new Set([...prev.retired, ...newlyRetired])].sort((a, b) => a - b);

  return SlotsLock.parse({ version: 1, slots, retired, next });
}
```

Append to `src/index.ts`:

```ts
export * from "./slots";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/slots.test.ts`
Expected: PASS — 10 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-schema/src/slots.ts \
        packages/content-schema/src/__tests__/slots.test.ts \
        packages/content-schema/src/index.ts
git commit -m "feat(content-schema): append-only slot lockfile, decoupled from display order"
```

---

### Task 11: JSON Schema generation

**Files:**
- Create: `packages/content-schema/scripts/generate-json-schema.ts`
- Test: `packages/content-schema/src/__tests__/json-schema.test.ts`

**Interfaces:**
- Consumes: `Course`, `Lesson`, `QuizBlock`, `Achievement`, `Quest`, `LearningPath`, `Instructor`, `SlotsLock`.
- Produces: `SCHEMA_TARGETS: Record<string, ZodType>` and files under `packages/content-schema/schema/`.

Consumed by `academy-courses` for in-editor validation (spec §12), and by the docs generator (spec §16.2).

- [ ] **Step 1: Write the failing test**

`packages/content-schema/src/__tests__/json-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { SCHEMA_TARGETS } from "../../scripts/generate-json-schema";

describe("JSON Schema generation", () => {
  it("covers every authored file type", () => {
    expect(Object.keys(SCHEMA_TARGETS).sort()).toEqual(
      ["achievement", "course", "instructor", "lesson", "path", "quest", "quiz", "slots"].sort(),
    );
  });

  it("emits a valid draft schema for every target", () => {
    for (const [name, schema] of Object.entries(SCHEMA_TARGETS)) {
      const json = z.toJSONSchema(schema, { io: "input" }) as Record<string, unknown>;
      expect(json.$schema, `${name} has no $schema`).toBeTruthy();
    }
  });

  it("expresses the lesson block union so editors can autocomplete `type`", () => {
    const json = JSON.stringify(z.toJSONSchema(SCHEMA_TARGETS.lesson!, { io: "input" }));
    expect(json).toContain('"prose"');
    expect(json).toContain('"deployed-program-card"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/json-schema.test.ts`
Expected: FAIL — `Cannot find module '../../scripts/generate-json-schema'`.

- [ ] **Step 3: Implement `scripts/generate-json-schema.ts`**

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { Course } from "../src/course";
import { Lesson } from "../src/lesson";
import { QuizBlock } from "../src/blocks/quiz";
import { Achievement } from "../src/achievement";
import { Quest } from "../src/quest";
import { LearningPath } from "../src/path";
import { Instructor } from "../src/instructor";
import { SlotsLock } from "../src/slots";

/** One entry per file kind an author writes (or a tool generates). */
export const SCHEMA_TARGETS = {
  course: Course,
  lesson: Lesson,
  quiz: QuizBlock,
  achievement: Achievement,
  quest: Quest,
  path: LearningPath,
  instructor: Instructor,
  slots: SlotsLock,
} as const;

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = join(here, "..", "schema");
  mkdirSync(outDir, { recursive: true });

  for (const [name, schema] of Object.entries(SCHEMA_TARGETS)) {
    // `io: "input"` so defaults show as optional — an author has not typed them yet.
    const json = z.toJSONSchema(schema, { io: "input" });
    const file = join(outDir, `${name}.schema.json`);
    writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
    console.log(`wrote ${file}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
```

- [ ] **Step 4: Run the test, then generate and inspect**

Run: `pnpm --filter @superteam-lms/content-schema test src/__tests__/json-schema.test.ts`
Expected: PASS — 3 tests.

Run: `pnpm --filter @superteam-lms/content-schema schema:generate`
Expected: eight `wrote …/schema/<name>.schema.json` lines.

Run: `node -e "const s=require('./packages/content-schema/schema/lesson.schema.json'); console.log(JSON.stringify(s).includes('deployed-program-card'))"`
Expected: `true`

- [ ] **Step 5: Commit**

```bash
git add packages/content-schema/scripts packages/content-schema/schema \
        packages/content-schema/src/__tests__/json-schema.test.ts
git commit -m "feat(content-schema): emit JSON Schema for editor autocomplete"
```

---

### Task 12: Full suite, typecheck, and wire into turbo

**Files:**
- Modify: `packages/content-schema/package.json` (no change expected — verify)
- Test: the whole suite

- [ ] **Step 1: Run the full suite**

Run: `pnpm --filter @superteam-lms/content-schema test`
Expected: PASS — all tests across 10 files, ~85 assertions.

- [ ] **Step 2: Typecheck the package under strict mode**

Run: `pnpm --filter @superteam-lms/content-schema typecheck`
Expected: exit 0. `noUncheckedIndexedAccess` is on, so any `BLOCK_REGISTRY[t]` access must be provably total — it is, because `t: BlockType`.

- [ ] **Step 3: Verify turbo picks the package up**

Run: `pnpm typecheck`
Expected: turbo runs `typecheck` for `@superteam-lms/content-schema` alongside the existing packages, exit 0.

- [ ] **Step 4: Verify the registry is exhaustive by breaking it**

Temporarily add `podcast: { graded: false, required: false },` to `BLOCK_REGISTRY` and run `pnpm --filter @superteam-lms/content-schema typecheck`.
Expected: FAIL — `Object literal may only specify known properties, and 'podcast' does not exist in type 'Record<BlockType, BlockMeta>'`.

Then delete the `podcast` line and remove a real entry (e.g. `video`).
Expected: FAIL — `Property 'video' is missing in type … but required in type 'Record<BlockType, BlockMeta>'`.

Restore the file. This step proves the `satisfies` guard works in both directions; it produces no commit.

- [ ] **Step 5: Commit**

```bash
git add packages/content-schema
git commit -m "chore(content-schema): full suite green under strict typecheck"
```

---

## Self-Review

**Spec coverage.** §4.3 course → Task 8. §4.4 lesson + blocks + graded/required → Tasks 3–8. §4.5 quiz → Task 5. §4.6 slots → Task 10. §4.7 identity → Task 2. §4.9 capability keys, code-block fields, `program.idl.json` → Tasks 3, 4, 6. §4.10 award kinds → Task 9. §6.2 gates 2 (id caps), 7 (quiz), 8–11 (quest/achievement enums and caps), 13 (path draft) → Tasks 2, 5, 9. §16.2 JSON Schema → Task 11.

**Deliberately out of scope** (each has an owning plan): gates 1, 3–6 and 12–13c need the filesystem, git, or the executors — Plan 2. §4.8 `creator.githubId` → *resolution* is Plan 8; the *schema* is Task 8. Cross-lesson capability ordering (§4.9's CI invariant) needs the whole course tree — Plan 2. `PREDICATES satisfies Record<AwardKind, Predicate>` — Plan 7.

**Placeholder scan.** No `TBD`, no "add validation", no "similar to Task N". Every code step carries complete code.

**Type consistency.** `Block`/`BlockT`/`BlockType` used identically in Tasks 7, 8. `BLOCK_REGISTRY` keys match the eight union members in Task 7's test and implementation. `AWARD_KINDS` is `satisfies readonly AwardKind[]`, so it cannot drift from `Award`. `SlotsLockT` returned by `assignSlots` is the same type `SlotsLock` parses. `relativePath()` is defined once in `blocks/base.ts` and used by `prose`, `code`, `program-explorer`.

**Zod v4 API assumptions, all verified against 4.4.3 before writing.** `discriminatedUnion` over a `.refine()`d member parses and still enforces the refinement; `z.url()` exists; `z.record()` takes two arguments; `z.enum()` accepts a readonly tuple; `.default()` is applied before `.refine()` runs; `z.toJSONSchema(schema, { io: "input" })` emits `$schema` + `oneOf` over a refined union without throwing; `.array().nonempty()` exists. No step rests on an unverified API.

**One amendment.** Amendment A hoists widgets to first-class block types, diverging from spec §4.9 and gate 13b. It must be reflected back into the spec after Task 9.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-09-content-schema-package.md`. Two execution options:

**1. Subagent-Driven (recommended)** — a fresh subagent per task, reviewed between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.
