# WS-1 — Program v-next: reward simplification, IDL cutover, devnet reset

**Status:** design — no code. **rev-2**, post-tri-audit.
**Parent:** `2026-07-12-launch-readiness-epic-design.md` (§WS-1), merged as `af658f4`.

> **rev-2 changelog.** The tri-audit confirmed every on-chain claim field-by-field and found three HIGH defects, all on the client side, all of which rev-1 asserted away:
>
> - **H1 (§3.1)** — rev-1 said "migrate all seven consumers to `liveLessonCount`." Correct for six; **silently broken for the finalize trigger**, which mirrors an on-chain _subset_ test and must read the real `activeLessons` mask. This also settles the "is the synthesised mask gold-plating?" question: **keep it — it has exactly one reader, and that reader must never be wrong.**
> - **H2 (§Phase 3)** — rev-1 said "leave the admin course routes open." They must be **BLOCKED**: they speak the v1 IDL against a v-next program, so even a one-click "deactivate" corrupts course state **under the authority key**.
> - **H3 (§Phase 4)** — rev-1 said "learner progress survives." It survives **only if** each course is recreated with its _original_ on-chain lesson count. A larger one silently un-completes every mid-course learner.
>
> Corrected factual errors in rev-1: `/api/quests/daily` is **not** a queue-drain site (it calls `retryQuestXpForUser`, which is DB-only); **#432 is smaller than claimed** — `slots.json` already exists and is fully wired, so do not rebuild it; and the schema-sequencing rationale ("removing the schema field first breaks the compile gate") is **false** — Zod strips unknown keys.
>
> Unchanged and load-bearing: decoder-first ordering, the Arweave-XP migration priority, gating **inside** `retryPendingOnchainActions`, and the two-transaction close/create.

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

v1's `lesson_count` is synthesised **up** into a dense mask; v-next's mask is read directly. The consequences:

- The `|| 1` and `?? 0` fallbacks disappear, because the field they were defending against can no longer be absent.
- The whole silent-garble class dies **structurally**, not by careful sequencing.
- PR-1 becomes **behaviour-neutral on today's chain** (every live account is 224 bytes and takes the v1 branch), which makes it a safe, independently-mergeable change rather than part of a knife-edge cutover.

### 3.1 Six consumers want the count. One wants the mask. (rev-2 — H1)

**Rev-1 of this spec said "migrate all seven consumers to `liveLessonCount`." That was wrong, and it was wrong in the exact way an implementer would be.** It is correct for six of them and silently broken for the seventh.

The seventh is the **finalize trigger** — `event-handlers.ts:453`, the webhook that decides whether a learner has finished a course and fires `finalize_course`. It calls `isAllLessonsComplete(lessonFlags, lessonCount)`, which is a **dense-prefix** test: it walks bits `0..count-1` and demands every one be set.

The chain does something different. `finalize_course` gates on a **subset** test:

```rust
.all(|(flags, active)| flags & active == *active)   // finalize_course.rs:32
```

These two are equal **only while the mask is dense**. Today it always is, so nothing is broken _yet_. But **Phase 6 of this very spec introduces the ability to retire a lesson slot** (`update_course(new_active_lessons)` — that is the entire point of the v2 mask). The moment any course has a sparse mask, the prefix test and the subset test disagree, in both directions:

- **Learner stranded.** A learner completes every _live_ slot — say the mask is `{0,1,2,4}` after slot 3 is retired. Their flags are `{0,1,2,4}`. `liveLessonCount` is 4, so the client checks bits `0..3` — and demands bit **3**, the retired slot they were never asked to do. It returns `false`, the webhook never fires, and a learner who genuinely finished **never gets their XP or their credential**.
- **Doomed transaction.** A learner holds bits `{0,1,2,3}` (a dense prefix, including the retired slot) but has not done live slot 4. The client's prefix check passes, the webhook fires `finalize_course`, and the chain rejects it with `CourseNotCompleted` — a platform-funded transaction that can never succeed, re-queued forever.

The program's own comment says this out loud, and rev-1 walked straight past it:

