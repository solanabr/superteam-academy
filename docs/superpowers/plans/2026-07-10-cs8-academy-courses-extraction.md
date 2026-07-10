# CS-8 Phase-1 Extraction — `academy-courses` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the LIVE Sanity dataset into the `academy-courses` content-standard tree, freezing each course's `slots.lock.json` from today's live lesson order so it exactly reproduces the on-chain `Enrollment.lesson_flags` bit positions of 6 real learner completions across 13 devnet enrollments — then validate the whole tree with the CS-2 linter and hand the push to a human.

**Architecture:** A one-shot, read-only extraction toolchain under `scripts/cs8-extraction/` (this monorepo) reads three authoritative sources — the public Sanity dataset (unauthenticated GROQ), David's Supabase `user_progress` (read-only SELECT via the `dbd5cdaf` MCP), and the 13 devnet Enrollment PDAs (Helius RPC) — transforms the old document model into the block model, and writes the tree into the local `~/Documents/STBR/academy-courses` checkout on a branch off `initial-scaffolding`. A **bit-verification gate** sits between slot generation and tree freeze: for every completion it asserts the generated slot equals the on-chain set bit; **any mismatch halts the lane and files a P0** (the CS-4 pattern). The lane ends at a local commit validated by `@superteam-lms/content-lint`; a human pushes to `solanabr/academy-courses` (`blocked:needs-human`).

**Tech Stack:** TypeScript (tsx), `yaml` v2 (1.2 core), `@superteam-lms/content-schema` (Zod), `@superteam-lms/content-lint` (CS-2 gates), `@superteam-lms/challenge-executor` (QuickJS grader, gate 6), `@coral-xyz/anchor` `BorshCoder` + `@solana/web3.js` (PDA reads), the `dbd5cdaf` Supabase MCP (read-only SQL), Vitest.

## Global Constraints

- **READ-ONLY on every live system.** No writes to Sanity, Supabase, or on-chain. The GROQ export is unauthenticated (public dataset, D4). The Supabase path is a `SELECT`-only MCP call. Enrollment PDAs are `getAccountInfo` reads. Emitting migration SQL is allowed; **applying it is not** (human-gated, SENSITIVE).
- **The push is `blocked:needs-human`.** The lane commits locally to the `~/Documents/STBR/academy-courses` checkout and files a hand-off issue. A human pushes to `solanabr/academy-courses` (this account has READ-only access — verified `gh repo view`).
- **Live Sanity source of truth is `4e3i2wwc` / `production`** — the post-July-2026-rebalance dataset (resolve verbatim from `apps/web/.env*`: `NEXT_PUBLIC_SANITY_PROJECT_ID=4e3i2wwc`, `NEXT_PUBLIC_SANITY_DATASET=production`). **Never read `sanity/seed/*.json` — it is stale (6 courses vs 8 live).**
- **Devnet program id `7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V`.** Read PDAs via the **Helius RPC** in `apps/web/.env.local` (`SOLANA_RPC_URL`), never the public `api.devnet.solana.com` (it silently corrupts large payloads; reads are lower-risk but stay on Helius for consistency).
- **Slots are frozen from LIVE flattened `modules[]->lessons[]->` order** sorted `order asc` (§15.3). `slots.lock.json` for a migrated course is generated **once**, must reproduce the historical bits, and is never renumbered thereafter.
- **The extracted tree MUST pass every CS-2 gate** (`pnpm --filter @superteam-lms/content-lint content-lint <path>`) and validate against `@superteam-lms/content-schema` Zod, matching the `_template/` layout on the `initial-scaffolding` branch exactly.
- **Byte caps:** course/achievement id ≤ 32 UTF-8 bytes; lesson/path/instructor/quest id ≤ 128; `MAX_XP_PER_MINT = 5000`; `MAX_LESSON_SLOTS = 256`; finalize invariant `xpPerLesson × liveLessonCount ≤ 10000`.
- **Ids are immutable seeds — never strip a prefix before use** (project rule). Raw Sanity `_id` values are the on-chain/Supabase keys; rewrites (§15.5) are explicit, tracked, and for solana-101 require a human-applied Supabase migration.

---

## Source-of-truth references (this plan operationalizes them)

- Spec `docs/superpowers/specs/2026-07-09-course-content-standard-design.md` §15.1–15.5 (migration), §4 (content standard), §6.2 (gates).
- Scaffolding: `~/Documents/STBR/academy-courses` branch `initial-scaffolding` (`_template/`, `schema/*.json`, `.github/workflows/validate.yml`).
- Linter fixtures: `packages/content-lint/src/__tests__/fixtures/good/`.
- Zod: `packages/content-schema/src/` (`slots.ts::assignSlots`, `ids.ts`, `constants.ts`, `blocks/`, `course.ts`, `lesson.ts`).
- Live bit-mapping the gate must mirror: `apps/web/src/lib/courses/lesson-index.ts::findLessonIndex` and `apps/web/src/lib/solana/bitmap.ts::{decodeLessonBitmap,isLessonComplete}`.
- Enrollment read: `apps/web/src/lib/solana/{pda.ts::findEnrollmentPDA,academy-reads.ts::fetchEnrollment}`; IDL `apps/web/src/lib/solana/idl/superteam_academy.json` (`Enrollment.lesson_flags: [u64;4]`, snake_case via raw `BorshCoder`).

### Live inventory (spec §15.1 — the fixed target)

| Course (on-chain `course_id` seed = Sanity `_id`) | lessons | enrolled | completed | xp/lesson |
|---|---|---|---|---|
| `aD45H1NEbb1bqELwloGCqI` (solana-101) | 3 | 1 | 1 | **100** |
| `course-anchor-framework` | 12 | 2 | 0 | 20 |
| `course-building-first-program` | 16 | 2 | 0 | 20 |
| `course-defi-on-solana` | 12 | 2 | 1 | 40 |
| `course-rust-for-solana` | 12 | 2 | 2 | 20 |
| `course-solana-frontend` | 12 | 2 | 1 | 20 |
| `course-solana-fundamentals` | 12 | 2 | 1 | 10 |
| **total** | | **13** | **6** | |

Deleted, not migrated (§15.5): draft courses `ops2aYkxIM6NMo1gE18U1o`, `xcvxcv-z1pie4` (no modules, no lessons). **These counts are the expectation, not a hardcode** — Task 2 re-derives them from the live export and Task 7 fails loudly if reality differs.

---

## File-structure map

Created in **this monorepo** (`~/Documents/STBR/superteam-academy`):

```
scripts/cs8-extraction/
├── package.json                 # name: cs8-extraction; deps below; scripts: extract, test
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── config.ts                # PROJECT_ID, DATASET, PROGRAM_ID, RPC resolution + expected inventory
│   ├── export-sanity.ts         # unauthenticated GROQ export → out/sanity-export.json
│   ├── flatten-order.ts         # flattenLiveOrder(courseDoc): string[]  (mirrors findLessonIndex)
│   ├── read-completions.ts      # the 6 user_progress rows (+ wallet) → out/completions.json
│   ├── read-enrollments.ts      # the 13 Enrollment PDAs → out/enrollments.json
│   ├── generate-slots.ts        # buildSlotsLock(courseId, liveOrder): SlotsLockT
│   ├── verify-bits.ts           # THE GATE: verifyCompletionBits(...) → throws BitMismatchError
│   ├── id-rewrites.ts           # §15.5 decisions + emits SENSITIVE migration SQL (not applied)
│   ├── transform.ts             # oldLessonDoc → NewLesson blocks + code files
│   ├── generate-tree.ts         # writes course.yaml / lessons / slots.lock.json / etc.
│   └── extract.ts               # orchestrator (export → flatten → read → slots → GATE → tree)
├── src/__tests__/
│   ├── flatten-order.test.ts
│   ├── generate-slots.test.ts
│   ├── verify-bits.test.ts      # pass fixture + deliberate-mismatch fixture (asserts halt)
│   ├── transform.test.ts
│   └── fixtures/*.json
└── out/                         # gitignored artifacts (export, completions, enrollments, migrations)
```

Written into the **`academy-courses` checkout** (`~/Documents/STBR/academy-courses`, branch `cs8-phase1-extraction` off `initial-scaffolding`):

