# Course Content Standard & Sync Pipeline — Design

**Date:** 2026-07-09
**Status:** Design approved. Not yet planned or implemented.
**Scope:** The content standard for courses, modules, lessons, blocks, achievements, quests and
learning paths; the `academy-courses` repo; the repo → Sanity → on-chain sync pipeline; the
on-chain program change that makes lesson structure editable; migration; documentation.
**Next:** an implementation plan (`writing-plans`), phase by phase per §15.4.

---

## 1. Context

Today Sanity is the source of truth for course content, written by two competing paths:
`sanity/seed/import.mjs` and a live teacher UI at `/teach/courses`. Two of the eight live
courses were created through the UI, which is why they carry random Sanity `_id`s and lack
`trackId`, `instructor`, and `creatorRewardXp`.

We are inverting this. `github.com/solanabr/academy-courses` (currently empty, public)
becomes the only authoring surface. Teachers contribute by pull request. Sanity becomes a
derived, rebuildable projection. An admin clicks to sync.

This mirrors TinaCMS's Bridge/Database split — *"Your Markdown files are the source of
truth, but TinaCMS still requires the Data Layer… an ephemeral caching layer"* — which is
the documented answer to git-CMS scaling ceilings (~10k entries, repo size, rebuild cost).

### Live content inventory (Sanity project `4e3i2wwc`, dataset `production`)

| Type | Live | In `sanity/seed/` |
|---|---|---|
| course | 8 | 6 |
| module | 20 | 19 |
| lesson | 79 (45 content, 34 challenge) | 76 |
| achievement | 12 | 15 |
| learningPath | 7 | 7 |
| quest | 5 | 5 |
| instructor | 4 | 4 |

Largest course: 16 lessons. Lesson prose: 274–7,349 chars, median 1,698. Across all 76 seed
lessons there are **zero images**, **zero** `<img>`/`<video>`/`<iframe>`, one `videoUrl`,
258 fenced code blocks, and 69 markdown table rows. 108 test cases across 34 challenge
lessons; 26 marked `hidden: true`; the `hidden` key is present on only 39 of them.

---

## 2. Decisions

All decided by the user during brainstorming on 2026-07-09.

| # | Decision | Consequence |
|---|---|---|
| D1 | Repo is the only authoring surface; Sanity is a rebuildable projection | `/teach` authoring UI retires; Studio becomes read-only |
| D2 | A lesson is an ordered array of typed **blocks** | `quiz` and `openEnded` become additive; `lesson.type` disappears |
| D3 | `quiz` and `openEnded` ship now, not later | Both block types are in scope for v1 |
| D4 | Answer keys are **public**; secrecy is dropped | `hidden` tests, `answerKeyProjection`, the two server-only answer-key queries, and `queries-answer-leak.test.ts` are all deleted |
| D5 | `openEnded` is a **reflection**: one learner message, one AI reply, feedback only | No LLM output ever mints XP. PR #346's boundary holds |
| D6 | Teachers may add, remove, reorder and replace lessons on live courses | Requires an on-chain program change |
| D7 | Change the program now, while it is devnet-only | `Course` gains an active-lesson mask |
| D8 | Content sync is triggered from the admin panel, never automatically | The panel must surface content drift |
| D9 | Achievement unlock logic becomes **declarative** — content names a predicate `kind`, code implements a closed set of kinds | Hardcoded course ids leave the codebase; the two half-populated `UserState`s must merge |
| D10 | Blocks declare **capability keys** (`produces` / `consumes`) | The deploy → interact → capstone chain becomes expressible and CI-checkable |

### Non-goals

- Cross-LMS interop (Common Cartridge, SCORM, QTI XML emission).
- Rubric-scored or peer-reviewed open-ended answers.
- Multi-language content variants (the repo is English-only for now).
- Moving the five client-side Sanity fetch sites server-side (tracked separately).

---

## 3. Research basis

Three systems solve the same problem — untrusted contributors submitting graded exercises
by PR — and agree on four points.

1. **A two-sided CI gate.** The reference solution must pass the tests; the starter must
   fail them.
   - freeCodeCamp: `it('Test suite must fail on the initial contents')` and
     `it('Solution must pass the tests')` in `curriculum/src/test/test-challenges.js`.
   - Rustlings: `cargo dev check --require-solutions` runs every solution;
     `check_exercises_unsolved` asserts each exercise fails as shipped.
   - Exercism: `cp .meta/example.rs src/lib.rs && cargo test` in `bin/test_exercise.sh`.
2. **A stable opaque ID**, decoupled from title, filename and order. fCC freezes a MongoDB
   ObjectId; Exercism a UUIDv4 that "must never change".
3. **Ordering in a manifest, not in filenames.** fCC moved order into
   `curriculum/structure/`; Rustlings uses array position in `info.toml`; Exercism uses
   array position in `config.json`.
4. **CI rejects orphan files and manifest↔filesystem drift.** Rustlings'
   `check_unexpected_files`; Exercism's `configlet lint`.

They disagree on one point: fCC uses a single markdown file with `--section--` markers;
Exercism and Rustlings use a directory of typed files. **We follow Exercism**, because our
executors (`runJsSubmission(code, tests)`, `runRustSubmission(code, tests)`) are already
exported pure functions. If `solution.ts` is a real file, CI calls them directly — the same
oracle that grades a learner at runtime proves the content correct at merge time.

Two further findings shape the schema.

- **`correctIndex` is a bug, not a field.** edX OLX (`<choice name="a" correct="true">`)
  and IMS QTI (`<simpleChoice identifier="ChoiceA">` + `<correctResponse>`) both key
  correctness to stable option ids and model multi-select as a *set*, with per-option
  feedback as its own channel. QTI is explicit that free text is never auto-scored:
  *"the scoring of extended text responses is beyond the scope of this specification."*
- **Sanity schema validation never runs on programmatic writes.**
  *"When your code calls the mutation API or uses `@sanity/client`… none of those rules
  run."* This is the mechanism behind existing drift: `tests[].id` is `required()` in
  `sanity/schemas/lesson.ts` yet absent from all 108 live test objects, because
  `import.mjs` writes via `createOrReplace`. **Zod-in-CI is the only real gate.**

---

## 4. The content standard

### 4.1 Repo layout

```
academy-courses/
├── README.md
├── CONTRIBUTING.md
├── CLAUDE.md
├── CODEOWNERS
├── teachers.yaml                     # githubId → display name; maintainer-controlled
├── schema/                           # JSON Schema, generated from the Zod package
│   ├── course.schema.json
│   ├── lesson.schema.json
│   └── quiz.schema.json
├── .github/
│   ├── workflows/validate.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── instructors/ana-santos.yaml
├── achievements/first-steps.yaml
├── quests/complete-lesson.yaml
├── paths/solana-core.yaml
└── courses/
    ├── _template/                    # validated by CI, excluded from sync
    └── solana-fundamentals/
        ├── course.yaml
        ├── slots.lock.json           # AUTO-GENERATED
        └── lessons/
            ├── accounts/
            │   ├── lesson.yaml
            │   ├── intro.md
            │   ├── assets/accounts.png
            │   └── exercise/
            │       ├── starter.ts
            │       ├── solution.ts
            │       └── tests.json
            └── pdas/
                ├── lesson.yaml
                ├── intro.md
                └── quiz.yaml
```

