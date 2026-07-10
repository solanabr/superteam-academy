# cs8-extraction

One-shot, **read-only** migration tool that extracts the live Sanity dataset into the `solanabr/courses-academy` content-standard tree (CS-8, spec §15, plan #388).

It writes nothing to Sanity, Supabase, or chain. The only writes are files in the target checkout.

## Run

```bash
pnpm --filter @superteam-lms/content-lint exec tsx \
  "$(pwd)/scripts/cs8-extraction/extract.ts" ~/Documents/STBR/courses-academy
```

It is invoked through `content-lint`'s package so `yaml` and `@superteam-lms/content-schema` resolve. It lives outside `packages/` on purpose: it is a throwaway tool, not shipped, and not in the web typecheck scope.

## Then gate it

```bash
# 1. every gate, zero errors (Rust/buildable blocks emit notices — tolerated)
pnpm --filter @superteam-lms/content-lint exec tsx src/cli.ts ~/Documents/STBR/courses-academy

# 2. §15.3 bit-verification — slots must reproduce every on-chain completion bit
cd apps/web && pnpm exec tsx scripts/cs8-verify-bits.ts
```

## What it decides

Both are owner decisions, encoded as constants at the top of `extract.ts`:

- **Dropped courses.** `aD45H1NEbb1bqELwloGCqI` (solana-101) and `ops2aYkxIM6NMo1gE18U1o`. Neither id matches `^course-<kebab>$`, so `CourseId` rejects them regardless. Their lessons drop with them. `path-solana-core` loses its reference to the former; `path-ai-solana` referenced only it and becomes `draft: true`, as the schema requires of an empty non-draft path.
- **Curated achievements.** `speed-runner` and `perfect-score` are deleted — no first-try or timing signal exists, so no award kind can express them. `full-stack-solana` → `path-completed`, `course-completer` → `course-completed`, `bug-hunter` → `manual`. No community achievements; none are live.

## Why slots come from live array order

`Enrollment.lesson_flags` bits were set by `findLessonIndex`, which flattens `modules[].lessons[]` by **array position**. `slots.lock.json` must therefore freeze today's live order exactly, or the CS-4 course reset would corrupt real progress.

The script imports `assignSlots` from `@superteam-lms/content-schema` rather than reimplementing it, so slot semantics cannot drift from the app. For all six courses, array order and `| order(order asc)` are identical — verified — so the ordering is unambiguous.

`cs8-verify-bits.ts` independently confirms the result against devnet: **152 PASS / 0 FAIL / 0 FLAG**.

## Idempotence

Re-running wipes and regenerates `courses/`, `achievements/`, `quests/`, `paths/`, `instructors/`. It leaves scaffolding (`README`, `schema/`, `.github/`, `.vscode/`, `teachers.yaml`) untouched.