> _"which is exactly what the v1 popcount-equality could not do (spec §5.1)"_ — `finalize_course.rs:29`

**So `activeLessons` is not a fictional field.** It has exactly one legitimate reader, and that reader is the one that must never be wrong. The resolution:

| Consumers                                          | Read                                       | Why                                                                                                                               |
| -------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| The six XP/display/admin sites                     | `liveLessonCount`                          | They genuinely want a scalar (XP math, "12 lessons", diff display).                                                               |
| **The finalize trigger** (`event-handlers.ts:453`) | **`activeLessons`**, via a **subset test** | It is a _client-side mirror of an on-chain gate_. It must be bit-identical to the chain's, or it strands learners and burns fees. |

`isAllLessonsComplete(flags, count)` should be **replaced**, not kept alongside — it has exactly one caller (verified: `event-handlers.ts:453` is the only one), and that caller is the one that needs the subset test. The new primitive mirrors the chain directly:

```ts
isCourseComplete(lessonFlags, activeLessons) =>
  activeLessons.every((active, i) => (lessonFlags[i] & active) === active)
```

**The general rule this is an instance of:** any client-side predicate that decides whether to _fire an on-chain instruction_ must mirror the on-chain gate exactly. Approximating it with a cheaper scalar is how you get stranded users and doomed, fee-burning transactions — and both failures are silent.

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

Remove `minCompletionsForReward` from the schema first, then from the content docs. **Rev-1 justified that ordering by claiming the reverse "would break the compile gate." That is false** — the Zod schema is not `.strict()` and the JSON Schema does not set `additionalProperties: false`, so `schema.parse` silently strips unknown keys. Either order works. Keep the two-step because it is tidy, not because it is load-bearing — and do not let anyone spend time defending a constraint that does not exist.

### Test and CI surface (rev-2)

Removing the field breaks fixtures and assertions that rev-1 did not enumerate. All of these must move in the same wave, or CI goes red for reasons unrelated to the actual change:

- `onchain-academy/tests/rust/src/test_course.rs` — asserts `Course::SIZE == 255`. Becomes **253**.
- The TS integration tests (`tests/onchain-academy.ts`) and the CU harness (`tests/cu-measurement.ts`) both pass `min_completions_for_reward` in `CreateCourseParams`.
- **`onchain-academy/trident-tests/fuzz_0/types.rs:66-77` hand-copies the `Course` layout** for the fuzzer. It is **already stale against the in-tree v2** — so today the fuzzer is fuzzing a struct that does not exist. It must be regenerated, and it is worth asking why a hand-mirrored layout was allowed to drift silently in the first place (a mirror that can rot is a mirror that will).

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

| Path                                                         | Signer        | During the window                             |
| ------------------------------------------------------------ | ------------- | --------------------------------------------- |
| `/api/lessons/complete`                                      | backend       | **BLOCK**                                     |
| `/api/certificates/mint`                                     | backend       | **BLOCK**                                     |
| `/api/webhooks/helius` → `event-handlers.ts`                 | backend       | **BLOCK** (finalize, credential, achievement) |
| `lib/solana/onchain-queue.ts` → `retryPendingOnchainActions` | backend       | **BLOCK** — and _not_ at the route (§below)   |
| `/api/admin/courses/sync`                                    | **authority** | **BLOCK** (rev-2 — H2)                        |
| `/api/admin/courses/{deactivate,reactivate}`                 | **authority** | **BLOCK** (rev-2 — H2)                        |
| `/api/admin/achievements/sync`                               | authority     | leave open — the only one that is safe        |
| `/api/quests/daily` → `retryQuestXpForUser`                  | — (DB only)   | leave open (rev-2 — corrects rev-1)           |

#### The queue drain is not an endpoint — it fires on login

`retryPendingOnchainActions` is called from `/api/auth/wallet` and `/api/auth/callback` — _not_ from a cron. So **every user login replays queued backend-signed on-chain writes**. A route-level gate on the obvious write endpoints leaves sign-in wide open, and each login would fire transactions at a half-migrated chain, burning platform fees (the backend keypair is `payer`) and re-queueing failures that cannot succeed.