### 4.2 File formats, and why

| Content | Format | Rationale |
|---|---|---|
| Human-authored structure (`course.yaml`, `lesson.yaml`, `quiz.yaml`) | **YAML** (`yaml` v2, 1.2 core) | Comments and block scalars; the format teachers already meet in GitHub Actions |
| Test fixtures (`tests.json`) | **JSON** | `expectedOutput` has exact byte semantics. YAML coerces `1.0` → `1` and `1.10` → `1.1`. Exercism uses `canonical-data.json` for the same reason |
| Machine-generated (`slots.lock.json`) | **JSON** | Stable byte-for-byte serialization that CI can diff |
| Prose | **`.md`** | Rendered by `ReactMarkdown` today. No Portable Text conversion — Sanity's own markdown path is `markdown → HTML → Portable Text`, a lossy round-trip that buys nothing |
| Code | **real `.ts` / `.rs`** | Syntax highlighting, formatters, and CI compiles and runs them |

Modern YAML (1.2 core) does not have the "Norway problem" — `No`, `Yes`, `off`, `n` all
parse as strings, verified against `yaml` v2.8.2. Under YAML 1.1 (PyYAML) they become
booleans. The residual coercions (`1.10` → `1.1`, `1.0` → `1`) are caught by Zod's
`z.string()` as loud CI failures. Test fixtures avoid the problem entirely by using JSON.

### 4.3 `course.yaml`

```yaml
id: course-solana-fundamentals    # ≤32 bytes, immutable — this IS the PDA seed
slug: solana-fundamentals
title: Solana Fundamentals
description: ...
difficulty: beginner              # beginner | intermediate | advanced
duration: 6                       # hours
xpPerLesson: 10                   # on-chain, uniform per course
xpReward: 600                     # completion bonus
creatorRewardXp: 500
minCompletionsForReward: 10
trackId: 1
trackLevel: 1
tags: [solana, basics]
creator:
  githubId: "12345678"
instructor: instructor-ana-santos
modules:                          # INLINE objects, ordered by array position
  - key: basics
    title: The Basics
    description: ...
    lessons: [lesson-accounts, lesson-pdas]
  - key: programs
    title: Programs
    lessons: [lesson-cpi]
```

`lesson.xpReward` does not exist. It was orphan data: absent from the Sanity schema, read
by no query and no type, yet set on 76 seed lessons and documented in `docs/CMS_GUIDE.md`
as required. Actual per-lesson XP is `course.xpPerLesson`, held in the Course PDA.

### 4.4 `lesson.yaml` and the block model

```yaml
id: lesson-accounts               # immutable; Supabase user_progress.lesson_id
slug: accounts
title: Accounts
blocks:                           # ordered; Zod discriminatedUnion on `type`
  - { key: intro, type: prose, src: intro.md }
  - key: exercise
    type: code
    language: typescript          # typescript | rust
    buildType: standard           # standard | buildable
    starter: exercise/starter.ts
    solution: exercise/solution.ts
    tests: exercise/tests.json
    hints:
      - Think about how accounts store data.
  - key: reflect
    type: openEnded
    prompt: In 60 seconds, what did you learn?
    maxWords: 150
```

Each block type declares two **independent** axes:

| Block | `graded` | `required` | Gate behaviour |
|---|---|---|---|
| `prose`, `video`, `widget` | no | no | ignored |
| `code`, `quiz` | yes | yes | deterministic grader must pass |
| `openEnded` | no | yes | server must have seen a submission (sealed attestation) |

`block.key` is stable within a lesson and becomes the Sanity array item's `_key`, so
re-syncs do not churn.

Blocks may additionally declare **capability keys** — `produces` and `consumes` (§4.9) — and
`widget` blocks carry their own `config`, replacing values currently hardcoded in components
or crammed into lesson-level fields behind `hidden` predicates.

### 4.5 `quiz.yaml`

Modeled on what edX OLX and IMS QTI agree on.

```yaml
key: check-accounts
questions:
  - id: q1                        # stable id, NEVER an index
    prompt: Which accounts can store state?
    multiSelect: true             # correctness is a SET
    options:
      - { id: a, label: Data accounts,    correct: true }
      - { id: b, label: Program accounts, correct: true }
      - id: c
        label: Instructions
        correct: false
        feedback: Instructions are transaction inputs, not accounts.
    explanation: Both data and program accounts live in the account model.
```

Per-option `feedback` and a general `explanation` are separate channels. A naive
`{question, options, correctIndex}` model has nowhere to put either, cannot express
multi-select, and silently grades the wrong answer when options are reordered.

Quizzes are open-book: a quiz's answer *is* its content, and the repo is public. Execution-
graded `code` and AI-fed `openEnded` are the only block types where a public key does not
hand over the answer. This is an accepted consequence of D4.

### 4.6 `slots.lock.json`

```json
{
  "//": "AUTO-GENERATED by `pnpm content:slots`. Do not edit.",
  "version": 1,
  "slots": { "lesson-accounts": 0, "lesson-pdas": 1, "lesson-cpi": 2 },
  "retired": [],
  "next": 3
}
```

A **slot** is a permanent on-chain bitmap position, distinct from display `order`. Assigned
once, never renumbered, never reused. Teachers never edit this file; CI regenerates it and
fails if the committed copy differs.

Decoupling `slot` from `order` is what makes reordering, regrouping, inserting and deleting
free. Today `findLessonIndex` derives the bitmap position from **array position** in the
flattened `modules[].lessons[]`, so inserting a lesson mid-course silently shifts every
subsequent bit and corrupts enrolled learners' progress.

### 4.7 Identity

| Entity | ID form | Constraint | Why |
|---|---|---|---|
| course | `course-<slug>` | ≤32 bytes, immutable | PDA seed (`assertIdLength`, 1–32 bytes) |
| achievement | `achievement-<slug>` | ≤32 bytes, immutable | PDA seed |
| lesson | `lesson-<slug>` | ≤128 chars, immutable | `user_progress.lesson_id` |
| module | `key`, unique in course | — | inline object, not a document |
| block | `key`, unique in lesson | — | Sanity array `_key` |
| quiz question / option | `id`, stable | — | correctness keyed by id |

Sanity `_id` charset is `a-zA-Z0-9._-`, max 128 chars, no leading `-`, and the `drafts.`
and `versions.` prefixes are reserved. Our 32-byte PDA cap is comfortably legal. All live
IDs pass today, but `course-building-first-program` is 29 of 32 bytes — CI enforces the cap.

**Directory names are cosmetic.** Renaming `lessons/rent/` to `lessons/rent-exemption/` is
free; changing `id:` is not.

### 4.8 Teacher identity → on-chain creator

`profiles.github_id` already stores the **numeric** GitHub user id
(`account-tab.tsx:126`: *"We sync the GitHub identity's `id` to `profiles.github_id`"*),
which is stable across username changes and is what a GitHub Action reads from
`github.event.pull_request.user.id`. The sync route already resolves
`course.author → profiles.wallet_address → Course.creator` (`sync/route.ts:118`).

