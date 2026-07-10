# `content-lint` — Content Linter + Repo-Level CI Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@superteam-lms/content-lint` — the Node/TS CLI that runs in the `academy-courses` repo's CI and enforces the repo-checkable subset of spec §6.2 (gates 1–5, 5a, 6-JS, 7, 13a–13d), plus the reusable GitHub Actions workflow that the content repo calls.

**Architecture:** A standalone workspace package (`packages/content-lint`, no build step, `main` → `src/index.ts`, matching `packages/types` and `packages/content-schema`). It **imports the Zod schemas from `@superteam-lms/content-schema`** (Plan 1) and validates a checked-out `academy-courses` tree against them, and **reuses the real `runJsSubmission` executor** so a `code` block's `solution.ts` is graded by the *same* oracle that grades a learner at runtime — the machine-checked fix for the July false-403 rebalance. `runLint(root, opts)` discovers files, parses them (`yaml` v2 pinned to 1.2 core; `tests.json` as JSON), runs Gate 1 (Zod) to build a typed model, then runs an ordered list of gate checks that each return `Diagnostic[]`. The process exits non-zero iff any `error`-severity diagnostic is produced (`warning`/`notice` never fail the build). A reusable `workflow_call` workflow (`.github/workflows/validate-content.yml`, in this repo) checks out the caller's content + this monorepo and runs the CLI.

**Tech Stack:** Node 20+, TypeScript 5.7 (strict, `noUncheckedIndexedAccess`), tsx, `yaml` ^2.8.2 (v2 = YAML 1.2 core, Norway-safe), `@superteam-lms/content-schema` (Zod source of truth), `@superteam-lms/challenge-executor` (QuickJS-WASM `runJsSubmission`), zod ^4.4.3, vitest 4, pnpm workspaces, turbo, GitHub Actions.

## Global Constraints

- Package name: `@superteam-lms/content-lint`. Private, version `0.0.1`. No build step: `"main": "./src/index.ts"`, `"types": "./src/index.ts"` — copy `packages/types/package.json`.
- The linter is **fail-closed on infrastructure**: if `runJsSubmission` returns `{ available: false }`, that is an `error` diagnostic, never a pass (mirrors the app's completion-gate contract in `executor.ts`).
- **Gate 6 tiers (spec §6.2a):** JS/TS `code` blocks are graded in-repo via `runJsSubmission` (pure Node, CI-safe). **Rust and `buildable` `code` blocks are DEFERRED to sync-time** and the linter emits a `notice` diagnostic for each (a logged skip, never a silent one, and never a failure).
- YAML is parsed with `yaml` v2 pinned to **1.2 core** (`parse(str, { version: "1.2" })`). Test fixtures (`tests.json`, `program.idl.json`, `slots.lock.json`) are parsed as **JSON** — `expectedOutput` has exact byte semantics and YAML coerces `1.0`→`1` (spec §4.2).
- `MAX_XP_PER_MINT = 5000`; the finalize invariant ceiling is `2 × MAX_XP_PER_MINT = 10000` (spec §5.2 / gate 5a). Both are imported from `@superteam-lms/content-schema`, never re-hardcoded.
- Capability ordering (gate 13a) is checked in **DISPLAY order** — the flattened `course.modules[].lessons[]` sequence — **NOT slot order** (spec §4.9). A slot-order check would pass a reordered course that shows a consumer before its producer.
- Course + achievement ids are ≤ 32 UTF-8 bytes (`byteLength` from content-schema); lesson/path/instructor/quest ids ≤ 128 bytes. Charset is the stricter `[a-z0-9-]` with a required kind prefix — enforced by the content-schema id schemas; the linter surfaces failures with the file path.
- IDs are **immutable vs the PR base**: an `id` present at the base ref whose value changed at head is a hard `error` (gate 2), detected via `git show <mergeBase>:<path>`.
- TDD throughout: every gate task writes a failing test first (a fixture repo tree that violates the gate → the linter emits that gate's `error`), then the real check, then run-to-pass, then commit.
- Test command throughout: `pnpm --filter @superteam-lms/content-lint test`. The CLI/bin is named `content-lint`.
- Zero `any`. All exports typed. No new runtime deps beyond `yaml` (git access is via `node:child_process`; file walking is via `node:fs` — no `fast-glob`).

## Prerequisite: this plan depends on Plan 1 (`@superteam-lms/content-schema`)

The linter imports `Course`, `Lesson`, `QuizBlock`, `Achievement`, `Quest`, `LearningPath`, `Instructor`, `Block`, `BLOCK_REGISTRY`, `CAPABILITY_KEYS`, `assignSlots`, `SlotsLock`, `byteLength`, `MAX_XP_PER_MINT` from `@superteam-lms/content-schema`. That package must be merged first (its plan is `docs/superpowers/plans/2026-07-09-content-schema-package.md`). Task 2's scaffold declares it as a `workspace:*` dependency.

## Note on the executor: a one-file extraction (Task 1)

The two-sided JS gate reuses `apps/web/src/lib/challenge/executor.ts`'s `runJsSubmission`. That module is **pure Node** (QuickJS-WASM via `quickjs-emscripten-core` + `@jitl/quickjs-singlefile-cjs-release-sync`, `sucrase` for transpile, and `@superteam-lms/types` for `AdminTestCase`) — it imports **no** React/Next/browser API (verified). A package under `packages/` must not reach into an app's `src/`, so Task 1 **moves `executor.ts` into a new tiny shared package `@superteam-lms/challenge-executor`** and leaves a one-line re-export shim at the old path, so every existing `@/lib/challenge/executor` importer (`rust-executor.ts`, `buildable-executor.ts`, `validate.ts`, and the two tests) is unchanged and the existing apps/web suite is the regression gate. Both `apps/web` and `content-lint` then import the **identical** `runJsSubmission` — making "the same oracle grades learners and content" literally true, which is the point of the two-sided gate.

## File Structure

```
packages/challenge-executor/          NEW (Task 1 — extraction)
├── package.json                      name @superteam-lms/challenge-executor, no build step
├── tsconfig.json                     copy of packages/types/tsconfig.json
└── src/
    ├── index.ts                      export * from "./executor"
    └── executor.ts                   MOVED verbatim from apps/web/src/lib/challenge/executor.ts

apps/web/src/lib/challenge/executor.ts  MODIFIED → one-line re-export shim (Task 1)

packages/content-lint/                NEW (this plan)
├── package.json                      name @superteam-lms/content-lint, bin/script content-lint, no build step
├── tsconfig.json                     copy of packages/types/tsconfig.json
├── vitest.config.ts                  node env, globals
└── src/
    ├── index.ts                      barrel: runLint, Diagnostic, types
    ├── cli.ts                        entry: parse argv/env, runLint, print, process.exit
    ├── diagnostics.ts                Diagnostic, Severity, LintResult, summarize, diag()
    ├── loader.ts                     discover() + parse (yaml 1.2 core / json) → RawDoc[]
    ├── model.ts                      RepoModel, CourseEntry, LessonEntry types
    ├── git.ts                        gitShow(), mergeBase(), normalizeBaseRef()
    ├── lint.ts                       runLint() orchestrator + CHECKS registry
    └── checks/
        ├── gate1-schema.ts           Zod-validate every file → typed model (Task 3)
        ├── gate2-ids.ts             uniqueness, charset/byte caps, immutability vs base (Task 4)
        ├── gate3-slots.ts           slots.lock.json == assignSlots regeneration (Task 5)
        ├── gate4-refs.ts            cross-reference resolution (Task 6)
        ├── gate5-orphans.ts        no orphan files under a lesson dir (Task 7)
        ├── gate5a-xp.ts            finalize XP invariant at repo scope (Task 8)
        ├── gate6-executor.ts       two-sided JS gate; Rust/buildable deferred w/ notice (Task 9)
        ├── gate7-quiz.ts           quiz surfacing (Task 10)
        ├── gate13a-capabilities.ts capability ordering by DISPLAY order (Task 11)
        └── gate13bcd-widgets.ts    widget registry + idl + slot-exhaustion warn (Task 12)
└── src/__tests__/
    ├── helpers.ts                   makeTempRepo(), writeTree(), withGitRepo()
    ├── fixtures/                     bad-* trees per gate + good/ template (Tasks 2–13)
    ├── loader.test.ts               (Task 2)
    ├── gate1.test.ts … gate13.test.ts   (one per gate task)
    └── good-template.test.ts        the _template tree is green end-to-end (Task 13)

.github/workflows/validate-content.yml   NEW — reusable workflow_call (Task 14, in THIS repo)
```

---

### Task 1: Extract the JS executor into `@superteam-lms/challenge-executor`

**Files:**
- Create: `packages/challenge-executor/package.json`
- Create: `packages/challenge-executor/tsconfig.json`
- Create: `packages/challenge-executor/src/index.ts`
- Move: `apps/web/src/lib/challenge/executor.ts` → `packages/challenge-executor/src/executor.ts`
- Modify: `apps/web/src/lib/challenge/executor.ts` (becomes a re-export shim)
- Modify: `apps/web/package.json` (add the workspace dep)

**Interfaces:**
- Consumes: nothing new.
- Produces: `@superteam-lms/challenge-executor` exporting `runJsSubmission(code: string, tests: AdminTestCase[]): Promise<SubmissionRunResult>`, `isExecutorAvailable()`, and the types `ServerTestResult`, `SubmissionRunResult` — **byte-identical** to today's `apps/web/src/lib/challenge/executor.ts`.

This is a mechanical move verified by the **existing** apps/web test suite; no new test is authored.

- [ ] **Step 1: Confirm the current suite is green (baseline)**

Run: `pnpm --filter @superteam-lms/web test src/lib/challenge/__tests__/executor.test.ts src/lib/challenge/__tests__/_exploit-repro.test.ts`
Expected: PASS — record the pass count; it must be identical after the move.

- [ ] **Step 2: Create the package**

`packages/challenge-executor/package.json`:

```json
{
  "name": "@superteam-lms/challenge-executor",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@jitl/quickjs-singlefile-cjs-release-sync": "^0.32.0",
    "@superteam-lms/types": "workspace:*",
    "quickjs-emscripten-core": "^0.32.0",
    "sucrase": "^3.35.1"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

`packages/challenge-executor/tsconfig.json` — copy `packages/types/tsconfig.json` verbatim.

`packages/challenge-executor/src/index.ts`:

```ts
export * from "./executor";
```

- [ ] **Step 3: Move `executor.ts` verbatim**

```bash
git mv apps/web/src/lib/challenge/executor.ts packages/challenge-executor/src/executor.ts
```

The file's import `import type { AdminTestCase } from "@superteam-lms/types";` already resolves from the new package (it declares the same workspace dep). No content change.

- [ ] **Step 4: Leave a re-export shim at the old path**

Recreate `apps/web/src/lib/challenge/executor.ts`:

```ts
/**
 * The JS/TS challenge executor now lives in `@superteam-lms/challenge-executor`
 * so the content linter (packages/content-lint) can reuse the SAME oracle that
 * grades learners at runtime. This shim preserves every existing
 * `@/lib/challenge/executor` import (rust-executor, buildable-executor,
 * validate, tests) unchanged.
 */
export * from "@superteam-lms/challenge-executor";
```

- [ ] **Step 5: Wire the workspace dep + reinstall**

Add to `apps/web/package.json` `dependencies`: `"@superteam-lms/challenge-executor": "workspace:*"`.

Run: `pnpm install`
Expected: lockfile updates; no errors.

- [ ] **Step 6: Re-run the suite — behaviour must be unchanged**

Run: `pnpm --filter @superteam-lms/web test src/lib/challenge/__tests__/executor.test.ts src/lib/challenge/__tests__/_exploit-repro.test.ts && pnpm --filter @superteam-lms/challenge-executor typecheck`
Expected: PASS — same count as Step 1; `tsc` exits 0.

- [ ] **Step 7: Commit**

```bash
git add packages/challenge-executor apps/web/src/lib/challenge/executor.ts apps/web/package.json pnpm-lock.yaml
git commit -m "refactor(challenge): extract runJsSubmission to @superteam-lms/challenge-executor"
```

---

### Task 2: Scaffold `content-lint` — diagnostics, loader, orchestrator, CLI

**Files:**
- Create: `packages/content-lint/package.json`, `tsconfig.json`, `vitest.config.ts`
- Create: `packages/content-lint/src/diagnostics.ts`, `loader.ts`, `model.ts`, `lint.ts`, `cli.ts`, `index.ts`
- Create: `packages/content-lint/src/__tests__/helpers.ts`
- Test: `packages/content-lint/src/__tests__/loader.test.ts`

**Interfaces:**
- Consumes: nothing yet from the checks; `@superteam-lms/content-schema` types for `model.ts`.
- Produces:
  - `Diagnostic { gate: string; severity: "error" | "warning" | "notice"; file: string; message: string }`, `LintResult { diagnostics: Diagnostic[]; ok: boolean }`, `summarize(d: Diagnostic[]): LintResult`, `diag(gate, severity, file, message): Diagnostic`.
  - `RawDoc { path: string; abs: string; kind: DocKind; data: unknown; parseError?: string }`, `DocKind`, `discover(root: string): RawDoc[]`, `walkFiles(root: string): string[]`.
  - `RepoModel`, `CourseEntry`, `LessonEntry` (typed collections, populated by Gate 1).
  - `Check = (model: RepoModel, ctx: LintContext) => Diagnostic[] | Promise<Diagnostic[]>`, `LintContext { root: string; baseRef?: string }`, `CHECKS: Check[]` (empty here; appended by later tasks), `runLint(root: string, opts?: { baseRef?: string }): Promise<LintResult>`.
  - Test helpers: `makeTempRepo(tree: Record<string, string>): string` (writes a file tree to a temp dir, returns its path).

- [ ] **Step 1: Write the failing test**

`packages/content-lint/src/__tests__/helpers.ts`:

```ts
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/** Write a `path -> contents` map into a fresh temp dir; return the dir. */
export function makeTempRepo(tree: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "content-lint-"));
  for (const [rel, contents] of Object.entries(tree)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, contents, "utf8");
  }
  return root;
}
```

`packages/content-lint/src/__tests__/loader.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { discover } from "../loader";
import { runLint } from "../lint";
import { makeTempRepo } from "./helpers";

