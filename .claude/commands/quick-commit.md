---
description: "Commit the current change: branch off main if needed, stage named files, conventional message"
disable-model-invocation: true
---

Commit the work in progress. Husky's pre-commit hook does the formatting and Rust checks, so this
command doesn't reformat the repo or run broad tools.

## 1. Branch

If the current branch is `main`, create one first, named
`<type>/<scope>-<description>-<DD-MM-YYYY>` (today's date), e.g. `fix/cooldown-check-12-02-2026`.
Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`. Ask if the scope isn't obvious.

## 2. Stage named files

Run `git status --short` and stage only the files that belong to this change, by name:

```bash
git add apps/web/src/lib/foo.ts apps/web/src/lib/__tests__/foo.test.ts
```

Never `git add -A`, `git add .` or `git add -u`. Untracked scratch files, test repros and tool
caches sit in this tree, and a sweep has committed hundreds of them before. If something
unexpected is untracked, leave it and mention it.

## 3. Check

Run the checks for what you staged before committing:

- TS/TSX in `apps/web`: `pnpm --filter web typecheck` and the tests next to the files.
- Rust in `onchain-academy`: `cargo test -p onchain-academy-pinocchio` (from `onchain-academy/`).
- Migrations: confirm they're applied per `supabase/CLAUDE.md`.

The pre-commit hook then runs prettier on staged files (lint-staged) and `cargo fmt --check` plus
clippy when Rust is staged. If it fails, fix the cause and commit again. Don't use `--no-verify`.

## 4. Message

Conventional prefix and a short imperative subject, optional scope: `fix(web): stop the double
submit on enroll`. Add a body only when the why isn't obvious from the diff, in one or two plain
sentences. No emoji and no CI-skip markers (the `guard-git` hook blocks them).

```bash
git commit -m "fix(web): stop the double submit on enroll"
```

Show `git log -1 --stat` afterwards. Don't push unless asked.