**The gate must live _inside_ `retryPendingOnchainActions`, not in front of routes.** Nobody thinks of login as a write path.

> **rev-1 error, corrected:** rev-1 also listed `/api/quests/daily` as a third drain site. It is not. That route calls `retryQuestXpForUser`, which settles `quest_xp` rows through the `award_xp` DB function and **signs nothing on chain**. Gating it would have paused quest XP for no reason. Quest XP keeps flowing through the window.

#### The admin course routes must be blocked too (H2)

Rev-1 said "leave the admin routes open — the operator needs them." **That is wrong, and it is the more dangerous half of the gate.**

`/api/admin/courses/{sync,deactivate,reactivate}` all route through `create_course` / `update_course`, and `admin-signer.ts:26,261` binds the **v1 IDL** until Phase 6 ships. So during Phase 4–6 — v-next program live, client still v1 — those routes serialise **v1-layout instruction params against a v-next program**. `UpdateCourseParams` loses a field, so even a bare `{ newIsActive: true }` misaligns: the arg struct has a different _field count_, and Borsh is positional. The result is a corrupted `update_course` **signed with the platform authority key**.

A one-click "deactivate this course" in the admin UI is enough to trigger it. These routes must be **blocked**, and the operator performs the migration with **scripts** (`onchain-academy/scripts/`) that speak the v-next IDL directly — which was always the plan for Phase 4 anyway.

`/api/admin/achievements/sync` calls `create_achievement_type`, whose layout is untouched by this migration. It is the only admin route that is genuinely safe to leave open.

#### What stays up

Learner **reads** are unaffected throughout: the catalog renders from the committed bundle, so browsing, lessons, and content all keep working. Quest XP keeps flowing (DB-only). Only on-chain **writes** pause.

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
- `lesson_count` = **the course's ORIGINAL on-chain v1 count** — see the precondition below
- `collection`, `is_active`, `content_tx_id` restored
- `min_completions_for_reward` — **gone**

#### Learner progress survives — but only if the recreate count is right (rev-2 — H3)

Enrollments are separate PDAs keyed by `course_id`, untouched by `close_course`. The recreated Course lands at the _same address_ (seeds are `["course", course_id]`, and `declare_id!` is unchanged — this is an upgrade-in-place, same program ID), so `enrollment.course == course.key()` still holds and `lesson_flags` are preserved.

**Rev-1 asserted that survival unconditionally. It is conditional.**

`create_course` builds a **dense** mask from `lesson_count`, and `finalize_course` gates on the subset test (`flags & active == active`). So if a course is recreated with a **larger** `lesson_count` than the one its current learners enrolled under, the new mask demands bits those learners were never asked to set — and every mid-course learner **silently reverts from complete to incomplete**. They lose nothing on chain, but they can no longer finalize, and nothing surfaces the fact.

**Precondition for Phase 4 — verify, do not assume:** read each of the six live Course accounts with the v1 coder and record its actual on-chain `lesson_count`. Recreate with **exactly that value**. Do **not** take the counts from the content bundle (12/16/12/12/12/12) on faith — the bundle is what the content _says today_; the chain is what learners _enrolled under_. If they differ, the chain wins for the recreate, and the difference is then reconciled through a normal `update_course(new_active_lessons)` **after** the migration, where the mask can grow deliberately rather than by accident.

This makes `lesson_count`-at-recreate a **set-once value for anyone mid-course**, exactly like `creator`. Two irreversible values, one transaction.

#### What does not survive

`create_course` sets `total_enrollments = 0` and `total_completions = 0`, and `version` rewinds to `1`. The enrollment PDAs still exist, so **`total_enrollments` will under-report** permanently — there is no instruction that can write it back. On devnet with test data this is noise; it is called out so it is a decision, not a surprise.

