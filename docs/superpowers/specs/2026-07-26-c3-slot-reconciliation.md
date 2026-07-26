# C3 slot ID reconciliation — `building-your-first-solana-program`

**Closes #602.** Plan-of-record for the lesson `id` → on-chain slot map that the C3 content PR
must ship. Companion to the catalog redesign (`2026-07-25-catalog-redesign-spec.md` §"Course 3")
and the unified launch spec §3 item 22.

**Why this document exists.** A slot is a permanent on-chain bitmap position in
`Enrollment.lesson_flags` / `Course.active_lessons`. `slots.lock.json` pins `lessonId → slot`.
The C3 redesign renames and reorders almost every lesson; if the content PR gets the `id` strings
wrong, `slots.lock` regenerates to a different map and either fails CI or (worse, on a fresh
deploy) mis-activates lesson bits. The catalog spec deferred the exact map ("Resolve the exact ID
map against `slots.lock` before the PR") and stated the surviving count three inconsistent ways
(12 / "13 of 16" / "13 of 15"), with its own `16 − 2 + 1 = 15` arithmetic implying 14. This
document resolves it to one authoritative, CI-valid map and proves the invariants.

---

## 1. The one fact that makes this mechanical

Slots are **not** chosen by hand. `packages/content-schema/src/slots.ts :: assignSlots(existing,
lessonIds)` is machine-owned and fully deterministic given the final ordered list of lesson `id`
strings. Its rule, verbatim from the source:

- an `id` already present in the previous lock **keeps its slot** — regardless of slug, title, or
  content changes (**this is what "rename freely" means: the key is the `id`, never the slug**);
- an `id` **not** in the previous lock is appended at `next`, then `next += 1` (**new lessons get
  new slots, always at the end**);
- any previous `id` absent from the new list has its slot moved to `retired[]`, and `next` never
  decreases (**retired slots are reserved forever, never reused**).

`packages/content-lint/src/checks/gate3-slots.ts` regenerates the lock from the **merge-base**
commit's lock and fails CI on any diff. **This applies even though C3 is a close+recreate with no
inherited on-chain learner state:** `slots.lock.json` is a content-repo artifact keyed by the
course's slug path (`courses/building-your-first-solana-program/`), which the redesign keeps. Gate-3
therefore diffs against the *legacy 16-slot lock*, so the append-only discipline is mandatory
regardless of the on-chain recreate. A "reset the lock to clean 0–14" approach (tempting because no
learner state carries) is **not available without special-casing CI** and is rejected — see §6.

Consequence: **the entire deliverable reduces to prescribing the exact `id:` field for each of the
15 new lesson.yaml files.** The lock then follows deterministically, and is reproduced in §4.

## 2. Legacy state (the fork point)

`courses/building-your-first-solana-program/slots.lock.json` at `origin/main`, verbatim:

```json
{
  "version": 1,
  "slots": {
    "lesson-bfsp-from-code-to-chain": 0,
    "lesson-bfsp-your-first-build": 1,
    "lesson-bfsp-anatomy-anchor-program": 2,
    "lesson-bfsp-add-instruction": 3,
    "lesson-bfsp-on-chain-state": 4,
    "lesson-bfsp-define-counter": 5,
    "lesson-bfsp-account-constraints": 6,
    "lesson-bfsp-wire-up-initialize": 7,
    "lesson-bfsp-adding-instructions": 8,
    "lesson-bfsp-build-increment": 9,
    "lesson-bfsp-complete-counter": 10,
    "lesson-bfsp-deploy-to-devnet": 11,
    "lesson-bfsp-m4-airdrop": 12,
    "lesson-bfsp-m4-deploy": 13,
    "lesson-bfsp-m4-interact": 14,
    "lesson-bfsp-m4-capstone": 15
  },
  "retired": [],
  "next": 16
}
```

The legacy course has **16 lessons at slots 0–15** (not 15 — one source of the arithmetic drift).
`id` ≠ slug: the slug is the lesson directory name; the slot is keyed by the `id:` field. The full
`id ↔ slug ↔ title` mapping, read from each `lessons/*/lesson.yaml`:

| Slot | Legacy `id` | Legacy slug | Legacy title | Has graded exercise? |
| ---- | ----------- | ----------- | ------------ | -------------------- |
| 0 | `lesson-bfsp-from-code-to-chain` | `from-code-to-chain` | From Code to Chain | no (prose) |
| 1 | `lesson-bfsp-your-first-build` | `your-first-build` | Your First Build | **yes** (buildable, no-edit) |
| 2 | `lesson-bfsp-anatomy-anchor-program` | `anatomy-anchor-program` | Anatomy of an Anchor Program | no (prose) |
| 3 | `lesson-bfsp-add-instruction` | `add-instruction` | Add an Instruction | **yes** (buildable) |
| 4 | `lesson-bfsp-on-chain-state` | `on-chain-state` | On-Chain State | no (prose) |
| 5 | `lesson-bfsp-define-counter` | `define-counter-account` | Define a Counter Account | **yes** (buildable) |
| 6 | `lesson-bfsp-account-constraints` | `account-constraints-deep-dive` | Account Constraints Deep Dive | no (prose) |
| 7 | `lesson-bfsp-wire-up-initialize` | `wire-up-initialize` | Wire Up Initialize | **yes** (buildable, the DEBUG rung) |
| 8 | `lesson-bfsp-adding-instructions` | `adding-instructions` | Adding Instructions | no (prose) |
| 9 | `lesson-bfsp-build-increment` | `build-increment` | Build the Increment | **yes** (buildable) |
| 10 | `lesson-bfsp-complete-counter` | `complete-counter-program` | Complete Counter Program | **yes** (buildable) |
| 11 | `lesson-bfsp-deploy-to-devnet` | `deploy-to-devnet` | Deploy to Devnet | **yes** (buildable) — byte-dup of slot 10, retire |
| 12 | `lesson-bfsp-m4-airdrop` | `airdrop-fund-wallet` | Airdrop & Fund Your Wallet | no |
| 13 | `lesson-bfsp-m4-deploy` | `deploy-program-devnet` | Deploy Your Program to Devnet | **yes** (buildable, deployable) |
| 14 | `lesson-bfsp-m4-interact` | `interact-with-program` | Interact with Your Program | no |
| 15 | `lesson-bfsp-m4-capstone` | `what-you-built` | What You've Built | no (recap) |

## 3. Authoritative reconciliation table

New C3 is **15 lessons** (3/4/4/4). Disposition legend:
**KEPT** = renamed content, same `id`, same slot ·
**RETIRED** = no continuing lesson keeps this `id`; slot reserved, never reused ·
**NEW** = no lineage in *this course's* lock; append at a new slot.

Rule applied for **KEPT vs NEW**: a new lesson keeps a legacy slot iff it continues a legacy
**bfsp** lesson (its graded exercise *or* its prose). A lesson whose exercise and prose are both
new-to-this-course — including the three whose prose is imported from the retiring `anchor-framework`
course, which has **no id in bfsp's lock** — is genuinely NEW and appends. Where two legacy lessons
merge into one new lesson, the surviving `id` is the exercise-bearing one (graded-artifact
continuity); the prose-only partner's `id` retires.

| # | Module | New slug (catalog spec) | Prescribed `id:` | Slot | Legacy source(s) | Disposition |
| - | ------ | ----------------------- | ---------------- | ---- | ---------------- | ----------- |
| 1 | M1 | `from-rust-core-to-anchor` | `lesson-bfsp-your-first-build` | **1** | your-first-build (1) build+hints; from-code-to-chain (0) prose folds in | KEPT (rename) |
| 2 | M1 | `anatomy-of-an-anchor-program` | `lesson-bfsp-add-instruction` | **3** | add-instruction (3) exercise shape; anatomy-anchor-program (2) prose folds in | KEPT (rename) |
| 3 | M1 | `add-an-instruction` | `lesson-bfsp-adding-instructions` | **8** | adding-instructions (8) prose, reshaped prose→parsons | KEPT (rename+reshape) |
| 4 | M2 | `accounts-are-just-bytes` | `lesson-bfsp-on-chain-state` | **4** | on-chain-state (4), extended | KEPT (rename) |
| 5 | M2 | `pdas-an-address-with-no-key` | `lesson-bfsp-pdas-vault` | **16** | prose from `anchor-framework/pda-deep-dive` (not bfsp); new exercise | **NEW** |
| 6 | M2 | `define-the-vault-account` | `lesson-bfsp-define-counter` | **5** | define-counter (5) exercise+hints wholesale, counter→vault | KEPT (rename) |
| 7 | M2 | `wire-up-initialize` | `lesson-bfsp-wire-up-initialize` | **7** | wire-up-initialize (7) nearly verbatim — same id | KEPT (identity) |
| 8 | M3 | `cpi-moving-real-lamports` | `lesson-bfsp-cpi-lamports` | **17** | prose from `anchor-framework/cpi-overview` (not bfsp); code rewritten | **NEW** |
| 9 | M3 | `write-the-deposit` | `lesson-bfsp-build-increment` | **9** | build-increment (9) ladder/hints | KEPT (rename) |
| 10 | M3 | `withdraw-with-a-pda-signer` | `lesson-bfsp-complete-counter` | **10** | complete-counter (10) — the completion rung | KEPT (rename) |
| 11 | M3 | `harden-the-vault` | `lesson-bfsp-account-constraints` | **6** | account-constraints (6) prose [+ anchor-framework prose] | KEPT (rename) |
| 12 | M4 | `pre-flight-check` | `lesson-bfsp-pre-flight-check` | **18** | net-new (LiteSVM + cold retrieval) — spec calls it "NET-NEW SLOT" | **NEW** |
| 13 | M4 | `fund-your-wallet` | `lesson-bfsp-m4-airdrop` | **12** | airdrop-fund-wallet (12) verbatim | KEPT (rename) |
| 14 | M4 | `deploy-and-publish-the-idl` | `lesson-bfsp-m4-deploy` | **13** | m4-deploy (13) + m4-interact (14) merged; keep deploy `id` | KEPT (rename+merge) |
| 15 | M4 | `what-you-built` | `lesson-bfsp-m4-capstone` | **15** | m4-capstone (15) base + cumulative quiz added | KEPT (rename) |

### Retired slots (reserved forever, never reassigned)

| Slot | Legacy `id` | Why retired |
| ---- | ----------- | ----------- |
| **0** | `lesson-bfsp-from-code-to-chain` | opener prose folded into new #1; false "you've written Anchor programs" claim dropped |
| **2** | `lesson-bfsp-anatomy-anchor-program` | prose folded into new #2 (whose exercise-bearing `id`, `add-instruction`, survives) |
| **11** | `lesson-bfsp-deploy-to-devnet` | five files byte-identical (md5 `9b77d6d5…`) to slot 10; mandated delete |
| **14** | `lesson-bfsp-m4-interact` | merged into new #14 (which keeps `m4-deploy`'s `id`) |

**Counts: 12 KEPT · 4 RETIRED · 3 NEW = 15 lessons.** `retired = [0, 2, 11, 14]`, `next = 19`.

This reconciles the catalog spec's three conflicting figures: **"12 of 16" is correct** for legacy
`id`s that survive; the "13 of 16 / retire twice / add once" phrasings undercount because they
treat the three merges (0→#1, 2→#2, 14→#14) and the two anchor-framework-sourced NEW lessons as
free, which the slot algorithm does not (each merge retires one `id`; each non-bfsp lesson appends).

## 4. Resulting `slots.lock.json` (what the C3 content PR must commit)

Reproduced by running the prescribed `id` list (§3, display order) through the real
`assignSlots(legacyLock, newIds)` — the same function gate-3 uses:

```json
{
  "version": 1,
  "slots": {
    "lesson-bfsp-your-first-build": 1,
    "lesson-bfsp-add-instruction": 3,
    "lesson-bfsp-adding-instructions": 8,
    "lesson-bfsp-on-chain-state": 4,
    "lesson-bfsp-pdas-vault": 16,
    "lesson-bfsp-define-counter": 5,
    "lesson-bfsp-wire-up-initialize": 7,
    "lesson-bfsp-cpi-lamports": 17,
    "lesson-bfsp-build-increment": 9,
    "lesson-bfsp-complete-counter": 10,
    "lesson-bfsp-account-constraints": 6,
    "lesson-bfsp-pre-flight-check": 18,
    "lesson-bfsp-m4-airdrop": 12,
    "lesson-bfsp-m4-deploy": 13,
    "lesson-bfsp-m4-capstone": 15
  },
  "retired": [0, 2, 11, 14],
  "next": 19
}
```

The content PR does not hand-write this — it runs `pnpm content:slots`, which produces exactly the
above from the legacy lock + the new lesson list, provided every `id:` field matches §3. Commit the
regenerated file; gate-3 fails on any diff.

## 5. Invariant proof

Verified programmatically against the `assignSlots` loop (source: `slots.ts`):

- **No kept `id` changes slot.** Every KEPT row in §3 shows the legacy slot unchanged
  (`assignSlots` copies `prev.slots[id]` when the `id` recurs). Checked: all 12 kept `id`s map to
  their legacy slot. ✅
- **New lessons take NEW slots, append-only.** The three NEW `id`s receive 16, 17, 18 — all ≥ the
  legacy `next` (16), assigned in display order (`pdas`→16, `cpi`→17, `pre-flight`→18). No new
  lesson reuses an existing or retired slot. ✅
- **Retired slots stay reserved, never reused.** `retired = [0, 2, 11, 14]`; none appears in
  `slots` (schema refinement "a retired slot cannot also be live" holds), and `next = 19` exceeds
  every live and retired slot. ✅
- **One slot ↔ one lesson.** 15 distinct slot values for 15 lessons (schema refinement "a slot may
  be assigned to only one lesson" holds). ✅

## 6. Flagged decisions (do not resolve silently)

**No `id` is forced to change slot** — the algorithm makes that impossible, so there is no
hard conflict to escalate. Two design choices are recorded here rather than buried:

**D1 — Plan of record (§3) vs the spec's literal "retire twice, add once."** A second CI-valid map
exists that retires only `{3, 11}` and adds only `pre-flight` (slot 16), matching the spec's exact
`16 − 2 + 1` arithmetic. It requires `pdas` and `cpi` to adopt leftover legacy prose slots and,
critically, forces **`harden-the-vault` to inherit `lesson-bfsp-m4-interact`'s slot 14** — a
cross-module `id` reuse (a Module 3 lesson wearing a Module 4 lesson's identity). Both maps satisfy
every invariant. **Recommendation: adopt §3 (clean 1:1 lineage, three honest NEW slots).** It avoids
confusing cross-module `id` reuse and truthfully represents `pdas`/`cpi`/`pre-flight` as new
lessons. The `16 − 2 + 1` figure it contradicts is itself the arithmetic unified-spec item 22 flags
as wrong. Owner may override to the minimal-churn variant; if so, the §4 lock changes and this doc
must be updated before the content PR.

**D2 — Which `id` retires inside a merge is a low-stakes authoring choice.** In each of the three
merges (rows #1, #2, #14), two legacy `id`s collapse to one new lesson; exactly one `id` survives
and one retires. §3 keeps the **exercise-bearing** `id` (rows #1 keeps `your-first-build`, #2 keeps
`add-instruction`, #14 keeps `m4-deploy`). Because C3 is close+recreate with **no inherited
learner state**, swapping which partner survives (e.g. keep `anatomy-anchor-program` slot 2, retire
`add-instruction` slot 3 in row #2) is equally CI-valid and changes only which integer sits in
`retired[]`. No swap changes the counts. Locked to the exercise-bearing choice for graded-artifact
continuity; noted so a reviewer does not read it as an error.

**Rejected — resetting the lock to contiguous 0–14.** Since no learner state carries, a clean
`slots 0–14, retired [], next 15` is superficially attractive. It is **rejected**: gate-3
regenerates from the legacy merge-base lock, so a hand-reset lock fails CI ("a slot was changed,
reused, or a lesson is missing"), and resetting the base would break the machine-owned invariant
that makes slots safe across every *future* edit. Append-only is not optional here.

## 7. Insertion checklist for the C3 content PR

1. Set each `lessons/*/lesson.yaml` `id:` field to the value in the §3 table — **the `id`, not the
   slug, is load-bearing.** A typo in an `id` silently creates a NEW slot and retires the intended
   one.
2. Run `pnpm content:slots`; confirm the output equals §4 byte-for-byte. Commit it. Do not
   hand-edit `slots.lock.json`.
3. Gate-3 must pass on the content PR (regenerates against `origin/main`'s legacy lock).
4. **On-chain activation (MAS-15, unified spec item 22):** the three NEW slots **16, 17, 18** are
   uncompletable until activated in `Course.active_lessons` via `update_course`. On the C3
   close+recreate the recreate must seed `active_lessons` with **all 15 live slots**
   `{1,3,4,5,6,7,8,9,10,12,13,15,16,17,18}` — note the gaps at the retired `{0,2,11,14}`. A newly
   inserted lesson whose bit is not set is silently uncompletable; this is the single highest-risk
   step.

---

## Out-of-scope findings

- **The catalog spec's own §"On-chain implications" item 89 is arithmetically wrong** and should be
  corrected to point here: "13 of 16 IDs survive rename-only … `16 − 2 + 1 = 15`" is inconsistent
  with the material (the real map is 12 kept / 4 retired / 3 new). A one-line pointer to this doc is
  added to the C3 section (see the companion edit); item 89's numbers are left as-is to avoid
  editing the frozen plan-of-record beyond a pointer, but the content-PR author must use §3 here,
  not item 89.
- **`slots.schema.json` pins `version` to `const: 1`** and `next ≤ 256` (`MAX_LESSON_SLOTS`). The
  C3 map (max slot 18, next 19) is far within budget; no schema pressure.