describe("discover", () => {
  it("classifies every content file kind by path", () => {
    const root = makeTempRepo({
      "courses/solana-fundamentals/course.yaml": "id: course-solana-fundamentals\n",
      "courses/solana-fundamentals/slots.lock.json": "{}\n",
      "courses/solana-fundamentals/lessons/accounts/lesson.yaml": "id: lesson-accounts\n",
      "courses/solana-fundamentals/lessons/accounts/check.quiz.yaml": "key: check\n",
      "achievements/first-steps.yaml": "id: achievement-first-steps\n",
      "quests/complete-lesson.yaml": "id: quest-complete-lesson\n",
      "paths/solana-core.yaml": "id: path-solana-core\n",
      "instructors/ana-santos.yaml": "id: instructor-ana-santos\n",
      "README.md": "# ignored\n",
    });
    const kinds = discover(root).map((d) => d.kind).sort();
    expect(kinds).toEqual(
      ["achievement", "course", "instructor", "lesson", "path", "quest", "quiz", "slots"].sort(),
    );
  });

  it("reports a YAML parse error rather than throwing", () => {
    const root = makeTempRepo({ "instructors/x.yaml": "id: : : broken\n  - [\n" });
    const doc = discover(root).find((d) => d.kind === "instructor");
    expect(doc?.parseError).toBeTruthy();
  });
});

describe("runLint (empty)", () => {
  it("is ok on a repo with no content and no checks registered", async () => {
    const root = makeTempRepo({ "README.md": "# empty\n" });
    const result = await runLint(root);
    expect(result.ok).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-lint test`
Expected: FAIL — `No projects matched the filter` (package does not exist yet).

- [ ] **Step 3: Create the package manifest + config**

`packages/content-lint/package.json`:

```json
{
  "name": "@superteam-lms/content-lint",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "content-lint": "tsx src/cli.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@superteam-lms/challenge-executor": "workspace:*",
    "@superteam-lms/content-schema": "workspace:*",
    "@superteam-lms/types": "workspace:*",
    "yaml": "^2.8.2",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "tsx": "^4.21.0",
    "typescript": "^5.7.0",
    "vitest": "^4.0.18"
  }
}
```

`packages/content-lint/tsconfig.json` — copy `packages/types/tsconfig.json`; ensure `"include": ["src/**/*.ts"]` and `compilerOptions` include `"strict": true`, `"noUncheckedIndexedAccess": true`, `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"esModuleInterop": true`, `"skipLibCheck": true`.

`packages/content-lint/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { globals: true, environment: "node", testTimeout: 30_000 },
});
```

(`testTimeout` is raised because the Gate 6 tests instantiate the QuickJS WASM runtime.)

- [ ] **Step 4: Implement `diagnostics.ts`**

```ts
export type Severity = "error" | "warning" | "notice";

export interface Diagnostic {
  /** Gate identifier, e.g. "gate-1", "gate-13a". */
  gate: string;
  severity: Severity;
  /** Repo-relative path (or "" for repo-wide diagnostics). */
  file: string;
  message: string;
}

export interface LintResult {
  diagnostics: Diagnostic[];
  /** True iff there is no `error`-severity diagnostic. warnings/notices never fail. */
  ok: boolean;
}

export function diag(
  gate: string,
  severity: Severity,
  file: string,
  message: string,
): Diagnostic {
  return { gate, severity, file, message };
}

export function summarize(diagnostics: Diagnostic[]): LintResult {
  return { diagnostics, ok: !diagnostics.some((d) => d.severity === "error") };
}
```

- [ ] **Step 5: Implement `loader.ts`**

```ts
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";

export type DocKind =
  | "course" | "lesson" | "quiz"
  | "achievement" | "quest" | "path" | "instructor" | "slots";

export interface RawDoc {
  /** Repo-relative POSIX-style path. */
  path: string;
  abs: string;
  kind: DocKind;
  /** Parsed YAML (1.2 core) or JSON; undefined when parseError is set. */
  data: unknown;
  parseError?: string;
}

/** Directories we never descend into. */
const SKIP_DIRS = new Set([".git", "node_modules", ".github", "schema", ".vscode"]);

/** Every file under `root`, repo-relative, POSIX separators. */
export function walkFiles(root: string, dir = root): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      out.push(...walkFiles(root, abs));
    } else {
      out.push(relative(root, abs).split("\\").join("/"));
    }
  }
  return out;
}

/** Path-pattern classification. Returns null for files we do not lint directly. */
function classify(path: string): DocKind | null {
  if (/^courses\/[^/]+\/course\.yaml$/.test(path)) return "course";
  if (/^courses\/[^/]+\/slots\.lock\.json$/.test(path)) return "slots";
  if (/^courses\/[^/]+\/lessons\/[^/]+\/lesson\.yaml$/.test(path)) return "lesson";
  if (/^courses\/[^/]+\/lessons\/[^/]+\/[^/]+\.quiz\.yaml$/.test(path)) return "quiz";
  if (/^achievements\/[^/]+\.yaml$/.test(path)) return "achievement";
  if (/^quests\/[^/]+\.yaml$/.test(path)) return "quest";
  if (/^paths\/[^/]+\.yaml$/.test(path)) return "path";
  if (/^instructors\/[^/]+\.yaml$/.test(path)) return "instructor";
  return null;
}

function parseByKind(abs: string, kind: DocKind): unknown {
  const text = readFileSync(abs, "utf8");
  // slots.lock.json and *.json fixtures are JSON: exact byte semantics (spec §4.2).
  if (kind === "slots") return JSON.parse(text);
  // yaml v2 default schema for 1.2 is `core` — Norway-safe (No/Yes/off stay strings).
  return parseYaml(text, { version: "1.2" });
}