```
courses/<slug>/course.yaml
courses/<slug>/slots.lock.json
courses/<slug>/lessons/<slug>/{lesson.yaml, intro.md, exercise/{starter,solution}.{ts|rs}, exercise/tests.json, program.idl.json}
achievements/<slug>.yaml   # + the 4 community achievements now live
quests/<slug>.yaml
paths/<slug>.yaml
instructors/<slug>.yaml
out/migrations/*.sql        # SENSITIVE, human-applied — NOT committed to academy-courses
```

**Package boundary:** `scripts/cs8-extraction` is a throwaway migration tool, not shipped. It depends on `@superteam-lms/content-schema` (for `assignSlots`, ids, types) and `@superteam-lms/content-lint` (invoked as CLI, not imported) so the frozen tree passes the exact gates CI will run.

---

## Task 1: Scaffold the extraction toolchain

**Files:**
- Create: `scripts/cs8-extraction/package.json`
- Create: `scripts/cs8-extraction/tsconfig.json`
- Create: `scripts/cs8-extraction/vitest.config.ts`
- Create: `scripts/cs8-extraction/.gitignore` (`out/`)
- Create: `scripts/cs8-extraction/src/config.ts`
- Test: `scripts/cs8-extraction/src/__tests__/config.test.ts`

**Interfaces:**
- Produces: `config.ts` exports `PROJECT_ID = "4e3i2wwc"`, `DATASET = "production"`, `PROGRAM_ID: string` (from `NEXT_PUBLIC_PROGRAM_ID`), `rpcUrl(): string` (from `SOLANA_RPC_URL`), `EXPECTED = { courses: 7, drafts: ["ops2aYkxIM6NMo1gE18U1o","xcvxcv-z1pie4"], enrollments: 13, completions: 6 }`, `SOLANA_101_ID = "aD45H1NEbb1bqELwloGCqI"`.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/cs8-extraction/src/__tests__/config.test.ts
import { describe, it, expect } from "vitest";
import { PROJECT_ID, DATASET, EXPECTED, SOLANA_101_ID } from "../config";

