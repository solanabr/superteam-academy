---
description: "Sweep open PRs: CI on the head SHA, review state, stale ones; file genuinely new findings as deduped issues. Read-mostly."
disable-model-invocation: true
---

Sweep the open PRs once, report, and stop. You comment and file issues; you never push code to a PR
and never merge.

## Each run

1. List open PRs: `gh pr list --state open --json number,title,headRefName,headRefOid,author,isDraft,updatedAt`.
2. For each non-draft PR, read:
   - CI on the current head: `gh pr checks <n>`. Pending means pending, not green.
   - Review state: human reviews and any `reviewer` findings posted on the PR. Is every blocking
     finding fixed or answered?
   - The risk tier from the changed paths (`REVIEW.md`), and for high risk whether the owner has
     given an explicit OK on the current head.
3. Act, once per PR:
   - CI red, or blocking findings open: post or update one summary comment (edit in place using a
     `<!-- triage -->` marker; never stack comments) with the failing checks and open findings.
   - Green, reviewed for its tier, and owner-approved if high: say so in the digest. Merging is
     `/merge-pr`'s job.
   - No activity for 7+ days: one nudge comment.
4. Turn real backlog items found in reviews or CI into issues, deduped first: run two or three
   narrow searches (`gh issue list --state open --search "<one distinctive term>"`; multi-word
   queries miss matches) and create an issue only when none match. An issue is problem, evidence,
   done-when. Use existing labels if they fit; don't create labels.
5. Print a digest: PRs by state (green / CI pending / CI red / waiting on review / waiting on the
   owner / stale), and issues filed this run, or "none, all findings already tracked".

If there are no open PRs and nothing new, say so in one line and stop.

## Guardrails

- Never push to, approve, or merge a PR from this command.
- Don't repeat a finding that's already on the PR or in an open issue.
- On-chain, migration, auth and secrets findings: flag them for the owner; don't propose a fix in
  the comment that reveals more than the PR already does. The repo is public.
- If `gh pr edit` fails on the classic-Projects deprecation, use the REST API
  (`gh api repos/{owner}/{repo}/issues/<n>/labels`).