```
course.yaml: creator.githubId
  → CI asserts pull_request.user.id == creator.githubId   (you may only ship your own course)
  → sync resolves github_id → profiles.wallet_address → Course.creator (Pubkey)
  → falls back to the platform authority when unlinked, as today
```

No wallet ever enters the repo. A maintainer label overrides the author check.

### 4.9 The on-chain course chain — capability keys

Module 4 of *Building Your First Solana Program* is four lessons that pass per-learner state
between them:

```
lesson-bfsp-m4-airdrop     content    widgets=[wallet-funding]        → funds a devnet wallet
lesson-bfsp-m4-deploy      challenge  buildable, deployable=true      → builds + deploys a program
lesson-bfsp-m4-interact    content    widgets=[program-explorer]      → calls that program (needs IDL)
lesson-bfsp-m4-capstone    content    widgets=[deployed-program-card] → shows that program
```

Nothing in the schema, the app, or CI expresses that ordering. A teacher can put
`program-explorer` on lesson 1 of a fresh course and it renders an empty shell.

**This is why `deployed-program-card` was never implemented.** It consumes state produced two
lessons earlier, and `deployed_programs` is `UNIQUE(user_id, course_id, lesson_id)` — keyed to
the *producing* lesson, which the consuming lesson has no way to name. The widget was
declared in the schema, documented in `CMS_GUIDE.md`, offered in the Studio dropdown, and
selected by `lesson-bfsp-m4-capstone`. It was not laziness; it was inexpressible.

Blocks therefore declare capabilities:

```yaml
# lesson-bfsp-m4-airdrop
blocks:
  - key: fund
    type: widget
    widget: wallet-funding
    config: { amount: 2, network: devnet }   # today 2 SOL is hardcoded in the component
    produces: funded-wallet

# lesson-bfsp-m4-deploy
blocks:
  - key: exercise
    type: code
    language: rust
    buildType: buildable
    deployable: true
    consumes: [funded-wallet]
    produces: deployed-program

# lesson-bfsp-m4-interact
blocks:
  - key: explore
    type: widget
    widget: program-explorer
    consumes: [deployed-program]
    idl: program.idl.json      # a real file, not a `text` field with a hand-rolled validator
```

**CI invariant:** every `consumes: X` must be preceded, by slot order within the same course,
by a block that `produces: X`. The consuming block resolves the producing lesson's id from the
manifest — which is exactly the `deployed_programs` lookup key that was missing.

`language`, `buildType` and `deployable` move from the lesson onto the `code` block, where
they belong. `programIdl` stops being a 20-row textarea with a custom JSON validator and
becomes `program.idl.json`: diffable, formattable, and CI can assert its `metadata.name`
matches the key the explorer will look for (`lesson.ts:113` — *"used for keypair storage"*).

Known, out of scope: `generic-program-explorer` reads the deployed keypair from
**`localStorage`**, keyed `${walletPrefix}-${programName}-${courseSlug}`, not from the
database. Clearing browser storage breaks the interact lesson. Pre-existing and orthogonal.

### 4.10 Achievements as content (D9)

Achievement unlock logic currently lives in TypeScript, and it has drifted from the content
it describes.

`event-handlers.ts:76` declares `SOLANA_DEV_PATH_COURSES` — four course ids that
`achievement-full-stack-solana` treats as "all tracks". **It matches no `learningPath` in the
dataset.** It is a fifth, invisible learning path that exists only in application code, and it
excludes `course-building-first-program` and `course-defi-on-solana`, both of which sit in real
paths. Two more course ids are hardcoded in the same function
(`"course-rust-for-solana"`, `"course-anchor-framework"`).

So achievements become declarative:

```yaml
# achievements/anchor-expert.yaml
id: achievement-anchor-expert
award: { kind: course-completed, course: course-anchor-framework }

# achievements/full-stack-solana.yaml
award: { kind: path-completed, path: path-solana-core }      # a real path, checked to exist

# achievements/helper.yaml
award: { kind: community-stat, stat: acceptedAnswers, gte: 5 }

# achievements/bug-hunter.yaml
award: { kind: manual }
```

`UNLOCK_CHECKS` collapses from one closure per achievement into a closed set of **predicate
kinds**: `lessons-completed`, `lessons-completed-in-course`, `course-completed`,
`path-completed`, `streak`, `user-number`, `community-stat`, `manual`. Content names a kind;
code implements the kinds. CI checks that every referenced course and path exists and that
every named kind is implemented.

This forces a fix that is overdue on its own merits. There are **two** `UserState`
constructions, each half-populated: `event-handlers.ts:750` fills progress fields and zeroes
community ones; `achievements.ts:121` zeroes progress fields and fills community ones. Neither
can ever award an achievement needing both. A declarative predicate needs one fully-populated
state.

`achievement-perfect-score` then needs a real `allTestsPassedFirstTry` signal — the field is
hardcoded `false` at **both** construction sites — or it is deleted. No third option.

---

## 5. The on-chain seam

### 5.1 What the deployed program does today

```rust
// complete_lesson.rs:15
require!(lesson_index < course.lesson_count, ...);

// finalize_course.rs:23
let completed: u32 = enrollment.lesson_flags.iter().map(|w| w.count_ones()).sum();
require!(completed == course.lesson_count as u32, CourseNotCompleted);

// update_course.rs:58
require!(new_lesson_count >= course.lesson_count, ...);   // monotonic; can only grow
```

Consequences: slots must be dense `0..lesson_count-1` and every one live. Retiring a slot
makes `popcount` permanently less than `lesson_count`, so `finalize_course` reverts with
`CourseNotCompleted` **forever** — no completion bonus, no credential, `total_completions`
never increments, creator rewards die. `lesson_count` cannot be lowered to compensate.
Deletion is inexpressible.

### 5.2 The change (D6, D7)

Add an active-lesson mask to `Course`, mirroring `Enrollment.lesson_flags`:

```rust
Course {
    lesson_count: u8,            // retained for display; XP math uses popcount(active_lessons)
    active_lessons: [u64; 4],    // NEW — 256-bit mask of live slots
    _reserved: [u8; 8],          // preserved
}

// complete_lesson
require!(course.is_active_slot(lesson_index), ...);

// finalize_course
require!((flags & active) == active, CourseNotCompleted);

// update_course
new_active_lessons: Option<[u64; 4]>
```

A learner holding a bit for a since-retired lesson still finalizes; the `AND` ignores it.
Retiring a slot clears its bit. Insert, delete, reorder and move all become free forever.

**Cost.** `Course._reserved` is only 8 bytes, so a 32-byte mask grows `Course::SIZE`
224 → 248. Every existing `Course` account must be recreated — 7 on devnet, via one admin
resync. `Enrollment` is untouched: `lesson_flags` keeps its layout, so no learner's bitmap
moves. There are **no mainnet Course accounts** (Squads custody handoff is the last
blocker), so this is the cheapest this change will ever be.

`complete_lesson`, `finalize_course` and `update_course` all change, so the audit sign-off
and byte-verified deploy for those three instructions must be redone.

