# Enhancement: Credential-Based Prerequisites, Cross-Track Upgrades & Level Protection

## Overview

This document details three interconnected bugs in the on-chain program's credential and prerequisite system, the alternative approaches we evaluated, the reasoning behind our chosen solution, and the resulting UX improvements.

---

## Problems Identified

### Bug 1: Prerequisite Check Breaks After Enrollment Closure

**Symptom:** A learner who completed a prerequisite course and reclaimed their enrollment rent could never enroll in the dependent (advanced) course.

**Root cause:** The `enroll` instruction verified prerequisites by deserializing the prerequisite Enrollment PDA from `remaining_accounts`. The `close_enrollment` instruction deletes this PDA (via Anchor's `close = learner` constraint), returning rent to the learner. Once closed, the enrollment account no longer exists on-chain, so deserialization fails and the prerequisite check reverts.

**Impact:** Learners faced an impossible choice — keep the Enrollment PDA alive (forfeiting ~0.002 SOL in rent) or reclaim rent and lose the ability to progress in a track. This directly contradicts the platform's promise that enrollment is ephemeral and rent-reclaimable.

```
Before fix:
  Complete Course A → Close Enrollment (reclaim rent) → Enroll in Course B (requires A) → ❌ FAILS
```

### Bug 2: `upgrade_credential` Broken for Multi-Course Tracks

**Symptom:** Upgrading a credential after completing a second course in the same track failed when using Course Y's enrollment, even though the learner held a valid credential NFT.

**Root cause:** `upgrade_credential` read `enrollment.credential_asset` to find the existing credential NFT address. But credentials are per-track (not per-course). When a learner completes Course Y (the second course in a track), Course Y's enrollment has `credential_asset = None` because the credential was originally issued via Course X's enrollment. The instruction would hit `enrollment.credential_asset.ok_or(CourseNotFinalized)` and revert.

**Workaround (fragile):** The backend could pass Course X's enrollment PDA (which has `credential_asset` set) instead of Course Y's. This worked only if Course X's enrollment was still open. Once the learner closed Course X's enrollment to reclaim rent, `credential_asset` was lost and upgrade became impossible — combining Bug 1 and Bug 2 into a complete blocker.

**Impact:** The upgrade flow had no reliable path for multi-course track progression. The workaround of using Course X's enrollment was fragile (broken by rent reclaim) and required the backend to track which enrollment originally issued the credential — coupling that should not exist.

```
Before fix:
  Issue credential via Course X enrollment → Complete Course Y → Upgrade via Course Y enrollment → ❌ FAILS
  (Course Y enrollment has credential_asset = None)

  Workaround: Upgrade via Course X enrollment → ⚠️ WORKS only if Course X enrollment is still open
  Close Course X enrollment (reclaim rent) → Upgrade via Course X enrollment → ❌ FAILS (PDA deleted)
```

### Bug 3: Credential Level Can Downgrade

**Symptom:** A learner who completed courses out of order (e.g., level-2 before level-1) could have their credential level downgraded.

**Root cause:** Both `issue_credential` and `upgrade_credential` blindly set the credential's `level` attribute from `course.track_level`. No comparison was made against the credential's current level. If a learner completed a level-2 course first (credential level = 2), then completed a level-1 course and triggered an upgrade, the credential level would be overwritten to 1.

**Impact:** Learner achievements could be silently eroded. The credential NFT — visible in wallets and meant to represent track progression — would show a lower level than actually earned.

---

## Approaches Evaluated

### Approach A: New `CompletionRecord` PDA (Rejected)

**Concept:** Introduce a new PDA type (`CompletionRecord`) seeded by `[b"completion", course_id, learner]` that persists permanently after course completion, independent of the enrollment lifecycle.

**Pros:**
- Clean separation: enrollment is transient, completion is permanent
- Prerequisite checks would read `CompletionRecord` instead of enrollment
- No dependency on Metaplex Core for prerequisite logic

**Cons:**
- **New PDA = new rent cost:** Every completed course would require an additional ~0.001 SOL permanent rent deposit. At scale (thousands of learners × dozens of courses), this adds up significantly.
- **Storage bloat:** Two PDAs per completed course per learner (enrollment + completion record) during the active phase
- **Migration complexity:** Existing completed enrollments would need a migration instruction or off-chain backfill
- **Doesn't fix Bug 2 or Bug 3:** Would still need additional changes for credential upgrade and level logic

**Verdict:** Rejected. Adds permanent on-chain cost for something the credential NFT already proves.

### Approach B: Prevent Enrollment Closure for Prerequisite Courses (Rejected)

**Concept:** Add a check in `close_enrollment` that refuses to close an enrollment if any active course references it as a prerequisite.

**Pros:**
- Minimal code change (one `require!` in `close_enrollment`)
- No new state or PDAs

**Cons:**
- **Defeats the purpose of rent reclamation:** Learners who complete prerequisite courses can never reclaim rent, which is the entire point of `close_enrollment`
- **Scaling problem:** As more courses are added with prerequisites, an increasingly large portion of enrollments become permanently locked
- **Poor UX:** "You completed the course but can't get your rent back" is confusing
- **Still doesn't fix Bug 2 or Bug 3**

**Verdict:** Rejected. Treats the symptom, not the cause. Makes UX worse.

### Approach C: Credential NFT as Proof of Completion (Chosen)

**Concept:** Use the learner's existing Metaplex Core credential NFT as proof of prerequisite completion. The credential already exists, is soulbound, and carries track/level metadata. Verify it on-chain via `BaseAssetV1` deserialization.

**Pros:**
- **Zero additional rent cost:** No new PDAs. The credential NFT already exists as part of the normal flow.
- **Fixes all three bugs simultaneously:**
  - Bug 1: Credential persists regardless of enrollment closure
  - Bug 2: Credential is looked up by collection membership, not enrollment
  - Bug 3: Current level is read from the credential and `max()` is applied
- **Stronger security:** Credential ownership and collection membership are verified on-chain (not just PDA derivation)
- **Aligns incentives:** Learners are now incentivized to collect their credential NFT before closing enrollment (which they would naturally do anyway)
- **Enables rent reclamation:** Enrollment becomes truly ephemeral — close it anytime after credential issuance

**Cons:**
- **Requires `track_collection: Pubkey` on Course PDA:** +32 bytes per course (192 → 224 bytes). Acceptable since courses are created by admins, not at learner scale.
- **Metaplex Core CPI dependency in `enroll`:** Previously `enroll` had no external CPI. Now it reads (but doesn't write) a Metaplex Core account. Read-only access adds minimal CU overhead (~2,000 CU for deserialization).
- **Prerequisite requires credential issuance:** Learners must collect their credential NFT before enrolling in the next course. This is a feature, not a bug — it ensures the track progression is explicit.

**Verdict:** Chosen. Solves all three bugs, improves UX, adds no per-learner cost, and leverages existing infrastructure.

---

## Implementation Details

### 1. Course PDA: `track_collection` Field

```rust
// state/course.rs
pub struct Course {
    // ... existing fields ...
    pub track_level: u8,
    pub track_collection: Pubkey,  // NEW: Metaplex Core collection for this track
    pub prerequisite: Option<Pubkey>,
    // ... remaining fields ...
}
```

**SIZE:** 192 → 224 bytes (+32 for the `Pubkey`).

**Purpose:** Links each course to its track's Metaplex Core collection on-chain. This enables:
- Prerequisite verification: "Does the learner hold a credential from the prerequisite course's track?"
- Credential issuance/upgrade: Constraint `track_collection.key() == course.track_collection` prevents passing the wrong collection.

### 2. Prerequisite Check (Bug 1 Fix)

**Before:**
```
remaining_accounts = [prereq_course_pda, prereq_enrollment_pda]
→ Deserialize enrollment → Check completed_at → Verify PDA seeds
```

**After:**
```
remaining_accounts = [prereq_course_pda, credential_nft]
→ Verify credential owner == mpl_core::ID
→ Deserialize BaseAssetV1
→ Check asset.owner == learner
→ Check asset.update_authority == Collection(prereq_course.track_collection)
```

**Security layers:**
1. Account owner check (`mpl_core::ID`) — rejects non-Metaplex accounts
2. `BaseAssetV1` deserialization — rejects malformed data
3. `asset.owner == learner` — rejects credentials owned by others
4. `UpdateAuthority::Collection(track_collection)` — rejects credentials from wrong tracks

### 3. Credential Verification in `upgrade_credential` (Bug 2 Fix)

**Before:**
```rust
let existing_asset = enrollment.credential_asset.ok_or(CourseNotFinalized)?;
require!(credential_asset.key() == existing_asset, CredentialAssetMismatch);
```

**After:**
```rust
let asset = BaseAssetV1::try_from(&ctx.accounts.credential_asset)?;
require!(asset.owner == learner.key(), InvalidCredentialOwner);
require!(asset.update_authority == UpdateAuthority::Collection(track_collection.key()), TrackCollectionMismatch);
```

The credential is now verified by its on-chain properties (ownership + collection membership), not by an enrollment field that may not exist for the current course.

After upgrade, the credential address is propagated back: `enrollment.credential_asset = Some(credential_asset.key())`.

### 4. Max-Level Logic (Bug 3 Fix)

```rust
let current_level = fetch_asset_plugin::<Attributes>(&credential_asset, PluginType::Attributes)
    .ok()
    .and_then(|(_, attrs, _)| {
        attrs.attribute_list.iter()
            .find(|a| a.key == "level")
            .and_then(|a| a.value.parse::<u8>().ok())
    })
    .unwrap_or(0);

let effective_level = std::cmp::max(current_level, course.track_level);
```

The `level` attribute on the credential NFT is read via `fetch_asset_plugin`, parsed, and compared against the course's `track_level`. The higher value wins. This guarantees monotonic level progression regardless of course completion order.

### 5. New Error Variants

```rust
#[msg("Credential is not owned by the learner")]
InvalidCredentialOwner,

#[msg("Credential does not belong to the track collection")]
TrackCollectionMismatch,
```

Specific errors for credential validation failures, distinct from the existing `PrerequisiteNotMet` (which covers the prerequisite enrollment flow).

---

## UX Improvements

### Rent Reclamation Flow

The previous design created a hidden trap: learners who completed a prerequisite course and responsibly reclaimed their enrollment rent would be blocked from progressing. The new flow makes enrollment truly ephemeral:

```
New learner journey:
1. Enroll in Course A (pay ~0.002 SOL rent)
2. Complete all lessons → Finalize
3. Collect credential NFT (soulbound, lives in wallet forever)
4. Close enrollment → Get rent back ✅
5. Enroll in Course B (requires Course A) — pass credential NFT as proof ✅
6. Close Course A enrollment at any time — it's no longer needed
```

### Future Enhancement: Auto-Close on Credential Collection

With the credential NFT now serving as the permanent proof of completion, the enrollment PDA becomes unnecessary after credential issuance. A natural next step is to **auto-close the enrollment when the learner collects their credential NFT**, combining two transactions into one:

```
Current (2 transactions):
  1. issue_credential → credential minted to learner
  2. close_enrollment → rent returned to learner

Future (1 transaction):
  1. issue_credential_and_close → credential minted + enrollment closed + rent returned
```

This could be implemented as either:
- A new `issue_credential_and_close` instruction (atomic, single tx)
- Backend-initiated via the existing `issue_credential` with an additional `close_enrollment` ix in the same transaction

The on-chain changes in this PR make this possible by eliminating all dependencies on the enrollment PDA for prerequisite checks and credential upgrades. The enrollment's only remaining purpose after credential issuance is as a historical record — and the credential NFT itself fulfills that role better (visible in wallets, carries metadata, immutable on-chain).

### Credential as Universal Proof

The credential NFT now serves as the single source of truth for track progression:

| Use Case | Before | After |
|----------|--------|-------|
| Prerequisite check | Enrollment PDA (deleted on close) | Credential NFT (permanent) |
| Credential upgrade | `enrollment.credential_asset` (per-course) | On-chain BaseAssetV1 (per-track) |
| Level tracking | Blindly overwritten | `max(current, new)` monotonic |
| Wallet visibility | N/A | Soulbound NFT in learner's wallet |
| Rent reclamation | Blocked by prerequisite dependency | Free to close anytime |

---

## Files Changed

| File | Change | Lines |
|------|--------|-------|
| `state/course.rs` | Added `track_collection: Pubkey`, SIZE 192→224 | +5/-1 |
| `errors.rs` | Added `InvalidCredentialOwner`, `TrackCollectionMismatch` | +4 |
| `instructions/create_course.rs` | Added `track_collection` to params + handler | +2 |
| `instructions/enroll.rs` | Credential NFT prerequisite check | +24/-27 |
| `instructions/upgrade_credential.rs` | On-chain verification + max-level + propagation | +37/-16 |
| `instructions/issue_credential.rs` | Added `track_collection` constraint | +5/-2 |
| `tests/rust/src/test_course.rs` | Updated SIZE + `track_collection` in structs | +7/-3 |
| `tests/onchain-academy.ts` | Added `trackCollection` params, rewrote prerequisite tests | +130/-55 |

---

## Security Analysis

| Attack Vector | Mitigated? | Mechanism |
|---------------|-----------|-----------|
| Wrong credential for prerequisite | Yes | `asset.update_authority` checked against `prereq_course.track_collection` |
| Credential from different track | Yes | Collection mismatch caught by `UpdateAuthority::Collection` comparison |
| Non-Metaplex-Core account as credential | Yes | Account owner checked against `mpl_core::ID` before deserialization |
| Someone else's credential | Yes | `asset.owner == learner.key()` |
| Backend passes wrong track_collection | Yes | Anchor constraint `track_collection.key() == course.track_collection` |
| Credential level downgrade | Yes | `max(current_level, course.track_level)` enforced on-chain |
| Double credential issuance (same enrollment) | Yes | `enrollment.credential_asset.is_none()` guard unchanged |
| Malformed BaseAssetV1 data | Yes | `try_from` + `map_err` returns appropriate error |

---

## Test Coverage

### Rust Unit Tests (77 passing)

- `course_size_constant_is_correct` — Verifies SIZE = 224
- `course_serialization_roundtrip` — Includes `track_collection` field
- `course_with_prerequisite_roundtrip` — Includes `track_collection` field
- `course_serialized_size_with_max_id_and_all_options` — Validates serialized size matches SIZE constant

### TypeScript Integration Tests (66 passing)

**Existing tests updated:**
- All 19 `createCourse` calls include `trackCollection` parameter
- Credential issuance and upgrade tests use `track_collection` constraint

**Prerequisite tests (rewritten for credential-based verification):**

| # | Test Name | What It Verifies | Expected Result |
|---|-----------|-----------------|-----------------|
| 1 | "enroll fails without remaining accounts for prerequisite" | No remaining accounts passed for a course with prerequisite | `PrerequisiteNotMet` error |
| 2 | "enroll fails with non-Metaplex-Core account as credential" | Passes an enrollment PDA (program-owned) instead of a Metaplex Core credential NFT | `PrerequisiteNotMet` error |
| 3 | "enroll with credential NFT succeeds" | Full flow: create course with real collection → complete all lessons → finalize → issue credential → enroll in dependent course using credential NFT | Enrollment succeeds |

**Regression tests (new — covering all 3 bugs):**

| # | Test Name | Bug | What It Verifies | Expected Result |
|---|-----------|-----|-----------------|-----------------|
| 4 | "prerequisite succeeds after close_enrollment (rent reclaim)" | Bug 1 | Complete prereq course → issue credential → close enrollment (reclaim rent) → enroll in dependent course using credential NFT | Enrollment succeeds despite closed enrollment |
| 5 | "prerequisite fails with credential from wrong track" | Bug 1 | Hold credential from Track A → attempt to enroll in course requiring Track B completion | `PrerequisiteNotMet` error |
| 6 | "upgrade_credential succeeds from second course in same track (Bug 2 regression)" | Bug 2 | Issue credential via Course X → complete Course Y in same track → upgrade credential via Course Y enrollment | Upgrade succeeds, `enrollment.credential_asset` propagated |
| 7 | "credential level never downgrades (Bug 3 regression)" | Bug 3 | Complete level-2 course → issue credential (level=2) → complete level-1 course → upgrade credential → verify level remains 2 | Credential level = 2, not downgraded to 1 |

### Test Output

```
  Onchain Academy
    Phase 1: Initialization
      ✔ initializes config and XP mint
    Phase 2: Course creation
      ✔ creates a course
      ✔ fails with duplicate courseId
      ✔ fails with empty courseId
      ✔ fails with too-long courseId
      ✔ fails with lessonCount = 0
      ✔ fails with invalid difficulty
      ✔ creates a course with prerequisite
      ✔ creates a second active course for update tests
    Phase 3: Course updates
      ✔ updates course content tx ID
      ✔ updates XP per lesson
      ✔ deactivates a course
      ✔ reactivates a course
      ✔ fails when non-authority tries to update
    Phase 4: Enrollment
      ✔ enrolls a learner
      ✔ fails duplicate enrollment
      ✔ fails enrollment in inactive course
    Phase 5: Lesson completion & finalization
      ✔ completes a lesson and mints XP
      ✔ fails duplicate lesson completion
      ✔ fails out-of-bounds lesson index
      ✔ completes remaining lessons
      ✔ finalizes course and mints bonus + creator XP
      ✔ fails double finalization
    Phase 6: Credentials
      ✔ issues credential NFT for completed course
      ✔ double issue_credential fails
      ✔ upgrades existing credential
      ✔ fails with wrong credential asset on upgrade
      ✔ upgrade_credential succeeds from second course in same track (Bug 2 regression)
      ✔ credential level never downgrades (Bug 3 regression)
    Phase 7: Close enrollment
      ✔ fails to close before 24h for incomplete enrollment
      ✔ closes completed enrollment immediately
      ✔ closes incomplete enrollment after 24h
    Phase 8: Minter roles
      ✔ registers a minter
      ✔ minter rewards XP
      ✔ fails with zero amount
      ✔ fails when exceeding max per call
      ✔ revokes minter
      ✔ fails reward after revocation
    Phase 9: Backend signer rotation
      ✔ rotates backend signer
      ✔ old signer fails
      ✔ new signer succeeds
    Phase 10: Achievements
      ✔ creates achievement type
      ✔ awards achievement with NFT and XP
      ✔ double award fails (receipt PDA collision)
      ✔ deactivates achievement type
      ✔ fails award after deactivation
    Phase 11: Edge cases
      ✔ fails finalize before all lessons complete
      ✔ fails credential before finalize
      ✔ close_enrollment with credential still works
      ✔ re-enroll after close
      ✔ second learner full flow
      ✔ creator reward only after min completions
      ✔ max lesson count (255) course creation
      ✔ enroll in course with no prerequisite (no remaining accounts needed)
    Phase 12: Prerequisite enforcement
      ✔ enroll fails without remaining accounts for prerequisite
      ✔ enroll fails with non-Metaplex-Core account as credential
      ✔ enroll with credential NFT succeeds
      ✔ prerequisite succeeds after close_enrollment (rent reclaim)
      ✔ prerequisite fails with credential from wrong track
    Phase 13: Full track flow
      ✔ complete track: enroll → lessons → finalize → credential → next course
    Phase 14: Multiple enrollments
      ✔ two learners in same course, independent progress
    Phase 15: Achievement supply cap
      ✔ respects max supply
    Phase 16: Minter cap enforcement
      ✔ minter with unlimited cap (maxXpPerCall=0)
      ✔ minter cap boundary: exact amount succeeds, +1 fails
    Phase 17: Content update
      ✔ updates content tx ID without affecting enrollments
    Phase 18: Multi-course XP accumulation
      ✔ XP accumulates across courses

  66 passing (2m)
```
