---
description: "Take one GitHub issue to a reviewed PR: verify, implement, test, open, and merge per REVIEW.md"
argument-hint: "[issue-number]"
disable-model-invocation: true
---

Work issue #$ARGUMENTS from start to a reviewed PR. If no number is given, ask which issue; don't
pick one yourself. GitHub issues are the source of truth. Labels are optional context.

## 1. Read and check it isn't already done

- `gh issue view <n> --comments`. Find the done-when. If there isn't one, write it down from the
  issue and confirm it with the user before building.
- Check whether `main` already meets it: run the check the issue names, or find the fixing commit
  (`git log --oneline -- <path>`). If it's done, comment with the commit and close the issue. That
  is the unit of work.

## 2. Branch and implement

- Branch from an up-to-date `main`: `<type>/<scope>-<description>-<DD-MM-YYYY>`.
- Read the `CLAUDE.md` of each area you touch first.
- For a large change, hand the implementation to a `general-purpose` subagent with the issue, the
  done-when and the branch, and keep only its summary.
- On-chain work follows `onchain-academy/CLAUDE.md`. Migrations follow `supabase/CLAUDE.md`: apply
  through the Supabase MCP before merge and record the ledger row in the same PR.

## 3. Verify

Run the tests and checks for every area touched, and the exploit or repro the issue describes. For
UI, check the rendered page in a browser. Record what you ran; it goes in the PR's Testing section.

## 4. Open the PR

Commit with `/quick-commit` conventions (named files only), push, and open one PR with
`gh pr create` using `.github/pull_request_template.md`. Put `Closes #<n>` in the body. If
`gh pr create` or `gh pr edit` fails on the classic-Projects deprecation, use the REST API
(`gh api repos/{owner}/{repo}/pulls`).

## 5. Review and merge

- Set the risk tier from the diff (`REVIEW.md`).
- Medium and high: run the `reviewer` agent on the PR. Fix every blocking finding, or answer it
  with a reason, and re-review only the new diff. After three rounds, stop and rethink the approach.
- File non-blocking findings you don't fix as new issues, after searching for duplicates
  (`gh issue list --state open --search "<distinctive term>"`, two or three narrow searches).
- High: stop and ask the owner for an explicit OK on the current head. Mainnet actions and real
  secret values are always the owner's.
- Merge with `/merge-pr` once CI is green on the head SHA.

End with one line: the PR number, its tier, and its state (merged, waiting on CI, waiting on the
owner, or blocked and why).