Hard ceilings that remain: 256 lifetime slots per course (bitmap width), `lesson_count` is
`u8`. Largest course today is 16 lessons.

### 5.3 XP ceilings that CI must respect

`utils::MAX_XP_PER_MINT = 5000`, plus `MinterRole.max_xp_per_call`. Any quest or
achievement `xpReward` above 5000 makes `reward_xp` revert, the action queue retries
forever, and the learner never receives the XP.

---

## 6. Validation

### 6.1 Why validation must live in CI

Sanity schema `validation` never runs on programmatic writes. The entire ingestion path is
programmatic. Therefore Sanity `validation` protects nothing on the write side and is kept
only as editorial UX in the (read-only) Studio. **Zod, in CI, is the gate.**

### 6.2 The gates

Content shape:
1. Zod-validate every YAML/JSON against `@superteam-lms/content-schema`.
2. IDs unique, immutable versus `main`, legal charset; course and achievement ids ≤32 bytes.
3. `slots.lock.json` matches regeneration; no slot changed or reused; `next` monotonic.
4. All cross-references resolve (lesson ids in `modules`, `instructor`, path → course).
5. No orphan files under a lesson directory.

Correctness:

6. **For every `code` block:** `solution` passes its `tests.json` **and** `starter` fails
   them. Reuses `runJsSubmission` / `runRustSubmission`.
7. Quiz: option ids unique; ≥1 correct; exactly 1 correct when `multiSelect: false`.

Cross-system invariants (each exists because nothing else enforces it):

8. `quest.type ∈ {lesson, lesson_batch, challenge, login_streak, module}` — the SQL enum.
9. `quest.targetValue ≥ 1`. `get_daily_quest_state` compares `v_current >= v_target` with
   **no guard**; a quest with `targetValue: 0` completes every day and mints free XP.
10. `1 ≤ quest.xpReward ≤ 5000` and `1 ≤ achievement.xpReward ≤ 5000` (= `MAX_XP_PER_MINT`).
11. `achievement.category ∈ {progress, streaks, skills, community, special}`.
12. **Every achievement declares an `award.kind` the code implements**, and every course or
    path it references exists. `kind: manual` is explicit, not implicit. Enforceable at compile
    time via `PREDICATES satisfies Record<AwardKind, Predicate>`.
13. A learning path has ≥1 course, or declares `draft: true`.
13a. **Capability ordering:** every block declaring `consumes: X` is preceded, by slot order
    within the same course, by a block declaring `produces: X`.
13b. A `widget` block's `widget` value is a key in the renderer registry — no more dropdown
    values that render nothing.
13c. A `program.idl.json` parses, has a non-empty `instructions` array, and its
    `metadata.name` matches the keypair-storage key the consuming explorer expects.

Governance (CI, in `academy-courses`):

14. `creator.githubId == pull_request.user.id`, unless a maintainer label overrides.
15. Deleting a lesson, or reassigning a slot, requires an explicit PR label.

**Gates 1–15 run in the content repo's CI, which can see only the repo and the GitHub API.**
Two further checks need Sanity and Supabase, so they run **server-side at sync time** in
`POST /api/admin/content/sync`, which aborts with a clear message rather than writing:

16. A course may only be pruned if its `onChainStatus.isActive` is `false` — otherwise the
    prune would orphan a PDA holding live enrollments.
17. A lesson deletion or slot reassignment reports how many enrolled learners hold that bit,
    from `enrollments.lesson_flags`, and requires the admin to confirm.

The content repo's CI *may* additionally read the public Sanity dataset unauthenticated to
warn early on 16 — it is public by design (D4) — but the authoritative check is at sync time.

### 6.3 Why gates 8–13 are load-bearing

- `get_daily_quest_state` branches on `v_type` with an `IF/ELSIF` chain and **no final
  `ELSE`**. An unknown quest type computes `v_current = 0` and never awards — fail-closed,
  but silent: the quest renders `0/N` forever.
- `getMissingAchievementFields()` checks exactly two things: `name` non-empty and
  `xpReward > 0`. It never checks that the achievement is *awardable*. Today
  `achievement-speed-runner` is deployed on-chain (PDA + Metaplex collection + real SOL) and
  no code path can grant it. Conversely `UNLOCK_CHECKS` holds four keys —
  `first-comment`, `curious-mind`, `helper`, `top-contributor` — with no Sanity document, so
  `checkNewAchievements` (which iterates Sanity docs) never evaluates them. Every community
  achievement is dead, and `buildCommunityUserState` queries `community_stats` on each
  completion to feed checks that cannot fire. `achievement-perfect-score` is unreachable from
  either construction site. **Three of twelve live achievements cannot be earned.**
- `path-infrastructure` and `path-security` are live learning paths with zero courses.

---

## 7. The completion gate

### 7.1 Today it fails open

```ts
// apps/web/src/app/api/lessons/complete/route.ts:98
const answerKey = await getChallengeAnswerKeyById(courseId, lessonId);
if (answerKey && answerKey.type === "challenge") { /* validate, 403, 503, fail-closed */ }
```

The gate is opt-in on the literal string `"challenge"`. Add `type: "quiz"` today and the
`if` is false: the route grants XP and the on-chain `complete_lesson` with **no proof the
learner answered anything**. The fail-closed machinery (`non_js_challenge`, the 503 degrade)
lives *inside* that branch and never protects a new type.

The lesson type union is redeclared as a string-literal type in **four independent places**
(`packages/types/src/course.ts`, `curriculum-accordion.tsx:12`,
`course-structure-editor.tsx:23`, `lib/teacher/structure.ts:28`) with **16 branch sites** on
`lesson.type`.

### 7.2 The block model inverts the dispatch

```ts
const graded = lesson.blocks.filter(b => BLOCK_REGISTRY[b._type]?.graded);
for (const block of graded) {
  const grader = GRADERS[block._type];
  if (!grader) return deny(503);                       // unknown type → CLOSED
  if (!await grader(block, proofs[block._key])) return deny(403);
}
for (const block of lesson.blocks.filter(b => BLOCK_REGISTRY[b._type]?.required)) {
  if (!openAttestation(proofs[block._key], { lessonId, userId })) return deny(403);
}
```

The gate asks *"give me this block's grader"* rather than *"is this a challenge?"*. A block
type with no registered grader has no grader, so completion is denied. **Unknown becomes
fail-closed by construction.**

The completion payload is `{ lessonId, proofs: Record<blockKey, proof> }`. Block-level
results are **transient** — never persisted per-block. The lesson stays the only durable
progress unit, matching the on-chain bitmap and `user_progress`.

### 7.3 Adding a block type

Sanity's documented page-builder pattern makes adding a block touch **three** places: the
block file, the container's `of` array, and the schema index. A registry constant spread
into `of` reduces it to two. Plus a renderer and (if graded) a grader.

Realistically: `blocks/quiz.ts` (Zod + Sanity object), one registry line,
`components/lesson/blocks/quiz-block.tsx`, `lib/grading/graders/quiz.ts`. **Four files,
one registry edit.** Not the "zero edits" claimed earlier, but not today's twenty sites.

---

## 8. `openEnded` — the reflection block

