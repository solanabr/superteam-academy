---
description: Work one unit of the launch backlog — babysit+merge an open loop PR, or advance the next issue via a specialist subagent. Verified by both gates (CI + Claude review). Drive with /goal.
---

You are driving Superteam Academy's mainnet-launch backlog. **The GitHub issues are the source of
truth.** Each run, do **one** useful unit of work, then stop. Optional lane filter via `$ARGUMENTS`
(e.g. `area:onchain`, or `area:db,area:frontend`). If empty, take any open issue.

**Keep this session lean.** Do the heavy lifting in a subagent and keep only its summary (step 2) —
context degrades as it fills, and a `/goal` run spans many turns.

## Each run, in priority order

**1. Babysit the open loop PR first (finish in-flight work before starting new work).**

- Find loop PRs: `gh pr list --state open --json number,headRefName --jq '[.[]|select(.headRefName|startswith("loop/"))]'`.
- For each, read **both gates**:
  - **CI**: `gh pr checks <n>`.
  - **Review verdict**: the latest `claude[bot]` issue-comment —
    `gh api repos/{owner}/{repo}/issues/<n>/comments --jq '[.[]|select(.user.login=="claude[bot]")]|last|.body'`.
    It leads with `Verdict: Approve ✓` or blocking findings. **The `claude-review` CHECK turning
    green only means the action ran — it is NOT the verdict. Read the comment.**
- Act on state:
  - **CI still pending** (checks not all complete) → **cheap no-op turn**: print `PR #<n>: CI pending`
    and stop. Do not spin; do not start a second issue.
  - **CI red** → fix the failure (delegate to the step-2 specialist subagent if non-trivial), push.
  - **Review has blocking findings** → address them, push, comment `@claude re-review` (the
    auto-review does NOT re-run on push), and **wait for the NEW `claude[bot]` comment** next turn
    before judging.
  - **BOTH gates pass** (CI green AND latest verdict = approve / no blocking) → **MERGE STEP:**
    - **First, triage the review's NON-BLOCKING findings — never merge-and-forget.** For each
      one: **fix** the cheap, real, in-scope ones and push (then re-verify); **file** the rest as
      deduped issues; **decline** genuine over-engineering with a one-line reason in the PR. A
      "non-blocking" note left neither fixed nor tracked is lost work — not allowed. Only then:
    - **SENSITIVE** — any changed path under `supabase/schema.sql`, `onchain-academy/**`,
      real env/secret files (`.env`, `.env.local`, `.env.*` — but NOT public `*.example`
      templates), `.github/workflows/**`, or `.claude/**`; OR issue label ∈
      {`area:security`, `area:onchain`, `area:db`, `area:ci`}: **MANDATORY, never skipped as
      "redundant"** — dispatch an **independent adversarial reviewer** (a fresh, skeptical agent
      told to BREAK the security claim, not confirm it). The single `claude[bot]` gate is NOT
      sufficient: it has OK'd loop PRs that would have broken prod (a CSP that blocked the Monaco
      CDN app-wide) and shipped a CSRF hole on on-chain-authority routes. **Fix everything it
      finds and re-verify.** THEN **leave the PR open**, add label `needs-human-review`, comment
      `needs human review`, and **stop babysitting it**. NEVER self-merge these — a human signs off.
    - **SAFE** — everything else (`area:frontend`/`docs`/`testing`/`ops`):
      `gh pr merge <n> --squash --delete-branch`. The issue auto-closes via `Closes #<n>`.

**2. If no loop PR needs babysitting, advance the next issue.**

- `gh issue list --state open --label priority:P0` (fall back to P1, then P2). Pick the
  highest-priority issue that is **unblocked** (`blocked:*` clear), **unclaimed** (no `loop:wip`),
  and whose `area:` matches `$ARGUMENTS` (if set).
- Claim it: `gh label create loop:wip -c 5319E7 2>/dev/null || true` then
  `gh issue edit <n> --add-label loop:wip`. Branch per CLAUDE.md: `loop/<type>-<task-code>-<DD-MM-YYYY>`.
- **First, verify "Done when" isn't ALREADY met** — stale-but-open issues are common here. Run the
  check (`pnpm typecheck`, the relevant tests) or confirm the referenced fix is already in `main`
  (`git log --oneline -- <path>`). If already satisfied → **do NOT reimplement**: comment citing the
  resolving commit, `gh issue close <n>`, remove `loop:wip`. That closed issue IS the unit's progress.
- **Implement via ONE specialist subagent**, routed by the issue's `area:` (keeps this session lean,
  applies domain expertise):
  - `area:onchain` → `anchor-engineer` · `area:testing` → `solana-qa-engineer` ·
    everything else → `general-purpose`.
  - Hand the subagent: the issue number + body, its **checklist + "Done when"**, the branch name,
    and `CLAUDE.md` + `docs/TASK-CODES.md` conventions. It implements, **runs the relevant
    tests/build locally to verify** (the most important step — agent-runnable verification), commits,
    pushes, and opens **one** PR with `Closes #<n>`. It returns a **short summary** (PR #, what
    changed, verification result). Keep only that summary.
- The two gates fire automatically on PR open; next run babysits it (step 1).

## End every turn

Print one status line so the `/goal` evaluator can judge completion from the transcript:
`OPEN P0=<n> P1=<n> | main CI=<green|red> | this turn: <merged #X | opened #Y | babysat #Z | no-op>`

## Hard rules

- **NEVER self-merge** SENSITIVE PRs (step 1). A human signs off on RLS / schema / on-chain /
  secrets / mainnet / CI-workflow / `.claude` changes.
- **New finding** (from CI, the review, or your own work) → **dedup first**:
  `gh issue list --state open --search "<1-2 distinctive keywords: a table/function name or task code>"`
  (run 2-3 narrow searches — multi-word queries AND-fail and miss matches). Only if none match →
  `gh issue create` with `priority:` + `area:` + `severity:` (severity ∈ {critical, high, medium} —
  there is no `severity:low`). Self-growing until clean; don't fix out-of-scope inline.
- **Labeling a PR: use the REST API**, not `gh pr edit --add-label` — the latter errors on this repo
  via the deprecated projects-classic GraphQL path:
  `echo '{"labels":["<label>"]}' | gh api repos/{owner}/{repo}/issues/<n>/labels --method POST --input -`.
  (Issue labels via `gh issue edit <n> --add-label` work fine.)
- Run under **auto mode** for permissions. Real blocker → comment on the issue and stop; don't thrash.

## Stop condition (the goal)

No open `priority:P0` or `priority:P1` issues, `main` CI green, gates `G-1…G-9` closed → report
**"Launch backlog clear — production-ready, pending the human mainnet-deploy confirmation"** and stop.