describe("config", () => {
  it("pins the live dataset and expected inventory", () => {
    expect(PROJECT_ID).toBe("4e3i2wwc");
    expect(DATASET).toBe("production");
    expect(EXPECTED.enrollments).toBe(13);
    expect(EXPECTED.completions).toBe(6);
    expect(EXPECTED.drafts).toContain("ops2aYkxIM6NMo1gE18U1o");
    expect(SOLANA_101_ID).toBe("aD45H1NEbb1bqELwloGCqI");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter cs8-extraction test -- config`
Expected: FAIL — `Cannot find module '../config'`.

- [ ] **Step 3: Write `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `config.ts`**

```json
// scripts/cs8-extraction/package.json
{
  "name": "cs8-extraction",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "extract": "tsx src/extract.ts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@coral-xyz/anchor": "^0.31.1",
    "@solana/web3.js": "^1.98.0",
    "@superteam-lms/content-schema": "workspace:*",
    "yaml": "^2.8.2"
  },
  "devDependencies": {
    "@superteam-lms/content-lint": "workspace:*",
    "@types/node": "^22.19.9",
    "tsx": "^4.21.0",
    "typescript": "^5.7.0",
    "vitest": "^4.0.18"
  }
}
```

```jsonc
// scripts/cs8-extraction/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

```ts
// scripts/cs8-extraction/vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["src/**/*.test.ts"] } });
```

```
// scripts/cs8-extraction/.gitignore
out/
```

```ts
// scripts/cs8-extraction/src/config.ts
export const PROJECT_ID = "4e3i2wwc";
export const DATASET = "production";
export const API_VERSION = "2024-01-01";

/** solana-101's raw Sanity _id — the on-chain course_id seed and pre-rename Supabase key. */
export const SOLANA_101_ID = "aD45H1NEbb1bqELwloGCqI";

/** Expected live inventory (spec §15.1). Task 7 asserts reality matches. */
export const EXPECTED = {
  courses: 7,
  drafts: ["ops2aYkxIM6NMo1gE18U1o", "xcvxcv-z1pie4"] as const,
  enrollments: 13,
  completions: 6,
} as const;

export function programId(): string {
  const id = process.env.NEXT_PUBLIC_PROGRAM_ID;
  if (!id) throw new Error("NEXT_PUBLIC_PROGRAM_ID required (source apps/web/.env.local)");
  return id;
}

export function rpcUrl(): string {
  const url = process.env.SOLANA_RPC_URL;
  if (!url) throw new Error("SOLANA_RPC_URL (Helius) required — do NOT use public devnet RPC");
  return url;
}
```

- [ ] **Step 4: Install and run the test to verify it passes**

Run: `pnpm install && pnpm --filter cs8-extraction test -- config`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add scripts/cs8-extraction/package.json scripts/cs8-extraction/tsconfig.json \
  scripts/cs8-extraction/vitest.config.ts scripts/cs8-extraction/.gitignore \
  scripts/cs8-extraction/src/config.ts scripts/cs8-extraction/src/__tests__/config.test.ts
git commit -m "chore(cs8): scaffold extraction toolchain + pinned config"
```

---

## Task 2: Unauthenticated GROQ export of the LIVE dataset

**Files:**
- Create: `scripts/cs8-extraction/src/export-sanity.ts`
- Test: `scripts/cs8-extraction/src/__tests__/export-sanity.test.ts`

**Interfaces:**
- Consumes: `PROJECT_ID`, `DATASET`, `API_VERSION` from `config.ts`.
- Produces: `runExport(): Promise<SanityExport>` writing `out/sanity-export.json`; type `SanityExport = { courses: RawCourse[]; achievements: RawDoc[]; quests: RawDoc[]; paths: RawDoc[]; instructors: RawDoc[] }`. `RawCourse.modules[].lessons[]` each carry `{ _id, title, slug, type, language, buildType, deployable, widgets, programIdl, videoUrl, content, code, tests, solution, hints, order }`. `parseGroqResponse(json): SanityExport` is the pure, testable core.

The **exact GROQ query** (fetches ALL courses incl. drafts + non-synced; includes `solution` and every test unstripped — legal because the dataset is public post-D4):

```groq
{
  "courses": *[_type == "course"]{
    _id, title, "slug": slug.current, description, difficulty, duration,
    xpPerLesson, xpReward, creatorRewardXp, minCompletionsForReward,
    trackId, trackLevel, tags, author, authoringStatus, onChainStatus,
    "instructor": instructor->_id,
    "modules": modules[]->{
      _id, title, description, order,
      "lessons": lessons[]->{
        _id, title, "slug": slug.current, type, language, buildType, deployable,
        widgets, programIdl, videoUrl, content, code,
        "tests": tests[]{ "id": coalesce(id, _key), description, input, expectedOutput, hidden },
        solution, hints, order
      } | order(order asc)
    } | order(order asc)
  },
  "achievements": *[_type == "achievement"]{ _id, title, description, category, icon, xpReward, maxSupply, criteria, onChainStatus },
  "quests": *[_type == "quest"]{ _id, title, description, type, xpReward, targetValue, resetType, active },
  "paths": *[_type == "learningPath"]{ _id, title, "slug": slug.current, description, difficulty, order, draft, "courses": courses[]->_id },
  "instructors": *[_type == "instructor"]{ _id, name, bio, avatar, socialLinks }
}
```

Request form (unauthenticated GET; URL-encode the query):

```
GET https://4e3i2wwc.apicdn.sanity.io/v2024-01-01/data/query/production?query=<url-encoded>
```

> Use `apicdn.sanity.io` (public CDN, no token). If the encoded query exceeds URL limits, POST to `https://4e3i2wwc.api.sanity.io/v2024-01-01/data/query/production` with `{ "query": "..." }` — still no token, public dataset. A raw NDJSON fallback is `GET .../data/export/production` (whole-dataset dump).

- [ ] **Step 1: Write the failing test** (against a recorded fixture, not the network)

```ts
// scripts/cs8-extraction/src/__tests__/export-sanity.test.ts
import { describe, it, expect } from "vitest";
import { parseGroqResponse } from "../export-sanity";

const sample = {
  result: {
    courses: [
      { _id: "course-x", title: "X", slug: "x", modules: [
        { _id: "m1", order: 0, lessons: [
          { _id: "les-a", slug: "a", type: "content", content: "# A", order: 0 },
        ] },
      ] },
    ],
    achievements: [], quests: [], paths: [], instructors: [],
  },
};

describe("parseGroqResponse", () => {
  it("unwraps result and keeps module/lesson order", () => {
    const out = parseGroqResponse(sample);
    expect(out.courses).toHaveLength(1);
    expect(out.courses[0].modules[0].lessons[0]._id).toBe("les-a");
  });
  it("throws on a GROQ error envelope", () => {
    expect(() => parseGroqResponse({ error: { description: "bad" } })).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter cs8-extraction test -- export-sanity`
Expected: FAIL — `parseGroqResponse` is not defined.

- [ ] **Step 3: Implement `export-sanity.ts`**

```ts
// scripts/cs8-extraction/src/export-sanity.ts
import { writeFileSync, mkdirSync } from "node:fs";
import { PROJECT_ID, DATASET, API_VERSION } from "./config";

export interface RawLesson {
  _id: string; title: string; slug: string; type: "content" | "challenge";
  language?: "typescript" | "rust"; buildType?: string; deployable?: boolean;
  widgets?: string[]; programIdl?: string; videoUrl?: string; content?: string;
  code?: string; tests?: RawTest[]; solution?: string; hints?: string[]; order?: number;
}
export interface RawTest { id: string; description?: string; input?: string; expectedOutput?: string; hidden?: boolean; }
export interface RawModule { _id: string; title?: string; description?: string; order?: number; lessons: RawLesson[]; }
export interface RawCourse {
  _id: string; title?: string; slug?: string; description?: string; difficulty?: string;
  duration?: number; xpPerLesson?: number; xpReward?: number; creatorRewardXp?: number;
  minCompletionsForReward?: number; trackId?: number; trackLevel?: number; tags?: string[];
  author?: string; authoringStatus?: string; onChainStatus?: Record<string, unknown>;
  instructor?: string; modules: RawModule[];
}
export interface SanityExport {
  courses: RawCourse[];
  achievements: Record<string, unknown>[];
  quests: Record<string, unknown>[];
  paths: Record<string, unknown>[];
  instructors: Record<string, unknown>[];
}

export const GROQ = `{ ... }`; // the query above, verbatim (kept in one const)

export function parseGroqResponse(json: unknown): SanityExport {
  const j = json as { result?: SanityExport; error?: { description?: string } };
  if (j.error) throw new Error(`Sanity GROQ error: ${j.error.description ?? "unknown"}`);
  if (!j.result?.courses) throw new Error("Sanity response missing result.courses");
  return {
    courses: j.result.courses ?? [],
    achievements: j.result.achievements ?? [],
    quests: j.result.quests ?? [],
    paths: j.result.paths ?? [],
    instructors: j.result.instructors ?? [],
  };
}

export async function runExport(): Promise<SanityExport> {
  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: GROQ }),
  });
  if (!res.ok) throw new Error(`Sanity export HTTP ${res.status}`);
  const parsed = parseGroqResponse(await res.json());
  mkdirSync("out", { recursive: true });
  writeFileSync("out/sanity-export.json", JSON.stringify(parsed, null, 2));
  return parsed;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter cs8-extraction test -- export-sanity`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the live export and eyeball the inventory** (read-only; needs network)

Run: `cd scripts/cs8-extraction && env $(grep -E 'NEXT_PUBLIC_SANITY' ../../apps/web/.env.local | xargs) tsx -e 'import("./src/export-sanity").then(m=>m.runExport()).then(x=>console.log("courses",x.courses.length,"drafts?",x.courses.filter(c=>!c.modules?.length).map(c=>c._id)))'`
Expected: prints `courses 9` (7 real + 2 empty drafts) and the two draft `_id`s `ops2aYkxIM6NMo1gE18U1o`, `xcvxcv-z1pie4`. **If the draft ids or live-course count differ from §15.1, stop and reconcile the spec before continuing** (do not silently proceed on a changed dataset).

- [ ] **Step 6: Commit**

```bash
git add scripts/cs8-extraction/src/export-sanity.ts scripts/cs8-extraction/src/__tests__/export-sanity.test.ts
git commit -m "feat(cs8): unauthenticated GROQ export of the live dataset"
```

---

## Task 3: Flatten live lesson order (mirror `findLessonIndex`)

This is the ordering the on-chain bits were set against. It **must** replicate `apps/web/src/lib/courses/lesson-index.ts` semantics: the app flattens `course.modules.flatMap(m => m.lessons)` where those arrays are already `| order(order asc)` sorted by the query. So: sort modules by `order asc`, sort each module's lessons by `order asc`, then flatMap the `_id`s.

**Files:**
- Create: `scripts/cs8-extraction/src/flatten-order.ts`
- Test: `scripts/cs8-extraction/src/__tests__/flatten-order.test.ts`

**Interfaces:**
- Consumes: `RawCourse` from `export-sanity.ts`.
- Produces: `flattenLiveOrder(course: RawCourse): string[]` and `liveLessonIndex(course, lessonId): number` (index or -1).

- [ ] **Step 1: Write the failing test**

```ts
// scripts/cs8-extraction/src/__tests__/flatten-order.test.ts
import { describe, it, expect } from "vitest";
import { flattenLiveOrder, liveLessonIndex } from "../flatten-order";
import type { RawCourse } from "../export-sanity";

const course = {
  _id: "c", modules: [
    { _id: "m2", order: 1, lessons: [{ _id: "les-c", order: 0 }, { _id: "les-d", order: 1 }] },
    { _id: "m1", order: 0, lessons: [{ _id: "les-b", order: 1 }, { _id: "les-a", order: 0 }] },
  ],
} as unknown as RawCourse;

describe("flattenLiveOrder", () => {
  it("sorts modules then lessons by order asc, then flattens (matches findLessonIndex)", () => {
    expect(flattenLiveOrder(course)).toEqual(["les-a", "les-b", "les-c", "les-d"]);
  });
  it("returns the bitmap index of a lesson, or -1", () => {
    expect(liveLessonIndex(course, "les-c")).toBe(2);
    expect(liveLessonIndex(course, "nope")).toBe(-1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter cs8-extraction test -- flatten-order`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `flatten-order.ts`**

```ts
// scripts/cs8-extraction/src/flatten-order.ts
import type { RawCourse } from "./export-sanity";

const byOrder = <T extends { order?: number }>(a: T, b: T) =>
  (a.order ?? 0) - (b.order ?? 0);

/** The live flattened lesson-id order — the exact sequence on-chain bits index into. */
export function flattenLiveOrder(course: RawCourse): string[] {
  return [...(course.modules ?? [])]
    .sort(byOrder)
    .flatMap((m) => [...(m.lessons ?? [])].sort(byOrder).map((l) => l._id));
}

export function liveLessonIndex(course: RawCourse, lessonId: string): number {
  return flattenLiveOrder(course).indexOf(lessonId);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter cs8-extraction test -- flatten-order`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/cs8-extraction/src/flatten-order.ts scripts/cs8-extraction/src/__tests__/flatten-order.test.ts
git commit -m "feat(cs8): flatten live lesson order mirroring findLessonIndex"
```

---

## Task 4: Read the 6 completions from David's Supabase (read-only)

The 6 `user_progress` completions are the truth the bits must reproduce. Read them **read-only** via the `dbd5cdaf` Supabase MCP (project `obqlljsagzslxarwphxv` — the same DB `NEXT_PUBLIC_SUPABASE_URL` points at; the user's other Supabase projects are OFF-LIMITS). This step is a documented manual/MCP read that writes `out/completions.json`; the code parses and shape-checks that file.

**Files:**
- Create: `scripts/cs8-extraction/src/read-completions.ts`
- Create (by the operator, from MCP output): `scripts/cs8-extraction/out/completions.json`
- Test: `scripts/cs8-extraction/src/__tests__/read-completions.test.ts`

**Interfaces:**
- Produces: `loadCompletions(): Completion[]`; `Completion = { userId: string; wallet: string; courseId: string; lessonId: string; lessonIndex: number | null; completedAt: string }`. `lessonIndex` is the **stored** `user_progress.lesson_index` (written at completion time) — the §15.3 cross-check reference.

**The exact read-only SQL** (run via the `dbd5cdaf` MCP `execute_sql`, or `supabase` MCP `SELECT` — never a write):

```sql
-- The 6 completions, joined to the learner's wallet (Enrollment PDA seed input).
select up.user_id,
       p.wallet_address        as wallet,
       up.course_id,
       up.lesson_id,
       up.lesson_index,
       up.completed_at
from user_progress up
join profiles p on p.id = up.user_id
where up.completed = true
order by up.course_id, up.completed_at;
```

Save the rows to `out/completions.json` as an array of `{ user_id, wallet, course_id, lesson_id, lesson_index, completed_at }`. Expected 6 rows (§15.1). Also capture the popcount cross-check per (user, course):

```sql
-- Per-enrollment completed-lesson counts, to cross-check on-chain popcount later.
select user_id, course_id, count(*) as completed_lessons
from user_progress where completed = true
group by user_id, course_id order by course_id;
```

> **If any completed row has `wallet_address IS NULL`,** the learner never linked a wallet; there is no Enrollment PDA to verify against. Record it, and treat that completion as **unverifiable → halt + P0** (Task 7 STOP condition) rather than silently skipping — a missing wallet is exactly the kind of gap that hides a bit-order bug.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/cs8-extraction/src/__tests__/read-completions.test.ts
import { describe, it, expect } from "vitest";
import { parseCompletions } from "../read-completions";

const rows = [
  { user_id: "u1", wallet: "Wa11et1111111111111111111111111111111111111", course_id: "course-rust-for-solana", lesson_id: "lesson-rust-basics", lesson_index: 0, completed_at: "2026-05-01T00:00:00Z" },
];

describe("parseCompletions", () => {
  it("maps rows and preserves the stored lesson_index", () => {
    const [c] = parseCompletions(rows);
    expect(c.wallet).toMatch(/^Wa11et/);
    expect(c.lessonIndex).toBe(0);
  });
  it("rejects a null wallet (unverifiable completion)", () => {
    expect(() => parseCompletions([{ ...rows[0], wallet: null }])).toThrow(/wallet/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter cs8-extraction test -- read-completions`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `read-completions.ts`**

```ts
// scripts/cs8-extraction/src/read-completions.ts
import { readFileSync } from "node:fs";

export interface Completion {
  userId: string; wallet: string; courseId: string;
  lessonId: string; lessonIndex: number | null; completedAt: string;
}

interface Row {
  user_id: string; wallet: string | null; course_id: string;
  lesson_id: string; lesson_index: number | null; completed_at: string;
}

export function parseCompletions(rows: Row[]): Completion[] {
  return rows.map((r) => {
    if (!r.wallet) {
      throw new Error(`completion ${r.user_id}/${r.lesson_id} has null wallet — unverifiable (halt + P0)`);
    }
    return {
      userId: r.user_id, wallet: r.wallet, courseId: r.course_id,
      lessonId: r.lesson_id, lessonIndex: r.lesson_index, completedAt: r.completed_at,
    };
  });
}

export function loadCompletions(path = "out/completions.json"): Completion[] {
  return parseCompletions(JSON.parse(readFileSync(path, "utf8")) as Row[]);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter cs8-extraction test -- read-completions`
Expected: PASS (2 tests).

- [ ] **Step 5: Perform the live read (operator step) and save the artifact**

Via the `dbd5cdaf` MCP, run both SELECTs above; write the first result set to `scripts/cs8-extraction/out/completions.json`. Confirm exactly 6 rows and no null wallet. (No commit — `out/` is gitignored.)

- [ ] **Step 6: Commit the code**

```bash
git add scripts/cs8-extraction/src/read-completions.ts scripts/cs8-extraction/src/__tests__/read-completions.test.ts
git commit -m "feat(cs8): read-only loader for the 6 user_progress completions"
```

---

## Task 5: Read the 13 Enrollment PDAs on devnet

**Files:**
- Create: `scripts/cs8-extraction/src/read-enrollments.ts`
- Create (operator/live run): `scripts/cs8-extraction/out/enrollments.json`
- Test: `scripts/cs8-extraction/src/__tests__/read-enrollments.test.ts`

**Interfaces:**
- Consumes: `programId()`, `rpcUrl()`; the enrollment set = every `(courseId, wallet)` from `completions.json` **plus** all enrolled wallets (13 total) discovered from Supabase `enrollments`.
- Produces: `readEnrollment(courseId, wallet, conn): Promise<{ lessonFlags: bigint[]; completedBits: number[] } | null>`; `bitSet(lessonFlags: bigint[], index: number): boolean` (mirrors `bitmap.ts::isLessonComplete`).

The enrollment PDA uses the **raw** `course_id` seed (`["enrollment", course_id, wallet]`) — for solana-101 that is `aD45H1NEbb1bqELwloGCqI` (pre-rename), matching `user_progress.course_id`. Decode via the raw IDL `BorshCoder` (`lesson_flags` snake_case, `[u64;4]`).

The list of 13 enrolled `(course_id, wallet)` pairs comes from a read-only SELECT (same MCP path as Task 4):

```sql
select e.course_id, p.wallet_address as wallet
from enrollments e join profiles p on p.id = e.user_id
where p.wallet_address is not null
order by e.course_id;
```

- [ ] **Step 1: Write the failing test** (pure bit helper; PDA/network not unit-tested)

```ts
// scripts/cs8-extraction/src/__tests__/read-enrollments.test.ts
import { describe, it, expect } from "vitest";
import { bitSet, completedBits } from "../read-enrollments";

describe("bitSet", () => {
  it("reads a bit in the [u64;4] flags little-endian by index", () => {
    // bit 0 and bit 2 set in word 0
    const flags = [0b101n, 0n, 0n, 0n];
    expect(bitSet(flags, 0)).toBe(true);
    expect(bitSet(flags, 1)).toBe(false);
    expect(bitSet(flags, 2)).toBe(true);
    expect(completedBits(flags)).toEqual([0, 2]);
  });
  it("indexes across word boundaries (bit 64 = word 1 bit 0)", () => {
    expect(bitSet([0n, 1n, 0n, 0n], 64)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter cs8-extraction test -- read-enrollments`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `read-enrollments.ts`**

```ts
// scripts/cs8-extraction/src/read-enrollments.ts
import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder } from "@coral-xyz/anchor";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { programId } from "./config";

// Raw IDL so lesson_flags stays snake_case (see MEMORY: BorshCoder camelCase note).
const idl = JSON.parse(
  readFileSync(new URL("../../../apps/web/src/lib/solana/idl/superteam_academy.json", import.meta.url), "utf8")
);
const coder = new BorshCoder(idl);

export function findEnrollmentPda(courseId: string, wallet: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), new PublicKey(wallet).toBuffer()],
    new PublicKey(programId())
  )[0];
}

export function bitSet(lessonFlags: bigint[], index: number): boolean {
  const word = lessonFlags[Math.floor(index / 64)] ?? 0n;
  return (word & (1n << BigInt(index % 64))) !== 0n;
}

export function completedBits(lessonFlags: bigint[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < lessonFlags.length * 64; i++) if (bitSet(lessonFlags, i)) out.push(i);
  return out;
}

export async function readEnrollment(courseId: string, wallet: string, conn: Connection) {
  const info = await conn.getAccountInfo(findEnrollmentPda(courseId, wallet));
  if (!info) return null;
  const acct = coder.accounts.decode("Enrollment", info.data) as { lesson_flags: { toString(): string }[] };
  const lessonFlags = acct.lesson_flags.map((w) => BigInt(w.toString()));
  return { lessonFlags, completedBits: completedBits(lessonFlags) };
}

export async function readAll(pairs: { courseId: string; wallet: string }[], rpc: string) {
  const conn = new Connection(rpc, "confirmed");
  const rows = [];
  for (const { courseId, wallet } of pairs) {
    const e = await readEnrollment(courseId, wallet, conn);
    rows.push({ courseId, wallet, found: !!e, lessonFlags: e?.lessonFlags.map(String) ?? null, completedBits: e?.completedBits ?? null });
  }
  mkdirSync("out", { recursive: true });
  writeFileSync("out/enrollments.json", JSON.stringify(rows, null, 2));
  return rows;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter cs8-extraction test -- read-enrollments`
Expected: PASS (2 tests).

- [ ] **Step 5: Live read (operator step)** — feed the 13 `(course_id, wallet)` pairs to `readAll(pairs, rpcUrl())` with `SOLANA_RPC_URL` + `NEXT_PUBLIC_PROGRAM_ID` sourced from `apps/web/.env.local`. Confirm `found: true` for all 13 and that per-enrollment `completedBits.length` matches the Task-4 popcount SQL exactly. Any `found: false` or popcount mismatch → **halt + P0**.

- [ ] **Step 6: Commit the code**

```bash
git add scripts/cs8-extraction/src/read-enrollments.ts scripts/cs8-extraction/src/__tests__/read-enrollments.test.ts
git commit -m "feat(cs8): read 13 devnet Enrollment PDAs + bitmap helpers"
```

---

## Task 6: Generate `slots.lock.json` from live order

**Files:**
- Create: `scripts/cs8-extraction/src/generate-slots.ts`
- Test: `scripts/cs8-extraction/src/__tests__/generate-slots.test.ts`

**Interfaces:**
- Consumes: `flattenLiveOrder` (Task 3); `assignSlots` from `@superteam-lms/content-schema`.
- Produces: `buildSlotsLock(course: RawCourse): SlotsLockT` — a fresh migration lock where `slots[lessonId] === liveIndex` (0..N-1, `retired: []`, `next: N`), keyed by the **new** lesson id (post-rewrite; identity for named courses).

Because this is a first-run migration lock, `assignSlots(null, liveOrder)` assigns `slot = array index = liveIndex`. That identity — `slot(lessonId) === liveLessonIndex(lessonId)` — is precisely what Task 7 verifies against the on-chain bits.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/cs8-extraction/src/__tests__/generate-slots.test.ts
import { describe, it, expect } from "vitest";
import { buildSlotsLock } from "../generate-slots";
import type { RawCourse } from "../export-sanity";

const course = {
  _id: "course-x", modules: [
    { _id: "m1", order: 0, lessons: [{ _id: "lesson-a", order: 0 }, { _id: "lesson-b", order: 1 }] },
    { _id: "m2", order: 1, lessons: [{ _id: "lesson-c", order: 0 }] },
  ],
} as unknown as RawCourse;

describe("buildSlotsLock", () => {
  it("assigns dense slots equal to the live flattened index", () => {
    const lock = buildSlotsLock(course, (id) => id); // identity id-rewrite
    expect(lock.slots).toEqual({ "lesson-a": 0, "lesson-b": 1, "lesson-c": 2 });
    expect(lock.retired).toEqual([]);
    expect(lock.next).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter cs8-extraction test -- generate-slots`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `generate-slots.ts`**

```ts
// scripts/cs8-extraction/src/generate-slots.ts
import { assignSlots, type SlotsLockT } from "@superteam-lms/content-schema";
import { flattenLiveOrder } from "./flatten-order";
import type { RawCourse } from "./export-sanity";

/** rewriteId maps a raw Sanity lesson _id → the new content-standard lesson id (Task 8). */
export function buildSlotsLock(course: RawCourse, rewriteId: (rawId: string) => string): SlotsLockT {
  const liveOrder = flattenLiveOrder(course).map(rewriteId);
  return assignSlots(null, liveOrder);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter cs8-extraction test -- generate-slots`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add scripts/cs8-extraction/src/generate-slots.ts scripts/cs8-extraction/src/__tests__/generate-slots.test.ts
git commit -m "feat(cs8): generate migration slots.lock from live lesson order"
```

---

## Task 7: THE bit-verification GATE (the crux)

For every completion, the frozen slot **must** equal the on-chain set bit, or a real learner's progress would point at the wrong lesson. This gate is fail-closed and halts the lane on any anomaly (the CS-4 pattern: *any invariant fails → STOP, file a P0, do not proceed* — spec §15.3, issue #356).

**Verification methodology (per completion row):**
1. Map `user_progress` → wallet via `profiles.wallet_address` (Task 4). Null wallet → halt.
2. Compute `slot = buildSlotsLock(course, rewriteId).slots[newLessonId]` — the slot this migration would freeze (= live flattened index).
3. Read the Enrollment PDA `["enrollment", rawCourseId, wallet]` and decode `lesson_flags` (Task 5). `rawCourseId` is the **pre-rewrite** id (solana-101 = `aD45H1NEbb1bqELwloGCqI`), because that is the on-chain seed and the `user_progress.course_id` value.
4. **Assert `bitSet(lessonFlags, slot) === true`.** If the frozen slot's bit is not set on-chain, the lockfile is wrong for this learner.
5. **Sharper §15.3 cross-check:** compare `slot` to the stored `user_progress.lesson_index`. If they differ, the lesson moved between completion time and today → today's live order no longer reproduces the historical bit. Report it explicitly.
6. **Popcount cross-check:** `completedBits(lessonFlags).length` must equal the Supabase completed-lesson count for that `(user, course)` (Task 4 second SQL). A surplus/deficit bit means live order and on-chain state disagree.

**STOP condition:** any failed assertion (4), any order mismatch (5) that cannot be reconciled to a lock where every completion's `slot === set bit`, or any popcount mismatch (6) → **do NOT freeze that course's `slots.lock.json`; file a P0 issue; halt the lane.** Never write a lockfile the gate could not clear. (Reconciliation, when a lesson genuinely moved: set that lesson's slot to the on-chain bit position rather than today's index, regenerate, and re-run the gate until every completion clears — but only a human may sign off on a hand-reconciled lock; the automated path stops.)

**Files:**
- Create: `scripts/cs8-extraction/src/verify-bits.ts`
- Test: `scripts/cs8-extraction/src/__tests__/verify-bits.test.ts`

**Interfaces:**
- Consumes: `Completion` (Task 4), `buildSlotsLock` (Task 6), `bitSet`/`completedBits` (Task 5), `rewriteId`/`rawCourseId` (Task 8).
- Produces: `verifyCompletionBits(input): VerifyReport` — throws `BitMismatchError` (halt) on any STOP condition; returns a per-completion `{ ok: true }[]` report otherwise.

```ts
export interface VerifyInput {
  completions: Completion[];
  courseById: Map<string, RawCourse>;              // keyed by RAW _id
  slotsByNewCourseId: Map<string, SlotsLockT>;     // Task 6 output
  enrollmentFlags: Map<string, bigint[]>;          // key `${rawCourseId}:${wallet}` (Task 5)
  popcountByEnrollment: Map<string, number>;       // key `${userId}:${rawCourseId}` (Task 4)
  rewriteLessonId: (rawId: string) => string;
  newCourseId: (rawCourseId: string) => string;
}
export class BitMismatchError extends Error {}
```

- [ ] **Step 1: Write the failing test** (a passing case AND a deliberate-mismatch case that must halt)

```ts
// scripts/cs8-extraction/src/__tests__/verify-bits.test.ts
import { describe, it, expect } from "vitest";
import { verifyCompletionBits, BitMismatchError } from "../verify-bits";
import type { RawCourse } from "../export-sanity";
import { buildSlotsLock } from "../generate-slots";

const course = {
  _id: "course-rust-for-solana", modules: [
    { _id: "m1", order: 0, lessons: [{ _id: "lesson-rust-basics", order: 0 }, { _id: "lesson-ownership", order: 1 }] },
  ],
} as unknown as RawCourse;
const id = (x: string) => x; // identity rewrites for named course

function baseInput(flags: bigint[]) {
  return {
    completions: [{ userId: "u1", wallet: "5v", courseId: "course-rust-for-solana", lessonId: "lesson-rust-basics", lessonIndex: 0, completedAt: "z" }],
    courseById: new Map([["course-rust-for-solana", course]]),
    slotsByNewCourseId: new Map([["course-rust-for-solana", buildSlotsLock(course, id)]]),
    enrollmentFlags: new Map([["course-rust-for-solana:5v", flags]]),
    popcountByEnrollment: new Map([["u1:course-rust-for-solana", flags.reduce((n, w) => n + [...w.toString(2)].filter(b => b === "1").length, 0)]]),
    rewriteLessonId: id, newCourseId: id,
  };
}

describe("verifyCompletionBits", () => {
  it("passes when the frozen slot's bit is set on-chain", () => {
    const report = verifyCompletionBits(baseInput([0b1n, 0n, 0n, 0n])); // bit 0 set
    expect(report.every((r) => r.ok)).toBe(true);
  });
  it("HALTS when the completed lesson's slot bit is NOT set (order moved since completion)", () => {
    // bit 1 set instead of bit 0 → lesson-rust-basics (slot 0) has no bit → STOP + P0
    expect(() => verifyCompletionBits(baseInput([0b10n, 0n, 0n, 0n]))).toThrow(BitMismatchError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter cs8-extraction test -- verify-bits`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `verify-bits.ts`**

```ts
// scripts/cs8-extraction/src/verify-bits.ts
import type { SlotsLockT } from "@superteam-lms/content-schema";
import type { RawCourse } from "./export-sanity";
import type { Completion } from "./read-completions";
import { bitSet, completedBits } from "./read-enrollments";

export interface VerifyInput {
  completions: Completion[];
  courseById: Map<string, RawCourse>;
  slotsByNewCourseId: Map<string, SlotsLockT>;
  enrollmentFlags: Map<string, bigint[]>;
  popcountByEnrollment: Map<string, number>;
  rewriteLessonId: (rawId: string) => string;
  newCourseId: (rawCourseId: string) => string;
}
export class BitMismatchError extends Error {
  constructor(msg: string) { super(msg); this.name = "BitMismatchError"; }
}
export interface VerifyResult { courseId: string; lessonId: string; slot: number; ok: true; movedSinceCompletion: boolean; }

export function verifyCompletionBits(input: VerifyInput): VerifyResult[] {
  const out: VerifyResult[] = [];
  for (const c of input.completions) {
    const rawCourseId = c.courseId;
    const flags = input.enrollmentFlags.get(`${rawCourseId}:${c.wallet}`);
    if (!flags) throw new BitMismatchError(`no on-chain enrollment for ${rawCourseId}/${c.wallet} — HALT + P0`);

    const lock = input.slotsByNewCourseId.get(input.newCourseId(rawCourseId));
    if (!lock) throw new BitMismatchError(`no slots.lock for course ${rawCourseId} — HALT + P0`);
    const newLessonId = input.rewriteLessonId(c.lessonId);
    const slot = lock.slots[newLessonId];
    if (slot === undefined) throw new BitMismatchError(`lesson ${newLessonId} absent from slots.lock — HALT + P0`);

    // (4) the crux: the frozen slot's bit MUST be set on-chain for this completion.
    if (!bitSet(flags, slot)) {
      throw new BitMismatchError(
        `${rawCourseId}/${c.lessonId}: frozen slot ${slot} has NO on-chain bit ` +
        `(set bits: [${completedBits(flags).join(",")}]). Live order does not reproduce the ` +
        `completion-time bit — do NOT freeze this lockfile. HALT + P0 (spec §15.3).`
      );
    }

    // (5) sharper §15.3 cross-check: stored lesson_index vs today's slot.
    const movedSinceCompletion = c.lessonIndex !== null && c.lessonIndex !== slot;
    if (movedSinceCompletion) {
      // The bit at `slot` is set (passed (4)), yet the historical index differs — the lesson
      // moved. That is reconcilable ONLY if the bit still lands on this lesson; surface it loudly
      // for human sign-off rather than freezing silently.
      throw new BitMismatchError(
        `${rawCourseId}/${c.lessonId}: stored lesson_index ${c.lessonIndex} != today's slot ${slot} ` +
        `— lesson moved since completion. Human reconciliation required. HALT + P0 (spec §15.3).`
      );
    }

    // (6) popcount cross-check against Supabase completed-lesson count.
    const expectedPop = input.popcountByEnrollment.get(`${c.userId}:${rawCourseId}`);
    if (expectedPop !== undefined && completedBits(flags).length !== expectedPop) {
      throw new BitMismatchError(
        `${rawCourseId}/${c.wallet}: on-chain popcount ${completedBits(flags).length} != ` +
        `Supabase completed count ${expectedPop}. HALT + P0.`
      );
    }

    out.push({ courseId: rawCourseId, lessonId: c.lessonId, slot, ok: true, movedSinceCompletion });
  }
  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter cs8-extraction test -- verify-bits`
Expected: PASS (2 tests — the mismatch case throws `BitMismatchError`).

- [ ] **Step 5: Commit**

```bash
git add scripts/cs8-extraction/src/verify-bits.ts scripts/cs8-extraction/src/__tests__/verify-bits.test.ts
git commit -m "feat(cs8): bit-verification gate — halt+P0 on any slot/bit mismatch"
```

---

## Task 8: The id-rewrite decisions (§15.5)

Each decision is flagged **SENSITIVE (human-applied Supabase migration)** or **repo-content (this lane)**. The lane encodes the mappings and **emits** migration SQL to `out/migrations/` for a human to apply; it never applies it.

| Decision | Type | Action in this lane |
|---|---|---|
| Delete drafts `ops2aYkxIM6NMo1gE18U1o`, `xcvxcv-z1pie4` | repo-content | Not extracted (no dir written). No Supabase change (no rows reference them). |
| Rename `aD45H1NEbb1bqELwloGCqI` → `course-solana-101` | **SENSITIVE** | course.yaml gets `id: course-solana-101`; **emit** `course_id` rewrite across 5 FK-less tables. On-chain Enrollment PDA seed cannot change → orphaned PDA noted for human decision. |
| 3 UUID lessons → real `lesson-<slug>` ids | **SENSITIVE** (for any carrying `user_progress`) | lesson.yaml gets the real id; **emit** `user_progress.lesson_id` rewrite for affected rows. |
| 1 UUID module → real `key` | repo-content | Module is an inline `key` in course.yaml; no Postgres row references a module. |
| 4 community achievements enter repo | repo-content | Write `achievements/{first-comment,curious-mind,helper,top-contributor}.yaml` with `award.kind` (community-stat / manual). |
| `achievement-speed-runner`: add `award.kind` or delete | repo-content **+ OPEN QUESTION** | Per human decision (§17); default = delete unless a kind is chosen. CI gate 12 forbids limbo. |
| `achievement-perfect-score`: real `allTestsPassedFirstTry` or delete | repo-content **+ OPEN QUESTION** | Per human decision (§17); default = delete (no first-try signal exists). |

**The 5 FK-less tables holding `course_id` as `TEXT`** (spec §15.5): `enrollments`, `user_progress`, `certificates`, `deployed_programs`, `threads`.

**Files:**
- Create: `scripts/cs8-extraction/src/id-rewrites.ts`
- Create (live, from export + completions): `scripts/cs8-extraction/out/migrations/001_rename_solana_101.sql`, `.../002_rewrite_uuid_lesson_ids.sql`
- Test: `scripts/cs8-extraction/src/__tests__/id-rewrites.test.ts`

**Interfaces:**
- Produces: `rewriteCourseId(rawId): string`, `rewriteLessonId(rawId): string`, `isDeletedDraft(rawId): boolean`, `emitMigrationSql(mappings): string`.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/cs8-extraction/src/__tests__/id-rewrites.test.ts
import { describe, it, expect } from "vitest";
import { rewriteCourseId, isDeletedDraft, emitCourseRenameSql } from "../id-rewrites";

describe("id-rewrites", () => {
  it("renames solana-101 and passes named courses through", () => {
    expect(rewriteCourseId("aD45H1NEbb1bqELwloGCqI")).toBe("course-solana-101");
    expect(rewriteCourseId("course-rust-for-solana")).toBe("course-rust-for-solana");
  });
  it("flags the two test-junk drafts as deleted", () => {
    expect(isDeletedDraft("ops2aYkxIM6NMo1gE18U1o")).toBe(true);
    expect(isDeletedDraft("xcvxcv-z1pie4")).toBe(true);
    expect(isDeletedDraft("course-defi-on-solana")).toBe(false);
  });
  it("emits a 5-table course_id rewrite, not applied", () => {
    const sql = emitCourseRenameSql("aD45H1NEbb1bqELwloGCqI", "course-solana-101");
    for (const t of ["enrollments", "user_progress", "certificates", "deployed_programs", "threads"]) {
      expect(sql).toContain(`update ${t} set course_id = 'course-solana-101'`);
    }
    expect(sql).toContain("BEGIN"); // wrapped in a transaction the human runs
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter cs8-extraction test -- id-rewrites`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `id-rewrites.ts`**

```ts
// scripts/cs8-extraction/src/id-rewrites.ts
import { SOLANA_101_ID, EXPECTED } from "./config";

const COURSE_RENAMES: Record<string, string> = { [SOLANA_101_ID]: "course-solana-101" };
const FK_LESS_COURSE_TABLES = ["enrollments", "user_progress", "certificates", "deployed_programs", "threads"] as const;

export function isDeletedDraft(rawId: string): boolean {
  return (EXPECTED.drafts as readonly string[]).includes(rawId);
}
export function rewriteCourseId(rawId: string): string {
  return COURSE_RENAMES[rawId] ?? rawId;
}

/** UUID lesson ids → real ids. Filled from the live export in Step 5 (three lessons). */
const LESSON_RENAMES: Record<string, string> = {
  // "<uuid-lesson-id>": "lesson-<slug>",   // populated from out/sanity-export.json
};
export function rewriteLessonId(rawId: string): string {
  return LESSON_RENAMES[rawId] ?? rawId;
}

/** SENSITIVE — emitted for a human to apply. Never executed here. */
export function emitCourseRenameSql(from: string, to: string): string {
  const stmts = FK_LESS_COURSE_TABLES.map((t) => `  update ${t} set course_id = '${to}' where course_id = '${from}';`);
  return ["-- SENSITIVE: human-applied. solana-101 course_id rename (spec §15.5).",
    "-- NOTE: the on-chain Enrollment PDA seed cannot be rewritten; its old-id PDA is orphaned.",
    "BEGIN;", ...stmts, "COMMIT;"].join("\n");
}
export function emitLessonRenameSql(renames: Record<string, string>): string {
  const stmts = Object.entries(renames).map(([from, to]) => `  update user_progress set lesson_id = '${to}' where lesson_id = '${from}';`);
  return ["-- SENSITIVE: human-applied. UUID lesson_id rewrites (spec §15.5).", "BEGIN;", ...stmts, "COMMIT;"].join("\n");
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter cs8-extraction test -- id-rewrites`
Expected: PASS (3 tests).

- [ ] **Step 5: Populate `LESSON_RENAMES` from the live export and emit the migration files**

Inspect `out/sanity-export.json` for lesson `_id`s that are not `lesson-…` (the 3 UUID lessons) and derive `lesson-<slug>` from each lesson's `slug`. Fill `LESSON_RENAMES`, then write `out/migrations/001_rename_solana_101.sql` and `out/migrations/002_rewrite_uuid_lesson_ids.sql`. **Only emit rows that actually exist** — cross-check each `from` against `user_progress` (Task 4) so a no-op UPDATE is never shipped. (`out/` is gitignored; the SQL rides in the hand-off issue, Task 11.)

- [ ] **Step 6: Commit the code**

```bash
git add scripts/cs8-extraction/src/id-rewrites.ts scripts/cs8-extraction/src/__tests__/id-rewrites.test.ts
git commit -m "feat(cs8): id-rewrite decisions + SENSITIVE migration SQL emitter"
```

---

## Task 9: Transform old docs → block model and generate the tree

Old → new mapping (live Sanity fields from `sanity/schemas/lesson.ts`, confirmed against the app's `moduleWithLessonsFields`):

- **`type: "content"`** → `prose` block (`src: intro.md`, body from `content`) + optional `video` block (from `videoUrl`) + `widget` blocks (one per `widgets[]` entry; `program-explorer` carries `program.idl.json` from `programIdl`, capability `consumes/produces` per §4.9 when a chain exists).
- **`type: "challenge"`** → `prose` block (from `content`) + `code` block: `language`, `buildType` (default `standard`), `deployable`, `starter: exercise/starter.<ext>` (from `code`), `solution: exercise/solution.<ext>` (from `solution`), `tests: exercise/tests.json` (from `tests[]`, all of them, incl. previously-hidden — public post-D4), `hints` (from `hints`).
- **course**: `xpPerLesson`, `xpReward`, `creatorRewardXp`, `minCompletionsForReward`, `trackId`, `trackLevel`, `tags`, `difficulty`, `duration`, `slug`, `title`, `description`, `instructor` (→ `instructor-<slug>` id), `creator.githubId` (resolved from `author` → `profiles.github_id`; falls back to a placeholder maintainer id when unlinked, matched in `teachers.yaml`). Modules become inline `{ key, title, description, lessons: [ids] }` in `order asc`. Drop `authoringStatus`, `author`, `onChainStatus`.
- Apply `rewriteCourseId` / `rewriteLessonId`; skip `isDeletedDraft` courses.
- Attach `slots.lock.json` from Task 6 (already gate-cleared in Task 7).

**Files:**
- Create: `scripts/cs8-extraction/src/transform.ts`
- Create: `scripts/cs8-extraction/src/generate-tree.ts`
- Test: `scripts/cs8-extraction/src/__tests__/transform.test.ts`

**Interfaces:**
- Consumes: `RawCourse`/`RawLesson` (Task 2), id-rewrites (Task 8).
- Produces: `toLessonYaml(raw): {yaml: object; files: {path: string; body: string}[]}`; `writeTree(export, outDir): void` writing valid YAML/JSON that round-trips through `@superteam-lms/content-schema`.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/cs8-extraction/src/__tests__/transform.test.ts
import { describe, it, expect } from "vitest";
import { toLessonYaml } from "../transform";
import { Lesson } from "@superteam-lms/content-schema";
import type { RawLesson } from "../export-sanity";

const challenge = {
  _id: "lesson-token-math", slug: "token-math", title: "Token Math", type: "challenge",
  language: "typescript", content: "# Convert SOL", code: "export function toLamports() {}",
  solution: "export function toLamports(n){return n*1e9;}",
  tests: [{ id: "one", input: "1", expectedOutput: "result === 1000000000", hidden: false }],
  hints: ["1 SOL = 1e9 lamports"], order: 0,
} as unknown as RawLesson;

describe("toLessonYaml", () => {
  it("emits a prose + code block lesson that validates against the Zod schema", () => {
    const { yaml, files } = toLessonYaml(challenge, (id) => id);
    const parsed = Lesson.parse(yaml);
    expect(parsed.blocks.map((b) => b.type)).toEqual(["prose", "code"]);
    expect(files.map((f) => f.path)).toEqual(
      expect.arrayContaining(["intro.md", "exercise/starter.ts", "exercise/solution.ts", "exercise/tests.json"])
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter cs8-extraction test -- transform`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `transform.ts` and `generate-tree.ts`**

Implement `toLessonYaml(raw, rewriteLessonId)` per the mapping above (extension `.ts`/`.rs` from `language`; `tests.json` is JSON.stringify of the `tests[]` with `hidden` preserved only where meaningful — the schema tolerates it). Implement `writeTree(exp, outDir)` iterating non-draft courses: write `course.yaml` (via `yaml.stringify`), each lesson dir (`lesson.yaml`, `intro.md`, `exercise/*`, `program.idl.json` when present), `slots.lock.json` (JSON, 2-space), plus `achievements/`, `quests/`, `paths/`, `instructors/`. Every emitted object is validated with the matching `@superteam-lms/content-schema` parser before writing — a parse failure aborts that file with a clear error (fail-closed).

```ts
// scripts/cs8-extraction/src/generate-tree.ts (shape)
import { stringify as toYaml } from "yaml";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { Course, Lesson } from "@superteam-lms/content-schema";
import type { SanityExport } from "./export-sanity";
import { isDeletedDraft, rewriteCourseId, rewriteLessonId } from "./id-rewrites";
import { toLessonYaml, toCourseYaml } from "./transform";
import { buildSlotsLock } from "./generate-slots";

export function writeTree(exp: SanityExport, outDir: string): void {
  for (const raw of exp.courses) {
    if (isDeletedDraft(raw._id) || !raw.modules?.length) continue;
    const courseYaml = Course.parse(toCourseYaml(raw, rewriteCourseId, rewriteLessonId));
    const dir = join(outDir, "courses", courseYaml.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "course.yaml"), toYaml(courseYaml));
    writeFileSync(join(dir, "slots.lock.json"), JSON.stringify(buildSlotsLock(raw, rewriteLessonId), null, 2) + "\n");
    for (const m of raw.modules) for (const l of m.lessons) {
      const { yaml, files } = toLessonYaml(l, rewriteLessonId);
      Lesson.parse(yaml);
      const ldir = join(dir, "lessons", yaml.slug as string);
      mkdirSync(join(ldir, "exercise"), { recursive: true });
      writeFileSync(join(ldir, "lesson.yaml"), toYaml(yaml));
      for (const f of files) writeFileSync(join(ldir, f.path), f.body);
    }
  }
  // ...achievements / quests / paths / instructors written similarly, each Zod-parsed first.
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter cs8-extraction test -- transform`
Expected: PASS (1 test).

- [ ] **Step 5: Run the full orchestrator end-to-end** into the `academy-courses` checkout

Create `src/extract.ts` wiring: `runExport()` → read completions/enrollments artifacts → `buildSlotsLock` per course → **`verifyCompletionBits(...)` (halts on any P0)** → `writeTree(exp, ACADEMY_COURSES_DIR)`. Then:

```bash
cd ~/Documents/STBR/academy-courses && git switch initial-scaffolding && git switch -c cs8-phase1-extraction
cd ~/Documents/STBR/superteam-academy/scripts/cs8-extraction && \
  env $(grep -E 'NEXT_PUBLIC_SANITY|NEXT_PUBLIC_PROGRAM_ID|SOLANA_RPC_URL' ../../apps/web/.env.local | xargs) \
  ACADEMY_COURSES_DIR=~/Documents/STBR/academy-courses tsx src/extract.ts
```

Expected: the gate prints `bit-verification: 6/6 OK`, then the tree is written. **If the gate throws `BitMismatchError`, STOP — file a P0 and do not write the tree.**

- [ ] **Step 6: Commit the tooling**

```bash
git add scripts/cs8-extraction/src/transform.ts scripts/cs8-extraction/src/generate-tree.ts \
  scripts/cs8-extraction/src/extract.ts scripts/cs8-extraction/src/__tests__/transform.test.ts
git commit -m "feat(cs8): transform live docs to block model + generate the tree"
```

---

## Task 10: Validate the extracted tree with the CS-2 linter

**Files:**
- Modify (in the `academy-courses` checkout): the extracted `courses/**`, `achievements/**`, `quests/**`, `paths/**`, `instructors/**` (iterate to green).

**Interfaces:**
- Consumes: `@superteam-lms/content-lint` CLI, pointed at the local checkout.

- [ ] **Step 1: Run the linter against the local checkout**

Run:
```bash
cd ~/Documents/STBR/superteam-academy && \
  LINT_BASE_REF= pnpm --filter @superteam-lms/content-lint content-lint ~/Documents/STBR/academy-courses
```
Expected on first run: gate-1..5/7 clean; **gate-6 reports errors** on some of the 34 challenges (spec §15.6 — the two-sided executor gate rejects content that is live today; the July-2026 rebalance was never machine-verified). This is expected, not a lane failure.

- [ ] **Step 2: Fix each gate-6 failure at the content layer**

For every `solution.ts does NOT pass its own tests` / `starter.ts unexpectedly passes`: fix `exercise/tests.json` (visible tests prove completeness; a differently-inputted case catches hardcoding — the rebalance principle) or the `solution`/`starter` file, in the `academy-courses` checkout only. Rust/buildable blocks defer to sync-time re-validation (§6.2a); note them, do not block on Playground here. Re-run Step 1 until:

Expected: `content-lint: OK (N diagnostics, 0 errors)`.

- [ ] **Step 3: Confirm slots + ids gates specifically**

Run: `LINT_BASE_REF= pnpm --filter @superteam-lms/content-lint content-lint ~/Documents/STBR/academy-courses 2>&1 | grep -E 'gate-2|gate-3'`
Expected: no `gate-2` (id) or `gate-3` (slots) errors — the frozen `slots.lock.json` regenerates to itself and every id is legal and ≤ its byte cap.

- [ ] **Step 4: Commit the validated tree (in the academy-courses checkout)**

```bash
cd ~/Documents/STBR/academy-courses && git add -A
git commit -m "feat: CS-8 Phase-1 extraction — 7 courses from live Sanity, slots frozen from live order, CS-2 green"
```

---

## Task 11: Human hand-off (`blocked:needs-human`)

The lane ends here. This account has READ-only access to `solanabr/academy-courses`; a human pushes.

**Files:** none in this repo. Produces a GitHub issue and a local commit (Task 10 Step 4).

- [ ] **Step 1: Verify the local commit is clean and complete**

Run: `cd ~/Documents/STBR/academy-courses && git log --oneline -1 && git status --short`
Expected: the extraction commit on `cs8-phase1-extraction`; clean working tree.

- [ ] **Step 2: File the human push + migration hand-off issue** (in `solanabr/superteam-academy`)

```bash
gh issue create --repo solanabr/superteam-academy \
  --title "CS-8 Phase-1: human push academy-courses + apply SENSITIVE migrations" \
  --label "blocked:needs-human,area:ops,priority:P1" \
  --body "$(cat <<'EOF'
CS-8 Phase-1 extraction is committed locally at ~/Documents/STBR/academy-courses on branch cs8-phase1-extraction, validated green by @superteam-lms/content-lint. Bit-verification gate passed 6/6.

Human actions required (this account has READ-only access to solanabr/academy-courses):
1. Push branch cs8-phase1-extraction to solanabr/academy-courses and open a PR.
2. Apply the SENSITIVE Supabase migrations (David's obqlljsagzslxarwphxv), reviewed first:
   - out/migrations/001_rename_solana_101.sql  (course_id rename across enrollments/user_progress/certificates/deployed_programs/threads)
   - out/migrations/002_rewrite_uuid_lesson_ids.sql  (user_progress.lesson_id for the 3 UUID lessons)
3. Decide the two OPEN QUESTIONS (see below) before the achievements land.

Do NOT apply migrations before review — they rewrite live learner FKs.
EOF
)"
```

- [ ] **Step 3: Record the open questions in the issue body** (see the plan's Open Questions section) and stop. **No push, no migration apply, no Sanity/on-chain writes.**

---

## Self-Review

**Spec coverage (§15.1–15.5):**
- §15.1 stakes / inventory → Task 1 `EXPECTED`, Task 2 Step 5 inventory assertion.
- §15.2 `close_course` precedent → out of Phase-1 scope (Phase 4 / CS-4 #356); noted, not implemented here.
- §15.3 slots from live order + sharper completion-time subtlety → Tasks 3, 6, and the crux Task 7 (assertions 4 + 5).
- §15.4 order of operations → this plan is Phase 1 only; hand-off (Task 11) precedes Phases 3–8.
- §15.5 content decisions (draft delete, solana-101 rename, UUID lesson/module ids, community achievements, speed-runner/perfect-score) → Task 8 table + Task 9 + Open Questions.

**Goal-requirement coverage:**
1. Where live data comes from → Task 2 (GROQ, project `4e3i2wwc`/`production`, resolved from env), Task 4 (Supabase read-only SQL), Task 5 (13 PDAs).
2. slots.lock from live flattened order, all 7 courses → Tasks 3 + 6.
3. bit-verification GATE with STOP condition → Task 7 (methodology + halt + P0).
4. id-rewrites, SENSITIVE vs repo-content → Task 8.
5. push is `blocked:needs-human` → Task 11.
6. CS-2 linter green + gate passes → Task 10 + Task 7.

**Placeholder scan:** exact GROQ query, exact SQL (both SELECTs + emitted UPDATEs), exact PDA seeds, exact env keys, exact commands present. The one intentionally-empty structure — `LESSON_RENAMES` — is filled in Task 8 Step 5 from the live export (its three ids are UUIDs unknowable until the export runs; the plan says exactly how to derive them).

**Type consistency:** `RawCourse`/`RawLesson`/`SanityExport` (Task 2) flow into Tasks 3/6/9; `Completion` (Task 4), `bitSet`/`completedBits` (Task 5), `SlotsLockT`/`assignSlots` (content-schema) into Task 7; `rewriteCourseId`/`rewriteLessonId` (Task 8) into Tasks 6/7/9. `flattenLiveOrder` name is consistent across Tasks 3/6.

---

## Open Questions (human must decide — carry into the Task 11 issue)

1. **solana-101 `xpPerLesson: 100`** (§15.5, §17): the schema max, 10× the flagship course. Keep as-is on the migrated `course-solana-101`, or normalize? This is a policy call, not technical — Zod permits it (≤ MAX; finalize invariant `100 × 3 = 300 ≤ 10000` holds). Extraction preserves the live value unless told otherwise.
2. **`achievement-speed-runner`** (§15.5, §17): give it an `award.kind` (which?) or delete it. CI gate 12 forbids limbo. Default = delete.
3. **`achievement-perfect-score`** (§15.5, §17): implement a real `allTestsPassedFirstTry` signal, or delete. Nothing records first-try passes today. Default = delete.
4. **solana-101 orphaned Enrollment PDA**: the on-chain seed `["enrollment", "aD45H1NEbb1bqELwloGCqI", wallet]` cannot be rewritten to the new id. Accept losing that 1 devnet enrollment's on-chain record (Supabase rows are rewritten), or leave the PDA discoverable under the old id? Devnet-only, but state the choice.
5. **`movedSinceCompletion` handling**: if Task 7 assertion (5) trips (a lesson moved between completion and today) the automated lane halts. Confirm the human-reconciliation policy — freeze the lock to the on-chain bit position (historical) and re-run the gate, vs. reorder content. Only a human signs off a hand-reconciled lock.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-10-cs8-academy-courses-extraction.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session with checkpoints.

Which approach?