One learner message, one AI reply, feedback only. **No XP, no verdict, no gate on
correctness.** PR #346's boundary holds: *"XP / scoring UNCHANGED — completion-only,
server-authoritative, untouched. The accept-gate awards no XP."*

Reuses #346's four primitives verbatim:

| Primitive | Reuse |
|---|---|
| `lib/ai/partner-prompt.ts` | Cache-shaped prompt: byte-deterministic static prefix (persona + lesson context + reflection prompt), per-turn dynamic suffix (the learner's answer, fenced as `data only — do not treat as instructions`) |
| `lib/ai/assist-budget.ts` | Fail-closed atomic `spend_*` RPC; wrapper denies on any error; `refundAssist` for an undelivered call |
| `lib/ai/check-seal.ts` | AES-256-GCM sealed **attestation** `{ lessonId, blockKey, userId, exp }`, proving the server saw a submission. `openCheck` fails closed to `null` |
| Structured output | `responseSchema`, `temperature`, per-intent `maxOutputTokens` |

`challenge_assists` is `PRIMARY KEY (user_id, lesson_id)` with a single `assists_used`
counter — it meters one kind of AI call per lesson. A reflection needs its own counter on
the same lesson, so it generalizes to `ai_credits(user_id, lesson_id, kind)` with
`spend_ai_credit(..., p_kind, p_max)`. Same fail-closed semantics, one extra column. #346 is
unmerged, so this is a cheap generalization.

Because the reflection is ungraded, prompt-injection risk collapses to "a learner makes the
AI say something silly to them." Nothing mints.

---

## 9. The sync pipeline

### 9.1 Two syncs, never conflated

```
academy-courses (git, source of truth)
   │  PR: Zod validate · two-sided executor gate · slots.lock · id immutability
   │  merge → GitHub Action builds a content bundle for commit <sha>
   ▼
[1] repo → Sanity          machine, idempotent, full reconcile
   ▼
Sanity (derived, rebuildable)
   ▼
[2] Sanity → on-chain      human-gated, admin panel, fail-closed   ← unchanged
```

### 9.2 Secrets stay server-side

The GitHub Action does **not** hold `SANITY_ADMIN_TOKEN`. It validates, builds an NDJSON
bundle plus assets, publishes it as a release artifact for that commit SHA, and notifies the
app. Everything privileged happens server-side:

```
POST /api/admin/content/sync   { sha, bundleUrl }     ← ADMIN_SECRET, human-triggered
  1. fetch bundle for <sha>, verify checksum
  2. RE-validate with the same @superteam-lms/content-schema Zod package
  3. write Sanity   (createOrReplace + preserve-list + prune)
  4. revalidateTag("courses")
```

Step 2 exists because the PR check may not have run against this exact tree.

### 9.3 The `createOrReplace` trap

`createOrReplace` keyed by a deterministic `_id` is Sanity's idempotency primitive, but it
**replaces the whole document**. `course.onChainStatus` (`coursePda`, `txSignature`,
`trackCollectionAddress`, `isActive`, `lastSynced`) is Sanity-owned state the repo knows
nothing about. A naive sync would erase the on-chain link on every merge.

**Invariant.** Every field of a managed document is either (a) a pure function of the repo,
or (b) named in the sync job's `PRESERVE` list. Nothing else exists.

`PRESERVE = { course: ["onChainStatus"], achievement: ["onChainStatus"] }`. The sync reads
existing `onChainStatus` for all managed ids in one GROQ, reattaches it, then
`createOrReplace`s. CI asserts
`sanitySchemaFields(type) === repoProjectedFields(type) ∪ PRESERVE[type]`, so adding a
Sanity-owned field later without registering it fails the build rather than getting wiped.

### 9.4 Pruning

Sanity has no reconcile primitive. `dataset import` never prunes; `createOrReplace` never
deletes. Four guards:

1. Every managed doc carries `sync: { source: "academy-courses", rev: "<sha>" }`.
   **Field names may not start with `_`** — *"must not start with underscores (`_`), which
   are reserved for system fields"* — so `_syncRev` is illegal.
2. Prune is `*[sync.source == "academy-courses" && sync.rev != $sha]`. Documents without the
   marker (`sanity.imageAsset`, anything hand-created) are untouchable.
3. Write everything first, verify the written count matches the bundle, *then* prune. A
   partial write can never trigger a mass delete.
4. **Blast-radius guard:** if the prune set exceeds 20% of managed docs, abort and require an
   explicit admin override.

The `contentSync` singleton (§11) is written **last**, carrying the new `sync.rev`, so the
prune query never matches it.

Delete-by-query caps at 10,000 documents. We have ~115.

### 9.5 Weak references

*"If a document has incoming strong references, it can't be deleted."* In a rebuildable
projection that deadlocks pruning and makes ingest order matter. So
`course.modules[].lessons[]` and `course.instructor` become **weak** references. A dangling
`->` dereferences to `null`, which `courseFields` already tolerates for `instructor`.

### 9.6 Assets

Sanity gives uploaded assets a content-derived `_id`: `image-<sha1hash>-<dimensions>-<format>`,
and *"If the same asset is uploaded multiple times, but with different filenames, only one
asset will be created."* There is no force-new option. The sync computes the `_id` from the
file's SHA-1 and skips the upload when it already exists, so asset sync is free on re-runs.

Images live beside the lesson (`assets/accounts.png`) and are referenced relatively in the
markdown. The sync uploads them and rewrites the paths to Sanity CDN URLs, gaining
transforms and hotspot. `uploadTeacherImage` already does this for teacher uploads.

Video is a `video` block holding a URL. Nothing is uploaded; `lesson-client.tsx` already has
`getEmbedUrl` for YouTube/Vimeo.

*(Docs do not state whether asset dedupe is per-project or per-dataset; the endpoint is keyed
by both. Assume per-dataset.)*

### 9.7 Scale

~115 documents (8 courses, 79 lessons, 4 instructors, 7 paths, 12 achievements, 5 quests;
modules now inline). Lesson content is median 1.7 KB, max 7.3 KB — the bundle is under a
megabyte. Sanity's limits are 25 mutate req/s, 100 concurrent mutations, 4 MB per request,
10k docs per delete-query. Two orders of magnitude of headroom. Batch into a couple of
transactions.

---

## 10. The Sanity projection

### 10.1 Six document types, down from seven

`module` stops being a document and becomes an inline object on the course. Sanity's
guidance: *"If you use objects, the content is easier to query but trapped within the
document. If you use references, the content can be reused between documents."* Modules are
never reused across courses.

Three course fields disappear, because the repo now *is* the workflow:

| Field | Replaced by |
|---|---|
| `authoringStatus` | merged to `main` |
| `reviewFeedback` | PR review comments |
| `author` (Supabase user id) | `creator.githubId` |

`approveCourse`, `rejectCourse`, `getPendingReviewCourses` and the `/teach` review surface
retire with them.

### 10.2 The GROQ collapse

Heterogeneous arrays normally need per-`_type` conditional projections, and `sanity typegen`
degrades to `unknown` on non-literal GROQ. **That cost evaporates**: no block holds a secret
(D4) and no block holds a reference. The lesson projection is `blocks[]{ ... }` — one
literal projection, fully typed.

Compare today, where the same lesson is projected **six ways** —
`moduleWithLessonsFields`, `getLessonBySlug`, `answerKeyProjection`, `getCourseStructure`,
`getCourseById`, `getCourseLessons` — three of which exist only to strip `solution` and
`tests[hidden == true]`.

Deleted: `getChallengeAnswerKey`, `getChallengeAnswerKeyById`, `answerKeyProjection`,
`queries-answer-leak.test.ts`. The `code` grader reads `solution` and `tests` from the same
public projection everyone else gets.

### 10.3 Read path

Public dataset, **no browser token**, `useCdn: true`, `perspective: 'published'`. Sanity is
blunt: *"if the access token grants write permission, you have in effect made your data
writeable by everyone"* — and a shipped read token makes the dataset public anyway. Since
content is public by design (D4), this is the honest configuration.

Known consequence: the five `"use client"` pages that fetch Sanity in `useEffect`
(`dashboard`, `profile`, `profile/[username]`, `certificates`, `certificates/[id]`) cannot be
purged by `revalidateTag("courses")`, because `next: { revalidate, tags }` is a server fetch
extension. They serve stale for the CDN TTL after a sync. Moving them server-side is tracked
separately.

### 10.4 Read-only Studio

Strip `document.actions` and `newDocumentOptions`. **This is UI dressing, not a security
boundary.** Real enforcement is the project role: every human gets **Viewer** in
`sanity.io/manage`; `SANITY_ADMIN_TOKEN` stays server-side, held only by the sync job and
`admin-mutations.ts`.

---

## 11. Drift model

Two independent gaps. Today the admin panel sees only the second.

```
academy-courses @ <sha>  ──[1] content sync──▶  Sanity  ──[2] chain sync──▶  devnet
       └──────── contentDrift ────────┘           └──── chainDrift (diffCourse) ────┘
```

**Content drift** is new. A singleton Sanity document `_id: "contentSync"` holds
`{ sha, syncedAt, counts }`. The panel fetches `academy-courses` HEAD from the GitHub API and
compares.

| State | Meaning | Panel |
|---|---|---|
| `up_to_date` | `contentSync.sha == HEAD` | green |
| `behind` | HEAD has N commits Sanity hasn't ingested | "Sync content (N commits behind)" + file diff |
| `never_synced` | no `contentSync` doc | first-run banner |
| `blocked` | HEAD's CI validation is failing | red; sync button disabled |

`blocked` matters: the panel **must refuse to sync a commit whose CI is red**, or a human can
click invalid content past the Zod gate.

**Chain drift** is the existing `SyncStatus`
(`synced | out_of_sync | not_deployed | draft | missing_fields`) from `diffCourse` /
`diffAchievement`, unchanged. Note `draft` here means a `drafts.`-prefixed Sanity `_id`
(`isDraftId`), not `authoringStatus`; a derived dataset written by `createOrReplace` never
contains draft documents, so the status becomes unreachable rather than retired.

Content sync must land before chain sync — the required active-lesson mask cannot be computed
from a Sanity that has not ingested the new lesson. The panel enforces the ordering.

### 11.1 Deletion ordering

```
PR removes lessons/rent/ ; slots.lock.json moves slot 1 → retired
  merge
  [1] Sanity prunes the lesson doc, course.modules updated     ← app: lesson gone
  [2] admin resync: update_course(new_active_lessons)          ← chain: bit cleared
```

Between [1] and [2] the app shows N−1 lessons while the chain still requires the retired bit;
anyone sitting on N−1 completions cannot finalize. So the panel surfaces the pending chain
delta as required work, and completion percentage is always computed from **live slots**,
never from `lesson_count`.

`pending_onchain_actions` cannot carry this: its DDL is `user_id UUID NOT NULL REFERENCES
auth.users(id)` — learner-scoped. A course-level mask update has no user. The existing
`diffCourse` output is the mechanism.

---

## 12. The `academy-courses` repo scaffolding

- **`README.md`** — what this repo is; how to add a course in five steps.
- **`CONTRIBUTING.md`** — the PR flow, each CI gate, and what each failure means.
- **`CLAUDE.md`** — mostly prohibitions (see below).
- **`CODEOWNERS`**, **`teachers.yaml`** — maintainer-controlled.
- **`schema/*.json`** — JSON Schema generated from the Zod package via `zod-to-json-schema`,
  committed, and bound to files by path in `.vscode/settings.json` (`yaml.schemas`) rather
  than by a per-file modeline, since lesson directories sit at varying depths:

  ```json
  { "yaml.schemas": {
      "./schema/lesson.schema.json": "courses/*/lessons/*/lesson.yaml",
      "./schema/course.schema.json": "courses/*/course.yaml",
      "./schema/quiz.schema.json":   "courses/*/lessons/*/*.quiz.yaml" } }
  ```

  VS Code's YAML extension then autocompletes block types and red-underlines a bad `type:`
  as the teacher types, hours before CI. Cheapest available win for contribution quality.

- **`courses/_template/`** — a complete, CI-passing example, excluded from sync by the `_`
  prefix. It exercises **every** block type: prose with a co-located image, a video, a
  TypeScript `code` block, a Rust `code` block, a quiz with single- and multi-select, and an
  `openEnded` reflection. If a block type isn't in the template, it isn't supported.

### `CLAUDE.md` for `academy-courses`

- The repo is the source of truth. Never edit Sanity; never edit the app.
- `slots.lock.json` is machine-generated. Run `pnpm content:slots`; never hand-edit.
- IDs are immutable. Renaming a lesson directory is fine; changing `id:` is not.
- A `code` block's `solution` must pass its `tests.json`, and its `starter` must fail them.
- Never invent a `quest.type` — it must exist in the SQL enum.
- Never add an achievement without an `UNLOCK_CHECKS` entry or `award: manual`.
- Deleting a lesson retires its slot forever and needs a labelled PR.

---

## 13. Security posture changes

| Before | After |
|---|---|
| Dataset public; app strips `solution` and hidden tests from every public projection; a P0 regression test guards it | Dataset public; nothing is secret. Stripping machinery deleted |
| Answer keys reachable unauthenticated via the Sanity API regardless of app-side stripping | Same reachability, now intentional and documented |
| `SANITY_ADMIN_TOKEN` in three duplicated write clients | Same token, one shared factory; never in GitHub Actions |
| Completion gate opt-in on `"challenge"` — new lesson types fail **open** | Gate dispatches on the block registry — unknown types fail **closed** |
| `queries-answer-leak.test.ts` guards two of the three lesson-body queries | Deleted; there is no answer key to leak |

`docs/SECRET-ROTATION.md:47` currently describes `SANITY_API_TOKEN` as guarding
"Read content (incl. hidden test answer keys)". It never did — the dataset is public and no
token is required. That line must be corrected.

---

## 14. Bugs discovered during design (separate issues, not fixed here)

1. **Quest XP silently lost on chain failure.** `OnchainActionType` includes `"quest_xp"`;
   the table's constraint is
   `CHECK (action_type IN ('achievement','certificate','course_finalize','xp','enroll'))`.
   `quests/daily/route.ts:184` queues `"quest_xp"`. `supabase-js` `.upsert()` **returns** the
   error rather than throwing, and `queueFailedOnchainAction` never inspects the return, so
   the constraint violation is discarded and the `catch` never fires.
   `onchain-queue.ts:320`'s `case "quest_xp":` waits for rows that can never exist. The quest
   is marked complete in Postgres and the XP never reaches the chain.
2. **Community achievements are dead.** Four `UNLOCK_CHECKS` keys have no Sanity document.
3. **`achievement-speed-runner`** is deployed on-chain and unearnable.
4. **`deployed-program-card`** is a Studio dropdown value and a documented widget with no
   render branch; `lesson-bfsp-m4-capstone` selects it and renders nothing.
5. **`docs/CMS_GUIDE.md:95`** documents `lesson.xpReward` as required; the field does not
   exist in the schema and nothing reads it.
6. **`path-infrastructure`, `path-security`** are live learning paths with zero courses.
7. **`apps/web/src/app/api/CLAUDE.md`** documents `/api/ai/chat` and `/api/ai/suggest`,
   which do not exist. The real routes are `/api/ai/partner` and `/api/ai/partner/verify`.
8. **`achievement-perfect-score` is unreachable.** `allTestsPassedFirstTry` is hardcoded
   `false` at both `UserState` construction sites (`event-handlers.ts:762`,
   `achievements.ts:128`).
9. **`SOLANA_DEV_PATH_COURSES` (`event-handlers.ts:76`) matches no `learningPath`.** Four
   hardcoded course ids stand in for "all tracks"; `achievement-full-stack-solana` therefore
   means something no content document expresses.
10. **Two half-populated `UserState` constructions.** The webhook path zeroes community fields;
    the community path zeroes progress fields. No achievement needing both can ever unlock.
11. **`docs/CMS_GUIDE.md:224` and `docs/CUSTOMIZATION.md:479` instruct the reader to strip the
    `achievement-` prefix** from `UNLOCK_CHECKS` keys. The real keys are the full `_id`.
    Following that instruction is what produced the `getDeployedAchievements()` prefix-stripping
    bug (wrong PDA, silent failure in the on-chain queue). **Fix immediately, independently of
    this work.**
12. **`docs/SECRET-ROTATION.md:47`** claims `SANITY_API_TOKEN` guards "Read content (incl.
    hidden test answer keys)". No token is required — the dataset is public. `:9` and `:20`
    also name `solarium.courses` as the canonical production deploy; it is not.

