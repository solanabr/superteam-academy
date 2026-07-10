# Sanity Schema v2 (CS-5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reshape the Sanity schemas and read layer to the block model (spec §10): a lesson becomes an ordered `blocks[]` page-builder array, `module` stops being a document and becomes an inline object, inter-managed references go weak, the authoring-workflow fields disappear, the Studio goes read-only, the answer-key machinery is deleted, and the lesson GROQ collapses to one literal projection.

**Architecture:** Eight first-class Sanity object types (one per block type, Amendment A) are registered in a single `blocks/index.ts` registry array that a lesson's `blocks[]` field spreads into `of`. Their fields mirror the `@superteam-lms/content-schema` (CS-1) Zod shapes 1:1 by field name; because Sanity is the *projection/read* store, content-bearing fields hold the CS-9-**resolved** value (markdown / code / IDL JSON / a `testCase[]` array) rather than the repo's relative path. Modules become an inline `courseModule` object on the course. Every managed document carries a `sync: { source, rev }` prune marker. The lesson read path becomes one literal `blocks[]{ ... }` projection — no per-`_type` conditional stripping — because post-D4 no block holds a secret and no block holds a reference.

**Tech Stack:** Sanity v3 (`sanity`, `@sanity/client`, `@sanity/vision`), `next-sanity`, `sanity schema extract` + `sanity typegen`, TypeScript 5.7 strict, vitest 4.

## Global Constraints

