# `@superteam-lms/content-lint`

The repo-level content linter for the `academy-courses` content repository. It
Zod-validates every content file against `@superteam-lms/content-schema` and runs
the repo-checkable subset of the content-standard's merge gates (spec §6.2). It
exits non-zero **iff** any `error`-severity diagnostic is produced; `warning` and
`notice` diagnostics never fail the build.

## Gates

| Gate                   | What it checks                                                                                                                                                                                                                                                                | Severity |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **1**                  | Every `course.yaml` / `lesson.yaml` / `*.quiz.yaml` / achievement / quest / path / instructor / `slots.lock.json` validates against its Zod schema.                                                                                                                           | error    |
| **2**                  | Ids are unique within a kind; course + achievement ids ≤ 32 UTF-8 bytes; an id present at the PR base whose value changed is a hard fail (ids are immutable).                                                                                                                 | error    |
| **3**                  | `slots.lock.json` equals a fresh `assignSlots(baseLock, displayOrder)` regeneration — no slot renumbered/reused, `next` monotonic, no missing/stale lesson.                                                                                                                   | error    |
| **4**                  | Cross-references resolve: `modules[].lessons` → lesson files, `course.instructor`, `course.prerequisiteCourse`, `path.courses[]`.                                                                                                                                             | error    |
| **5**                  | No orphan file under a lesson dir — every file is referenced by a block (`src`/`starter`/`solution`/`tests`/`idl`) or from a prose block's markdown.                                                                                                                          | error    |
| **5a**                 | `xpPerLesson × liveLessonCount ≤ 10000` (= `2 × MAX_XP_PER_MINT`); above it `finalize_course` reverts forever and no learner can complete the course.                                                                                                                         | error    |
| **6 (JS)**             | **Two-sided executor gate** — a `typescript` `code` block's `solution` **passes** every test and its `starter` **fails**, graded by the _same_ `runJsSubmission` (QuickJS-WASM) oracle that grades learners at runtime. An unavailable executor is a hard fail (fail-closed). | error    |
| **6 (Rust/buildable)** | Deferred to runtime grading (fail-closed per block, graded on learner submission) — logged, never silently skipped.                                                                                                                                                           | notice   |
| **7**                  | Quiz surfacing — unique option ids, ≥1 correct, exactly-1-correct when `multiSelect` is false — with a quiz-specific message.                                                                                                                                                 | error    |
| **13a**                | Capability ordering by **DISPLAY order** (`modules[].lessons[]` → `blocks[]`): a block that `consumes: X` must follow a valid producer of `X`. `funded-wallet` only from a `wallet-funding` block; `deployed-program` only from a deployable `code` block.                    | error    |
| **13b**                | Every block `type` is a `BLOCK_REGISTRY` key.                                                                                                                                                                                                                                 | error    |
| **13c**                | Each `program-explorer` block's `idl` file parses as JSON with a non-empty `instructions` array and a non-empty `metadata.name`.                                                                                                                                              | error    |
| **13d**                | Slot-exhaustion warning when a course's `slots.lock.json` `next > 200` (of 256).                                                                                                                                                                                              | warning  |

Gates 8–12 (quest/achievement/path enums + caps) are enforced by the
content-schema Zod refines at Gate 1. Gates 14–18 (governance, Sanity/Supabase/
chain-config) run server-side at sync-time (spec §6.2), not in repo CI.

## CLI

```bash
content-lint <content-dir>          # defaults to CWD
```

Environment:

- `LINT_BASE_REF` (or `GITHUB_BASE_REF`) — the PR base branch. A bare branch name
  (`main`) is prefixed to `origin/main`; a full ref is used verbatim. When unset,
  the gate 2/3 base-diff arm is skipped (uniqueness, byte caps, and fresh
  regeneration still run).

Exit codes: `0` = OK, `1` = at least one `error` diagnostic, `2` = the linter
itself crashed.

## CI — reusable workflow

`academy-courses` calls the reusable workflow this monorepo publishes:

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

The workflow checks out the caller's content (full history, for gate 2/3 base
diffs) and this monorepo (for the linter + `content-schema` + `challenge-executor`),
installs the `content-lint` workspace, exports the PR base ref as `LINT_BASE_REF`,
and runs the CLI against the content tree.