/** Discover + parse every lintable file. Parse failures become `parseError`, never throws. */
export function discover(root: string): RawDoc[] {
  const docs: RawDoc[] = [];
  for (const path of walkFiles(root)) {
    const kind = classify(path);
    if (!kind) continue;
    const abs = join(root, path);
    try {
      docs.push({ path, abs, kind, data: parseByKind(abs, kind) });
    } catch (err) {
      docs.push({
        path, abs, kind, data: undefined,
        parseError: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return docs;
}
```

- [ ] **Step 6: Implement `model.ts`**

```ts
import type {
  CourseT, LessonT, QuizBlockT, AchievementT, QuestT, LearningPathT, InstructorT, SlotsLockT,
} from "@superteam-lms/content-schema";

export interface LessonEntry {
  id: string;
  /** Repo-relative lesson directory. */
  dir: string;
  /** Repo-relative lesson.yaml path. */
  file: string;
  lesson: LessonT;
  /** Every repo-relative file under `dir` (for gate 5 orphan detection). */
  files: string[];
}

export interface CourseEntry {
  id: string;
  dir: string;
  file: string;
  course: CourseT;
  /** Repo-relative slots.lock.json path, if present. */
  slotsPath: string | null;
  slotsLock: SlotsLockT | null;
}

export interface RepoModel {
  root: string;
  courses: CourseEntry[];
  lessons: LessonEntry[];
  lessonsById: Map<string, LessonEntry>;
  standaloneQuizzes: { file: string; quiz: QuizBlockT }[];
  achievements: { file: string; achievement: AchievementT }[];
  quests: { file: string; quest: QuestT }[];
  paths: { file: string; path: LearningPathT }[];
  instructors: { file: string; instructor: InstructorT }[];
}

/** The typed collections start empty; Gate 1 (checks/gate1-schema.ts) fills them. */
export function emptyModel(root: string): RepoModel {
  return {
    root,
    courses: [], lessons: [], lessonsById: new Map(),
    standaloneQuizzes: [], achievements: [], quests: [], paths: [], instructors: [],
  };
}
```

- [ ] **Step 7: Implement `lint.ts`**

```ts
import { discover } from "./loader";
import { emptyModel, type RepoModel } from "./model";
import { diag, summarize, type Diagnostic, type LintResult } from "./diagnostics";

export interface LintContext {
  root: string;
  baseRef?: string;
}

export type Check = (
  model: RepoModel,
  ctx: LintContext,
) => Diagnostic[] | Promise<Diagnostic[]>;

/**
 * Gate 1 (checks/gate1-schema.ts) is special: it consumes the raw parsed docs
 * and PRODUCES the typed RepoModel. It is registered as `schemaCheck` so later
 * checks receive a populated model. Registered by Task 3.
 */
export let schemaCheck:
  | ((root: string, diagnostics: Diagnostic[]) => RepoModel)
  | undefined;
export function registerSchemaCheck(fn: typeof schemaCheck): void {
  schemaCheck = fn;
}

/** Gates 2..13. Appended by later tasks via `registerCheck`. */
export const CHECKS: Check[] = [];
export function registerCheck(check: Check): void {
  CHECKS.push(check);
}

export async function runLint(
  root: string,
  opts: { baseRef?: string } = {},
): Promise<LintResult> {
  const diagnostics: Diagnostic[] = [];

  // Parse-phase diagnostics (loader): a file that will not even parse.
  for (const doc of discover(root)) {
    if (doc.parseError) {
      diagnostics.push(
        diag("parse", "error", doc.path, `failed to parse: ${doc.parseError}`),
      );
    }
  }

  const model = schemaCheck ? schemaCheck(root, diagnostics) : emptyModel(root);

  const ctx: LintContext = { root, baseRef: opts.baseRef };
  for (const check of CHECKS) {
    diagnostics.push(...(await check(model, ctx)));
  }

  return summarize(diagnostics);
}
```

- [ ] **Step 8: Implement `cli.ts` and `index.ts`**

`packages/content-lint/src/cli.ts`:

```ts
import { runLint } from "./lint";
import type { Diagnostic } from "./diagnostics";

function normalizeBaseRef(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // GITHUB_BASE_REF is a bare branch name ("main"); a full ref is used verbatim.
  return raw.includes("/") ? raw : `origin/${raw}`;
}

function format(d: Diagnostic): string {
  const where = d.file ? ` ${d.file}` : "";
  return `[${d.severity}] ${d.gate}${where}: ${d.message}`;
}

async function main(): Promise<void> {
  const root = process.argv[2] ?? process.cwd();
  const baseRef = normalizeBaseRef(
    process.env.LINT_BASE_REF ?? process.env.GITHUB_BASE_REF,
  );
  const { diagnostics, ok } = await runLint(root, { baseRef });

  for (const d of diagnostics.filter((x) => x.severity === "notice")) console.log(format(d));
  for (const d of diagnostics.filter((x) => x.severity === "warning")) console.warn(format(d));
  for (const d of diagnostics.filter((x) => x.severity === "error")) console.error(format(d));

  const errors = diagnostics.filter((d) => d.severity === "error").length;
  console.log(
    ok
      ? `content-lint: OK (${diagnostics.length} diagnostics, 0 errors)`
      : `content-lint: FAILED (${errors} error${errors === 1 ? "" : "s"})`,
  );
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error("content-lint crashed:", err);
  process.exit(2);
});
```

`packages/content-lint/src/index.ts`:

```ts
export * from "./diagnostics";
export * from "./loader";
export * from "./model";
export * from "./lint";
```

- [ ] **Step 9: Install and run the loader test**

Run: `pnpm install && pnpm --filter @superteam-lms/content-lint test src/__tests__/loader.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 10: Commit**

```bash
git add packages/content-lint
git commit -m "feat(content-lint): scaffold — loader, diagnostics, runLint orchestrator, CLI"
```

---

### Task 3: Gate 1 — Zod-validate every content file (spec §6.2 gate 1)

**Files:**
- Create: `packages/content-lint/src/checks/gate1-schema.ts`
- Modify: `packages/content-lint/src/index.ts` (import the check for its registration side-effect)
- Test: `packages/content-lint/src/__tests__/gate1.test.ts`

**Interfaces:**
- Consumes: `discover` (loader), the schemas `Course`, `Lesson`, `QuizBlock`, `Achievement`, `Quest`, `LearningPath`, `Instructor`, `SlotsLock` from `@superteam-lms/content-schema`.
- Produces: `buildModel(root, diagnostics): RepoModel` registered via `registerSchemaCheck`. Emits a `gate-1` `error` per file that fails its schema; populates the typed `RepoModel` from files that pass. A `*.quiz.yaml` with no `type:` key is validated as a `quiz` block (the shorthand of spec §4.5 — `type` injected before parse).

- [ ] **Step 1: Write the failing test**

`packages/content-lint/src/__tests__/gate1.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema"; // registers the schema check
import { makeTempRepo } from "./helpers";

const okCourse = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
creator: { githubId: "123" }
modules:
  - key: m
    title: M
    lessons: [lesson-a]
`;

describe("gate 1 — schema validation", () => {
  it("passes a well-formed course", async () => {
    const root = makeTempRepo({ "courses/x/course.yaml": okCourse });
    const r = await runLint(root);
    expect(r.diagnostics.filter((d) => d.gate === "gate-1")).toEqual([]);
  });

  it("errors on a course missing a required field", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": okCourse.replace("title: X\n", ""),
    });
    const r = await runLint(root);
    const g1 = r.diagnostics.filter((d) => d.gate === "gate-1");
    expect(g1).toHaveLength(1);
    expect(g1[0]!.file).toBe("courses/x/course.yaml");
    expect(r.ok).toBe(false);
  });

  it("errors on a quiz with two correct options when multiSelect is false", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": okCourse,
      "courses/x/lessons/a/check.quiz.yaml": `key: check
questions:
  - id: q1
    prompt: pick one
    multiSelect: false
    options:
      - { id: a, label: A, correct: true }
      - { id: b, label: B, correct: true }
`,
    });
    const r = await runLint(root);
    const g1 = r.diagnostics.filter((d) => d.gate === "gate-1" && d.file.endsWith("check.quiz.yaml"));
    expect(g1).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate1.test.ts`
Expected: FAIL — `Cannot find module '../checks/gate1-schema'`.

- [ ] **Step 3: Implement `checks/gate1-schema.ts`**

```ts
import type { ZodType } from "zod";
import {
  Course, Lesson, QuizBlock, Achievement, Quest, LearningPath, Instructor, SlotsLock,
} from "@superteam-lms/content-schema";
import { discover, walkFiles, type DocKind, type RawDoc } from "../loader";
import { emptyModel, type RepoModel } from "../model";
import { registerSchemaCheck } from "../lint";
import { diag, type Diagnostic } from "../diagnostics";
import { dirname } from "node:path";

const SCHEMA: Record<DocKind, ZodType> = {
  course: Course,
  lesson: Lesson,
  quiz: QuizBlock,
  achievement: Achievement,
  quest: Quest,
  path: LearningPath,
  instructor: Instructor,
  slots: SlotsLock,
};

/** A standalone `*.quiz.yaml` may omit `type:` (spec §4.5 shorthand); inject it. */
function coerce(kind: DocKind, data: unknown): unknown {
  if (kind === "quiz" && data && typeof data === "object" && !("type" in data)) {
    return { type: "quiz", ...(data as Record<string, unknown>) };
  }
  return data;
}

function formatZodIssues(err: unknown): string {
  const issues = (err as { issues?: { path: (string | number)[]; message: string }[] }).issues;
  if (!issues) return String(err);
  return issues
    .map((i) => `${i.path.length ? i.path.join(".") + ": " : ""}${i.message}`)
    .join("; ");
}

/**
 * Gate 1 (spec §6.2). Validates every discovered file against its Zod schema and
 * builds the typed RepoModel from the files that pass. A parse failure was
 * already reported by the loader, so those docs are skipped here.
 */
export function buildModel(root: string, diagnostics: Diagnostic[]): RepoModel {
  const model = emptyModel(root);
  const docs = discover(root).filter((d): d is RawDoc & { data: unknown } => !d.parseError);

  // Map each course dir to the files under it, for lesson `files` (gate 5).
  const allFiles = walkFiles(root);

  // First pass: validate everything, collect typed entries.
  const validLessons: { doc: RawDoc; lesson: unknown }[] = [];
  const validCourses: { doc: RawDoc; course: unknown }[] = [];
  const slotsByDir = new Map<string, unknown>();

  for (const doc of docs) {
    const schema = SCHEMA[doc.kind];
    const parsed = schema.safeParse(coerce(doc.kind, doc.data));
    if (!parsed.success) {
      diagnostics.push(diag("gate-1", "error", doc.path, formatZodIssues(parsed.error)));
      continue;
    }
    const value = parsed.data;
    switch (doc.kind) {
      case "course": validCourses.push({ doc, course: value }); break;
      case "lesson": validLessons.push({ doc, lesson: value }); break;
      case "slots": slotsByDir.set(dirname(doc.path), value); break;
      case "quiz":
        model.standaloneQuizzes.push({ file: doc.path, quiz: value as never }); break;
      case "achievement":
        model.achievements.push({ file: doc.path, achievement: value as never }); break;
      case "quest":
        model.quests.push({ file: doc.path, quest: value as never }); break;
      case "path":
        model.paths.push({ file: doc.path, path: value as never }); break;
      case "instructor":
        model.instructors.push({ file: doc.path, instructor: value as never }); break;
    }
  }

  for (const { doc, lesson } of validLessons) {
    const dir = dirname(doc.path);
    const l = lesson as { id: string };
    const entry = {
      id: l.id, dir, file: doc.path, lesson: lesson as never,
      files: allFiles.filter((f) => f.startsWith(dir + "/")),
    };
    model.lessons.push(entry);
    model.lessonsById.set(l.id, entry);
  }

  for (const { doc, course } of validCourses) {
    const dir = dirname(doc.path);
    const c = course as { id: string };
    const slotsPathCandidate = `${dir}/slots.lock.json`;
    model.courses.push({
      id: c.id, dir, file: doc.path, course: course as never,
      slotsPath: allFiles.includes(slotsPathCandidate) ? slotsPathCandidate : null,
      slotsLock: (slotsByDir.get(dir) as never) ?? null,
    });
  }

  return model;
}

registerSchemaCheck(buildModel);
```

Append to `packages/content-lint/src/index.ts`:

```ts
export * from "./checks/gate1-schema";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate1.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-lint/src/checks/gate1-schema.ts \
        packages/content-lint/src/__tests__/gate1.test.ts \
        packages/content-lint/src/index.ts
git commit -m "feat(content-lint): gate 1 — Zod-validate every content file, build typed model"
```

---

### Task 4: Gate 2 — id uniqueness, charset/byte caps, immutability vs base (spec §6.2 gate 2)

**Files:**
- Create: `packages/content-lint/src/git.ts`
- Create: `packages/content-lint/src/checks/gate2-ids.ts`
- Modify: `packages/content-lint/src/index.ts`
- Test: `packages/content-lint/src/__tests__/gate2.test.ts`

**Interfaces:**
- Consumes: `RepoModel`, `LintContext`, `byteLength` from `@superteam-lms/content-schema`, git helpers.
- Produces:
  - `git.ts`: `mergeBase(root: string, baseRef: string): string | null`; `gitShow(root: string, ref: string, path: string): string | null` (returns null when the path did not exist at `ref`).
  - `gate2Check` registered via `registerCheck`. Errors on: duplicate id within a kind; a course/achievement id > 32 bytes; any id whose value changed vs the merge-base version of the *same file path*. (Charset + prefix are already enforced by Gate 1's id schemas; Gate 2 adds cross-file uniqueness, the byte cap surfacing, and immutability.)

- [ ] **Step 1: Write the failing test**

`packages/content-lint/src/__tests__/gate2.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate2-ids";
import { makeTempRepo } from "./helpers";

const course = (id: string) => `id: ${id}
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
creator: { githubId: "1" }
modules: [{ key: m, title: M, lessons: [lesson-a] }]
`;

describe("gate 2 — ids", () => {
  it("errors on a duplicate course id", async () => {
    const root = makeTempRepo({
      "courses/a/course.yaml": course("course-dupe"),
      "courses/b/course.yaml": course("course-dupe"),
    });
    const r = await runLint(root);
    expect(r.diagnostics.some((d) => d.gate === "gate-2" && /duplicate/i.test(d.message))).toBe(true);
  });

  it("errors on a mutated id vs the git base", async () => {
    const root = makeTempRepo({ "courses/a/course.yaml": course("course-original") });
    const git = (...args: string[]) => execFileSync("git", args, { cwd: root });
    git("init", "-q");
    git("config", "user.email", "t@t.t");
    git("config", "user.name", "t");
    git("add", "-A");
    git("commit", "-qm", "base");
    // Head mutates the id (immutable → hard fail).
    writeFileSync(join(root, "courses/a/course.yaml"), course("course-renamed"), "utf8");
    const r = await runLint(root, { baseRef: "HEAD" });
    expect(r.diagnostics.some((d) => d.gate === "gate-2" && /immutable|changed/i.test(d.message))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate2.test.ts`
Expected: FAIL — `Cannot find module '../checks/gate2-ids'`.

- [ ] **Step 3: Implement `git.ts`**

```ts
import { execFileSync } from "node:child_process";

function git(root: string, args: string[]): string | null {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

/** The merge-base of HEAD and baseRef; falls back to baseRef itself. Null if git is unavailable. */
export function mergeBase(root: string, baseRef: string): string | null {
  const mb = git(root, ["merge-base", "HEAD", baseRef]);
  if (mb) return mb.trim();
  // No common ancestor (e.g. baseRef == HEAD in a fresh repo) — use baseRef directly.
  return git(root, ["rev-parse", baseRef])?.trim() ?? null;
}

/** File contents at `ref`, or null when the path did not exist there. */
export function gitShow(root: string, ref: string, path: string): string | null {
  return git(root, ["show", `${ref}:${path}`]);
}
```

- [ ] **Step 4: Implement `checks/gate2-ids.ts`**

```ts
import { parse as parseYaml } from "yaml";
import { byteLength } from "@superteam-lms/content-schema";
import { registerCheck, type LintContext } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";
import { mergeBase, gitShow } from "../git";

const BYTE_CAP: Record<string, number> = { course: 32, achievement: 32 };

/** Every (kind, id, file) triple in the repo. */
function idsOf(model: RepoModel): { kind: string; id: string; file: string }[] {
  return [
    ...model.courses.map((c) => ({ kind: "course", id: c.id, file: c.file })),
    ...model.lessons.map((l) => ({ kind: "lesson", id: l.id, file: l.file })),
    ...model.achievements.map((a) => ({ kind: "achievement", id: a.achievement.id, file: a.file })),
    ...model.quests.map((q) => ({ kind: "quest", id: q.quest.id, file: q.file })),
    ...model.paths.map((p) => ({ kind: "path", id: p.path.id, file: p.file })),
    ...model.instructors.map((i) => ({ kind: "instructor", id: i.instructor.id, file: i.file })),
  ];
}

/** Read the `id:` field from a YAML string, tolerating a broken base version. */
function idFrom(text: string): string | undefined {
  try {
    const doc = parseYaml(text, { version: "1.2" }) as { id?: unknown };
    return typeof doc?.id === "string" ? doc.id : undefined;
  } catch {
    return undefined;
  }
}

export function gate2Check(model: RepoModel, ctx: LintContext): Diagnostic[] {
  const out: Diagnostic[] = [];
  const all = idsOf(model);

  // Uniqueness within each kind.
  const seen = new Map<string, string>(); // `${kind}:${id}` -> first file
  for (const { kind, id, file } of all) {
    const key = `${kind}:${id}`;
    const prev = seen.get(key);
    if (prev) {
      out.push(diag("gate-2", "error", file, `duplicate ${kind} id "${id}" (also in ${prev})`));
    } else {
      seen.set(key, file);
    }
    // Byte cap for PDA-seed ids.
    const cap = BYTE_CAP[kind];
    if (cap && byteLength(id) > cap) {
      out.push(diag("gate-2", "error", file, `${kind} id "${id}" is ${byteLength(id)} bytes (max ${cap})`));
    }
  }

  // Immutability vs the PR base: an id present at base whose value changed is a hard fail.
  if (ctx.baseRef) {
    const base = mergeBase(ctx.root, ctx.baseRef);
    if (base) {
      for (const { kind, id, file } of all) {
        const baseText = gitShow(ctx.root, base, file);
        if (baseText === null) continue; // file is new at head — nothing to compare
        const baseId = idFrom(baseText);
        if (baseId !== undefined && baseId !== id) {
          out.push(diag(
            "gate-2", "error", file,
            `${kind} id changed from "${baseId}" to "${id}" — ids are immutable (spec §4.7)`,
          ));
        }
      }
    }
  }

  return out;
}

registerCheck(gate2Check);
```

Append to `index.ts`: `export * from "./checks/gate2-ids";`

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate2.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 6: Commit**

```bash
git add packages/content-lint/src/git.ts packages/content-lint/src/checks/gate2-ids.ts \
        packages/content-lint/src/__tests__/gate2.test.ts packages/content-lint/src/index.ts
git commit -m "feat(content-lint): gate 2 — id uniqueness, byte caps, immutability vs base"
```

---

### Task 5: Gate 3 — `slots.lock.json` matches `assignSlots` regeneration (spec §6.2 gate 3)

**Files:**
- Create: `packages/content-lint/src/checks/gate3-slots.ts`
- Modify: `packages/content-lint/src/index.ts`
- Test: `packages/content-lint/src/__tests__/gate3.test.ts`

**Interfaces:**
- Consumes: `assignSlots`, `SlotsLock` from `@superteam-lms/content-schema`; `gitShow`/`mergeBase`; `RepoModel`.
- Produces: `gate3Check`. For each course, regenerates the lock via `assignSlots(baseLock, displayOrderLessonIds)` where `baseLock` is the course's committed `slots.lock.json` **at the merge-base** (or `null` if new), and errors if the committed head lock differs from the regeneration (a changed/reused slot, a non-monotonic `next`, a missing or stale lesson). Display order is `course.modules.flatMap(m => m.lessons)` — never slot order.

- [ ] **Step 1: Write the failing test**

`packages/content-lint/src/__tests__/gate3.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate3-slots";
import { makeTempRepo } from "./helpers";

const course = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
creator: { githubId: "1" }
modules: [{ key: m, title: M, lessons: [lesson-a, lesson-b] }]
`;
const lesson = (id: string) => `id: ${id}
slug: ${id.replace("lesson-", "")}
title: ${id}
blocks: [{ type: prose, key: intro, src: intro.md }]
`;

describe("gate 3 — slots", () => {
  const tree = (lock: string) => ({
    "courses/x/course.yaml": course,
    "courses/x/slots.lock.json": lock,
    "courses/x/lessons/a/lesson.yaml": lesson("lesson-a"),
    "courses/x/lessons/a/intro.md": "# a",
    "courses/x/lessons/b/lesson.yaml": lesson("lesson-b"),
    "courses/x/lessons/b/intro.md": "# b",
  });

  it("passes when the lock matches a fresh regeneration", async () => {
    const lock = JSON.stringify({ version: 1, slots: { "lesson-a": 0, "lesson-b": 1 }, retired: [], next: 2 });
    const r = await runLint(makeTempRepo(tree(lock)));
    expect(r.diagnostics.filter((d) => d.gate === "gate-3")).toEqual([]);
  });

  it("errors when a slot was renumbered", async () => {
    const lock = JSON.stringify({ version: 1, slots: { "lesson-a": 5, "lesson-b": 1 }, retired: [], next: 6 });
    const r = await runLint(makeTempRepo(tree(lock)));
    expect(r.diagnostics.some((d) => d.gate === "gate-3")).toBe(true);
  });

  it("errors when a new lesson is missing from the lock", async () => {
    const lock = JSON.stringify({ version: 1, slots: { "lesson-a": 0 }, retired: [], next: 1 });
    const r = await runLint(makeTempRepo(tree(lock)));
    expect(r.diagnostics.some((d) => d.gate === "gate-3")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate3.test.ts`
Expected: FAIL — `Cannot find module '../checks/gate3-slots'`.

- [ ] **Step 3: Implement `checks/gate3-slots.ts`**

```ts
import { assignSlots, SlotsLock, type SlotsLockT } from "@superteam-lms/content-schema";
import { registerCheck, type LintContext } from "../lint";
import { type RepoModel, type CourseEntry } from "../model";
import { diag, type Diagnostic } from "../diagnostics";
import { mergeBase, gitShow } from "../git";

/** Order-independent structural equality of two locks. */
function locksEqual(a: SlotsLockT, b: SlotsLockT): boolean {
  if (a.version !== b.version || a.next !== b.next) return false;
  const ak = Object.keys(a.slots), bk = Object.keys(b.slots);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (a.slots[k] !== b.slots[k]) return false;
  const ar = [...a.retired].sort((x, y) => x - y).join(",");
  const br = [...b.retired].sort((x, y) => x - y).join(",");
  return ar === br;
}

/** The committed lock at the merge-base, or null if new / unavailable. */
function baseLock(ctx: LintContext, course: CourseEntry): SlotsLockT | null {
  if (!ctx.baseRef || !course.slotsPath) return null;
  const base = mergeBase(ctx.root, ctx.baseRef);
  if (!base) return null;
  const text = gitShow(ctx.root, base, course.slotsPath);
  if (text === null) return null;
  const parsed = SlotsLock.safeParse(JSON.parse(text));
  return parsed.success ? parsed.data : null;
}

export function gate3Check(model: RepoModel, ctx: LintContext): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const course of model.courses) {
    const file = course.slotsPath ?? `${course.dir}/slots.lock.json`;
    if (!course.slotsLock) {
      out.push(diag("gate-3", "error", file, "missing or invalid slots.lock.json (run `pnpm content:slots`)"));
      continue;
    }
    const displayOrder = course.course.modules.flatMap((m) => m.lessons);
    // KNOWN LIMITATION: regenerating from the merge-base assumes no add-then-remove
    // of the SAME lesson within one PR (which would retire a slot the base never knew
    // about). `pnpm content:slots` regenerates incrementally from the immediately-
    // preceding commit, so a correctly-generated lock always passes; the rare intra-PR
    // churn case is the sync-time re-validation's job (spec §9.2).
    let expected: SlotsLockT;
    try {
      expected = assignSlots(baseLock(ctx, course), displayOrder);
    } catch (err) {
      out.push(diag("gate-3", "error", file, err instanceof Error ? err.message : String(err)));
      continue;
    }
    if (!locksEqual(course.slotsLock, expected)) {
      out.push(diag(
        "gate-3", "error", file,
        `slots.lock.json does not match regeneration — a slot was changed, reused, or a lesson is missing. Run \`pnpm content:slots\`. Expected ${JSON.stringify(expected)}`,
      ));
    }
  }
  return out;
}

registerCheck(gate3Check);
```

Append to `index.ts`: `export * from "./checks/gate3-slots";`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate3.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-lint/src/checks/gate3-slots.ts \
        packages/content-lint/src/__tests__/gate3.test.ts packages/content-lint/src/index.ts
git commit -m "feat(content-lint): gate 3 — slots.lock.json matches assignSlots regeneration"
```

---

### Task 6: Gate 4 — cross-references resolve (spec §6.2 gate 4)

**Files:**
- Create: `packages/content-lint/src/checks/gate4-refs.ts`
- Modify: `packages/content-lint/src/index.ts`
- Test: `packages/content-lint/src/__tests__/gate4.test.ts`

**Interfaces:**
- Consumes: `RepoModel`.
- Produces: `gate4Check`. Errors when: a lesson id in `course.modules[].lessons` has no lesson file; `course.instructor` names a missing instructor; a `path.courses[]` entry names a missing course; `course.prerequisiteCourse` names a missing course. (Instructor is optional; only checked when present.)

- [ ] **Step 1: Write the failing test**

`packages/content-lint/src/__tests__/gate4.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate4-refs";
import { makeTempRepo } from "./helpers";

describe("gate 4 — cross-references", () => {
  it("errors on a lesson id referenced by a module but absent from the repo", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
creator: { githubId: "1" }
modules: [{ key: m, title: M, lessons: [lesson-ghost] }]
`,
    });
    const r = await runLint(root);
    expect(r.diagnostics.some((d) => d.gate === "gate-4" && /lesson-ghost/.test(d.message))).toBe(true);
  });

  it("errors on a path referencing a missing course", async () => {
    const root = makeTempRepo({
      "paths/p.yaml": `id: path-p
slug: p
title: P
difficulty: beginner
courses: [course-missing]
`,
    });
    const r = await runLint(root);
    expect(r.diagnostics.some((d) => d.gate === "gate-4" && /course-missing/.test(d.message))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate4.test.ts`
Expected: FAIL — `Cannot find module '../checks/gate4-refs'`.

- [ ] **Step 3: Implement `checks/gate4-refs.ts`**

```ts
import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

export function gate4Check(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  const lessonIds = new Set(model.lessons.map((l) => l.id));
  const courseIds = new Set(model.courses.map((c) => c.id));
  const instructorIds = new Set(model.instructors.map((i) => i.instructor.id));

  for (const c of model.courses) {
    for (const m of c.course.modules) {
      for (const lid of m.lessons) {
        if (!lessonIds.has(lid)) {
          out.push(diag("gate-4", "error", c.file, `module "${m.key}" references missing lesson "${lid}"`));
        }
      }
    }
    if (c.course.instructor && !instructorIds.has(c.course.instructor)) {
      out.push(diag("gate-4", "error", c.file, `references missing instructor "${c.course.instructor}"`));
    }
    if (c.course.prerequisiteCourse && !courseIds.has(c.course.prerequisiteCourse)) {
      out.push(diag("gate-4", "error", c.file, `references missing prerequisite course "${c.course.prerequisiteCourse}"`));
    }
  }

  for (const p of model.paths) {
    for (const cid of p.path.courses) {
      if (!courseIds.has(cid)) {
        out.push(diag("gate-4", "error", p.file, `path references missing course "${cid}"`));
      }
    }
  }

  return out;
}

registerCheck(gate4Check);
```

Append to `index.ts`: `export * from "./checks/gate4-refs";`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate4.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-lint/src/checks/gate4-refs.ts \
        packages/content-lint/src/__tests__/gate4.test.ts packages/content-lint/src/index.ts
git commit -m "feat(content-lint): gate 4 — cross-reference resolution"
```

---

### Task 7: Gate 5 — no orphan files under a lesson directory (spec §6.2 gate 5)

**Files:**
- Create: `packages/content-lint/src/checks/gate5-orphans.ts`
- Modify: `packages/content-lint/src/index.ts`
- Test: `packages/content-lint/src/__tests__/gate5.test.ts`

**Interfaces:**
- Consumes: `RepoModel` (each `LessonEntry.files` is every file under the lesson dir).
- Produces: `gate5Check`. For each lesson, computes the set of *referenced* files — `lesson.yaml`, any `*.quiz.yaml`, every block `src`/`starter`/`solution`/`tests`/`idl`, and any relative asset referenced from a `prose` block's `.md` (markdown `![](path)` / `[](path)`) — and errors on any file under the lesson dir that is neither referenced nor a known name.

- [ ] **Step 1: Write the failing test**

`packages/content-lint/src/__tests__/gate5.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate5-orphans";
import { makeTempRepo } from "./helpers";

const course = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
creator: { githubId: "1" }
modules: [{ key: m, title: M, lessons: [lesson-a] }]
`;

describe("gate 5 — orphans", () => {
  it("errors on a file that no block references", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/slots.lock.json": JSON.stringify({ version: 1, slots: { "lesson-a": 0 }, retired: [], next: 1 }),
      "courses/x/lessons/a/lesson.yaml": `id: lesson-a
slug: a
title: A
blocks: [{ type: prose, key: intro, src: intro.md }]
`,
      "courses/x/lessons/a/intro.md": "# a",
      "courses/x/lessons/a/leftover.ts": "// nobody references this",
    });
    const r = await runLint(root);
    expect(r.diagnostics.some((d) => d.gate === "gate-5" && /leftover\.ts/.test(d.message))).toBe(true);
  });

  it("does not flag an asset referenced from markdown", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/slots.lock.json": JSON.stringify({ version: 1, slots: { "lesson-a": 0 }, retired: [], next: 1 }),
      "courses/x/lessons/a/lesson.yaml": `id: lesson-a
slug: a
title: A
blocks: [{ type: prose, key: intro, src: intro.md }]
`,
      "courses/x/lessons/a/intro.md": "# a\n\n![diagram](assets/accounts.png)\n",
      "courses/x/lessons/a/assets/accounts.png": "PNG",
    });
    const r = await runLint(root);
    expect(r.diagnostics.filter((d) => d.gate === "gate-5")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate5.test.ts`
Expected: FAIL — `Cannot find module '../checks/gate5-orphans'`.

- [ ] **Step 3: Implement `checks/gate5-orphans.ts`**

```ts
import { readFileSync } from "node:fs";
import { join, posix } from "node:path";
import { registerCheck } from "../lint";
import { type RepoModel, type LessonEntry } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

/** Files whose bare name is always allowed under a lesson dir. */
const KNOWN = (f: string): boolean => f === "lesson.yaml" || f.endsWith(".quiz.yaml");

/** Relative asset paths referenced from markdown image/link syntax. */
function markdownRefs(mdText: string): string[] {
  const refs: string[] = [];
  const re = /!?\[[^\]]*\]\(([^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(mdText))) {
    const target = m[1]!;
    if (!/^https?:|^#|^mailto:/.test(target)) refs.push(target.split("#")[0]!.split("?")[0]!);
  }
  return refs;
}

/** Every lesson-dir-relative file a lesson's blocks (and their markdown) reference. */
function referenced(entry: LessonEntry, root: string): Set<string> {
  const rel = new Set<string>();
  const add = (p: string | undefined) => { if (p) rel.add(posix.normalize(p)); };
  for (const b of entry.lesson.blocks as Record<string, unknown>[]) {
    add(b.src as string | undefined);
    add(b.starter as string | undefined);
    add(b.solution as string | undefined);
    add(b.tests as string | undefined);
    add(b.idl as string | undefined);
    if (b.type === "prose" && typeof b.src === "string") {
      const mdAbs = join(root, entry.dir, b.src);
      try {
        for (const r of markdownRefs(readFileSync(mdAbs, "utf8"))) add(r);
      } catch { /* missing md is a gate-1/gate-5 concern elsewhere */ }
    }
  }
  return rel;
}

export function gate5Check(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const entry of model.lessons) {
    const refs = referenced(entry, model.root);
    for (const file of entry.files) {
      const name = file.slice(entry.dir.length + 1); // lesson-dir-relative
      if (KNOWN(name)) continue;
      if (!refs.has(posix.normalize(name))) {
        out.push(diag("gate-5", "error", file, `orphan file — no block references it and it is not a known name`));
      }
    }
  }
  return out;
}

registerCheck(gate5Check);
```

Append to `index.ts`: `export * from "./checks/gate5-orphans";`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate5.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-lint/src/checks/gate5-orphans.ts \
        packages/content-lint/src/__tests__/gate5.test.ts packages/content-lint/src/index.ts
git commit -m "feat(content-lint): gate 5 — orphan file detection under lesson dirs"
```

---

### Task 8: Gate 5a — the finalize XP invariant at repo scope (spec §6.2 gate 5a / §5.2)

**Files:**
- Create: `packages/content-lint/src/checks/gate5a-xp.ts`
- Modify: `packages/content-lint/src/index.ts`
- Test: `packages/content-lint/src/__tests__/gate5a.test.ts`

**Interfaces:**
- Consumes: `RepoModel`, `MAX_XP_PER_MINT` from `@superteam-lms/content-schema`.
- Produces: `gate5aCheck`. For each course, asserts `xpPerLesson × liveLessonCount ≤ 2 × MAX_XP_PER_MINT` (= 10000), where `liveLessonCount = course.modules.flatMap(m => m.lessons).length`. The Course Zod refine already enforces this (Plan 1 Task 8), but gate 5a re-asserts it at repo scope with a message that names the finalize-forever consequence — the invariant is load-bearing enough to state twice.

- [ ] **Step 1: Write the failing test**

`packages/content-lint/src/__tests__/gate5a.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { gate5aCheck } from "../checks/gate5a-xp";
import { emptyModel } from "../model";

function courseModel(xpPerLesson: number, lessonCount: number) {
  const model = emptyModel("/tmp");
  const lessons = Array.from({ length: lessonCount }, (_, i) => `lesson-l${i}`);
  model.courses.push({
    id: "course-x", dir: "courses/x", file: "courses/x/course.yaml",
    slotsPath: null, slotsLock: null,
    course: { xpPerLesson, modules: [{ key: "m", title: "M", lessons }] } as never,
  });
  return model;
}

describe("gate 5a — finalize XP invariant", () => {
  it("passes at the boundary (product exactly 10000)", () => {
    expect(gate5aCheck(courseModel(100, 100))).toEqual([]);
  });

  it("errors when xpPerLesson × lessonCount exceeds 10000", () => {
    const d = gate5aCheck(courseModel(100, 101));
    expect(d).toHaveLength(1);
    expect(d[0]!.gate).toBe("gate-5a");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate5a.test.ts`
Expected: FAIL — `Cannot find module '../checks/gate5a-xp'`.

- [ ] **Step 3: Implement `checks/gate5a-xp.ts`**

```ts
import { MAX_XP_PER_MINT } from "@superteam-lms/content-schema";
import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

const CEILING = 2 * MAX_XP_PER_MINT; // 10000 — finalize bonus = xp/lesson * count / 2 <= MAX_XP_PER_MINT

export function gate5aCheck(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const c of model.courses) {
    const count = c.course.modules.flatMap((m) => m.lessons).length;
    const product = c.course.xpPerLesson * count;
    if (product > CEILING) {
      out.push(diag(
        "gate-5a", "error", c.file,
        `xpPerLesson (${c.course.xpPerLesson}) × liveLessonCount (${count}) = ${product} > ${CEILING}; finalize_course would revert forever — no learner could ever complete this course (spec §5.2)`,
      ));
    }
  }
  return out;
}

registerCheck(gate5aCheck);
```

Append to `index.ts`: `export * from "./checks/gate5a-xp";`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate5a.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-lint/src/checks/gate5a-xp.ts \
        packages/content-lint/src/__tests__/gate5a.test.ts packages/content-lint/src/index.ts
git commit -m "feat(content-lint): gate 5a — finalize XP invariant at repo scope"
```

---

### Task 9: Gate 6 (JS) — two-sided executor gate; Rust/buildable deferred (spec §6.2 gate 6 / §6.2a)

**Files:**
- Create: `packages/content-lint/src/checks/gate6-executor.ts`
- Modify: `packages/content-lint/src/index.ts`
- Test: `packages/content-lint/src/__tests__/gate6.test.ts`

**Interfaces:**
- Consumes: `runJsSubmission` from `@superteam-lms/challenge-executor`; `AdminTestCase` from `@superteam-lms/types`; `RepoModel`.
- Produces: `gate6Check` (async). For every `code` block:
  - `language: "typescript"` **and** `buildType !== "buildable"` → read `solution` + `tests.json`, run `runJsSubmission(solution, tests)` (must be `available && passed`) **and** `runJsSubmission(starter, tests)` (must be `available && !passed`). `available: false` → `error` (fail-closed). Solution failing or starter passing → `error`.
  - `language: "rust"` or `buildType: "buildable"` → a `notice` diagnostic recording the deferral to sync-time (spec §6.2a). Never an error.

- [ ] **Step 1: Write the failing test**

`packages/content-lint/src/__tests__/gate6.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate6-executor";
import { makeTempRepo } from "./helpers";

const course = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
creator: { githubId: "1" }
modules: [{ key: m, title: M, lessons: [lesson-a] }]
`;
const lessonYaml = `id: lesson-a
slug: a
title: A
blocks:
  - key: exercise
    type: code
    language: typescript
    starter: exercise/starter.ts
    solution: exercise/solution.ts
    tests: exercise/tests.json
`;
const tests = JSON.stringify([
  { id: "t1", input: "2, 3", expectedOutput: "result === 5" },
  { id: "t2", input: "10, -4", expectedOutput: "result === 6" },
]);
const SOLUTION = `function add(a: number, b: number): number { return a + b; }\n`;
const STARTER = `function add(a: number, b: number): number { return 0; }\n`;

function tree(starter: string, solution: string) {
  return {
    "courses/x/course.yaml": course,
    "courses/x/lessons/a/lesson.yaml": lessonYaml,
    "courses/x/lessons/a/exercise/starter.ts": starter,
    "courses/x/lessons/a/exercise/solution.ts": solution,
    "courses/x/lessons/a/exercise/tests.json": tests,
  };
}

describe("gate 6 — two-sided JS executor", () => {
  it("passes when solution passes and starter fails", async () => {
    const r = await runLint(makeTempRepo(tree(STARTER, SOLUTION)));
    expect(r.diagnostics.filter((d) => d.gate === "gate-6" && d.severity === "error")).toEqual([]);
  });

  it("errors when the starter already passes the tests", async () => {
    const r = await runLint(makeTempRepo(tree(SOLUTION, SOLUTION)));
    expect(r.diagnostics.some((d) => d.gate === "gate-6" && /starter/i.test(d.message))).toBe(true);
  });

  it("errors when the solution fails its own tests", async () => {
    const r = await runLint(makeTempRepo(tree(STARTER, STARTER)));
    expect(r.diagnostics.some((d) => d.gate === "gate-6" && /solution/i.test(d.message))).toBe(true);
  });

  it("defers a rust block with a notice, never an error", async () => {
    const rustLesson = lessonYaml
      .replace("language: typescript", "language: rust")
      .replace("starter.ts", "starter.rs").replace("solution.ts", "solution.rs");
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": rustLesson,
      "courses/x/lessons/a/exercise/starter.rs": "fn add() {}",
      "courses/x/lessons/a/exercise/solution.rs": "fn add() {}",
      "courses/x/lessons/a/exercise/tests.json": tests,
    });
    const r = await runLint(root);
    expect(r.diagnostics.some((d) => d.gate === "gate-6" && d.severity === "notice")).toBe(true);
    expect(r.diagnostics.filter((d) => d.gate === "gate-6" && d.severity === "error")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate6.test.ts`
Expected: FAIL — `Cannot find module '../checks/gate6-executor'`.

- [ ] **Step 3: Implement `checks/gate6-executor.ts`**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runJsSubmission } from "@superteam-lms/challenge-executor";
import type { AdminTestCase } from "@superteam-lms/types";
import { registerCheck } from "../lint";
import { type RepoModel, type LessonEntry } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

interface CodeBlock {
  type: "code";
  key: string;
  language: "typescript" | "rust";
  buildType?: "standard" | "buildable";
  starter: string;
  solution: string;
  tests: string;
}

function read(root: string, entry: LessonEntry, rel: string): string {
  return readFileSync(join(root, entry.dir, rel), "utf8");
}

function loadTests(root: string, entry: LessonEntry, rel: string): AdminTestCase[] {
  return JSON.parse(read(root, entry, rel)) as AdminTestCase[];
}

async function gradeJsBlock(
  root: string, entry: LessonEntry, block: CodeBlock,
): Promise<Diagnostic[]> {
  const out: Diagnostic[] = [];
  const where = `${entry.file} (block "${block.key}")`;
  let tests: AdminTestCase[];
  try {
    tests = loadTests(root, entry, block.tests);
  } catch (err) {
    return [diag("gate-6", "error", entry.file, `block "${block.key}": cannot read tests.json — ${err instanceof Error ? err.message : String(err)}`)];
  }

  const solution = await runJsSubmission(read(root, entry, block.solution), tests);
  if (!solution.available) {
    return [diag("gate-6", "error", entry.file, `${where}: executor unavailable — cannot verify (fail-closed)`)];
  }
  if (!solution.passed) {
    const failing = solution.results.filter((r) => !r.passed).map((r) => r.id).join(", ");
    out.push(diag("gate-6", "error", entry.file, `${where}: solution.ts does NOT pass its own tests (failing: ${failing})`));
  }

  const starter = await runJsSubmission(read(root, entry, block.starter), tests);
  if (!starter.available) {
    return [diag("gate-6", "error", entry.file, `${where}: executor unavailable — cannot verify (fail-closed)`)];
  }
  if (starter.passed) {
    out.push(diag("gate-6", "error", entry.file, `${where}: starter.ts already passes the tests — a starter must FAIL them (spec §3)`));
  }

  return out;
}

export async function gate6Check(model: RepoModel): Promise<Diagnostic[]> {
  const out: Diagnostic[] = [];
  for (const entry of model.lessons) {
    for (const raw of entry.lesson.blocks as Record<string, unknown>[]) {
      if (raw.type !== "code") continue;
      const block = raw as unknown as CodeBlock;
      const buildable = block.buildType === "buildable";
      if (block.language === "typescript" && !buildable) {
        out.push(...(await gradeJsBlock(model.root, entry, block)));
      } else {
        out.push(diag(
          "gate-6", "notice", entry.file,
          `block "${block.key}" (${block.language}${buildable ? ", buildable" : ""}) is DEFERRED to sync-time grading (spec §6.2a) — not verified in repo CI`,
        ));
      }
    }
  }
  return out;
}

registerCheck(gate6Check);
```

Append to `index.ts`: `export * from "./checks/gate6-executor";`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate6.test.ts`
Expected: PASS — 4 tests. (The QuickJS WASM runtime instantiates once; `testTimeout: 30_000` from Task 2 covers cold start.)

- [ ] **Step 5: Commit**

```bash
git add packages/content-lint/src/checks/gate6-executor.ts \
        packages/content-lint/src/__tests__/gate6.test.ts packages/content-lint/src/index.ts
git commit -m "feat(content-lint): gate 6 — two-sided JS executor gate; rust/buildable deferred"
```

---

### Task 10: Gate 7 — quiz surfacing (spec §6.2 gate 7)

**Files:**
- Create: `packages/content-lint/src/checks/gate7-quiz.ts`
- Modify: `packages/content-lint/src/index.ts`
- Test: `packages/content-lint/src/__tests__/gate7.test.ts`

**Interfaces:**
- Consumes: `RepoModel`, `QuizBlock` from `@superteam-lms/content-schema`.
- Produces: `gate7Check`. The `QuizBlock` refines (unique option ids, ≥1 correct, exactly-1-when-single-select) already fire in Gate 1 for both inline `quiz` blocks and standalone `*.quiz.yaml` files. Gate 7's job is to **surface them clearly**: it re-validates every quiz (inline block + standalone) and, for each failure, emits a `gate-7` `error` with a quiz-specific message rather than a raw Zod dump — so the failure reads as "quiz question q1: exactly one option must be correct" in CI logs.

- [ ] **Step 1: Write the failing test**

`packages/content-lint/src/__tests__/gate7.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate7-quiz";
import { makeTempRepo } from "./helpers";

const course = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
creator: { githubId: "1" }
modules: [{ key: m, title: M, lessons: [lesson-a] }]
`;

describe("gate 7 — quiz", () => {
  it("surfaces a quiz-specific message for an inline quiz block with no correct option", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": `id: lesson-a
slug: a
title: A
blocks:
  - key: check
    type: quiz
    questions:
      - id: q1
        prompt: pick
        multiSelect: false
        options:
          - { id: a, label: A, correct: false }
          - { id: b, label: B, correct: false }
`,
    });
    const r = await runLint(root);
    expect(r.diagnostics.some((d) => d.gate === "gate-7" && /correct/i.test(d.message))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate7.test.ts`
Expected: FAIL — `Cannot find module '../checks/gate7-quiz'`.

- [ ] **Step 3: Implement `checks/gate7-quiz.ts`**

Gate 1 already errored on these (schema failure), but with a generic message and — for an inline quiz block — attributed to the whole lesson. Gate 7 re-reads the raw files and produces a targeted quiz message. Both point at the same file; the duplication is intentional (a clear quiz message plus Gate 1's structural signal).

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { QuizBlock } from "@superteam-lms/content-schema";
import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

function checkQuiz(file: string, value: unknown): Diagnostic[] {
  const parsed = QuizBlock.safeParse(
    value && typeof value === "object" && !("type" in value)
      ? { type: "quiz", ...(value as Record<string, unknown>) }
      : value,
  );
  if (parsed.success) return [];
  return parsed.error.issues.map((i) =>
    diag("gate-7", "error", file, `quiz ${i.path.filter((p) => p !== "type").join(".") || "block"}: ${i.message}`),
  );
}

export function gate7Check(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];

  // Standalone *.quiz.yaml — already valid in the model; re-run for symmetry (no-op).
  for (const q of model.standaloneQuizzes) {
    out.push(...checkQuiz(q.file, q.quiz));
  }

  // Inline quiz blocks (re-read the lesson file to reach quizzes that failed Gate 1).
  for (const entry of model.lessons) {
    let raw: unknown;
    try {
      raw = parseYaml(readFileSync(join(model.root, entry.file), "utf8"), { version: "1.2" });
    } catch {
      continue; // parse error already reported
    }
    const blocks = (raw as { blocks?: unknown[] })?.blocks ?? [];
    for (const b of blocks) {
      if (b && typeof b === "object" && (b as { type?: unknown }).type === "quiz") {
        out.push(...checkQuiz(entry.file, b));
      }
    }
  }

  return out;
}

registerCheck(gate7Check);
```

Append to `index.ts`: `export * from "./checks/gate7-quiz";`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate7.test.ts`
Expected: PASS — 1 test.

- [ ] **Step 5: Commit**

```bash
git add packages/content-lint/src/checks/gate7-quiz.ts \
        packages/content-lint/src/__tests__/gate7.test.ts packages/content-lint/src/index.ts
git commit -m "feat(content-lint): gate 7 — surface quiz validation failures clearly"
```

---

### Task 11: Gate 13a — capability ordering by DISPLAY order (spec §6.2 gate 13a / §4.9)

**Files:**
- Create: `packages/content-lint/src/checks/gate13a-capabilities.ts`
- Modify: `packages/content-lint/src/index.ts`
- Test: `packages/content-lint/src/__tests__/gate13a.test.ts`

**Interfaces:**
- Consumes: `RepoModel`, `CAPABILITY_KEYS` from `@superteam-lms/content-schema`.
- Produces: `gate13aCheck`. For each course, flattens blocks into a single DISPLAY-order sequence (`course.modules[].lessons[]` order, then each lesson's `blocks[]` order) and errors when a block `consumes: X` with no earlier block that `produces: X`. Producer type is constrained per capability: `funded-wallet` only from a `wallet-funding` block; `deployed-program` only from a `code` block with `deployable: true`. A `produces: X` from the wrong block type does not satisfy a later `consumes: X`.

- [ ] **Step 1: Write the failing test**

`packages/content-lint/src/__tests__/gate13a.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate13a-capabilities";
import { makeTempRepo } from "./helpers";

function tree(lessonOrder: string[]) {
  return {
    "courses/x/course.yaml": `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
creator: { githubId: "1" }
modules: [{ key: m, title: M, lessons: [${lessonOrder.join(", ")}] }]
`,
    "courses/x/lessons/fund/lesson.yaml": `id: lesson-fund
slug: fund
title: Fund
blocks:
  - { key: fund, type: wallet-funding, amount: 2, network: devnet, produces: funded-wallet }
`,
    "courses/x/lessons/explore/lesson.yaml": `id: lesson-explore
slug: explore
title: Explore
blocks:
  - { key: explore, type: program-explorer, idl: program.idl.json, consumes: [funded-wallet] }
`,
  };
}

describe("gate 13a — capability ordering", () => {
  it("passes when the producer lesson precedes the consumer in display order", async () => {
    const r = await runLint(makeTempRepo(tree(["lesson-fund", "lesson-explore"])));
    expect(r.diagnostics.filter((d) => d.gate === "gate-13a")).toEqual([]);
  });

  it("errors when the consumer precedes the producer in display order", async () => {
    const r = await runLint(makeTempRepo(tree(["lesson-explore", "lesson-fund"])));
    expect(r.diagnostics.some((d) => d.gate === "gate-13a" && /funded-wallet/.test(d.message))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate13a.test.ts`
Expected: FAIL — `Cannot find module '../checks/gate13a-capabilities'`.

- [ ] **Step 3: Implement `checks/gate13a-capabilities.ts`**

```ts
import { CAPABILITY_KEYS } from "@superteam-lms/content-schema";
import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

type Block = Record<string, unknown> & { type: string; key: string; produces?: string; consumes?: string[] };

/** Only these block types may legitimately produce each capability (spec §4.9). */
const VALID_PRODUCER: Record<string, (b: Block) => boolean> = {
  "funded-wallet": (b) => b.type === "wallet-funding",
  "deployed-program": (b) => b.type === "code" && b.deployable === true,
};

export function gate13aCheck(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const course of model.courses) {
    // Flatten to DISPLAY order: module order, lesson order within module, block order within lesson.
    const seq: { lessonFile: string; block: Block }[] = [];
    for (const lid of course.course.modules.flatMap((m) => m.lessons)) {
      const lesson = model.lessonsById.get(lid);
      if (!lesson) continue; // missing lesson is a gate-4 error
      for (const b of lesson.lesson.blocks as Block[]) {
        seq.push({ lessonFile: lesson.file, block: b });
      }
    }

    const producedSoFar = new Set<string>();
    for (const { lessonFile, block } of seq) {
      for (const need of block.consumes ?? []) {
        if (!producedSoFar.has(need)) {
          out.push(diag(
            "gate-13a", "error", lessonFile,
            `block "${block.key}" consumes "${need}" but no earlier block (in display order) produces it (spec §4.9)`,
          ));
        }
      }
      // Register this block's output only if it is a VALID producer for that capability.
      if (block.produces && (CAPABILITY_KEYS as readonly string[]).includes(block.produces)) {
        const validator = VALID_PRODUCER[block.produces];
        if (validator && validator(block)) {
          producedSoFar.add(block.produces);
        } else {
          out.push(diag(
            "gate-13a", "error", lessonFile,
            `block "${block.key}" declares produces "${block.produces}" but is not a valid producer for it (spec §4.9)`,
          ));
        }
      }
    }
  }
  return out;
}

registerCheck(gate13aCheck);
```

Append to `index.ts`: `export * from "./checks/gate13a-capabilities";`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate13a.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-lint/src/checks/gate13a-capabilities.ts \
        packages/content-lint/src/__tests__/gate13a.test.ts packages/content-lint/src/index.ts
git commit -m "feat(content-lint): gate 13a — capability ordering by display order"
```

---

### Task 12: Gates 13b/13c/13d — widget registry, program IDL, slot-exhaustion warning (spec §6.2)

**Files:**
- Create: `packages/content-lint/src/checks/gate13bcd-widgets.ts`
- Modify: `packages/content-lint/src/index.ts`
- Test: `packages/content-lint/src/__tests__/gate13bcd.test.ts`

**Interfaces:**
- Consumes: `RepoModel`, `BLOCK_REGISTRY` from `@superteam-lms/content-schema`.
- Produces: `gate13bcdCheck`. Three checks:
  - **13b** (structural): every block `type` is a key of `BLOCK_REGISTRY`. Under Amendment A each widget is a first-class block type, so an unknown widget already fails the discriminated union in Gate 1; 13b is a belt-and-suspenders assertion that surfaces a clear message if a parsed block type is somehow absent from the registry.
  - **13c**: each `program-explorer` block's `idl` file parses as JSON, has a non-empty `instructions` array, and a non-empty `metadata.name` string.
  - **13d**: `warning` when a course's `slots.lock.json` `next > 200` (of 256) — each lesson replacement burns a slot forever.

- [ ] **Step 1: Write the failing test**

`packages/content-lint/src/__tests__/gate13bcd.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { runLint } from "../lint";
import "../checks/gate1-schema";
import "../checks/gate13bcd-widgets";
import { makeTempRepo } from "./helpers";

const course = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
xpPerLesson: 10
xpReward: 100
creator: { githubId: "1" }
modules: [{ key: m, title: M, lessons: [lesson-a] }]
`;
const explorerLesson = `id: lesson-a
slug: a
title: A
blocks:
  - { key: explore, type: program-explorer, idl: program.idl.json, consumes: [deployed-program] }
`;

describe("gate 13c — program.idl.json", () => {
  it("errors on an idl with an empty instructions array", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": explorerLesson,
      "courses/x/lessons/a/program.idl.json": JSON.stringify({ instructions: [], metadata: { name: "x" } }),
    });
    const r = await runLint(root);
    expect(r.diagnostics.some((d) => d.gate === "gate-13c" && /instructions/.test(d.message))).toBe(true);
  });

  it("passes a well-formed idl", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": explorerLesson,
      "courses/x/lessons/a/program.idl.json": JSON.stringify({ instructions: [{ name: "init" }], metadata: { name: "counter" } }),
    });
    const r = await runLint(root);
    expect(r.diagnostics.filter((d) => d.gate === "gate-13c")).toEqual([]);
  });
});

describe("gate 13d — slot exhaustion", () => {
  it("warns (not errors) when next exceeds 200", async () => {
    const root = makeTempRepo({
      "courses/x/course.yaml": course,
      "courses/x/lessons/a/lesson.yaml": `id: lesson-a
slug: a
title: A
blocks: [{ type: prose, key: intro, src: intro.md }]
`,
      "courses/x/lessons/a/intro.md": "# a",
      "courses/x/slots.lock.json": JSON.stringify({ version: 1, slots: { "lesson-a": 0 }, retired: [], next: 201 }),
    });
    const r = await runLint(root);
    expect(r.diagnostics.some((d) => d.gate === "gate-13d" && d.severity === "warning")).toBe(true);
    expect(r.diagnostics.filter((d) => d.gate === "gate-13d" && d.severity === "error")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate13bcd.test.ts`
Expected: FAIL — `Cannot find module '../checks/gate13bcd-widgets'`.

- [ ] **Step 3: Implement `checks/gate13bcd-widgets.ts`**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BLOCK_REGISTRY } from "@superteam-lms/content-schema";
import { registerCheck } from "../lint";
import { type RepoModel } from "../model";
import { diag, type Diagnostic } from "../diagnostics";

const SLOT_WARN_THRESHOLD = 200; // of 256 (spec §6.2 gate 13d)

function checkIdl(root: string, dir: string, idlRel: string): Diagnostic[] {
  let idl: unknown;
  try {
    idl = JSON.parse(readFileSync(join(root, dir, idlRel), "utf8"));
  } catch (err) {
    return [diag("gate-13c", "error", `${dir}/${idlRel}`, `program.idl.json does not parse: ${err instanceof Error ? err.message : String(err)}`)];
  }
  const out: Diagnostic[] = [];
  const obj = idl as { instructions?: unknown; metadata?: { name?: unknown } };
  if (!Array.isArray(obj.instructions) || obj.instructions.length === 0) {
    out.push(diag("gate-13c", "error", `${dir}/${idlRel}`, "program.idl.json has an empty or missing `instructions` array"));
  }
  if (typeof obj.metadata?.name !== "string" || obj.metadata.name.length === 0) {
    out.push(diag("gate-13c", "error", `${dir}/${idlRel}`, "program.idl.json is missing a non-empty `metadata.name`"));
  }
  return out;
}

export function gate13bcdCheck(model: RepoModel): Diagnostic[] {
  const out: Diagnostic[] = [];
  const registryKeys = new Set(Object.keys(BLOCK_REGISTRY));

  for (const entry of model.lessons) {
    for (const b of entry.lesson.blocks as Record<string, unknown>[]) {
      // 13b — structural: the block type must be a registry key.
      if (typeof b.type === "string" && !registryKeys.has(b.type)) {
        out.push(diag("gate-13b", "error", entry.file, `block "${String(b.key)}" has type "${b.type}" absent from BLOCK_REGISTRY`));
      }
      // 13c — program.idl.json validity for program-explorer blocks.
      if (b.type === "program-explorer" && typeof b.idl === "string") {
        out.push(...checkIdl(model.root, entry.dir, b.idl));
      }
    }
  }

  // 13d — slot-exhaustion warning.
  for (const c of model.courses) {
    if (c.slotsLock && c.slotsLock.next > SLOT_WARN_THRESHOLD) {
      out.push(diag(
        "gate-13d", "warning", c.slotsPath ?? `${c.dir}/slots.lock.json`,
        `slot cursor next=${c.slotsLock.next} exceeds ${SLOT_WARN_THRESHOLD} of 256 — each lesson replacement burns a slot forever; at exhaustion the course can never add a lesson without a new id`,
      ));
    }
  }

  return out;
}

registerCheck(gate13bcdCheck);
```

Append to `index.ts`: `export * from "./checks/gate13bcd-widgets";`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/gate13bcd.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/content-lint/src/checks/gate13bcd-widgets.ts \
        packages/content-lint/src/__tests__/gate13bcd.test.ts packages/content-lint/src/index.ts
git commit -m "feat(content-lint): gates 13b/13c/13d — widget registry, program IDL, slot exhaustion"
```

---

### Task 13: The green `_template` fixture — every gate passes end-to-end

**Files:**
- Create: `packages/content-lint/src/__tests__/fixtures/good/` (a full mini `academy-courses` tree)
- Test: `packages/content-lint/src/__tests__/good-template.test.ts`

**Interfaces:**
- Consumes: `runLint`, all registered checks (import `../index` so every `registerCheck` side-effect runs).
- Produces: a committed reference tree the linter runs **green** on (zero `error` diagnostics), doubling as the `courses/_template/`-style example the `academy-courses` repo ships (spec §12). It exercises every block type: prose+image, video, a TypeScript `code` block (two-sided), a deferred Rust `code` block, an inline quiz (single + multi select), an `openEnded` reflection, and the capability chain (`wallet-funding → deployable code → program-explorer`).

- [ ] **Step 1: Write the failing test**

`packages/content-lint/src/__tests__/good-template.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { runLint } from "../lint";
import "../index"; // registers every gate check

const FIXTURE = join(__dirname, "fixtures", "good");

describe("good template fixture", () => {
  it("produces zero error-severity diagnostics", async () => {
    const r = await runLint(FIXTURE);
    const errors = r.diagnostics.filter((d) => d.severity === "error");
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("emits a deferral notice for the rust block (proving the skip is logged, not silent)", async () => {
    const r = await runLint(FIXTURE);
    expect(r.diagnostics.some((d) => d.gate === "gate-6" && d.severity === "notice")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/good-template.test.ts`
Expected: FAIL — `ENOENT` (fixture tree absent).

- [ ] **Step 3: Create the fixture tree**

Create these files under `packages/content-lint/src/__tests__/fixtures/good/`.

`instructors/ana-santos.yaml`:

```yaml
id: instructor-ana-santos
name: Ana Santos
```

`achievements/first-steps.yaml`:

```yaml
id: achievement-first-steps
name: First Steps
category: progress
xpReward: 50
award: { kind: lessons-completed, gte: 1 }
```

`quests/complete-lesson.yaml`:

```yaml
id: quest-complete-lesson
name: Complete a Lesson
type: lesson
xpReward: 25
targetValue: 1
resetType: daily
```

`paths/solana-core.yaml`:

```yaml
id: path-solana-core
slug: solana-core
title: Solana Core
difficulty: beginner
courses: [course-template]
```

`courses/template/course.yaml`:

```yaml
id: course-template
slug: template
title: Template Course
difficulty: beginner
duration: 2
xpPerLesson: 10
xpReward: 100
creator: { githubId: "12345678" }
instructor: instructor-ana-santos
modules:
  - key: intro
    title: Intro
    lessons: [lesson-t-basics, lesson-t-exercise]
  - key: chain
    title: On-chain chain
    lessons: [lesson-t-fund, lesson-t-deploy, lesson-t-interact]
```

`courses/template/slots.lock.json`:

```json
{
  "version": 1,
  "slots": {
    "lesson-t-basics": 0,
    "lesson-t-exercise": 1,
    "lesson-t-fund": 2,
    "lesson-t-deploy": 3,
    "lesson-t-interact": 4
  },
  "retired": [],
  "next": 5
}
```

`courses/template/lessons/basics/lesson.yaml` (prose + image, video, inline quiz, openEnded):

```yaml
id: lesson-t-basics
slug: basics
title: Basics
blocks:
  - { key: intro, type: prose, src: intro.md }
  - { key: watch, type: video, url: "https://youtu.be/dQw4w9WgXcQ" }
  - key: check
    type: quiz
    questions:
      - id: q1
        prompt: Which accounts store state?
        multiSelect: true
        options:
          - { id: a, label: Data accounts, correct: true }
          - { id: b, label: Program accounts, correct: true }
          - { id: c, label: Instructions, correct: false, feedback: Inputs, not accounts. }
      - id: q2
        prompt: Pick the base unit.
        multiSelect: false
        options:
          - { id: a, label: Lamport, correct: true }
          - { id: b, label: Gwei, correct: false }
  - { key: reflect, type: openEnded, prompt: "What did you learn?", maxWords: 120 }
```

`courses/template/lessons/basics/intro.md`:

```markdown
# Basics

Accounts store state on Solana.

![accounts diagram](assets/accounts.png)
```

`courses/template/lessons/basics/assets/accounts.png`:

```
PNG-PLACEHOLDER
```

`courses/template/lessons/exercise/lesson.yaml` (two-sided TS code + deferred Rust code):

```yaml
id: lesson-t-exercise
slug: exercise
title: Exercise
blocks:
  - key: ts
    type: code
    language: typescript
    starter: ts/starter.ts
    solution: ts/solution.ts
    tests: ts/tests.json
    hints: [Add the two numbers.]
  - key: rs
    type: code
    language: rust
    starter: rs/starter.rs
    solution: rs/solution.rs
    tests: rs/tests.json
```

`courses/template/lessons/exercise/ts/starter.ts`:

```ts
function add(a: number, b: number): number {
  return 0;
}
```

`courses/template/lessons/exercise/ts/solution.ts`:

```ts
function add(a: number, b: number): number {
  return a + b;
}
```

`courses/template/lessons/exercise/ts/tests.json`:

```json
[
  { "id": "t1", "input": "2, 3", "expectedOutput": "result === 5" },
  { "id": "t2", "input": "10, -4", "expectedOutput": "result === 6" }
]
```

`courses/template/lessons/exercise/rs/starter.rs`:

```rust
fn add(a: i64, b: i64) -> i64 { 0 }
```

`courses/template/lessons/exercise/rs/solution.rs`:

```rust
fn add(a: i64, b: i64) -> i64 { a + b }
```

`courses/template/lessons/exercise/rs/tests.json`:

```json
[{ "id": "t1", "input": "2, 3", "expectedOutput": "5" }]
```

`courses/template/lessons/fund/lesson.yaml` (produces funded-wallet):

```yaml
id: lesson-t-fund
slug: fund
title: Fund
blocks:
  - { key: fund, type: wallet-funding, amount: 2, network: devnet, produces: funded-wallet }
```

`courses/template/lessons/deploy/lesson.yaml` (deployable code — consumes funded-wallet, produces deployed-program; Rust+buildable → deferred notice):

```yaml
id: lesson-t-deploy
slug: deploy
title: Deploy
blocks:
  - key: build
    type: code
    language: rust
    buildType: buildable
    deployable: true
    starter: program/starter.rs
    solution: program/solution.rs
    tests: program/tests.json
    consumes: [funded-wallet]
    produces: deployed-program
```

`courses/template/lessons/deploy/program/starter.rs`:

```rust
// starter program
```

`courses/template/lessons/deploy/program/solution.rs`:

```rust
// solution program
```

`courses/template/lessons/deploy/program/tests.json`:

```json
[{ "id": "t1", "input": "", "expectedOutput": "ok" }]
```

`courses/template/lessons/interact/lesson.yaml` (program-explorer — consumes deployed-program, real idl):

```yaml
id: lesson-t-interact
slug: interact
title: Interact
blocks:
  - { key: explore, type: program-explorer, idl: program.idl.json, consumes: [deployed-program] }
```

`courses/template/lessons/interact/program.idl.json`:

```json
{
  "metadata": { "name": "counter" },
  "instructions": [{ "name": "increment" }]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @superteam-lms/content-lint test src/__tests__/good-template.test.ts`
Expected: PASS — 2 tests. If any gate reports an error, the first assertion prints the offending diagnostics as JSON; fix the fixture (it is the reference, so a real error means the template is wrong).

- [ ] **Step 5: Run the whole suite + the CLI against the fixture**

Run: `pnpm --filter @superteam-lms/content-lint test`
Expected: PASS — every gate test file green.

Run: `pnpm --filter @superteam-lms/content-lint exec tsx src/cli.ts src/__tests__/fixtures/good`
Expected: prints deferral notices, then `content-lint: OK (... diagnostics, 0 errors)`, exit 0.

Verify the red path manually: temporarily break the template (e.g. set `xpPerLesson: 9999` in `course.yaml`) and re-run the CLI — expect `content-lint: FAILED (1 error)`, exit 1. Restore the file. This smoke check produces no commit.

- [ ] **Step 6: Commit**

```bash
git add packages/content-lint/src/__tests__/fixtures/good \
        packages/content-lint/src/__tests__/good-template.test.ts
git commit -m "test(content-lint): green _template fixture exercising every gate"
```

---

### Task 14: The reusable GitHub Actions workflow (spec §9.1 / §6.2)

**Files:**
- Create: `.github/workflows/validate-content.yml` (in **this** repo, `solanabr/superteam-academy`)
- Create: `packages/content-lint/README.md` (documents the CLI + the caller snippet for `academy-courses`)

**Interfaces:**
- Consumes: the `content-lint` package script.
- Produces: a `workflow_call` workflow the `academy-courses` repo invokes as `uses: solanabr/superteam-academy/.github/workflows/validate-content.yml@main`. It checks out the caller's content (full history, for gate 2/3 base diffs) and this monorepo (for the linter), installs, and runs the CLI against the content tree with the PR base ref exported as `LINT_BASE_REF`.

- [ ] **Step 1: Write `.github/workflows/validate-content.yml`**

```yaml
name: validate-content

on:
  workflow_call:
    inputs:
      linter-ref:
        description: Ref of solanabr/superteam-academy to source the linter from.
        type: string
        default: main

permissions:
  contents: read

jobs:
  content-lint:
    runs-on: ubuntu-latest
    steps:
      # 1. The caller's content repo (academy-courses) at the PR head, full history
      #    so gate 2 (id immutability) and gate 3 (slots regeneration) can diff base.
      - name: Checkout content
        uses: actions/checkout@v4
        with:
          path: content
          fetch-depth: 0

      # 2. This monorepo, for @superteam-lms/content-lint + content-schema + executor.
      - name: Checkout linter
        uses: actions/checkout@v4
        with:
          repository: solanabr/superteam-academy
          ref: ${{ inputs.linter-ref }}
          path: linter

      - uses: pnpm/action-setup@v4
        with:
          package_json_file: linter/package.json

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: linter/pnpm-lock.yaml

      - name: Install (linter workspace only)
        working-directory: linter
        run: pnpm install --frozen-lockfile --filter @superteam-lms/content-lint...

      # 3. Make the PR base fetchable for the in-repo git diffs (gate 2/3).
      - name: Fetch content base ref
        if: github.event_name == 'pull_request'
        working-directory: content
        run: git fetch --no-tags --depth=1 origin "${{ github.base_ref }}"

      - name: Run content-lint
        working-directory: linter
        env:
          # gate 2/3 compare against origin/<base>; normalizeBaseRef prefixes origin/.
          LINT_BASE_REF: ${{ github.base_ref }}
        run: pnpm --filter @superteam-lms/content-lint exec tsx src/cli.ts "$GITHUB_WORKSPACE/content"
```

Notes captured in the plan (no code): the linter reads `LINT_BASE_REF`; `cli.ts`'s `normalizeBaseRef` turns a bare `main` into `origin/main`, and `git.ts` runs `git` inside the content dir (the CLI's argv path). The git commands in `git.ts` use `cwd: root` (the content dir), so the base fetch above populates `origin/<base>` there. On non-PR events `LINT_BASE_REF` is empty → gates 2/3 skip the immutability/base-diff arm (uniqueness, byte caps, and fresh-regeneration still run).

- [ ] **Step 2: Write `packages/content-lint/README.md`**

Document: what the linter is; the gate list (1–5, 5a, 6-JS, 7, 13a–13d) and which run where (Rust/buildable deferred to sync per §6.2a); the CLI (`content-lint <content-dir>`, env `LINT_BASE_REF`); and the exact caller snippet the `academy-courses` repo commits at `.github/workflows/validate.yml`:

````markdown
```yaml
# academy-courses/.github/workflows/validate.yml
name: validate
on:
  pull_request:
jobs:
  content:
    uses: solanabr/superteam-academy/.github/workflows/validate-content.yml@main
```
````

- [ ] **Step 3: Lint the workflow YAML locally**

Run: `pnpm --filter @superteam-lms/content-lint exec tsx -e "import {readFileSync} from 'node:fs'; import {parse} from 'yaml'; parse(readFileSync('../../.github/workflows/validate-content.yml','utf8')); console.log('workflow YAML parses')"`
Expected: `workflow YAML parses` (a syntactic sanity check; the workflow itself is exercised when `academy-courses` opens its first PR).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/validate-content.yml packages/content-lint/README.md
git commit -m "ci(content-lint): reusable validate-content workflow for academy-courses"
```

---

## Verification

- **Unit suite:** `pnpm --filter @superteam-lms/content-lint test` — every gate test file green (loader, gate1, gate2, gate3, gate4, gate5, gate5a, gate6, gate7, gate13a, gate13bcd, good-template).
- **Typecheck under strict mode:** `pnpm --filter @superteam-lms/content-lint typecheck` and `pnpm --filter @superteam-lms/challenge-executor typecheck` — both exit 0 (`noUncheckedIndexedAccess` on). `pnpm typecheck` (turbo) picks up both new packages.
- **Green on the good fixture, red on each bad fixture:** the `good/` `_template` tree produces **zero** `error` diagnostics (Task 13); every `bad-*`/violating fixture in Tasks 3–12 makes exactly its gate report an `error` and `runLint(...).ok === false`.
- **The two-sided JS gate reuses the real `runJsSubmission`** (`@superteam-lms/challenge-executor`, the module extracted from `apps/web` in Task 1) — so a `code` block's `solution.ts`/`starter.ts` are graded by the **same** QuickJS-WASM oracle that grades a learner at runtime. This makes content correctness machine-checked at merge time, which is the durable fix for the July 2026 false-403 rebalance (test sets were fixed by hand in Sanity and nothing verified them since; spec §15.6).
- **apps/web regression:** `pnpm --filter @superteam-lms/web test src/lib/challenge/__tests__` stays green after Task 1 (the executor extraction is behaviour-preserving via the re-export shim).
- **Fail-closed:** an `available: false` from the executor is an `error`, never a pass (Task 9), mirroring the app's completion gate.

## Self-Review

**Spec coverage (the 11 required items):**
1. Gate 1 Zod-validate all content files → Task 3.
2. Gate 2 id uniqueness + immutability vs base (git) + charset + ≤32-byte caps → Task 4 (charset/prefix via content-schema id schemas in Gate 1).
3. Gate 3 slots.lock.json == `assignSlots` regeneration (no slot changed/reused, `next` monotonic) → Task 5.
4. Gate 4 cross-references resolve (modules→lessons, instructor, path→courses, prerequisite) → Task 6.
5. Gate 5 orphan files under a lesson dir → Task 7.
6. Gate 5a finalize XP invariant `xpPerLesson × lessonCount ≤ 10000` at repo scope → Task 8.
7. Gate 6 JS two-sided (solution passes / starter fails), Rust+buildable deferred with a logged `notice` → Task 9.
8. Gate 7 quiz surfacing (unique option ids, ≥1 correct, exactly-1 single-select) → Task 10.
9. Gate 13a capability ordering by DISPLAY order + per-capability producer-type constraint → Task 11.
10. Gates 13b (widget registry key, structural) / 13c (program.idl.json parses + non-empty instructions + metadata.name) / 13d (slot-exhaustion warning at `next > 200`) → Task 12.
11. Reusable GitHub Actions workflow (`validate-content.yml`, `workflow_call`, called via `uses: solanabr/superteam-academy/...@main`) → Task 14.

Supporting: Task 1 (executor extraction, so the linter imports the real oracle), Task 2 (scaffold + loader + orchestrator + CLI), Task 13 (green `_template` fixture).

**Deliberately out of scope (owned elsewhere):** gates 8–12 (quest/achievement enums + caps, award-kind implemented, path draft) are enforced by the content-schema Zod refines at Gate 1 and need no separate linter check beyond surfacing (covered by Gate 1's per-file error). Gates 14/15 (governance: `creator.githubId == pull_request.user.id`, delete/reassign labels) need the GitHub PR context and a maintainer-label policy — flagged in the workflow's future work, not implemented here. Gates 16–18 (Sanity/Supabase/chain-config checks) run at sync-time server-side (spec §6.2), not in repo CI. The Rust/buildable executor path is deferred to sync-time by §6.2a and only `notice`-logged here.

**Placeholder scan:** no `TBD`/`TODO`/"add validation"/"similar to Task N". Every code step carries complete TypeScript. The one prose-only artifact is the workflow YAML (Task 14), which is complete.

**Type consistency:** `Diagnostic`/`Severity`/`LintResult`/`diag`/`summarize` defined in Task 2, used identically in every check. `RepoModel`/`CourseEntry`/`LessonEntry` defined in Task 2 (`model.ts`), populated in Task 3, consumed unchanged in Tasks 4–12. `Check`/`registerCheck`/`registerSchemaCheck`/`CHECKS` defined in Task 2, used by every gate. `runJsSubmission`/`SubmissionRunResult`/`AdminTestCase` come from `@superteam-lms/challenge-executor` (Task 1) and `@superteam-lms/types`. `assignSlots`/`SlotsLock`/`byteLength`/`MAX_XP_PER_MINT`/`BLOCK_REGISTRY`/`CAPABILITY_KEYS` come from `@superteam-lms/content-schema` (Plan 1). `gitShow`/`mergeBase` defined in Task 4, reused in Task 5.

**Reconciliations recorded (not silent divergences):**
- `*.quiz.yaml` may omit `type:` (spec §4.5 authoring shorthand) while `QuizBlock` requires `type: "quiz"` (Plan 1 Task 5) — the loader injects `type: "quiz"` before validating a standalone quiz file (Tasks 3, 7).
- Gate 3's regenerate-from-merge-base has a documented edge (add-then-remove the same lesson within one PR); the incremental `pnpm content:slots` always passes, and sync-time re-validation is the backstop (spec §9.2).
- Task 1 extracts `executor.ts` to a shared package rather than importing across the `packages → apps` boundary; verified behaviour-preserving by the existing apps/web suite.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-09-content-lint-ci.md`. Two execution options:

**1. Subagent-Driven (recommended)** — a fresh subagent per task, reviewed between tasks. Task 1 (executor extraction) must land and keep the apps/web suite green before Tasks 2–14; Plan 1 (`@superteam-lms/content-schema`) must be merged first.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.
