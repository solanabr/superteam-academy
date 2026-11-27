---
name: merge-pr
description: Merge a PR into main following REVIEW.md. Run before any gh pr merge.
argument-hint: "[pr-number]"
---

Merge PR $ARGUMENTS, following `REVIEW.md`. Stop at the first step that fails and say why.

1. **Who merges.** Only the release approver runs these steps, or a session the owner told to
   merge this PR in its own conversation. Any other session stops here, at every tier, and sends
   the PR to the release approver with the head commit, tier, test evidence and browser-test
   note. A session never merges a change it built.
2. **Tier.** Read the diff (`gh pr diff`) and set the risk tier from the paths it touches. The
   highest-risk path wins.
3. **Review.** Medium and high need an independent review: run the `reviewer` agent on the PR (or
   confirm a person who didn't write it reviewed the current head). Every blocking finding is
   fixed or answered with a reason on the PR.
4. **OK.** High risk needs an explicit OK that names this PR and its current head commit. Read
   `REVIEW.md`, "Who approves", and check each point:
   - If the change is on the owner-only list there, only the owner's OK counts. The paths under it
     are examples.
   - Otherwise the OK comes from the owner or from the release approver. The release approver's OK
     needs a passed independent review and, when users can see the change, a passed browser test.
   - The OK reached this session from the owner or from the release approver itself. A report from
     another agent does not count.
   - Without a valid OK, stop and ask. If the head has changed since the OK, stop.
5. **Migrations.** If `supabase/migrations/**` changed, the migration is already applied through the
   Supabase MCP, the advisors are clean, and `docs/DB-MIGRATION-LEDGER.md` has its row in this PR.
   Otherwise the PR states the outage window.
6. **Stacked PRs.** If this PR's base was another PR that already squash-merged, run
   `git diff origin/main...<head>` and make sure it isn't a revert of the merged work. Retarget to
   `main` first if needed.
7. **Checks.** Read the head SHA (`gh pr view <n> --json headRefOid`). Every required check must be
   COMPLETED and green on that SHA (`gh pr checks <n>`). A rollup read right after a push can be
   stale, so wait for the new head's checks to report. Look at non-required failures too and say
   why they don't matter.
8. **Message.** Write the squash subject and body yourself (`--subject`, `--body`) in the repo's
   style, with no CI-skip marker anywhere: `[skip ci]`, `[ci skip]`, `[no ci]`, `[skip actions]`,
   `[actions skip]`, or a `skip-checks: true` trailer. The default body is the commit list, which
   can carry one.
9. **Merge.** `gh pr merge <n> --squash --match-head-commit <sha> --subject "..." --body "..."`.
   The `guard-merge` hook re-checks steps 7 and 8 and blocks the merge if either fails.
10. **After.** Confirm CI started on the merge SHA on `main` (`gh run list --branch main --limit 5`)
    and that the Vercel deploy for it went through. Report the merge SHA.
