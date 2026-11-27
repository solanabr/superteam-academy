# Superteam Academy

A learning platform on Solana. Learners enroll in courses and finish lessons to earn soulbound XP
(Token-2022) and Metaplex Core credentials. This repo is public.

## Layout

- `apps/web/`: Next.js 15 App Router app with the API routes and the admin panel. See its
  `CLAUDE.md`, and `src/app/api/CLAUDE.md` for routes.
- `apps/build-server/`: Rust/Axum service on Cloud Run that compiles learners' Anchor programs.
- `onchain-academy/`: the on-chain program, Pinocchio only. See its `CLAUDE.md` and
  `docs/DEPLOY-PROGRAM.md`.
- `packages/`: `@superteam-lms/*` (types, config, content-schema, content-lint,
  challenge-executor, deploy).
- `supabase/`: migrations, which are the source of truth. See its `CLAUDE.md` and
  `docs/DB-MIGRATION-LEDGER.md`.
- Course content is a committed bundle compiled from `solanabr/academy-courses` at the SHA in
  `apps/web/content.lock`. Course images live in Vercel Blob.
- `docs/ARCHITECTURE.md` covers data flows; `.env.example` lists every env var.
  `docs/superpowers/specs/` holds dated design records: when one disagrees with the code, trust the code.

The web client uses `@solana/web3.js` 1.x and `@coral-xyz/anchor` against an Anchor-format IDL that
the Pinocchio program stays wire-compatible with. Sign-in is SIWS (nonces in the `siws_nonces`
table), Google/GitHub OAuth, or Dynamic embedded wallets. Challenges are graded on the server in
QuickJS (`packages/challenge-executor`); Rust challenges go through the build server.

## Commands

```bash
pnpm typecheck && pnpm lint && pnpm -r test   # CI "Frontend" job
pnpm --filter web dev                         # also: test, e2e, compile-content
pnpm test:hooks                               # .claude/hooks guards
cargo test --manifest-path onchain-academy/Cargo.toml -p onchain-academy-pinocchio
```

## Hard rules

- IMPORTANT: nothing touches mainnet without the owner's explicit confirmation in the conversation.
  That covers program deploys, upgrades and authority changes, and admin course writes.
- Program deploys and buffer writes go through a Helius RPC only, never the public devnet endpoint.
- Never print secrets: env values, keypairs, or RPC URLs, which carry API keys. Don't run
  `solana config get`/`set` (both print the URL) or echo `.env` files.
- Never set a git identity in a clone or worktree; the global one is inherited. Stage files by
  name, never `git add -A` or `git add .`. No CI-skip markers in commit messages or squash bodies.
- Apply DB migrations through the Supabase MCP before the PR merges (`supabase/CLAUDE.md`).
- Content `_id`s go into PDA seeds unchanged. Lesson bits come from the slot lock, never from a
  lesson's array position (`.claude/rules/onchain-client.md`).
- Don't hand-edit `apps/web/src/content/generated/`. Bump `content.lock` and recompile instead.
- The repo is public. Issues, PRs, docs and code comments never describe security or ops posture:
  custody, key rotation status, unpatched findings, budgets, balances or internal URLs.

The hooks in `.claude/hooks/` enforce the Helius, git identity, CI-skip and merge-check rules. They
catch the usual Bash command forms. They're a guard rail, not a security boundary. They run `node`,
which must be on the PATH of the shell Claude Code uses: they fail closed, so a missing `node`
blocks every command they match.

## Review and merge

`REVIEW.md` sets the risk tier from what a change touches, not from who wrote it.

- Low risk merges on green. Medium needs one independent review (the `reviewer` agent). High needs
  an independent adversarial review plus an explicit OK that names the PR and its head commit. The
  OK comes from the owner or from the approver the owner delegated. Some changes take only the
  owner's OK: `REVIEW.md`, "Who approves", lists them. No other agent's approval counts.
- Merge only when every required check is COMPLETED and green on the current head SHA. Use
  `/merge-pr`; the `guard-merge` hook re-checks before `gh pr merge` runs.
- UI changes need a check in a rendered browser. Reading the source misses computed CSS.

## Branches, commits and writing style

Branch names follow `<type>/<scope>-<description>-<DD-MM-YYYY>`, e.g.
`fix/cooldown-check-12-02-2026`. Husky runs prettier through lint-staged, plus `cargo fmt`/clippy
when Rust is staged.

Write commits, PRs, issues, comments and decision logs in the style of Simplified Technical English
(ASD-STE100): short, objective, one meaning per word. Use its writing rules, not its dictionary.

- One idea per sentence. Active voice, simple present. An instruction has 20 words or fewer, a
  description 25 or fewer.
- Use one word for one thing. No synonyms for variety, idioms, filler, hedging or intensifiers.
- State the fact or the decision. Do not comment on it.
- Never name agents or sessions, and never say how work moved between them. Never quote who
  approved or describe review rounds. When a record must say who decided, give the role and date.
- A commit is a conventional prefix (`feat`, `fix`, `docs`, `chore`, `refactor`, `ci`, `test`) plus
  a short imperative subject. Add a body only when the reason is not clear from the diff: one or
  two sentences, no list of the changes.
- A PR body has three parts of one or two sentences each: Change, Reason, Test. Add screenshots
  when users see the change. Link the issue; do not repeat it.
- An issue is problem, evidence, done-when. A comment or review reply is one to three sentences.
- No status emoji, bold labels on every paragraph, restated diffs, ceremony or closing summaries.
