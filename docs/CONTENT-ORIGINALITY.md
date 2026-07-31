# Content originality & code licensing

**Rule: every word and every line of example code in the catalog is original.**
(Unified launch spec 2026-07-25 §3 item 31; catalog-redesign spec §Licensing;
CAT-15.)

The reference corpora authors are pointed at are **technical anchors, coverage
checklists and outbound links only — never copy sources.** This document is the
originality policy, the reviewer protocol, and the content-repo PR-template
checkbox that item 31 asks for "at minimum."

## Why: the corpora are not adaptable

CAT-15 audited every Solana teaching corpus for its license:

| Corpus                                                                                                                                                            | License                        | Usable how                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------- |
| `solana-foundation/program-examples`, `coral-xyz/sealevel-attacks`, archived `developer-content`, cookbook repo, Ackee school, `developer-bootcamp-2024`, Neodyme | **none = all-rights-reserved** | checklist / anchor / outbound link |
| Metaplex docs, `mpl-core`                                                                                                                                         | all-rights-reserved / bespoke  | checklist / anchor / outbound link |
| Live Solana docs & cookbook (`solana.com`)                                                                                                                        | **GPL-3.0** (copyleft)         | checklist / anchor / outbound link |
| **LiteSVM, Mollusk, Surfpool**                                                                                                                                    | **Apache-2.0**                 | **adaptable with attribution**     |
| **Trident**                                                                                                                                                       | **MIT**                        | **adaptable with attribution**     |

Only the last two rows may be adapted. Everything else must be written from
scratch — the vulnerability _classes_, API _shapes_ and topic _coverage_ are
facts you may learn from and cite, but the _lines_ must be yours.

## The two enforcement layers

Originality cannot be proven by a CI check — a linter cannot know a hand-written
function is not a paraphrase. So enforcement is a human review step, with a
machine assist for the one case a machine can check.

### 1. Human review (the gate) — originality checkbox

Every content PR that adds or changes a code sample carries an originality
checkbox in its PR body (see the template below). The reviewer confirms it. This
is the actual originality guarantee; the linter below is only an assist.

### 2. Content-lint gate 20 (the assist) — declared-adaptation check

When a code block **legitimately adapts** LiteSVM/Mollusk/Surfpool/Trident, the
author declares it with the optional `attribution` field:

```yaml
- key: exercise
  type: code
  language: rust
  starter: exercise/starter.rs
  solution: exercise/solution.rs
  tests: exercise/tests.json
  attribution:
    source: LiteSVM
    license: Apache-2.0
    url: https://github.com/LiteSVM/litesvm
```

`content-lint` gate 20 then checks:

- **20a** — `source`/`url` must not name a forbidden corpus, **regardless of the
  license typed** (a mislabelled SPDX id cannot launder an all-rights-reserved or
  GPL-3.0 corpus).
- **20b** — `license` must be `Apache-2.0` or `MIT`.

**No `attribution` = the sample is claimed original**, and gate 20 says nothing —
that case is what the human checkbox attests. The field is the honest author's
way to record "I adapted this from X"; it does not and cannot catch undeclared
copying. Do not read a green gate 20 as proof of originality.

## Reviewer protocol

For each code block a PR adds or changes:

1. **Is it original?** Spot-check the non-trivial functions against the corpora
   the lesson cites (they are outbound links in the prose). If a block reads like
   a paraphrase of an all-rights-reserved or GPL-3.0 source, request a rewrite.
2. **If it declares `attribution`:** confirm the upstream really is
   LiteSVM/Mollusk/Surfpool (Apache-2.0) or Trident (MIT), and that the adaptation
   is genuinely derived from that Apache/MIT project — not from a forbidden corpus
   relabelled. Gate 20 catches the named-corpus and wrong-license cases; you catch
   the "adapted from Neodyme but attributed to LiteSVM" case.
3. **Tick the originality checkbox** only when both hold.

## Follow-up: content-repo PR template (academy-courses)

The originality checkbox lives in the **content repo's** PR template, which is a
separate repository from this monorepo. Add the following to
`academy-courses/.github/pull_request_template.md` in a follow-up content PR
(this monorepo cannot push there):

```markdown
## Originality & licensing (CAT-15)

- [ ] Every line of code I added is **original** — I did not copy or paraphrase
      `program-examples`, `sealevel-attacks`, `developer-content`, the cookbook,
      Ackee, `developer-bootcamp-2024`, Neodyme, Metaplex docs, or the GPL-3.0
      `solana.com` docs. Those corpora were checklists and outbound links only.
- [ ] Any code I **adapted** comes only from LiteSVM/Mollusk/Surfpool (Apache-2.0)
      or Trident (MIT), and every such block declares it via `attribution:`
      (`source`, `license`, `url`) so content-lint gate 20 can check it.
```

See `docs/superpowers/specs/2026-07-25-catalog-redesign-spec.md` §Licensing for
the full corpus audit, and `packages/content-lint/README.md` for gate 20.