---

## 15. Migration

### 15.1 What is at stake

All seven deployed `Course` accounts read live from devnet at exactly 224 bytes
(= `Course::SIZE`), `lesson_count` agreeing with Sanity everywhere:

| Course | lessons | enrolled | completed | xp/lesson |
|---|---|---|---|---|
| `aD45H1NEbb1bqELwloGCqI` (solana-101) | 3 | 1 | 1 | **100** |
| `course-anchor-framework` | 12 | 2 | 0 | 20 |
| `course-building-first-program` | 16 | 2 | 0 | 20 |
| `course-defi-on-solana` | 12 | 2 | 1 | 40 |
| `course-rust-for-solana` | 12 | 2 | 2 | 20 |
| `course-solana-frontend` | 12 | 2 | 1 | 20 |
| `course-solana-fundamentals` | 12 | 2 | 1 | 10 |
| **total** | | **13** | **6** | |

Thirteen enrollments and six completions, all devnet test data. Nothing of value is at risk.

### 15.2 `close_course` is the tool, and the precedent exists

Its own header:

> *"Migration tool: #184 resized `Course` (192 -> 224) with no migration path… This instruction
> takes the course as an `UncheckedAccount` so it can touch a stale / size-mismatched account…
> so `create_course` can recreate it (at the new size) in a later tx. Enrollments are separate
> PDAs keyed by `course_id` and are untouched here."*

