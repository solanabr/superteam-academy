# WS-1 — Program v-next: reward simplification, IDL cutover, devnet reset

**Status:** design — no code. Gets a tri-audit before implementation starts.
**Parent:** `2026-07-12-launch-readiness-epic-design.md` (§WS-1), merged as `af658f4`.
**Closes on completion:** #449, #450, #332, #440, #432, #140, #141. Unblocks the G-2 launch gate (#139) → Squads custody (#305, WS-4).
**Owner decisions already locked:** creator-reward cap removed entirely (accepted, insider-only risk — compensating control #459 shipped in `7809d2e`); Anchor-forward, #387 stays parked.

---

## 1. What this is

One on-chain redeploy, plus the client work that has to bracket it. It is the only SENSITIVE workstream in the epic and the only one that can silently corrupt production, so it gets its own spec.

Three things happen to the program:

1. `min_completions_for_reward` (u16) is deleted, along with the 100-completion reward window in `finalize_course`.
2. The IDL is regenerated — it is currently **v1** while the in-tree program is **v2** (#449), and the client has been decoding live accounts by luck.
3. The six existing devnet Course PDAs are closed and recreated, with instructor wallets as `creator` (#440) and at the new account size.

Everything else in this spec exists to make those three survivable.

---

## 2. The hazard this spec is really about

**The client and the program deploy on independent rails.** Merging to `main` auto-deploys the frontend via Vercel. Deploying the program is a manual Solana operation. Nothing sequences them, and there is no shared version handshake.

That matters because of an asymmetry:

| Situation                                       | Result                                                |
| ----------------------------------------------- | ----------------------------------------------------- |
| **v-next client reads a v1 (224-byte) account** | Borsh hits EOF → **throws loudly**. Bad, but visible. |
| **v1 client reads a v-next (253-byte) account** | Decodes garbage. **No error.**                        |

The second is the whole problem. A v1 client reading a v-next `Course` produces plausible-looking nonsense: every field after the lesson mask is shifted by 31 bytes. It does not throw, it does not log, and it does not stop.

And the failure is not confined to display. Traced on `main` (see #449 for the full table), **seven** sites read `course.lesson_count` off a raw-BorshCoder decode, and post-v2 that field is simply absent — so each read yields `undefined` and **not one of them throws**:

- Three (`event-handlers.ts:528`, `onchain-queue.ts:181`, `certificates/mint:147`) do `Number(undefined) || 1` and would mint credential NFTs whose metadata records `xp = xp_per_lesson × 1`. That metadata is **pinned to Arweave**. It is the only consequence in this entire migration that cannot be undone afterwards, and it is the reason the decoder ships before the program.
- One (`event-handlers.ts:450`) did `Number(undefined)` → `NaN`, and `isAllLessonsComplete(flags, NaN)` used to return **`true`** — every guard in it is a comparison, and comparisons against `NaN` are false, so it fell through. That specific fall-through is already **fixed and merged** (`7809d2e`, PR #460): the bitmap helpers now fail closed on a non-finite count. The site still needs migrating, but it can no longer fail open while we get there.

So the design goal is not "sequence the two deploys carefully." It is **make the ordering not matter.**

---

## 3. Design: a decoder that normalises, not just dispatches

The epic prescribed a length-aware decoder — branch the coder on account byte-length. That is necessary but it is only half the fix, because it leaves seven call sites still asking a version-specific question (`what is lesson_count?`) about a value that no longer exists in one of the versions.

**`fetchCourse` should return one shape regardless of what is on chain.**

```
decode(accountInfo):
  224 bytes → v1 coder  → { …, activeLessons: denseMask(lesson_count), liveLessonCount: lesson_count }
  253 bytes → v-next    → { …, activeLessons: active_lessons,          liveLessonCount: popcount(active_lessons) }
  anything else → throw (loudly — an unknown layout must never decode)
```

v1's `lesson_count` is synthesised **up** into a dense mask; v-next's mask is read directly. Callers only ever see `activeLessons` / `liveLessonCount`. The consequences:

- All seven consumers migrate to `liveLessonCount` **once**, and are correct against both layouts. There is no second migration after the deploy.
- The `|| 1` and `?? 0` fallbacks disappear, because the field they were defending against can no longer be absent.
- The whole silent-garble class dies **structurally**, not by careful sequencing.
- PR-1 becomes **behaviour-neutral on today's chain** (every live account is 224 bytes and takes the v1 branch), which makes it a safe, independently-mergeable change rather than part of a knife-edge cutover.

### Why byte length is the only available signal

Both obvious alternatives are dead ends, and both are worth stating so nobody re-litigates them:

- **The Anchor discriminator does not change.** It is derived from the struct _name_ (`Course`), not its layout — identical in v1 and v-next.
- **`Course.version` is not a schema version.** `create_course` sets it to `1`; `update_course` **increments** it. It is a content-revision counter. Dispatching on it would be actively wrong.

`space` is fixed at `Course::SIZE`, so the allocated length is stable regardless of how long `course_id` is. Length is a reliable discriminator here — but only because we control the sizes:

|                                                     | bytes   | status                      |
| --------------------------------------------------- | ------- | --------------------------- |
| v1                                                  | **224** | live on devnet today        |
| v2 (in-tree now)                                    | **255** | **never deployed anywhere** |
| **v-next** (v2 − `min_completions_for_reward: u16`) | **253** | the deploy target           |

**Do not pad `_reserved` back to 255 to "preserve" the size.** That would collide with the never-deployed v2 layout and make the discriminator ambiguous forever. Let it land on 253. `_reserved: [u8; 8]` stays exactly as it is.

---

## 4. What actually changes in the program

Removing one field touches **three** surfaces, not one — two of them are instruction argument layouts, which is easy to miss:

| Surface              | Change                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `state/course.rs`    | delete `min_completions_for_reward: u16` → `SIZE` 255 → **253**                           |
| `CreateCourseParams` | delete `min_completions_for_reward: u16` → **instruction arg layout changes**             |
| `UpdateCourseParams` | delete `new_min_completions_for_reward: Option<u16>` → **instruction arg layout changes** |
| `finalize_course.rs` | delete `CREATOR_REWARD_WINDOW`, `reward_end`, and both threshold clauses                  |

`finalize_course`'s reward condition collapses to its irreducible form:

```rust
if course.creator_reward_xp > 0 {
    // mint creator_reward_xp to the creator
}
```

`CreateCourseParams` **keeps `lesson_count: u8`** — `create_course` derives the dense mask from it via `Course::dense_mask()`. New courses are always dense; slots are only retired later, through `update_course(new_active_lessons)`. So the create path loses exactly one field and nothing else.

### The reward-value change is load-bearing, not cosmetic

`creator_reward_xp` must drop to **30** in the same wave. It is currently `750 ×4`, `1000`, and `500` in the bundle. With the cap gone, uncapped × 750 is **25× worse** than uncapped × 30. Shipping the field removal without the value drop delivers a materially different risk than the one the owner accepted.

This is **cross-repo**, and the epic under-stated it:

- `packages/content-schema/src/course.ts:32-33` and `schema/course.schema.json:42-48` declare both `creatorRewardXp` and `minCompletionsForReward`.
- All six course docs in `solanabr/courses-academy` set `minCompletionsForReward: 10`.
- So it needs a **content-repo PR + a `content.lock` bump + a bundle recompile**, sequenced with the program deploy — not a program-only change.

`minCompletionsForReward` should become optional-and-ignored in the schema first (so the content repo does not break the instant the program drops it), then be removed from the content docs in a follow-up. Sequencing the schema removal _before_ the content PR would break the compile gate.

---

## 5. Ordered plan

The order is chosen so that **no step depends on a step that has not landed**, and so the only irreversible action (recreating accounts) happens last, behind a gate.

### Phase 0 — finalise the program source, do not deploy

Remove the field and the window. `anchor build` → this regenerates the IDL **from the final v-next source**, which is what Phase 1 needs. Nothing is deployed. The chain is untouched.

> The epic said "regen the IDL" as a step inside the deploy. It has to happen _before_ the client work, because PR-1 cannot ship a v-next coder it does not have.

### Phase 1 — client: normalising decoder (SAFE, behaviour-neutral, merge freely)

Ship both coders and the length dispatch from §3, migrate all seven `lesson_count` consumers to `liveLessonCount`, and delete the `|| 1` / `?? 0` fallbacks.

**Write paths stay v1-shaped in this PR.** The instruction arg layouts change with the program, not with the account, so a version-aware writer would be genuinely hard — and it is unnecessary, because the migration itself is performed by scripts (Phase 4), not by the web admin. The web write path cuts over in Phase 6, after the program is live. This split is what keeps Phase 1 risk-free.

Verifiable claim for the reviewer: on today's chain (all six accounts at 224 bytes), this PR changes no observable behaviour.

### Phase 2 — verifiable build + measurements (#140, #141)

Reproducible build, record the program hash, re-measure CU. These gate the deploy; they do not change it.

### Phase 3 — maintenance gate ON

**This is where the epic's plan has a hole.** It said "gate the four write endpoints." There are more than four, and one of them is not an endpoint at all.

Every path that signs an on-chain write:

| Path                                                         | Signer    | During the window                             |
| ------------------------------------------------------------ | --------- | --------------------------------------------- |
| `/api/lessons/complete`                                      | backend   | **BLOCK**                                     |
| `/api/certificates/mint`                                     | backend   | **BLOCK**                                     |
| `/api/webhooks/helius` → `event-handlers.ts`                 | backend   | **BLOCK** (finalize, credential, achievement) |
| `lib/solana/onchain-queue.ts` → `retryPendingOnchainActions` | backend   | **BLOCK — see below**                         |
| `/api/admin/courses/sync`                                    | authority | leave open (operator needs it)                |
| `/api/admin/courses/{deactivate,reactivate}`                 | authority | leave open                                    |
| `/api/admin/achievements/sync`                               | authority | leave open                                    |

**The retry queue is drained from the login routes.** `retryPendingOnchainActions` is called from `/api/auth/wallet`, `/api/auth/callback`, and `/api/quests/daily` — _not_ from a cron. So **every user login replays queued on-chain writes**. A route-level gate on the four obvious write endpoints would leave login wide open, and each sign-in would fire backend-signed transactions at a half-migrated chain, burning platform fees and re-queueing failures that cannot succeed.

The gate therefore has to live **inside** `retryPendingOnchainActions`, not only in front of routes.

Learner _reads_ stay up throughout: the catalog renders from the committed bundle, so browsing, lessons and content are unaffected. Only on-chain writes pause.

### Phase 4 — deploy + reset (the irreversible part)

Deploy v-next **via the Helius RPC only** — the public devnet RPC corrupts large deploys (learned the hard way; see `devnet-deploy-and-lms-db-state`).

Then, per course, `close_course` → `create_course`:

**The linchpin, and I verified it before writing this spec:** `close_course` takes the course as an **`UncheckedAccount`**, not `Account<Course>`, precisely so it can touch a size-mismatched account (it was built for the earlier 192→224 resize). It validates the PDA seeds, the program ownership, and the 8-byte discriminator — which is stable across resizes — then drains lamports and frees the PDA manually.

**Without that, this migration would deadlock**: the moment v-next is live, the six 224-byte accounts fail to deserialize as `Account<Course>`, and if `close_course` resolved them that way they could be neither used nor closed. It does not. The migration is viable.

Two consequences to hold in mind:

- **Close and create are separate transactions**, deliberately (`close_course` reallocs to 0 and reassigns to the System Program, so `create_course`'s `init` must come in a later tx). There is no atomic swap; each course is briefly nonexistent.
- **The window is per-course.** Between the program deploy and a given course's recreate, that course is unusable on-chain — `enroll`, `complete_lesson`, `finalize_course`, `update_course` all resolve `Account<Course>` and will fail on the stale 224-byte data. This is exactly what Phase 3 gates.

Recreate each course with:

- `creator` = the **instructor wallet** (#440 — `creator` is immutable, set once at `create_course`; all six currently carry the platform authority, so this is the only chance to fix it)
- `creator_reward_xp` = **30**
- `lesson_count` → dense mask (12, 16, 12, 12, 12, 12)
- `collection`, `is_active`, `content_tx_id` restored
- `min_completions_for_reward` — **gone**

**Learner progress survives this.** Enrollments are separate PDAs keyed by `course_id`, untouched by `close_course`. The recreated Course lands at the _same address_ (seeds are `["course", course_id]`), so the `enrollment.course == course.key()` constraint still holds and `lesson_flags` are preserved. A learner mid-course keeps their completed lessons.

**One thing does not survive, and it is not in the epic:** `create_course` sets `total_enrollments = 0` and `total_completions = 0`. The enrollment PDAs still exist, so **`total_enrollments` will under-report** — permanently, with no instruction to correct it. On devnet with test data this is noise; it is called out here so it is a decision and not a surprise. (`total_completions = 0` is now harmless — that reset is precisely what #450 was about, and with the reward window gone it has no economic consequence. **#450 dies here.**)

### Phase 5 — verify

Byte-verify the deployed program against the recorded hash (#355). Decode all six recreated accounts and assert: 253 bytes, correct `creator`, `creator_reward_xp == 30`, mask popcount matches the bundle's lesson count. Then lift the gate.

### Phase 6 — client: write-path cutover

Regenerated IDL becomes the only IDL for writes. Drop `min_completions_for_reward` from the create/update param builders. **Send the mask** (`new_active_lessons`), not `new_lesson_count`.

This is where **#432** lives: today `admin-signer.ts:517` still sends `newLessonCount`, and the sync route's diff engine still models `lessonCount` as _increase-only_ (a v1 semantic — under a mask, removing a lesson is a routine bit-clear, not the "immutable decrease → recreate" the engine currently reports). The mask-writer is only partly built: there is mask plumbing at `admin-signer.ts:189-198`, but the write path is still v1-shaped, and `slots.lock.json` — which the program comment names as the invariant carrier the sync route must assert the mask against — exists **only as a content-lint test fixture**, not in the content repo. That gap is real WS-1 work and was not budgeted in the epic.

Keep the v1 branch of the decoder until mainnet. Post-migration devnet is all-253, and a fresh mainnet will be all-253 — at that point the v1 branch is dead code and should be deleted, not left to rot.

### Phase 7 — delete the #450 guard from #453

PR #453 (recreate server path) carries a creator-reward-window pre-flight. Post-deploy that window does not exist, so the guard must be **deleted, not simplified**.

**It is load-bearing until then.** The currently-deployed program _does_ have the window, so removing the guard before Phase 4 would make #453 unsafe against the chain it actually talks to. This is why #453 is parked rather than merged.

---

## 6. Decisions needed before implementation

1. **Instructor wallet pubkeys for all six courses.** This is a hard blocker on Phase 4, and it is the entire point of #440 — `creator` is immutable, so a recreate with the wrong value is not recoverable without _another_ close/recreate. Six real pubkeys are needed. If instructors are not yet assigned, the honest options are (a) delay Phase 4, or (b) recreate with placeholder wallets the platform controls and accept a second reset later — which is only acceptable on devnet, never on mainnet.
2. **`total_enrollments` reset to 0.** Accept the under-count on devnet, or add a backfill? (There is no instruction to write it; a backfill would mean a program change.)
3. **Devnet downtime window.** Learner on-chain writes pause for the length of Phase 4. Reads stay up. When?

---

## 7. Non-goals

- **Mainnet.** This is a devnet migration. Mainnet is WS-4 and follows Squads custody (#305).
- **#387 (Pinocchio).** Parked per owner decision. It must carry the IDL regen and this reward simplification in its definition of done when it is eventually reconciled.
- **Re-litigating the reward cap.** Its removal is an owner-accepted, priced-out risk (insider-only; compensating control #459 is shipped). See `creator-reward-uncapped-accepted-risk`.

---

## 8. Risk register

| Risk                                                         | Severity         | Mitigation                                                                                |
| ------------------------------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------- | --- | ---------------------------------------- |
| v1 client silently garbles v-next accounts                   | **CRITICAL**     | Phase 1 ships the normalising decoder first, behaviour-neutral. Ordering stops mattering. |
| Credential NFTs minted with wrong XP → Arweave-permanent     | **CRITICAL**     | Same. The three `                                                                         |     | 1` sites are the top migration priority. |
| `close_course` cannot touch stale accounts → courses bricked | **was CRITICAL** | **Retired.** Verified: `close_course` uses `UncheckedAccount` by design.                  |
| Login-triggered queue drain fires at a half-migrated chain   | **HIGH**         | Gate inside `retryPendingOnchainActions`, not just at routes. Not in the epic's plan.     |
| Deploy corrupted by public devnet RPC                        | **HIGH**         | Helius RPC only.                                                                          |
| Wrong/placeholder `creator` baked in immutably               | **HIGH**         | Decision 1 above. Blocks Phase 4.                                                         |
| Mask-writer + `slots.lock.json` unbuilt (#432)               | **MEDIUM**       | Scoped into Phase 6. Do not discover it there.                                            |
| `total_enrollments` under-reports after reset                | **LOW**          | Decision 2 above.                                                                         |

---

## 9. Definition of done

- [ ] Program v-next deployed to devnet via Helius, byte-verified against a recorded reproducible-build hash.
- [ ] IDL in the client regenerated from the **final v-next source**, not the in-tree v2.
- [ ] All seven `lesson_count` consumers read `liveLessonCount`; no `|| 1` or `?? 0` fallback on a chain-read count survives anywhere.
- [ ] Six Course accounts live at 253 bytes with instructor `creator`s and `creator_reward_xp = 30`.
- [ ] A learner enrolled before the reset can still complete their course and finalize.
- [ ] `min_completions_for_reward` is gone from the program, the IDL, the client, `packages/content-schema`, and the content repo.
- [ ] The deploy path writes the mask; the diff engine no longer models a lesson removal as an immutable-decrease recreate.
- [ ] #453's reward-window pre-flight is deleted.
- [ ] Maintenance gate lifted; queue drain confirmed healthy.
