---
description: Work one unit of the launch backlog — babysit an open PR or advance the next issue, verified by both gates (CI + Claude review). Use with /loop or /goal.
---

You are driving Superteam Academy's mainnet-launch backlog. **The GitHub issues are the source of
truth.** Each run, do **one** useful unit of work, then stop. Optional lane filter via `$ARGUMENTS`
(e.g. `area:onchain`, or `area:db,area:frontend`). If empty, take any open issue.

## Each run, in priority order

**1. Babysit open loop PRs first (finish before starting new work).**

- List open PRs that were opened by this loop (branch prefix `loop/`). For each, check
  `gh pr checks <n>` and the latest **Claude review** comment.
- CI red → fix the failure. Claude review has **blocking** findings (security / correctness /
  "does not meet Done when") → address them. Push the fix. **CI re-runs automatically, but the
  Claude review does NOT re-run on push** — comment `@claude re-review` on the PR to trigger a fresh
  review, then wait for the NEW review before judging DONE.
- A PR is **DONE only when BOTH gates pass**: CI green **AND** the Claude review has no blocking
  findings. CI proves the mechanical (tests/types/lint); the review proves the semantic (actually
  implemented, correct, meets the issue's "Done when"). Neither alone is enough.

**2. If no PR needs babysitting, advance the next issue.**

- `gh issue list --state open --label priority:P0` (fall back to P1, then P2). Pick the
  highest-priority issue that is **unblocked** (`blocked:*` clear), **unclaimed** (no `loop:wip`
  label), and whose `area:` matches `$ARGUMENTS` (if set).
- Claim it (create the label once if missing): `gh label create loop:wip -c 5319E7 2>/dev/null || true`
  then `gh issue edit <n> --add-label loop:wip`. Read the body; implement to its
  **checklist + "Done when"**, following `CLAUDE.md` and `docs/TASK-CODES.md`.
- Branch per CLAUDE.md: `loop/<type>-<task-code>-<DD-MM-YYYY>`. One issue per PR. Open the PR with
  `Closes #<n>`. The two gates fire automatically; next run babysits it (step 1).

## Hard rules

- **NEVER self-merge** anything touching RLS / `supabase/schema.sql` / `onchain-academy` / secrets /
  mainnet. Run an adversarial **Workflow** (maker → verify → re-exploit → fixer), then leave the PR
  open and comment `needs human review` — a human signs off on those.
- **New finding** (from CI, the review, or your own work) → **dedup first**:
  `gh issue list --state open --search "<1-2 distinctive keywords: a table/function name or task code>"`
  (run 2-3 narrow searches — multi-word queries AND-fail and miss matches). Only if none match →
  `gh issue create` with `priority:` + `area:` + `severity:` labels (severity ∈ {critical, high,
  medium} — there is no `severity:low`). Self-growing until clean; don't fix out-of-scope inline.
- Auto mode + the repo allowlist handle permissions. Real blocker → comment on the issue and stop;
  don't thrash.

## Stop condition (the goal)

No open `priority:P0` or `priority:P1` issues, `main` CI green, gates `G-1…G-9` closed → report
**"Launch backlog clear — production-ready, pending the human mainnet-deploy confirmation"** and stop.