`total_completions = 0` is the reset #450 was about. With the reward window gone it has no _bounded-window_ consequence — **#450 dies here**. It is not quite "harmless," though, and rev-1 overstated that: under the accepted uncapped-reward model, zeroing the counter erases the only on-chain record of how much a course has already paid its creator. It does not enable anything the accepted risk does not already permit (the reward is uncapped either way), but it does remove the audit trail. Worth stating; not worth blocking on.

### Phase 5 — verify

Byte-verify the deployed program against the recorded hash (#355). Decode all six recreated accounts and assert: 253 bytes, correct `creator`, `creator_reward_xp == 30`, mask popcount matches the bundle's lesson count. Then lift the gate.

### Phase 6 — client: write-path cutover

Regenerated IDL becomes the only IDL for writes. Drop `min_completions_for_reward` from the create/update param builders. **Send the mask** (`new_active_lessons`), not `new_lesson_count`. Unblock the admin course routes that Phase 3 blocked — they are safe again the moment the client speaks v-next.

**#432 is smaller than rev-1 claimed.** Rev-1 said `slots.lock.json` — the invariant carrier the program comment names — "exists only as a content-lint test fixture, not in the content repo," and budgeted building it. **That was wrong**, and the error was a too-literal filename grep: the compiled artifact is `src/content/generated/slots.json`. It is real content, emitted by the compiler, imported at `lib/content/store.ts:19`, and already cross-checked in the signer (`admin-signer.ts:175-191` — "asserts the mask matches the committed slots.lock before returning the signable params"). **The invariant carrier already exists and is already wired.** Do not rebuild it.

What genuinely remains in #432 is two items:

1. **The mask-writer.** `admin-signer.ts:517` still sends `newLessonCount`. It must send `newActiveLessons`, derived from `slots.json` and asserted against it before signing.
2. **The diff engine.** `sync-diff.ts:190-195,297-307` still models `lessonCount` as _increase-only_ — a v1 semantic. Under a mask, retiring a lesson is a routine bit-clear, not the "immutable decrease → recreate" the engine currently reports. Left as-is, the admin would be told to close-and-recreate a course every time a lesson is removed, which is exactly the destructive operation this migration exists to avoid needing.

Keep the v1 branch of the decoder until mainnet. Post-migration devnet is all-253, and a fresh mainnet will be all-253 — at that point the v1 branch is dead code and should be deleted, not left to rot.

### Phase 7 — delete the #450 guard from #453

PR #453 (recreate server path) carries a creator-reward-window pre-flight. Post-deploy that window does not exist, so the guard must be **deleted, not simplified**.

**It is load-bearing until then.** The currently-deployed program _does_ have the window, so removing the guard before Phase 4 would make #453 unsafe against the chain it actually talks to. This is why #453 is parked rather than merged.

---

## 6. Decisions needed before implementation

1. **Instructor wallet pubkeys for all six courses.** The long-lead blocker on Phase 4, and the entire point of #440 — `creator` is immutable, so a recreate with the wrong value is not recoverable without _another_ close/recreate. Six real pubkeys are needed. If instructors are not yet assigned, the honest options are (a) delay Phase 4, or (b) recreate with placeholder wallets the platform controls and accept a second reset later — acceptable on devnet, **never** on mainnet. This decision is independent of the spec, so it can be chased in parallel with implementation.
2. **`total_enrollments` reset to 0.** Accept the under-count on devnet, or add a backfill? (There is no instruction to write it; a backfill would mean a program change.)
3. **The downtime window — wider than rev-1 said (H2).** Learner on-chain **writes** pause, and so do the **web-admin course toggles** (activate/deactivate/sync), because those routes speak the v1 IDL until Phase 6. Reads, browsing, lessons, and quest XP all stay up. The operator drives the migration with scripts, not the admin UI. When?

---

## 7. Non-goals

- **Mainnet.** This is a devnet migration. Mainnet is WS-4 and follows Squads custody (#305).
- **#387 (Pinocchio).** Parked per owner decision. It must carry the IDL regen and this reward simplification in its definition of done when it is eventually reconciled.
- **Re-litigating the reward cap.** Its removal is an owner-accepted, priced-out risk (insider-only; compensating control #459 is shipped). See `creator-reward-uncapped-accepted-risk`.

---

## 8. Risk register

| Risk                                                                                                            | Severity             | Mitigation                                                                                                          |
| --------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| v1 client silently garbles v-next accounts                                                                      | **CRITICAL**         | Phase 1 ships the normalising decoder first, behaviour-neutral. Ordering stops mattering.                           |
| Credential NFTs minted with wrong XP → Arweave-permanent                                                        | **CRITICAL**         | Same. The three `\|\| 1` sites are the top migration priority — the only irreversible consequence in the migration. |
| Finalize trigger uses a count, not the mask → learners stranded / doomed fee-burning txs once a slot is retired | **HIGH** (rev-2, H1) | §3.1. Wire the finalize trigger to `activeLessons` + the subset test. Replace `isAllLessonsComplete`.               |
| Admin course routes speak v1 IDL to a v-next program → authority-signed layout corruption                       | **HIGH** (rev-2, H2) | Phase 3. **Block** `/api/admin/courses/*`. Operator migrates with scripts.                                          |
| Recreate with a larger lesson count → mid-course learners silently un-completed                                 | **HIGH** (rev-2, H3) | Phase 4 precondition: read each course's **original on-chain** count and reuse it exactly.                          |
| Login-triggered queue drain fires at a half-migrated chain                                                      | **HIGH**             | Gate **inside** `retryPendingOnchainActions`, not at routes. Not in the epic's plan.                                |
| Deploy corrupted by public devnet RPC                                                                           | **HIGH**             | Helius RPC only.                                                                                                    |
| Wrong/placeholder `creator` baked in immutably                                                                  | **HIGH**             | Decision 1. Blocks Phase 4.                                                                                         |
| Trident fuzz mirror hand-copies a stale `Course` layout                                                         | **MEDIUM**           | Regenerate. It is _already_ stale against v2 — the fuzzer is currently fuzzing a struct that does not exist.        |
| Mask-writer + increase-only diff engine (#432)                                                                  | **MEDIUM**           | Scoped into Phase 6. Smaller than rev-1 thought — `slots.json` already exists and is wired.                         |
| `close_course` cannot touch stale accounts → courses bricked                                                    | ~~CRITICAL~~         | **Retired.** Verified: `close_course` takes an `UncheckedAccount` by design.                                        |
| `total_enrollments` under-reports after reset                                                                   | **LOW**              | Decision 2.                                                                                                         |

---

## 9. Definition of done

- [ ] Program v-next deployed to devnet via Helius, byte-verified against a recorded reproducible-build hash.
- [ ] IDL in the client regenerated from the **final v-next source**, not the in-tree v2.
- [ ] **Six** count-consumers read `liveLessonCount`; no `|| 1` or `?? 0` fallback on a chain-read count survives anywhere.
- [ ] **The finalize trigger reads `activeLessons` and applies the subset test** (`flags & active == active`), bit-identical to `finalize_course`. `isAllLessonsComplete` (dense-prefix) is **gone**, not merely unused. **(H1)**
- [ ] A test proves the finalize trigger is correct against a **sparse** mask — a learner who completed every live slot finalizes, and one who is missing a live slot does not. Without this, H1 regresses the first time a lesson is retired.
- [ ] Six Course accounts live at 253 bytes with instructor `creator`s and `creator_reward_xp = 30`.
- [ ] **Each recreated course's `lesson_count` equals the value read off its original on-chain account**, not the bundle's. **(H3)**
- [ ] A learner enrolled before the reset can still complete their course and finalize — **verified on devnet against a real pre-reset enrollment**, not asserted.
- [ ] `min_completions_for_reward` is gone from the program, the IDL, the client, `packages/content-schema`, the content repo, the Rust/TS/CU tests, and the Trident fuzz mirror.
- [ ] The deploy path writes the mask; the diff engine no longer models a lesson removal as an immutable-decrease recreate.
- [ ] #453's reward-window pre-flight is deleted.
- [ ] Maintenance gate lifted — including the admin course routes blocked in Phase 3 **(H2)** — and the queue drain confirmed healthy.
