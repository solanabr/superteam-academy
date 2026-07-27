# Handoff — orchestrator/gate loop, 2026-07-25

Two Claude sessions, two roles. This document is the contract between them.

> **A previous attempt at this split collapsed** (2026-07-15) because the implementer session absorbed
> both roles when waiting on the gate got awkward. The fix is mechanical, not cultural: the
> orchestrator **never waits** on the gate. It labels the PR, drops it, and takes the next issue. The
> gate works asynchronously from the label queue.

## Roles

|       | **Orchestrator** (fresh session)                                                                 | **Gate** (existing session)                     |
| ----- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Does  | Picks issues, dispatches subagents, implements, opens PRs                                        | Reviews PRs, verifies claims, merges or bounces |
| Never | Self-merges anything labelled `needs-gate`; makes owner decisions; touches the do-not-touch list | Implements features; picks issues               |
| Loop  | Continuous — always has exactly one issue in flight                                              | Drains the `needs-gate` queue when invoked      |

## The plan of record

**`docs/superpowers/specs/2026-07-25-UNIFIED-LAUNCH-SPEC.md`** supersedes the six 2026-07-25 research
specs. 57 numbered items, every one traceable to a validated claim. The other five specs remain as the
audit trail — read them only when the unified spec cites them.

Backlog: **issues #549–#608** are the plan. `#549–#589` are the launch-experience workstreams,
`#590–#592` the AI-tutor cost holes, `#594–#608` the items unification discovered.

## Loop protocol (orchestrator)

1. **Pick** the highest-priority unblocked, unclaimed issue (`priority:P0` → `P1` → `P2`; skip
   `loop:wip`, `blocked:*`, `needs-human`). Claim it with `loop:wip`.
2. **Verify it isn't already done** before implementing — stale-but-open issues are common here.
   If satisfied, comment citing the resolving commit, close, remove `loop:wip`. That closed issue is
   the unit of progress.
3. **Implement via one specialist subagent** routed by `area:` (`area:onchain` → anchor-engineer,
   `area:testing` → solana-qa-engineer, else general-purpose). It implements, **runs the real
   verification locally** (`pnpm typecheck`, the relevant tests, `content-lint` for content), commits,
   pushes, opens **one** PR with `Closes #N`.
4. **Verify the verification.** Do not trust a subagent's "tests pass" — run the command yourself and
   read the output. This is the single highest-value thing the orchestrator does.
5. **Route the PR:**
   - **SAFE** (`area:frontend`/`docs`/`analytics`/`content` and CI green + review approve): merge it.
   - **SENSITIVE** — any of `supabase/**`, `onchain-academy/**`, `.github/workflows/**`, `.claude/**`,
     real env files, **or** labels `area:security`/`area:onchain`/`area:db`/`area:ci`: dispatch an
     **independent adversarial reviewer** (a fresh, hostile agent told to _break_ the claim, not
     confirm it), fix everything it finds, then label **`needs-gate`**, comment why, and **stop
     babysitting it**. Do not wait. Take the next issue.
6. **New findings** → dedup with 2–3 narrow searches, then file with `priority:`/`area:`/`severity:`.
   Never fix out-of-scope work inline.

## Gate protocol (this session)

Drain `label:needs-gate`. For each PR, in this order:

1. **CI green.**
2. **Read the `claude[bot]` review body** — not just that a comment exists. A green `claude-review`
   check only means the action ran. Every non-blocking finding must be fixed or filed before merge;
   one left neither is lost work.
3. **Re-verify the load-bearing claims against the code**, not the description.
4. **Confirm the adversarial review happened** and its findings landed.
5. **Check nothing in the do-not-touch list moved.** Then merge, or bounce with specifics.

Bounced PRs get `needs-gate` removed and a comment; the orchestrator picks them back up.

### Ship-loop upgrades (added 2026-07-27, owner-approved)

Three rules imported from red-first/BDD practice, each patching a failure this loop actually had:

1. **A bounce comes back as a failing test, not prose.** When the gate bounces a PR for a defect,
   the fix push MUST include a regression test that **fails at the bounced head** and passes at the
   new one. The gate verifies red-first the way it verifies md5s (stash/checkout the old head, run
   exactly that test, watch it fail). Rationale: green-while-guarding-nothing tests are how #699's
   hollow guards happened; prose bounces are how #738/#748 stayed unfixed for hours.
