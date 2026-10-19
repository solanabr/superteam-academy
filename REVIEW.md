# Review

How changes get reviewed and merged here. The `reviewer` agent and `/merge-pr` follow this file.

## Risk tier

What the diff touches sets the tier, not who wrote it. The highest-risk path in the diff wins.

- **Low**: docs, copy, tests only, or an additive change behind a flag that ships off. Merges once CI
  is green.
- **Medium**: anything that isn't low or high. Needs one independent review: the `reviewer` agent,
  or a person who didn't write the change.
- **High**: needs an independent adversarial review and the owner's explicit OK before merge. An
  agent's approval never counts as the owner's. An OK covers the head commit it was given on, so a
  new push needs a new one.

High covers these paths (`apps/web/src/` omitted):

- `onchain-academy/**`: program code, IDL, deploy scripts.
- Destructive admin paths: `app/api/admin/**`, `lib/admin/**`, `lib/solana/admin-signer.ts`
  (recreate, close, deactivate, resync, freeze).
- Auth and SIWS: `app/api/auth/**`, `lib/auth/**`, `lib/solana/verify-siws.ts`, `middleware.ts`.
- CSP: `lib/csp.ts` and the headers in `apps/web/next.config.mjs`.
- Money the platform spends: `app/api/enroll/sponsor/**`, `lib/solana/sponsor-enroll.ts`,
  `lib/solana/xp-mint.ts`, `app/api/certificates/mint/**`, `lib/ai/spend-ledger.ts`.
- DB migrations: `supabase/migrations/**`.
- CI and agent guardrails: `.github/workflows/**`, `.claude/settings.json`, `.claude/hooks/**`.
- The content compiler and preview proxy: `lib/content/compile/**`, `scripts/compile-content.ts`,
  `lib/teach/**`, `app/api/teach/preview/**`, `app/content-assets/**`.

## What failure looks like

- Program: an account accepted without an owner, signer or PDA check; unchecked arithmetic; a
  layout, discriminator or error drifting from the IDL; a lesson bit not taken from the slot lock.
- Admin: learner progress destroyed; mainnet reached without the course-identity guard; a partial
  failure reported as success; a route reachable by a non-admin.
- Auth: nonce replay; a session minted for the wrong account; an open redirect; wallet-link takeover.
- CSP: an inline script without the nonce; `unsafe-inline` or `unsafe-eval` widened; Monaco or the
  Dynamic SDK broken (check it in a browser).
- Money: the learner taken from the request body; an uncapped fee, mint or AI spend; a limiter that
  fails open on a paid path.
- Migrations: users able to write rows the platform trusts; SECURITY DEFINER without a fixed
  `search_path` or without the `REVOKE`; not idempotent; a timestamp collision; no ledger row.
- Workflows: secrets reachable from fork PRs; `pull_request_target` checking out PR code; an action
  not pinned to a SHA; broader token permissions.
- Compiler and preview: a fetch to a host derived from user input; path traversal; solutions or
  hidden tests in a client payload; bundle output that isn't deterministic.
- Grading (`lib/grading/**`, `packages/challenge-executor/**`, `app/api/lessons/**`): a forgeable
  completion; an unavailable executor treated as a pass.
- UI: anything that only shows in computed CSS. Check the rendered page; reading the source misses
  `backdrop-filter` or `transform` re-parenting a `position: fixed` element.
- Anywhere: key rotation status, custody, budgets or unpatched findings written into code, docs, a
  commit or the PR body. The repo is public.

## Findings

Only correctness, security and gaps against the linked issue's done-when block a merge. Everything
else is optional, three nits at most, never blocking. Each finding gives:

- `file:line`;
- the failure scenario: what input or sequence produces what wrong outcome;
- the impact;
- evidence or a repro (a command, a test, a trace through the code), not a guess from a name;
- the class of bug, and any other place in the diff with the same class.

Tag a bug the diff didn't introduce as pre-existing. Start the summary with the number of blocking
findings, and say plainly when there are none.

## Rounds

- After the first pass, re-review only the new diff and whether earlier findings were fixed.
- Don't repeat a finding that was already raised.
- After three rounds on the same PR, stop and question the approach instead of patching again.
- A finding that keeps coming back across PRs belongs in this file, a `CLAUDE.md`, a skill or a lint rule.

## Skip

`apps/web/src/content/generated/**` (review the `content.lock` bump and recompile instead),
`apps/web/src/lib/content/__tests__/fixtures/golden/**`, `pnpm-lock.yaml` unless a dependency was
added, and `docs/superpowers/**`.

## Merging

- Merge only when every required check has COMPLETED green on the PR's current head SHA. A rollup
  read right after a push can be stale; "no failures" isn't green.
- Strip `[skip ci]`, `[ci skip]` and `[no ci]` from the squash subject and body, then confirm CI
  started on the merge SHA.
- After a stacked PR squash-merges, diff its base PR against `main` before merging that one too. It
  can turn into a revert.
- `/merge-pr` walks these steps. The `guard-merge` hook blocks `gh pr merge` until the checks are
  green and the message is clean.