This exact resize has been done once already. 224 → 248 follows the same path.

**What it costs:** `total_completions` and `total_enrollments` reset to zero. Enrollment PDAs
survive — their seeds are `["enrollment", course_id, user]`, unchanged by the resize. On devnet
the counters are noise. *On mainnet they would gate creator rewards through
`min_completions_for_reward`* — which is exactly why D7 says do this before mainnet.

### 15.3 The one non-obvious constraint

Existing `Enrollment.lesson_flags` bits were set by **array position** in the flattened
`modules[].lessons[]`, and enrollments survive the migration. Therefore:

> The initial `slots.lock.json` for each existing course must be generated from **today's live
> lesson order**, not from whatever order the repo ends up with.

Get this wrong and all 13 enrollments point at the wrong lessons. After the lockfile is frozen,
reordering is free forever. We cannot sidestep this by closing the enrollments:
`close_enrollment` requires `learner: Signer`, and we do not hold those keys.

### 15.4 Order of operations

```
Phase 0  Freeze          disable /teach authoring; no more Studio writes
Phase 1  Extract         GROQ-export the live dataset → generate the academy-courses tree
                         initial slots.lock.json derived from LIVE lesson order  ← 15.3
Phase 2  Schema + CI     packages/content-schema (Zod + block registry); validator;
                         two-sided executor gate. EXPECT FAILURES — see 15.6
Phase 3  Program v2      active_lessons mask; complete_lesson / finalize_course /
                         update_course; 128 Rust + 89 TS tests; re-audit those 3;
                         deploy devnet via Helius RPC
Phase 4  Devnet reset    close_course × 7  →  diffCourse reports not_deployed  →
                         admin clicks Sync  →  create_course recreates at 248 bytes with
                         active_lessons = dense mask of lesson_count
Phase 5  Sanity schema   blocks; module → inline object; weak refs; drop
                         authoringStatus/author/reviewFeedback; read-only Studio;
                         Viewer roles in sanity.io/manage
Phase 6  App             block registry; invert the completion gate; delete answer-key
                         machinery; declarative achievements; merge the two UserStates;
                         fix quest couplings
Phase 7  Sync + drift    POST /api/admin/content/sync; contentSync doc; drift UI
Phase 8  Retire          /teach authoring, import.mjs, backfill-authoring-status.mjs
```

Phase 4 needs no new tooling: closing the accounts makes `diffCourse` report `not_deployed`,
and the existing admin sync path calls `create_course`. Phases 3 and 5/6 are independent.
Phase 7 depends on 1, 2 and 5.

### 15.5 Content decisions this forces

- **`ops2aYkxIM6NMo1gE18U1o` / `xcvxcv-z1pie4`** — draft, never synced, no modules, no lessons.
  Test junk in the production dataset. **Not migrated. Deleted.**
- **`aD45H1NEbb1bqELwloGCqI` / `solana-101`** — since every Course account is closed and
  recreated anyway, this is the free moment to give it a real id, `course-solana-101`. Cost:
  one orphaned devnet Enrollment PDA. Its `xpPerLesson: 100` (the schema maximum, 10× the
  flagship course) is a policy question, not a technical one.
