# `@superteam-lms/content-lint`

The repo-level content linter for the `academy-courses` content repository. It
Zod-validates every content file against `@superteam-lms/content-schema` and runs
the repo-checkable subset of the content-standard's merge gates (spec §6.2). It
exits non-zero **iff** any `error`-severity diagnostic is produced; `warning` and
`notice` diagnostics never fail the build.

## Gates

| Gate                   | What it checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Severity |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **1**                  | Every `course.yaml` / `lesson.yaml` / `*.quiz.yaml` / achievement / quest / path / instructor / `slots.lock.json` validates against its Zod schema.                                                                                                                                                                                                                                                                                                                                                                                                                    | error    |
| **2**                  | Ids are unique within a kind; course + achievement ids ≤ 32 UTF-8 bytes; an id present at the PR base whose value changed is a hard fail (ids are immutable).                                                                                                                                                                                                                                                                                                                                                                                                          | error    |
| **3**                  | `slots.lock.json` equals a fresh `assignSlots(baseLock, displayOrder)` regeneration — no slot renumbered/reused, `next` monotonic, no missing/stale lesson.                                                                                                                                                                                                                                                                                                                                                                                                            | error    |
| **4**                  | Cross-references resolve: `modules[].lessons` → lesson files, `course.instructor`, `course.prerequisiteCourse`, `path.courses[]`.                                                                                                                                                                                                                                                                                                                                                                                                                                      | error    |
| **5**                  | No orphan file under a lesson dir — every file is referenced by a block (`src`/`starter`/`solution`/`tests`/`idl`) or from a prose block's markdown.                                                                                                                                                                                                                                                                                                                                                                                                                   | error    |
| **5a**                 | `xpPerLesson × liveLessonCount ≤ 10000` (= `2 × MAX_XP_PER_MINT`); above it `finalize_course` reverts forever and no learner can complete the course.                                                                                                                                                                                                                                                                                                                                                                                                                  | error    |
| **6 (JS)**             | **Two-sided executor gate** — a `typescript` `code` block's `solution` **passes** every test and its `starter` **fails**, graded by the _same_ `runJsSubmission` (QuickJS-WASM) oracle that grades learners at runtime. An unavailable executor is a hard fail (fail-closed).                                                                                                                                                                                                                                                                                          | error    |
| **6 (Rust/buildable)** | **Two-sided compile gate** — a `rust` + `buildType: buildable` block's `solution` **compiles** and its `starter` **fails to compile**, both spliced with the starter's canonical verification harness and built by `cargo-build-sbf --tools-version v1.54` against `apps/build-server/programs/Cargo.toml` — the same toolchain and manifest the build server grades learners with. Without the toolchain on PATH it falls back to the old deferral notice (or errors, under `CONTENT_LINT_RUST_ORACLE=require`). A per-block build timeout is an error, never a hang. | error    |
| **7**                  | Quiz surfacing — unique option ids, ≥1 correct, exactly-1-correct when `multiSelect` is false — with a quiz-specific message.                                                                                                                                                                                                                                                                                                                                                                                                                                          | error    |
| **13a**                | Capability ordering by **DISPLAY order** (`modules[].lessons[]` → `blocks[]`): a block that `consumes: X` must follow a valid producer of `X`. `funded-wallet` only from a `wallet-funding` block; `deployed-program` only from a deployable `code` block.                                                                                                                                                                                                                                                                                                             | error    |
| **13b**                | Every block `type` is a `BLOCK_REGISTRY` key.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | error    |
| **13c**                | Each `program-explorer` block's `idl` file parses as JSON with a non-empty `instructions` array and a non-empty `metadata.name`.                                                                                                                                                                                                                                                                                                                                                                                                                                       | error    |
| **13d**                | Slot-exhaustion warning when a course's `slots.lock.json` `next > 200` (of 256).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | warning  |
| **19a–d**              | Skill-tag vocabulary — every lesson `skills:` slug resolves to `skills.yaml` (19a, error); reuse bar (19b, error since #676), interleaving pairs (19c, warning), facet-only tags (19d, notice). Unified launch spec §3 item 7.                                                                                                                                                                                                                                                                                                                                         | mixed    |
| **20a**                | Originality/licensing — a code block's optional `attribution` must not cite a forbidden corpus (program-examples, sealevel-attacks, developer-content, developer-bootcamp, Ackee, Neodyme, Metaplex, GPL-3.0 solana.com docs); fires regardless of declared license (CAT-15).                                                                                                                                                                                                                                                                                          | error    |
| **20b**                | Originality/licensing — a declared `attribution.license` must be adaptable (Apache-2.0 or MIT: LiteSVM/Mollusk/Surfpool/Trident). No `attribution` = claimed original, attested by human review, not the linter. See `docs/CONTENT-ORIGINALITY.md`.                                                                                                                                                                                                                                                                                                                    | error    |
| **21a–b**              | Version-stamp currency — for each lesson `versionStamp` (opt-in; unstamped lessons skipped), query the npm registry `latest` per pinned package: **warn** on a pin behind latest or an unknown package (21a), notice an intentional ahead/prerelease pin (21a), notice (never fail) when the registry is unreachable (21b). Bounded 5s/request; flakiness degrades to a notice. Unified launch spec §3 item 8.                                                                                                                                                         | mixed    |

Gates 8–12 (quest/achievement/path enums + caps) are enforced by the
content-schema Zod refines at Gate 1. Gates 14–18 (governance, Sanity/Supabase/
chain-config) run server-side at sync-time (spec §6.2), not in repo CI.
Gate 19 (skill vocabulary) and gate 20 (originality/licensing) are numbered
after §6.2's reserved 1–18.

## CLI

```bash
content-lint <content-dir>          # defaults to CWD
```

Environment:

- `LINT_BASE_REF` (or `GITHUB_BASE_REF`) — the PR base branch. A bare branch name
  (`main`) is prefixed to `origin/main`; a full ref is used verbatim. When unset,
  the gate 2/3 base-diff arm is skipped (uniqueness, byte caps, and fresh
  regeneration still run).

- `CONTENT_LINT_RUST_ORACLE` — `auto` (default: compile buildable Rust blocks when
  `cargo-build-sbf` is on PATH, else emit the deferral notice), `require` (a missing
  toolchain is an error — what CI uses, so the gate cannot silently stop running),
  or `off` (never shell out).
- `CONTENT_LINT_RUST_TIMEOUT_MS` — per-build wall-clock cap, default 300000.
- `CONTENT_LINT_SBF_TARGET_DIR` — shared `CARGO_TARGET_DIR` for the Rust oracle.
  One build directory and one target dir serve every block in a run, so only the
  leaf crate recompiles; point this at a cached path in CI. Defaults to
  `<tmpdir>/content-lint-sbf-target`.
- `CONTENT_LINT_BUILD_TEMPLATE` — override the build-server template directory
  (`apps/build-server/programs`, resolved from the linter's own tree).

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
and runs the CLI against the content tree. It also installs the Solana CLI +
platform-tools v1.54 (cached) and sets `CONTENT_LINT_RUST_ORACLE=require`, so
gate 6's buildable oracle actually compiles rather than deferring.

`docs/ci/` carries the workflow file the content repo needs to switch to this
reusable workflow. (The `courses/_template` harness the oracle requires landed in
academy-courses #62.)