- **This PR does not touch live Sanity data.** It changes schema *definitions* and the read layer only. The document reshape (module docs → inline, `lesson.type` → blocks, resolving paths to content) is performed by the **CS-9 repo→Sanity sync**, not by this change (spec §9.1, §15.4 Phase 5 vs Phase 7).
- **Field names must not start with `_`** — reserved for Sanity system fields (spec §9.4). The prune marker is therefore `sync`, never `_syncRev`.
- **`block.key` maps to the Sanity array item `_key`** (spec §4.4). Block object types carry **no** `key` field; the projection reads `"key": _key`. Likewise the lesson `_id` *is* the lesson id (`lesson-accounts`) — no separate `id` field.
- **Projection resolution (Sanity holds resolved content, not repo paths).** CS-1 stores `prose.src` / `code.starter` / `code.solution` / `code.tests` / `program-explorer.idl` as relative file paths. The CS-9 sync resolves each and writes the resolved value into the same-named Sanity field: `src`/`starter`/`solution`/`idl` become text, `tests` becomes a `testCase[]` array (the resolved content of `tests.json`). Field *names* mirror CS-1 1:1; the Sanity *type* is what the sync writes and what the app/grader reads (spec §9.6, §10.2).
- **Everything is open-book (D4).** No block holds a secret. The `code` block's `solution` and `tests` are public — the grader reads them from the same public projection every reader gets (spec §4.5, §10.2). The `testCase` object has **no `hidden` field**.
- **Studio validation is advisory; CS-1 Zod is authoritative.** The Studio is read-only (§10.4) and all writes go through the CS-9 sync, which re-validates the whole tree with `@superteam-lms/content-schema`. Sanity-side `validation()` rules are light guards for the (rare) direct admin mutation, not the source of truth — do not attempt to reproduce every Zod cross-field refinement in Sanity.
- **Managed document types** (carry the `sync` marker, are pruned by the sync): `course`, `lesson`, `instructor`, `learningPath`, `achievement`, `quest`. `courseTag` is managed-adjacent (issue #322 vocabulary) and out of scope here.
- **PRESERVE list** (spec §9.3): `course.onChainStatus` and `achievement.onChainStatus` are Sanity-owned and survive re-sync. This plan keeps both fields exactly as they are today.
- **Capability keys** are the closed set `["funded-wallet", "deployed-program"]`, mirroring CS-1 `CAPABILITY_KEYS`.
- **Two Studio configs** exist and must stay in lockstep: `apps/web/sanity.config.ts` (embedded `/studio`) and `sanity/sanity.config.ts` (standalone). Schemas are shared via `@superteam-lms/sanity/schemas`.
- Conventional commits; the branch is docs+schema+read-layer only. Run `sanity schema extract` from the `sanity/` workspace and `sanity typegen generate` after every schema task.

## Scope, sequencing, and the Phase 5 / Phase 6 boundary

Spec §15.4 splits the migration: **Phase 5 = Sanity schema** (blocks; module→inline; weak refs; drop authoringStatus/author/reviewFeedback; read-only Studio) and **Phase 6 = App** (block registry in the completion gate; declarative achievements; the two quest-GROQ rewrites; the grader reading from the public projection). CS-5 owns Phase 5 **plus** the two read-layer items the issue explicitly assigns to it: the **GROQ collapse** and the **answer-key-machinery deletion** (Tasks 6–7 here).

Consequence — the one cross-phase coupling, stated up front: deleting `getChallengeAnswerKey` / `getChallengeAnswerKeyById` / `ChallengeAnswerKey` removes exports consumed by the Phase-6 grader (`apps/web/src/lib/challenge/validate.ts`, `api/lessons/validate-challenge/route.ts`, `api/lessons/complete/route.ts`, and the challenge executor tests). Those consumers switch to reading the `code` block's `solution`/`tests` from the public projection (spec §10.2) — **that rewire is Phase 6 (the App/grader issue) and must land together with Task 7** for `pnpm --filter web typecheck` to pass. Task 7 performs the *deletion and the GROQ collapse*; it *names* the coupled Phase-6 consumer change and does not implement the grader engine, the completion-gate inversion, the declarative-achievement predicates, or the lesson renderer (all Phase 6). The lesson-render component migration (`lesson-client.tsx`, `challenge-interface.tsx`) and the `packages/types` `Lesson`/`Course` reshape are likewise Phase 6; CS-5 leaves those return-type annotations untouched so the projection-string edits alone do not break the web typecheck.

## File Structure

```
sanity/
├── sanity-typegen.json                    new  — typegen config (schema.json + web query glob → sanity.types.ts)
├── package.json                           mod  — add extract-schema + typegen scripts
├── sanity.config.ts                       mod  — read-only Studio (document.actions/newDocumentOptions)
└── schemas/
    ├── index.ts                           mod  — register block/object types; drop moduleSchema; keep 7 docs
    ├── module.ts                          DEL  — module stops being a document (spec §10.1)
    ├── course.ts                          mod  — inline modules, weak instructor/prereq, +creator, +sync, −authoring fields
    ├── lesson.ts                          mod  — rewrite to ordered blocks[]; +sync
    ├── instructor.ts                      mod  — +sync
    ├── learningPath.ts                    mod  — weak courses[]; +sync
    ├── achievement.ts                     mod  — +sync
    ├── quest.ts                           mod  — +sync
    ├── objects/
    │   ├── syncField.ts                   new  — shared sync marker field (defineField)
    │   ├── courseModule.ts                new  — inline module object (weak lesson refs)
    │   └── testCase.ts                    new  — testCase object (no `hidden`, post-D4)
    └── blocks/
        ├── _shared.ts                     new  — capabilityFields (produces/consumes)
        ├── prose.ts                       new
        ├── video.ts                       new
        ├── code.ts                        new
        ├── quiz.ts                        new  — quiz block + quizQuestion + quizOption objects
        ├── openEnded.ts                   new
        ├── widgets.ts                     new  — wallet-funding, program-explorer, deployed-program-card
        └── index.ts                       new  — blockTypes[] + BLOCK_MEMBERS registry

apps/web/
├── sanity.config.ts                       mod  — read-only Studio (mirror of standalone)
└── src/lib/sanity/
    ├── queries.ts                         mod  — collapse lesson projection; inline-module GROQ; quest rewrite; DELETE answer-key fns
    └── __tests__/
        ├── queries-answer-leak.test.ts    DEL  — no secret to leak post-D4 (spec §10.2)
        └── queries-block-projection.test.ts  new — asserts the single blocks[] projection shape
```

---

### Task 1: Typegen tooling — schema extract + `sanity typegen`

**Files:**
- Create: `sanity/sanity-typegen.json`
- Modify: `sanity/package.json`

**Interfaces:**
- Consumes: the existing `sanity/sanity.config.ts` workspace `superteam-lms`.
- Produces: `pnpm --filter @superteam-lms/sanity run extract-schema` → `sanity/schema.json`; `pnpm --filter @superteam-lms/sanity run typegen` → `apps/web/src/lib/sanity/sanity.types.ts`. These are the per-task verification harness for every schema task that follows.

Typegen is not wired today. Set it up first so subsequent tasks can prove "schema compiles" (`extract`) and "types are clean" (`typegen`). `typegen` reads the extracted `schema.json` and scans the web query files, so it types the GROQ collapse in Task 7 as a discriminated union over `_type`.

- [ ] **Step 1: Baseline — capture that extract works on today's schema**

Run: `cd sanity && pnpm exec sanity schema extract --path schema.json`
Expected: `Extracted schema to ./schema.json` (current 8 doc/object types). This is the pre-change baseline; it proves the harness runs before any schema edit.

- [ ] **Step 2: Add the scripts**

Modify `sanity/package.json` `scripts`:

```json
  "scripts": {
    "dev": "sanity dev",
    "build": "sanity build",
    "deploy": "sanity deploy",
    "typecheck": "tsc --noEmit",
    "extract-schema": "sanity schema extract --path schema.json",
    "typegen": "sanity typegen generate"
  },
```

- [ ] **Step 3: Add the typegen config**

`sanity/sanity-typegen.json`:

```json
{
  "path": "../apps/web/src/lib/sanity/**/*.{ts,tsx}",
  "schema": "schema.json",
  "generates": "../apps/web/src/lib/sanity/sanity.types.ts"
}
```

`schema` is the extracted schema; `path` scans the web query layer so `sanity typegen` types each GROQ string against the schema; `generates` writes the typed output beside the queries.

- [ ] **Step 4: Prove the harness end to end**

Run: `pnpm --filter @superteam-lms/sanity run extract-schema && pnpm --filter @superteam-lms/sanity run typegen`
Expected: `schema.json` regenerates; typegen prints a per-query summary and writes `apps/web/src/lib/sanity/sanity.types.ts` with no `Unable to resolve` errors against today's schema.

- [ ] **Step 5: Commit**

```bash
git add sanity/package.json sanity/sanity-typegen.json sanity/schema.json apps/web/src/lib/sanity/sanity.types.ts
git commit -m "chore(sanity): wire sanity schema extract + typegen harness"
```

---

### Task 2: Block object schemas + the registry

**Files:**
- Create: `sanity/schemas/blocks/_shared.ts`
- Create: `sanity/schemas/blocks/prose.ts`, `video.ts`, `code.ts`, `quiz.ts`, `openEnded.ts`, `widgets.ts`
- Create: `sanity/schemas/objects/testCase.ts`
- Create: `sanity/schemas/blocks/index.ts`
- Modify: `sanity/schemas/index.ts`

**Interfaces:**
- Consumes: nothing (leaf schemas).
- Produces: `capabilityFields`, `proseBlock`, `videoBlock`, `codeBlock`, `quizBlock` (+ `quizQuestion`, `quizOption`), `openEndedBlock`, `walletFundingBlock`, `programExplorerBlock`, `deployedProgramCardBlock`, `testCase`, and the registry `blockTypes` / `BLOCK_MEMBERS`. `BLOCK_MEMBERS` is what Task 3's lesson `blocks[]` spreads into `of`.

Each block's `name` **is** its `_type` and the renderer-registry key (Amendment A). Object types carry no `key` field — `_key` is the block key.

- [ ] **Step 1: Write the shared capability fields**

`sanity/schemas/blocks/_shared.ts`:

```ts
import { defineField } from "sanity";

/** Mirrors content-schema CAPABILITY_KEYS. Closed set. */
export const CAPABILITY_KEYS = ["funded-wallet", "deployed-program"] as const;

const capabilityList = CAPABILITY_KEYS.map((value) => ({ title: value, value }));

/**
 * Shared block fields — mirror content-schema `blockBase` (produces?, consumes?).
 * Spread into each block's `fields`. Cross-block ordering (`consumes` must be
 * preceded by a `produces`) is a repo-side CI invariant (CS-1/CS-2), NOT a Sanity
 * rule: Studio is read-only, so these are informational here.
 */
export const capabilityFields = [
  defineField({
    name: "produces",
    title: "Produces capability",
    type: "string",
    options: { list: capabilityList },
  }),
  defineField({
    name: "consumes",
    title: "Consumes capabilities",
    type: "array",
    of: [{ type: "string" }],
    options: { list: capabilityList },
  }),
];
```

- [ ] **Step 2: Write the `testCase` object (no `hidden`, post-D4)**

`sanity/schemas/objects/testCase.ts`:

```ts
import { defineField, defineType } from "sanity";

/**
 * A single graded case. Mirrors content-schema `TestCase`. Post-D4 (open book)
 * there is NO `hidden` flag — every test is public, served in the same projection
 * the grader reads. The old `hidden` boolean and the `tests[hidden != true]`
 * stripping it forced are both deleted (spec §10.2).
 */
export const testCase = defineType({
  name: "testCase",
  title: "Test Case",
  type: "object",
  fields: [
    defineField({ name: "id", title: "Test ID", type: "string", validation: (r) => r.required() }),
    defineField({ name: "description", title: "Description", type: "string", validation: (r) => r.required() }),
    defineField({ name: "input", title: "Input", type: "text", rows: 3 }),
    defineField({ name: "expectedOutput", title: "Expected Output", type: "text", rows: 3 }),
  ],
  preview: { select: { title: "description", subtitle: "id" } },
});
```

- [ ] **Step 3: Write the prose and video blocks**

`sanity/schemas/blocks/prose.ts`:

```ts
import { defineField, defineType } from "sanity";
import { capabilityFields } from "./_shared";

/** Mirrors content-schema ProseBlock. `src` is a `.md` path in academy-courses;
 *  the CS-9 sync resolves it to the rendered markdown body written here. */
export const proseBlock = defineType({
  name: "prose",
  title: "Prose",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({
      name: "src",
      title: "Markdown",
      type: "text",
      rows: 20,
      description: "Resolved markdown body (CS-9 resolves ProseBlock.src → content).",
      validation: (r) => r.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Prose" }) },
});
```

`sanity/schemas/blocks/video.ts`:

```ts
import { defineField, defineType } from "sanity";
import { capabilityFields } from "./_shared";

/** Mirrors content-schema VideoBlock. YouTube/Vimeo, https only;
 *  lesson-client `getEmbedUrl` resolves the embed. */
export const videoBlock = defineType({
  name: "video",
  title: "Video",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({
      name: "url",
      title: "Video URL",
      type: "url",
      validation: (r) => r.required().uri({ scheme: ["https"], allowRelative: false }),
    }),
  ],
  preview: { select: { subtitle: "url" }, prepare: ({ subtitle }) => ({ title: "Video", subtitle }) },
});
```

- [ ] **Step 4: Write the code block**

`sanity/schemas/blocks/code.ts`:

```ts
import { defineField, defineType } from "sanity";
import { capabilityFields } from "./_shared";

/**
 * Mirrors content-schema CodeBlock. `starter`/`solution` are `.ts`/`.rs` paths in
 * academy-courses; CS-9 resolves them to code text here. `tests` is a `.json` path
 * resolved to a `testCase[]` array. `solution` and `tests` are PUBLIC (D4) — the
 * grader reads them from this same projection (spec §10.2).
 */
export const codeBlock = defineType({
  name: "code",
  title: "Code Exercise",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      options: {
        list: [
          { title: "TypeScript", value: "typescript" },
          { title: "Rust", value: "rust" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "buildType",
      title: "Build Type",
      type: "string",
      description: "standard runs in the isolate/Playground; buildable compiles via the Anchor build server (requires language rust).",
      options: {
        list: [
          { title: "Standard (isolate/Playground)", value: "standard" },
          { title: "Buildable (build server)", value: "buildable" },
        ],
        layout: "radio",
      },
      initialValue: "standard",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "deployable",
      title: "Deployable",
      type: "boolean",
      description: "Show 'Deploy to Devnet' after a successful build (requires buildType buildable).",
      initialValue: false,
    }),
    defineField({ name: "starter", title: "Starter Code", type: "text", rows: 15, validation: (r) => r.required() }),
    defineField({
      name: "solution",
      title: "Solution Code",
      type: "text",
      rows: 15,
      description: "PUBLIC post-D4. The code grader reads this from the same public projection every reader gets.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tests",
      title: "Test Cases",
      type: "array",
      of: [{ type: "testCase" }],
      validation: (r) => r.required().min(1),
    }),
    defineField({ name: "hints", title: "Hints", type: "array", of: [{ type: "text", rows: 3 }] }),
  ],
  preview: { select: { subtitle: "language" }, prepare: ({ subtitle }) => ({ title: "Code Exercise", subtitle }) },
});
```

- [ ] **Step 5: Write the quiz block (+ question/option objects)**

`sanity/schemas/blocks/quiz.ts`:

```ts
import { defineField, defineType } from "sanity";
import { capabilityFields } from "./_shared";

/** Mirrors content-schema QuizOption. Correctness keyed on a stable `id`. */
export const quizOption = defineType({
  name: "quizOption",
  title: "Option",
  type: "object",
  fields: [
    defineField({ name: "id", title: "Option ID", type: "string", validation: (r) => r.required() }),
    defineField({ name: "label", title: "Label", type: "string", validation: (r) => r.required() }),
    defineField({ name: "correct", title: "Correct", type: "boolean", initialValue: false }),
    defineField({ name: "feedback", title: "Per-option feedback", type: "text", rows: 2 }),
  ],
  preview: {
    select: { title: "label", correct: "correct" },
    prepare: ({ title, correct }) => ({ title, subtitle: correct ? "correct" : undefined }),
  },
});

/** Mirrors content-schema QuizQuestion. `multiSelect` → correctness is a SET. */
export const quizQuestion = defineType({
  name: "quizQuestion",
  title: "Question",
  type: "object",
  fields: [
    defineField({ name: "id", title: "Question ID", type: "string", validation: (r) => r.required() }),
    defineField({ name: "prompt", title: "Prompt", type: "text", rows: 2, validation: (r) => r.required() }),
    defineField({ name: "multiSelect", title: "Multi-select", type: "boolean", initialValue: false }),
    defineField({
      name: "options",
      title: "Options",
      type: "array",
      of: [{ type: "quizOption" }],
      validation: (r) => r.required().min(2),
    }),
    defineField({ name: "explanation", title: "Explanation", type: "text", rows: 2 }),
  ],
  preview: { select: { title: "prompt" } },
});

/** Mirrors content-schema QuizBlock. Cross-field invariants (exactly-one-correct,
 *  unique ids) are enforced authoritatively by CS-1 Zod at sync time. */
export const quizBlock = defineType({
  name: "quiz",
  title: "Quiz",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({
      name: "questions",
      title: "Questions",
      type: "array",
      of: [{ type: "quizQuestion" }],
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: { select: { questions: "questions" }, prepare: ({ questions }) => ({ title: "Quiz", subtitle: `${(questions as unknown[] | undefined)?.length ?? 0} questions` }) },
});
```

- [ ] **Step 6: Write the openEnded and widget blocks**

`sanity/schemas/blocks/openEnded.ts`:

```ts
import { defineField, defineType } from "sanity";
import { capabilityFields } from "./_shared";

/** Mirrors content-schema OpenEndedBlock. One learner message, one AI reply,
 *  feedback only — never graded, never mints XP (spec §8). */
export const openEndedBlock = defineType({
  name: "openEnded",
  title: "Open-Ended Reflection",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({ name: "prompt", title: "Prompt", type: "text", rows: 3, validation: (r) => r.required() }),
    defineField({
      name: "maxWords",
      title: "Max words",
      type: "number",
      initialValue: 200,
      description: "Bounds one Gemini call.",
      validation: (r) => r.min(20).max(500),
    }),
  ],
  preview: { select: { subtitle: "prompt" }, prepare: ({ subtitle }) => ({ title: "Reflection", subtitle }) },
});
```

`sanity/schemas/blocks/widgets.ts`:

```ts
import { defineField, defineType } from "sanity";
import { capabilityFields } from "./_shared";

/**
 * Amendment A: each widget is its own block type, so the `_type` IS the
 * renderer-registry key. Mirrors content-schema WalletFundingBlock /
 * ProgramExplorerBlock / DeployedProgramCardBlock.
 */

export const walletFundingBlock = defineType({
  name: "wallet-funding",
  title: "Wallet Funding",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({
      name: "amount",
      title: "SOL amount",
      type: "number",
      initialValue: 2,
      description: "Hardcoded to 2 in wallet-funding-card.tsx today.",
      validation: (r) => r.positive().max(5),
    }),
    defineField({
      name: "network",
      title: "Network",
      type: "string",
      initialValue: "devnet",
      options: { list: [{ title: "Devnet", value: "devnet" }] },
      validation: (r) => r.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Wallet Funding" }) },
});

export const programExplorerBlock = defineType({
  name: "program-explorer",
  title: "Program Explorer",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({
      name: "idl",
      title: "Program IDL (JSON)",
      type: "text",
      rows: 20,
      description: "Mirrors ProgramExplorerBlock.idl (a .json path); CS-9 resolves it to the IDL JSON string. Must contain a non-empty `instructions` array and `metadata.name` (the keypair-storage key generic-program-explorer.tsx looks for).",
      validation: (r) =>
        r.required().custom((value) => {
          if (typeof value !== "string") return "IDL is required";
          try {
            const parsed = JSON.parse(value) as { instructions?: unknown; metadata?: { name?: unknown } };
            if (!Array.isArray(parsed.instructions) || parsed.instructions.length === 0) {
              return "IDL must contain a non-empty 'instructions' array";
            }
            if (!parsed.metadata?.name) return "IDL must contain 'metadata.name'";
            return true;
          } catch {
            return "Invalid JSON";
          }
        }),
    }),
  ],
  preview: { prepare: () => ({ title: "Program Explorer" }) },
});

export const deployedProgramCardBlock = defineType({
  name: "deployed-program-card",
  title: "Deployed Program Card",
  type: "object",
  fields: [...capabilityFields],
  preview: { prepare: () => ({ title: "Deployed Program Card" }) },
});
```

- [ ] **Step 7: Write the registry and register everything**

`sanity/schemas/blocks/index.ts`:

```ts
import { proseBlock } from "./prose";
import { videoBlock } from "./video";
import { codeBlock } from "./code";
import { quizBlock } from "./quiz";
import { openEndedBlock } from "./openEnded";
import { walletFundingBlock, programExplorerBlock, deployedProgramCardBlock } from "./widgets";

/**
 * The eight first-class block object types (Amendment A). Adding a block type
 * touches exactly this array plus a new file — a lesson's `blocks[]` spreads
 * BLOCK_MEMBERS into `of`, so no container edit is needed (spec §7.3).
 */
export const blockTypes = [
  proseBlock,
  videoBlock,
  codeBlock,
  quizBlock,
  openEndedBlock,
  walletFundingBlock,
  programExplorerBlock,
  deployedProgramCardBlock,
];

/** `of` members for the lesson `blocks[]` array — each block type by name. */
export const BLOCK_MEMBERS = blockTypes.map((t) => ({ type: t.name }));
```

Modify `sanity/schemas/index.ts` (register block/object types now; lesson still references them in Task 3 — registering early is harmless and lets `extract` compile the union):

```ts
import { course } from "./course";
import { moduleSchema } from "./module";
import { lesson } from "./lesson";
import { instructor } from "./instructor";
import { learningPath } from "./learningPath";
import { achievement } from "./achievement";
import { quest } from "./quest";
import { courseTag } from "./courseTag";
import { testCase } from "./objects/testCase";
import { quizOption, quizQuestion } from "./blocks/quiz";
import { blockTypes } from "./blocks";

export const schemaTypes = [
  // documents
  course,
  moduleSchema,
  lesson,
  instructor,
  learningPath,
  achievement,
  quest,
  courseTag,
  // shared objects
  testCase,
  quizOption,
  quizQuestion,
  // block object types (registry)
  ...blockTypes,
];
```

- [ ] **Step 8: Verify — schema compiles and types are clean**

Run: `pnpm --filter @superteam-lms/sanity run extract-schema && pnpm --filter @superteam-lms/sanity run typegen`
Expected: `schema.json` now lists `prose`, `video`, `code`, `quiz`, `openEnded`, `wallet-funding`, `program-explorer`, `deployed-program-card`, `testCase`, `quizOption`, `quizQuestion`. Typegen exits 0.

Run: `node -e "const s=require('./sanity/schema.json'); const names=s.map(t=>t.name); console.log(['prose','video','code','quiz','openEnded','wallet-funding','program-explorer','deployed-program-card'].every(n=>names.includes(n)))"`
Expected: `true`.

- [ ] **Step 9: Commit**

```bash
git add sanity/schemas/blocks sanity/schemas/objects/testCase.ts sanity/schemas/index.ts sanity/schema.json apps/web/src/lib/sanity/sanity.types.ts
git commit -m "feat(sanity): block object types + registry (prose/video/code/quiz/openEnded + 3 widgets)"
```

---

### Task 3: Lesson document → ordered `blocks[]`

**Files:**
- Modify: `sanity/schemas/lesson.ts`

**Interfaces:**
- Consumes: `BLOCK_MEMBERS` from `./blocks`.
- Produces: a `lesson` document whose only content field is `blocks[]`. All of `type`, `language`, `buildType`, `deployable`, `widgets`, `programIdl`, `videoUrl`, `content`, `code`, `tests`, `hints`, `solution`, `order` are **removed** — each moves into a block.

`sync` is added in Task 5 (batched with the other managed docs). Display order of a lesson within a module is its position in `module.lessons[]`, so the lesson-level `order` field is gone.

- [ ] **Step 1: Rewrite `sanity/schemas/lesson.ts`**

```ts
import { defineField, defineType } from "sanity";
import { BLOCK_MEMBERS } from "./blocks";

/**
 * A lesson is the atomic completable unit (one bit of the on-chain bitmap). Its
 * content is an ordered `blocks[]` page-builder array (spec §4.4, §10). The
 * lesson `_id` IS the lesson id (`lesson-accounts`) — no separate `id` field.
 * `block.key` is the array item `_key`. There is no lesson-level `type`,
 * `language`, `content`, `code`, `tests`, `solution`, `widgets` or `order`; each
 * moved into a block. `sync` is added in the sync-marker task.
 */
export const lesson = defineType({
  name: "lesson",
  title: "Lesson",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "blocks",
      title: "Blocks",
      type: "array",
      of: BLOCK_MEMBERS,
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: {
    select: { title: "title", blocks: "blocks" },
    prepare: ({ title, blocks }) => ({ title, subtitle: `${(blocks as unknown[] | undefined)?.length ?? 0} blocks` }),
  },
});
```

- [ ] **Step 2: Verify — schema compiles; lesson.blocks is a typed union**

Run: `pnpm --filter @superteam-lms/sanity run extract-schema && pnpm --filter @superteam-lms/sanity run typegen`
Expected: exit 0. In `sanity/schema.json`, the `lesson` type's `blocks` field is an array whose `of` lists all eight block `_type`s; `type`/`content`/`code`/`tests` no longer appear on `lesson`.

Run: `node -e "const s=require('./sanity/schema.json'); const l=s.find(t=>t.name==='lesson'); const f=l.fields.map(x=>x.name); console.log(JSON.stringify(f)); console.log(!f.includes('type') && !f.includes('content') && f.includes('blocks'))"`
Expected: `["title","slug","blocks"]` then `true`.

- [ ] **Step 3: Commit**

```bash
git add sanity/schemas/lesson.ts sanity/schema.json apps/web/src/lib/sanity/sanity.types.ts
git commit -m "feat(sanity): lesson document is an ordered blocks[] page builder"
```

---

### Task 4: Inline module object + course rewrite; delete the `module` document

**Files:**
- Create: `sanity/schemas/objects/courseModule.ts`
- Delete: `sanity/schemas/module.ts`
- Modify: `sanity/schemas/course.ts`
- Modify: `sanity/schemas/index.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `courseModule` inline object (weak `lessons[]` refs); a `course` document with `modules: courseModule[]`, weak `instructor` and weak `prerequisiteCourse`, a new `creator` object, and **without** `author`, `authoringStatus`, `reviewFeedback`. `onChainStatus` is untouched (PRESERVE). `sync` is added in Task 5.

Modules are inline objects — never reused across courses (spec §10.1). Display order = array position, so `courseModule` has no `order` field.

**Coupling note (PR #367 review finding).** A live feature is built on the three dropped
fields: the teacher course builder + admin review queue (`api/teacher/courses/**`,
`api/admin/courses/review/route.ts`, `lib/sanity/admin-mutations.ts` + `teacher-mutations.ts`,
`components/admin/course-review-queue.tsx`, `components/teacher/course-form.tsx`, and
`packages/types/src/course.ts`'s `author`/`authoringStatus`/`reviewFeedback`). These use raw
GROQ/mutations, not the generated schema types, so this task's typecheck will NOT catch them —
they keep writing fields the schema no longer declares. **Intentional**: spec D1/§10.1 retires
the `/teach` authoring surface and CS-10 (Phase 8) deletes the feature; until then it is
degraded-but-harmless (writes fields Studio no longer shows; Sanity accepts undeclared fields
on mutation writes). Do NOT rewire it in this plan. Same root cause: `publicAuthoringGate`
(`lib/sanity/queries.ts:14`) becomes a permanent no-op once `authoringStatus` stops being set —
tolerated by its own `!defined()` arm, removed in CS-10 with the feature.

- [ ] **Step 1: Write the inline module object**

`sanity/schemas/objects/courseModule.ts`:

```ts
import { defineField, defineType } from "sanity";

/**
 * Inline module object on the course (spec §10.1) — replaces the standalone
 * `module` document. Mirrors content-schema CourseModule (`key`, `title`,
 * `description?`, `lessons[]`). Display order is the array position, so there is
 * no `order` field. Lesson refs are WEAK (spec §9.5): a rebuildable projection
 * cannot delete a lesson with an incoming strong ref, and a dangling `->`
 * dereferences to null, which the projection already tolerates.
 */
export const courseModule = defineType({
  name: "courseModule",
  title: "Module",
  type: "object",
  fields: [
    defineField({
      name: "key",
      title: "Module key",
      type: "string",
      description: "Stable, unique within the course. Mirrors CourseModule.key.",
      validation: (r) => r.required(),
    }),
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
    defineField({
      name: "lessons",
      title: "Lessons",
      type: "array",
      of: [{ type: "reference", to: [{ type: "lesson" }], weak: true }],
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: {
    select: { title: "title", lessons: "lessons" },
    prepare: ({ title, lessons }) => ({ title, subtitle: `${(lessons as unknown[] | undefined)?.length ?? 0} lessons` }),
  },
});
```

- [ ] **Step 2: Rewrite `sanity/schemas/course.ts`**

```ts
import { defineField, defineType } from "sanity";

/**
 * Course document. Modules are inline `courseModule` objects (spec §10.1).
 * `instructor` and `prerequisiteCourse` are WEAK references (spec §9.5 — the same
 * rationale that makes lesson refs weak extends to every inter-managed reference,
 * so pruning never deadlocks). `author`, `authoringStatus`, `reviewFeedback` are
 * gone — the repo is the workflow now (spec §10.1); `creator.githubId` replaces
 * `author`. `onChainStatus` is Sanity-owned and PRESERVEd across sync (§9.3);
 * `sync` (the prune marker) is added in the sync-marker task.
 */
export const course = defineType({
  name: "course",
  title: "Course",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "description", title: "Description", type: "text", rows: 4 }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: {
        list: [
          { title: "Beginner", value: "beginner" },
          { title: "Intermediate", value: "intermediate" },
          { title: "Advanced", value: "advanced" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: "duration", title: "Duration (hours)", type: "number", validation: (r) => r.required().min(0) }),
    defineField({ name: "thumbnail", title: "Thumbnail", type: "image", options: { hotspot: true } }),
    defineField({
      name: "instructor",
      title: "Instructor",
      type: "reference",
      to: [{ type: "instructor" }],
      weak: true,
    }),
    defineField({ name: "tags", title: "Tags", type: "array", of: [{ type: "string" }], options: { layout: "tags" } }),
    defineField({ name: "xpReward", title: "XP Reward", type: "number", initialValue: 500, validation: (r) => r.required().min(0) }),
    defineField({
      name: "modules",
      title: "Modules",
      type: "array",
      of: [{ type: "courseModule" }],
    }),
    defineField({ name: "xpPerLesson", title: "XP per Lesson", type: "number", initialValue: 10, validation: (r) => r.required().min(1).max(100) }),
    defineField({ name: "trackId", title: "Track ID", type: "number", initialValue: 0, description: "Numeric learning track identifier (0 = default track)." }),
    defineField({ name: "trackLevel", title: "Track Level", type: "number", initialValue: 0, description: "Position within the track (0 = first)." }),
    defineField({
      name: "prerequisiteCourse",
      title: "Prerequisite Course",
      type: "reference",
      to: [{ type: "course" }],
      weak: true,
      description: "Students must complete this course before enrolling.",
    }),
    defineField({ name: "creatorRewardXp", title: "Creator Reward XP", type: "number", initialValue: 0, description: "XP awarded to the course creator once min completions threshold is reached." }),
    defineField({ name: "minCompletionsForReward", title: "Min Completions for Creator Reward", type: "number", initialValue: 0, description: "Student completions required before creator reward is paid. 0 = never." }),
    defineField({
      name: "creator",
      title: "Creator",
      type: "object",
      description: "Resolved at CS-9 sync: creator.githubId → profiles.wallet_address → Course.creator on-chain. Replaces the removed `author` field.",
      fields: [
        defineField({
          name: "githubId",
          title: "GitHub numeric user id",
          type: "string",
          validation: (r) => r.regex(/^\d+$/, { name: "numeric github id" }),
        }),
      ],
    }),
    defineField({
      name: "onChainStatus",
      title: "On-Chain Status",
      type: "object",
      readOnly: true,
      hidden: ({ currentUser }) => !currentUser?.roles?.some((role) => role.name === "administrator"),
      description: "Managed by the admin dashboard / on-chain sync (PRESERVE list). Do not edit manually.",
      fields: [
        defineField({ name: "status", title: "Status", type: "string" }),
        defineField({
          name: "isActive",
          title: "Active",
          type: "boolean",
          description: "Mirrors the on-chain is_active flag. Legacy courses without this field are treated as active.",
        }),
        defineField({ name: "coursePda", title: "Course PDA", type: "string" }),
        defineField({ name: "trackCollectionAddress", title: "Track Collection Address", type: "string", description: "Metaplex Core collection pubkey for this course's credential NFTs." }),
        defineField({ name: "lastSynced", title: "Last Synced", type: "datetime" }),
        defineField({ name: "txSignature", title: "Tx Signature", type: "string" }),
      ],
    }),
  ],
  preview: { select: { title: "title", subtitle: "difficulty", media: "thumbnail" } },
});
```

- [ ] **Step 3: Delete the `module` document and update the schema index**

```bash
git rm sanity/schemas/module.ts
```

Modify `sanity/schemas/index.ts` — drop the `moduleSchema` import and array entry, add `courseModule`:

```ts
import { course } from "./course";
import { lesson } from "./lesson";
import { instructor } from "./instructor";
import { learningPath } from "./learningPath";
import { achievement } from "./achievement";
import { quest } from "./quest";
import { courseTag } from "./courseTag";
import { courseModule } from "./objects/courseModule";
import { testCase } from "./objects/testCase";
import { quizOption, quizQuestion } from "./blocks/quiz";
import { blockTypes } from "./blocks";

export const schemaTypes = [
  // documents
  course,
  lesson,
  instructor,
  learningPath,
  achievement,
  quest,
  courseTag,
  // shared objects
  courseModule,
  testCase,
  quizOption,
  quizQuestion,
  // block object types (registry)
  ...blockTypes,
];
```

- [ ] **Step 4: Verify — module doc gone; course carries inline modules + creator; authoring fields gone**

Run: `pnpm --filter @superteam-lms/sanity run extract-schema && pnpm --filter @superteam-lms/sanity run typegen`
Expected: exit 0.

Run: `node -e "const s=require('./sanity/schema.json'); console.log('module doc present:', s.some(t=>t.name==='module' && t.type==='document')); const c=s.find(t=>t.name==='course'); const f=c.fields.map(x=>x.name); console.log('has creator:', f.includes('creator')); console.log('author/authoringStatus/reviewFeedback gone:', !f.includes('author') && !f.includes('authoringStatus') && !f.includes('reviewFeedback'))"`
Expected: `module doc present: false`, `has creator: true`, `...gone: true`.

- [ ] **Step 5: Commit**

```bash
git add sanity/schemas/course.ts sanity/schemas/objects/courseModule.ts sanity/schemas/index.ts sanity/schema.json apps/web/src/lib/sanity/sanity.types.ts
git rm sanity/schemas/module.ts
git commit -m "feat(sanity): inline module object; course weak refs + creator; delete module doc + authoring fields"
```

---

### Task 5: `sync` prune marker + remaining weak references across managed docs

**Files:**
- Create: `sanity/schemas/objects/syncField.ts`
- Modify: `sanity/schemas/course.ts`, `lesson.ts`, `instructor.ts`, `learningPath.ts`, `achievement.ts`, `quest.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a shared `syncField` (`defineField`, `sync: { source, rev }`) added to all six managed document types; `learningPath.courses[]` becomes weak.

`sync` is the prune marker (spec §9.4): `*[sync.source == "academy-courses" && sync.rev != $sha]`. Field names may not start with `_`. It is Sanity-owned (`readOnly`), not a repo-projected field, so it is not in the PRESERVE-vs-projected CI equality — it is the sync's own bookkeeping, written last.

- [ ] **Step 1: Write the shared sync field**

`sanity/schemas/objects/syncField.ts`:

```ts
import { defineField } from "sanity";

/**
 * Prune marker for the CS-9 repo→Sanity sync (spec §9.4). Every managed document
 * carries it; prune is `*[sync.source == "academy-courses" && sync.rev != $sha]`.
 * Field name is `sync`, NOT `_syncRev` — leading underscores are reserved for
 * Sanity system fields. Sanity-owned/read-only; the sync writes it last.
 */
export const syncField = defineField({
  name: "sync",
  title: "Sync marker",
  type: "object",
  readOnly: true,
  hidden: ({ currentUser }) => !currentUser?.roles?.some((role) => role.name === "administrator"),
  description: "Managed by the content sync. Do not edit manually.",
  fields: [
    defineField({ name: "source", title: "Source", type: "string" }),
    defineField({ name: "rev", title: "Rev (git SHA)", type: "string" }),
  ],
});
```

- [ ] **Step 2: Add `syncField` to every managed document**

In each of `course.ts`, `lesson.ts`, `instructor.ts`, `learningPath.ts`, `achievement.ts`, `quest.ts`: add `import { syncField } from "./objects/syncField";` and append `syncField` as the **last** entry of the `fields` array.

For example, `sanity/schemas/instructor.ts` becomes:

```ts
import { defineField, defineType } from "sanity";
import { syncField } from "./objects/syncField";

export const instructor = defineType({
  name: "instructor",
  title: "Instructor",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "avatar", title: "Avatar", type: "image", options: { hotspot: true } }),
    defineField({ name: "bio", title: "Bio", type: "text", rows: 4 }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "object",
      fields: [
        defineField({ name: "twitter", title: "Twitter", type: "string" }),
        defineField({ name: "github", title: "GitHub", type: "string" }),
      ],
    }),
    syncField,
  ],
  preview: { select: { title: "name", media: "avatar" } },
});
```

Apply the identical pattern — `import { syncField }` + `syncField` as the final `fields` entry — to `course.ts` (after `onChainStatus`), `lesson.ts` (after `blocks`), `achievement.ts` (after `onChainStatus`), and `quest.ts` (after `active`).

- [ ] **Step 3: Make `learningPath.courses[]` weak and add `syncField`**

`sanity/schemas/learningPath.ts` — change the `courses` field's `of` to a weak reference and append `syncField`:

```ts
import { defineField, defineType } from "sanity";
import { syncField } from "./objects/syncField";

export const learningPath = defineType({
  name: "learningPath",
  title: "Learning Path",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: "description", title: "Description", type: "text", rows: 4 }),
    defineField({ name: "tag", title: "Tag", type: "string", description: "Short descriptor shown alongside the title (e.g. 'Foundation', 'Builder')" }),
    defineField({ name: "order", title: "Display Order", type: "number", description: "Controls display order on the courses page (lower = first)", validation: (r) => r.integer().min(0) }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      options: {
        list: [
          { title: "Beginner", value: "beginner" },
          { title: "Intermediate", value: "intermediate" },
          { title: "Advanced", value: "advanced" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "courses",
      title: "Courses",
      type: "array",
      of: [{ type: "reference", to: [{ type: "course" }], weak: true }],
    }),
    syncField,
  ],
  preview: { select: { title: "title", subtitle: "difficulty" } },
});
```

- [ ] **Step 4: Verify — every managed doc has `sync`; no `_`-prefixed field; path courses weak**

Run: `pnpm --filter @superteam-lms/sanity run extract-schema && pnpm --filter @superteam-lms/sanity run typegen`
Expected: exit 0.

Run: `node -e "const s=require('./sanity/schema.json'); const managed=['course','lesson','instructor','learningPath','achievement','quest']; console.log('all have sync:', managed.every(n=>s.find(t=>t.name===n).fields.some(f=>f.name==='sync'))); console.log('no underscore fields:', s.filter(t=>t.type==='document').every(t=>t.fields.every(f=>!f.name.startsWith('_'))))"`
Expected: `all have sync: true`, `no underscore fields: true`.

- [ ] **Step 5: Commit**

```bash
git add sanity/schemas/objects/syncField.ts sanity/schemas/course.ts sanity/schemas/lesson.ts sanity/schemas/instructor.ts sanity/schemas/learningPath.ts sanity/schemas/achievement.ts sanity/schemas/quest.ts sanity/schema.json apps/web/src/lib/sanity/sanity.types.ts
git commit -m "feat(sanity): sync prune marker on managed docs; weak learningPath.courses"
```

---

### Task 6: Read-only Studio (both configs)

**Files:**
- Modify: `sanity/sanity.config.ts`
- Modify: `apps/web/sanity.config.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: both Studio workspaces expose no document actions and no "new document" templates.

Strip `document.actions` and `document.newDocumentOptions` (spec §10.4). **This is UI dressing, not a security boundary** — real enforcement is the project role (every human is a **Viewer** in `sanity.io/manage`; `SANITY_ADMIN_TOKEN` stays server-side, held only by the sync job and `admin-mutations.ts`). That role change is **ops, not schema**, and is out of scope for this PR — note it in the PR body.

- [ ] **Step 1: Make the standalone Studio read-only**

`sanity/sanity.config.ts`:

```ts
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";

export default defineConfig({
  name: "superteam-lms",
  title: "Superteam LMS",

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "placeholder",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  // Read-only Studio (spec §10.4). All writes go through the CS-9 sync. UI
  // dressing only — Viewer roles in sanity.io/manage are the real boundary (ops).
  document: {
    actions: () => [],
    newDocumentOptions: () => [],
  },
});
```

- [ ] **Step 2: Mirror it in the embedded Studio**

`apps/web/sanity.config.ts` — add the same `document` block:

```ts
"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "@superteam-lms/sanity/schemas";

export default defineConfig({
  name: "superteam-lms",
  title: "Superteam LMS",

  basePath: "/studio",

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  // Read-only Studio (spec §10.4) — mirror of the standalone config.
  document: {
    actions: () => [],
    newDocumentOptions: () => [],
  },
});
```

- [ ] **Step 3: Verify — configs typecheck**

Run: `pnpm --filter @superteam-lms/sanity run typecheck && pnpm --filter web typecheck`
Expected: exit 0 for both. (`document.actions`/`newDocumentOptions` returning `[]` are valid `DocumentActionsResolver` / `NewDocumentOptionsResolver` signatures.)

- [ ] **Step 4: Commit**

```bash
git add sanity/sanity.config.ts apps/web/sanity.config.ts
git commit -m "feat(sanity): read-only Studio (strip document actions + newDocumentOptions)"
```

---

### Task 7: GROQ collapse, answer-key deletion, and quest coupling rewrite

**Files:**
- Modify: `apps/web/src/lib/sanity/queries.ts`
- Create: `apps/web/src/lib/sanity/__tests__/queries-block-projection.test.ts`
- Delete: `apps/web/src/lib/sanity/__tests__/queries-answer-leak.test.ts`

**Interfaces:**
- Consumes: the block-shaped schema from Tasks 2–5.
- Produces: a single shared `lessonFields` block projection; catalog/lesson/detail queries reprojected onto inline modules (`modules[].lessons[]->`) and blocks; `getAllQuests` rewritten per §15.4a. **Deleted:** `getChallengeAnswerKey`, `getChallengeAnswerKeyById`, `answerKeyProjection`, and the `ChallengeAnswerKey` interface.

> **Cross-phase coupling (read this first).** Deleting the answer-key exports breaks their Phase-6 consumers — `apps/web/src/lib/challenge/validate.ts` (imports the `ChallengeAnswerKey` type), `api/lessons/validate-challenge/route.ts`, `api/lessons/complete/route.ts`, and `lib/challenge/__tests__/{executor,rust-executor}.test.ts`. Those switch to reading the `code` block's `solution`/`tests` from the public projection (spec §10.2). **That rewire is the App/grader issue (spec §15.4 Phase 6) and must land in the same PR train as this task** so `pnpm --filter web typecheck` passes. This task performs the deletion + GROQ collapse and *names* the coupled change; it does not implement the grader engine, the completion-gate inversion, the declarative-achievement predicates, or the lesson renderer.

- [ ] **Step 1: Write the failing projection-shape test**

`apps/web/src/lib/sanity/__tests__/queries-block-projection.test.ts`:

```ts
/* eslint-disable import/order -- vi.mock must precede importing ../queries. */
import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn();

vi.mock("../client", () => ({
  sanityFetch: (query: string, params?: unknown, revalidate?: number, tags?: string[]) =>
    fetchMock(query, params, revalidate, tags),
}));

import * as queries from "../queries";
import { getLessonBySlug, getCourseBySlug } from "../queries";

function flatten(q: string): string {
  return q.replace(/\s+/g, " ");
}
function capturedQuery(i: number): string {
  const call = fetchMock.mock.calls[i];
  if (!call) throw new Error(`sanityFetch not called ${i + 1}x`);
  return call[0] as string;
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(null);
});

describe("CS-5: lesson read path is one literal blocks[] projection", () => {
  it("projects blocks[] with _type and _key and the code block's public solution/tests", async () => {
    await getLessonBySlug("course-x", "lesson-y");
    const q = flatten(capturedQuery(0));
    // The projection is a single literal blocks[] — no per-_type conditional.
    expect(q).toContain("blocks[]{");
    expect(q).toContain("_type");
    expect(q).toContain('"key": _key');
    // Post-D4 the code grader reads solution + tests from this same public projection.
    expect(q).toContain("solution");
    expect(q).toContain("tests[]{");
    // The old hidden-stripping is gone: no `hidden` predicate anywhere.
    expect(q).not.toContain("hidden");
  });

  it("reads inline modules, not module-document dereferences", async () => {
    await getCourseBySlug("course-x");
    const q = flatten(capturedQuery(0));
    // Inline modules: modules[].lessons[]-> , never modules[]->lessons[]-> .
    expect(q).not.toContain("modules[]->");
    expect(q).toContain("modules[]{");
  });

  it("no longer exports the deleted answer-key surface", () => {
    expect("getChallengeAnswerKey" in queries).toBe(false);
    expect("getChallengeAnswerKeyById" in queries).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter web test src/lib/sanity/__tests__/queries-block-projection.test.ts`
Expected: FAIL — the projection still uses `modules[]->` and `tests[hidden != true]`, and the answer-key functions still exist.

- [ ] **Step 3: Add the shared block projection and reproject the lesson/catalog queries**

In `apps/web/src/lib/sanity/queries.ts`, replace `moduleWithLessonsFields` (and its P0-C4 comment) with a single literal block projection. Because no block holds a secret or a reference (D4), one projection serves every reader:

```ts
// One literal lesson projection (spec §10.2). Post-D4 no block holds a secret and
// no block holds a reference, so there is no per-_type conditional stripping — the
// `code` grader reads `solution`/`tests` from the same public projection everyone
// gets. `block.key` is the array item `_key`. `sanity typegen` types `blocks[]` as
// a discriminated union over `_type`.
const lessonFields = `
  _id,
  title,
  "slug": slug.current,
  blocks[]{
    "key": _key,
    _type,
    produces,
    consumes,
    src,
    url,
    language,
    buildType,
    deployable,
    starter,
    solution,
    tests[]{ id, description, input, expectedOutput },
    hints,
    prompt,
    maxWords,
    amount,
    network,
    idl
  }
`;

// Inline modules (spec §10.1): array position is display order, so no
// `| order(order asc)`; lesson refs are weak, dereferenced with `lessons[]->`.
const moduleWithLessonsFields = `
  key,
  title,
  description,
  "lessons": lessons[]->{
    ${lessonFields}
  }
`;
```

Update the catalog/detail/lesson queries to inline modules and the block projection:

- `getAllCourses` and `getAllLearningPaths` — replace each `"modules": modules[]->{ ... lessons ... } | order(order asc)` block with a lightweight inline-module projection (list view needs only lesson id/title/slug, not blocks):

```groq
      "modules": modules[]{
        key,
        title,
        description,
        "lessons": lessons[]->{
          _id,
          title,
          "slug": slug.current
        }
      }
```

- `getCourseBySlug` and `getCourseById` — replace `"modules": modules[]->{ ${moduleWithLessonsFields} } | order(order asc)` with `"modules": modules[]{ ${moduleWithLessonsFields} }`.

- `getLessonBySlug` — replace the whole inline lesson selection with the shared projection over inline modules, and drop the P0-C4 comment:

```ts
export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
): Promise<Lesson | null> {
  return catalogFetch<Lesson | null>(
    `*[_type == "course" && slug.current == $courseSlug && onChainStatus.status == "synced" && ${activeGate} && ${publicAuthoringGate}][0] {
      "allLessons": modules[].lessons[]->{
        ${lessonFields}
      }
    }.allLessons[slug == $lessonSlug][0]`,
    { courseSlug, lessonSlug }
  );
}
```

- `getCourseLessons` — the flat lesson list no longer has a lesson-level `type` (it moved to blocks). Reproject over inline modules and drop `type`:

```ts
export async function getCourseLessons(
  courseSlug: string
): Promise<Pick<Lesson, "_id" | "title" | "slug">[]> {
  return catalogFetch<Pick<Lesson, "_id" | "title" | "slug">[]>(
    `*[_type == "course" && slug.current == $courseSlug && onChainStatus.status == "synced" && ${activeGate} && ${publicAuthoringGate}][0] {
      "lessons": modules[].lessons[]-> {
        _id,
        title,
        "slug": slug.current
      }
    }.lessons`,
    { courseSlug }
  );
}
```

- Every `count(modules[]->lessons[])` becomes `count(modules[].lessons[])` — in `getCoursesByIds`, `getRecommendedCourses`, `getAllCourseTags`, `getAllCourseLessonCounts`, and `getAllCoursesAdmin` (`"lessonCount": count(modules[].lessons[])`).

> **Note on lesson-list `type`.** `getAllCourses`/`getCourseLessons`/etc. dropped the lesson-level `type` field (it is gone from the schema). Consumers that branched on `lesson.type` ("content" vs "challenge") derive it from blocks in Phase 6 (`count(blocks[_type == "code"]) > 0`). The `Lesson`/`Module`/`Course` return-type annotations are **not** changed here — the `packages/types` reshape is Phase 6 — so these projection-string edits alone keep `pnpm --filter web typecheck` green.

- [ ] **Step 4: Delete the answer-key machinery**

Remove from `queries.ts`, in full: the `ChallengeAnswerKey` interface, the `answerKeyProjection` constant, and the `getChallengeAnswerKey` and `getChallengeAnswerKeyById` functions (with their doc comments). Remove the now-unused `AdminTestCase` import if nothing else references it.

Delete the regression test that guarded the removed secret:

```bash
git rm apps/web/src/lib/sanity/__tests__/queries-answer-leak.test.ts
```

Safe because there is no longer a secret to leak: post-D4 the reference `solution` and full `tests` are public in the repo and served in the same projection everyone gets (spec §4.5, §10.2). The test asserted a projection *omitted* `solution`/`hidden`; that omission is no longer a security property, so the test is obsolete rather than newly-failing.

- [ ] **Step 5: Rewrite the two quest GROQ couplings (§15.4a)**

In `getAllQuests`, both inputs break under the block model and degrade **silently** to empty arrays. Rewrite them:

```ts
    `{
      "quests": *[_type == "quest" && active == true && !(_id in path("drafts.**"))] {
        _id, name, description, type, icon, xpReward, targetValue, resetType
      },
      "challengeLessonIds": *[_type == "lesson" && count(blocks[_type == "code"]) > 0]._id,
      "moduleLessonMap": *[_type == "course" && !(_id in path("drafts.**"))].modules[]{
        "_id": ^._id + ":" + key,
        "lessonIds": lessons[]->_id
      }
    }`
```

- `challengeLessonIds`: `lesson.type` is deleted; a challenge lesson is one with a graded `code` block — `count(blocks[_type == "code"]) > 0`.
- `moduleLessonMap`: `module` documents are gone; rebuild the map from each course's inline `modules[]`, giving each a stable composite id `courseId:moduleKey`. The existing TS mapping (`m._id` → `id`, filter empty `lessonIds`) is unchanged in shape, so `QuestData`/`SanityQuest` and callers keep compiling.

> **Verification obligation carried to Phase 6 (spec §15.4a):** after the CS-9 data reshape, assert each of the 5 live quests has non-degenerate inputs (`challengeLessonIds` non-empty, `moduleLessonMap` non-empty) before declaring the quest surface done — a silent `0/N` is invisible in happy-path tests.

- [ ] **Step 6: Run the projection test to verify it passes**

Run: `pnpm --filter web test src/lib/sanity/__tests__/queries-block-projection.test.ts`
Expected: PASS — 3 tests. The projection is one literal `blocks[]{...}` with `_type`/`_key`/`solution`/`tests`, no `hidden`, inline modules, and no answer-key exports.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/sanity/queries.ts apps/web/src/lib/sanity/__tests__/queries-block-projection.test.ts
git rm apps/web/src/lib/sanity/__tests__/queries-answer-leak.test.ts
git commit -m "feat(sanity): collapse lesson GROQ to blocks[]; delete answer-key machinery; rewrite quest couplings"
```

---

## Verification

Run after all tasks (from the repo root unless noted):

1. **Schema compiles.** `pnpm --filter @superteam-lms/sanity run extract-schema` → regenerates `sanity/schema.json` with no error. The extracted schema lists 6 managed documents + `courseTag`, the inline `courseModule`/`testCase`/`quizOption`/`quizQuestion` objects, and the 8 block types; it lists **no** `module` document.

2. **Types are clean.** `pnpm --filter @superteam-lms/sanity run typegen` exits 0 and writes `apps/web/src/lib/sanity/sanity.types.ts`; `lesson.blocks` types as a discriminated union over `_type`, and the block projection in `queries.ts` resolves without `Unable to resolve` warnings (spec §10.2: the collapse is "fully typed").

3. **Studio typechecks.** `pnpm --filter @superteam-lms/sanity run typecheck` and (for the embedded config + queries) `pnpm --filter web typecheck` exit 0. Note: `pnpm --filter web typecheck` is the **integration gate for the answer-key deletion** — it only passes once the coupled Phase-6 grader read-path change (Scope note above) lands with Task 7; the schema/Studio tasks (1–6) are independently green.

4. **Projection-shape test.** `pnpm --filter web test src/lib/sanity/__tests__/queries-block-projection.test.ts` passes.

5. **Answer-leak test deletion is safe.** `apps/web/src/lib/sanity/__tests__/queries-answer-leak.test.ts` is deleted, not skipped. It asserted the client projection *omitted* `solution` and hidden `tests`; post-D4 those are public by design (spec §4.5, §10.2) — there is no secret to leak, so the invariant it guarded no longer exists. No replacement assertion is owed; the new `queries-block-projection.test.ts` instead asserts the *presence* of `solution`/`tests` in the single public projection.

## Migration note

This PR changes **schema definitions and the read layer only**. It does not migrate a single live Sanity document. The data reshape — module documents → inline `courseModule` objects, `lesson.type`/`content`/`code`/`tests` → resolved `blocks[]`, `author` → `creator.githubId`, stamping every managed doc with `sync: { source, rev }`, and pruning orphans — is performed by the **CS-9 repo→Sanity sync** (spec §9, §15.4 Phase 7), which re-validates the whole tree with `@superteam-lms/content-schema` and writes with `createOrReplace` + the PRESERVE list + the sync-marker prune. Until CS-9 runs, the live dataset still has the old shape; the schema-v2 definition and the CS-9 sync are deployed together (spec §15.4: Phase 7 depends on Phases 1, 2, and 5). Existing enrollments and on-chain state are untouched by this PR.

## Self-Review

**Spec coverage.** §10.1 six document types / inline module → Task 4. §10.1 drop authoringStatus/author/reviewFeedback → Task 4. §4.4 lesson blocks[] → Tasks 2–3. §4.5 quiz (option id/multiSelect/feedback/explanation) → Task 2. §4.9 capability keys + widget config + program.idl → Task 2. §9.4 sync marker (no leading `_`) → Task 5. §9.5 weak references (instructor, module.lessons, + prerequisiteCourse, learningPath.courses) → Tasks 4–5. §10.2 GROQ collapse + answer-key deletion → Task 7. §10.4 read-only Studio → Task 6. §15.4a quest couplings → Task 7. §16.2/typegen → Task 1. The eight issue items map to: (1) blocks+lesson → T2/T3; (2) module inline + delete doc → T4; (3) weak refs → T4/T5; (4) drop authoring fields → T4; (5) read-only Studio → T6; (6) delete answer-key machinery → T7; (7) GROQ collapse → T7; (8) sync field → T5.

**Deliberately out of scope** (spec §15.4 Phase 6 / other CS issues, named so the executor does not attempt them): the completion-gate inversion and `GRADERS` registry; the grader reading blocks (`validate.ts` rewire) beyond *naming* it as Task 7's coupled change; declarative-achievement predicates; the UserState merge; the durable quest-XP path; the lesson renderer (`lesson-client.tsx`, `challenge-interface.tsx`); the `packages/types` `Lesson`/`Course` reshape; Viewer-role assignment in `sanity.io/manage` (ops); the CS-9 sync itself; and the teacher-authoring/admin-review feature built on `author`/`authoringStatus`/`reviewFeedback` (superseded by the repo workflow, deleted in CS-10 — see Task 4's coupling note).

**Placeholder scan.** No `TBD`, no "add validation", no "similar to Task N". Every schema/query step carries complete code.

**Type consistency.** `capabilityFields` is defined once in `blocks/_shared.ts` and spread into all eight blocks. `BLOCK_MEMBERS` (from `blocks/index.ts`) is the single `of` source for `lesson.blocks`. `testCase` is referenced by `code.tests`; `quizOption`/`quizQuestion` by `quiz`; `courseModule` by `course.modules`; `syncField` by all six managed docs. The `lessonFields` GROQ constant feeds `getLessonBySlug`, `getCourseBySlug`, `getCourseById` identically. Sanity object `name` values (`prose`, `code`, `wallet-funding`, …) match both the CS-1 block `type` literals and the `_type` the projection reads.