- **Three UUID lessons and one UUID module**, all Studio-created, get proper ids. Lesson ids
  feed `user_progress.lesson_id`, so the rewrite must carry those rows or accept losing three
  devnet lessons' progress records.
- The **four community achievements** enter the repo and their predicates come alive for the
  first time. **`achievement-speed-runner`** gets an `award.kind` or is deleted — CI gate 12
  will not let it stay in limbo. **`achievement-perfect-score`** needs a real
  `allTestsPassedFirstTry` signal or is deleted.

### 15.6 Phase 2 will fail, and that is the point

The two-sided gate runs the real executors against all 34 challenge lessons. **This is expected
to reject content that is live today.** In July 2026, 18 challenge test sets were rebalanced by
hand because visible tests did not prove correctness and learners hit false 403s. That fix was
applied to Sanity by inspection; nothing has verified it since. Phase 2 turns it into a
machine-checked invariant. Budget for fixing challenges, not just moving them.

### 15.7 Rollback

Sanity is rebuildable from git by definition — that is the architecture, not a contingency. The
devnet program retains its upgrade authority until the Squads handoff (#305). Course accounts
can be closed and recreated again. The repo is git. The only irreversible step is the mainnet
deploy, and it is deliberately last.

### 15.8 What must not happen before mainnet

- The audit sign-off for `complete_lesson`, `finalize_course` and `update_course` must be
  redone. "Byte-verified on devnet" does not survive this change.
- Squads custody handoff (#305) still gates mainnet, unchanged.
- If the mask were added *after* mainnet, `close_course` would reset `total_completions` on
  courses whose creator rewards depend on it. That is the concrete cost of deferring.

---

## 16. Documentation

### 16.1 The docs are wrong today, before any of this

`docs/CMS_GUIDE.md` (464 lines, `Last synced: 2026-03-02`) contains, among others:

| Line | Claim | Reality |
|---|---|---|
| 5, 441 | production is `solarium.courses` | prod is `superteam-academy-web.vercel.app` |
| 95 | `lesson.xpReward` — Required: Yes | the field does not exist |
| 104 | TestCase `id` — Required: Yes | absent from all 108 live test objects |
| 110 | hidden tests shown "after submission" | stripped from the payload entirely; and publicly readable anyway |
| 202 | visibility gate is `onChainStatus.status == "synced"` | plus `publicAuthoringGate` plus `coalesce(onChainStatus.isActive, true)` |
| 224 | strip the `achievement-` prefix | **the bug instruction** (§14.11) |
| 299 | `deployed-program-card` "shows the student's deployed program" | renders nothing |
| 391 | "All 15 achievement definitions" | 12 live |
| 460 | "XP Rewards: 10–50 for lessons" | lessons have no XP field |

`onChainStatus.isActive` — which gates every public read — is mentioned **zero** times.
`authoringStatus`, `author`, `/teach`, `approveCourse`/`rejectCourse`, `writeCourseActive` and
`getAllQuests` are entirely undocumented.

### 16.2 Stop hand-writing the reference tables

Every error above is a hand-maintained table mirroring a schema. That is why the file rotted in
four months. The `content-schema` package already emits `schema/*.json` for editor
autocomplete; the same generator emits the doc tables:

```markdown
<!-- BEGIN GENERATED: lesson-blocks -->
…field tables, block types, enums, on-chain caps…
<!-- END GENERATED -->
```

`pnpm docs:generate` fills the markers; CI runs it and fails on `git diff --exit-code`. Same
mechanism as `slots.lock.json`. A schema change that does not update the docs cannot merge.
Prose — workflows, rationale, tips — stays hand-written. Field tables never are again.

### 16.3 Doc impact

| Doc | Fate |
|---|---|
| `docs/CMS_GUIDE.md` | **Split.** Authoring → `academy-courses/{README,CONTRIBUTING}.md`. What stays: how the Sanity projection works, for maintainers. Field tables generated |
| `docs/CUSTOMIZATION.md` | Fix `:479` immediately. Rewrite achievements for declarative `award.kind` |
| `docs/ARCHITECTURE.md` | New data flow (`repo → Sanity → chain`); `Course.active_lessons`; block model; inverted completion gate |
| `docs/ADMIN.md` | Content-sync trigger; three-way drift UI; the `blocked` state |
| `docs/DEPLOYMENT.md` | Public dataset; no browser token; Viewer roles; no `SANITY_ADMIN_TOKEN` in Actions |
| `docs/SECRET-ROTATION.md` | `:47` is false; `:9`/`:20` name the wrong production deploy |
| `docs/DEPLOY-PROGRAM.md` | Program v2; `close_course` → `create_course` at 248 bytes |
| `docs/STAGING.md` | Dataset story under a derived projection |
| `README.md` | `:53` "15 achievements" → generated |
| `CLAUDE.md`, `apps/web/CLAUDE.md`, `apps/web/src/app/api/CLAUDE.md`, `packages/types/CLAUDE.md` | Block model; the API table still lists two routes that do not exist |
| `.claude/skills/superteam-academy-dev/{structure,testing}.md` | Repo tree; the two-sided CI gate |
| **new** | `academy-courses/{README,CONTRIBUTING,CLAUDE}.md` |

### 16.4 Docs are a per-phase gate, not a final phase

A docs-at-the-end phase is exactly how `CMS_GUIDE.md` got four months stale.

```
Phase 2  → docs:generate wired; CI diff gate; CONTRIBUTING.md written
Phase 3  → DEPLOY-PROGRAM.md, ARCHITECTURE.md (Course layout)
Phase 5  → CMS_GUIDE.md split; generated tables land
Phase 6  → CUSTOMIZATION.md:479 dies; achievement kinds documented
Phase 7  → ADMIN.md, DEPLOYMENT.md, SECRET-ROTATION.md
Phase 8  → README.md, CLAUDE.md family
```

Two fixes are pulled **out** of the plan and done now, because they are live landmines
independent of this work: the `achievement-` prefix instruction (`CMS_GUIDE.md:224`,
`CUSTOMIZATION.md:479`) and `SECRET-ROTATION.md:47`.

---

## 17. Open questions

- **`achievement-speed-runner`**: give it an `award.kind`, or delete it?
- **`achievement-perfect-score`**: implement a real `allTestsPassedFirstTry` signal, or delete
  it? Nothing currently records first-try passes.
- **`buildable` challenges in CI.** The two-sided gate needs the Anchor build server for the 8
  `buildable` lessons. It is Dockerized, so CI can run it, but the job is slow. The alternative
  is `cargo build-sbf` directly and treating "compiles" as the gate — which is what
  `buildable-executor` does anyway.
- **Widget-only lessons auto-complete.** `lesson-bfsp-m4-airdrop` holds one ungraded,
  unrequired widget, so a learner completes it by clicking Next without funding a wallet. We
  could make `widget` blocks optionally `required` with an attestation (balance > 0). A product
  call, not a schema one.
- **Asset dedupe scope** (per-project vs per-dataset) is not documented. Verify before relying
  on cross-dataset asset reuse.
- **`solana-101-p48pee`** sets `xpPerLesson: 100`, the schema maximum and 10× the flagship
  course. Teacher-set economics need a policy, not just a cap.