2. **PR bodies claim red-proof explicitly.** Any PR whose point is "this can never happen again"
   states: `regression test <file> verified failing at <sha>`. A checkable claim, not a vibe.
   (First done ad hoc on #746 — now the convention.)
3. **The critical learner paths get Playwright, in CI** (tracked in its own issue): enroll →
   complete → XP; catalog gate (active courses render, deactivated don't); unsubscribe. The gate's
   manual runtime smokes caught #711 and validated the Next 15 upgrade, but they die with the
   session — 04-layer coverage must outlive the operator.

What we deliberately did NOT import: full Gherkin/BDD ceremony (two-agent loop, launch week), and
collapsing the gate into a pipeline stage. The gate's value is that it is a **different agent
verifying claims against reality** (prod DB, chain, live renders) — not the same author's context
checking rule-compliance. Records-vs-reality was our biggest bug class (6 instances); no in-pipeline
gate catches those.

### Branch lifecycle — the collision that already happened once

The gate squash-merges with `--delete-branch`. **Once a PR is merged, its branch is closed for
business.** Pushing further commits to it _recreates_ the branch with work attached to no open PR,
where it is silently orphaned.

- **Orchestrator:** after the gate merges, land follow-ups on a **new branch off `main`**, referencing
  the issue. Never re-push to a merged branch.
- **Gate:** before merging, check whether the orchestrator is still pushing; after merging, comment on
  the issue so it knows the branch is closed.

This cost two commits on 2026-07-26 (recovered in #618) — the deny-egress comment correction and the
`aria-disabled` fix.

## Do not touch without the owner

- **Mainnet anything.** Deploys, course creation, custody (#305).
- **Production DB migrations** beyond the dry-run stage.
- **The devnet on-chain window** (#606/#607) — batched, after the track-ladder decision.
- **`course.creator`, `trackId`, `trackLevel`** — immutable after on-chain creation.
- **courses-academy PRs #5 and #6** — CI green, awaiting owner merge.

## Owner decisions already made (do not relitigate)

- **No in-app coin.** Superteam sponsors the AI tutor. A learner-facing wall exists and is generous;
  budget may exceed $300/mo at 10k MAU and must simply be coherent with scale.
- **No XP re-mint.** Start from zero; clean up the DB (#607). **Never touch `profiles` or auth users** —
  a large cohort signed up at last week's event.
- **X, not LinkedIn**, for credential sharing. X share already ships; polish and localize it.
- **PB-1 recommendation: pure functions over fixtures** (#600) — pending owner confirmation.
- `course.creator = B7o8Nf…vzJF` is correct, not a placeholder.

## Open decisions that block work — escalate, never guess

- **O-1** AI sponsor commitment figure → blocks #591 thresholds.
- **O-2** Capstone scope: follow-along vs original program → blocks #561 and the AI-off-in-capstone rule.
- **O-3** Credential track ladder → blocks the on-chain window; irreversible after mainnet.
- **O-4** Anonymous progress banking → blocks the landing deep-link (#562).

## Start here

**#594** (build-server bump) — P0, no decision needed, longest pole, gates all Rust authoring.
Then **#595** (launch-breaking), **#590** (live cost leak), **#598** (blocks a merged-ready content PR).

## Gotchas

`MEMORY.md` loads automatically and carries the expensive ones. The three that bite hardest:
deploy on-chain **only** via Helius RPC; `gh pr edit --add-label` fails on these repos (use the REST
API); and pushing to `courses-academy` needs the gh token — the ambient git credential is read-only.

## Two agents, one backlog, one file tree (added 2026-07-26)

Both roles now author. That is fine, but it collides on files unless scoped, and the collisions are
**invisible in a diff** — a dropped array during a rebase looks exactly like a clean rebase.

Hit twice on 2026-07-26:

- **#10 ↔ #11** — both edited the `blocks:` region of four `bfsp` lesson files (#10 added `tutorNotes`,
  #11 appended a `retrieval-close` quiz). Resolution was keep-both; dropping #10's arrays would have
  silently reverted merged work.
- **#14 ↔ C3** — the orchestrator picked #683 (tutorNotes for `your-first-build` /
  `deploy-program-devnet`) from the backlog while an in-flight C3 authoring workflow was instructed to
  add the same notes **and renames both lessons** (`from-rust-core-to-anchor`,
  `deploy-and-publish-the-idl`). Duplicated work, and #14's notes land on paths C3 deletes.

**Rules:**

1. **Announce an authoring workflow's file scope before launching it**, as a comment on the issues it
   subsumes. A course-level workflow owns every lesson in that course for its duration.
2. **Do not pick a backlog issue whose files an in-flight workflow owns.** #683 was in-scope for C3;
   it should have been left to C3 or C3 told to skip it. Either is fine — both is not.
3. **On any rebase touching content, verify the OTHER side's additions survived**, per file, by
   counting them. Never infer it from "the rebase was clean". Both incidents above would have passed
   that inference and lost data.
4. **A rename makes the other side's edit land on a dead path.** Check for renames before assuming a
   conflict is a content disagreement — CATALOG-specified renames are not conflicts to adjudicate,
   they are paths to carry edits onto.
