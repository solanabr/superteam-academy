# SP3-C — Deploy screen v2: change-preview + #400 + #402 (Implementation Plan)

**Date:** 2026-07-11 · **Spec:** `docs/superpowers/specs/2026-07-10-sp3-admin-panel-v2-design.md` (rev 2), Deploy-screen section
**Lane:** SAFE (frontend over SP2's model) EXCEPT Task 4 (#402) touches the on-chain deploy signer → SENSITIVE, adversarial review.
**Prereqs (HARD):** SP2-B live — `onchain_deployments` is the per-item state source; `getAllCoursesAdmin` reads bundle + deployment row. SP3-A merged — `/admin/deploy` route + `DeployClient` exist.

## Ambiguities resolved (read before executing)

1. **#400 detection timing.** The spec says the creator-mismatch DETECTION must land BEFORE any CS-4 recreate — earlier than SP3-C. SP3-C's job is the **UI surface**, not first detection. RESOLUTION: at execution, check whether `diffCourse` already emits a `creator` diff and `getMissingCourseFields` already flags creatorWallet (issue #400). If YES → SP3-C only renders it. If NO (detection slipped) → SP3-C lands both the `sync-diff.ts` detection AND the UI, and flags that #400 shipped late. Either way the UI work is identical.
2. **Per-item state source.** The `onChainStatus` enum (`synced`/`out_of_sync`/`not_deployed`/`draft`/`missing_fields`) already flows from `/api/admin/status` (post-SP2-B, sourced from `onchain_deployments`, not inferred). SP3-C ADDS content-drift (`computeContentDrift` from `lib/github/drift`, i.e. bundle/`content.lock` vs courses-academy HEAD) so a course reads deployed-but-content-drifted distinctly from in-sync. No new fetch plumbing — extend the status route's per-course record.
3. **Change-preview data.** The diff already exists: `diffCourse` returns `differences[]` (updateable + immutable) and `hasImmutableMismatch`; `ImmutableMismatchWarning` already renders immutable diffs. SP3-C wraps these into a pre-deploy preview (currently the tables sync immediately on click). No new diff engine.
4. **#402 lives in the signer, not the DB.** `admin-signer.ts::deployCoursePda` already rejects missing/unparseable/off-curve `creatorWallet` but NOT on-curve-but-nonsense (System program, Token programs, the ed25519 identity are all on-curve) nor `creator == _authority.publicKey`. #402 = a denylist + platform-authority refusal there, plus a UI warning in the change-preview. The signer edit is the SENSITIVE part.
5. **Copy hygiene.** The current `ImmutableMismatchWarning` string references "Sanity Studio" ("Revert the change in Sanity Studio") — dead post-SP2. SP3-C rewrites it to the git/publish-PR remediation path.

## Tasks

### Task 1 — Per-item state: fold content-drift into the deploy record

**Files:** `app/api/admin/status/route.ts` (add a `contentDrift` field per course from `computeContentDrift` over `lib/github/drift` + `content.lock`/HEAD); `components/admin/course-sync-table.tsx` + `status-badge.tsx` (render deployed / drifted / never-deployed explicitly, distinguishing on-chain drift from content drift).
**TDD:** status-route unit test — synced+content-drifted course yields the drifted badge; not-deployed yields never-deployed.
**Verify:** `/admin/deploy` shows the three explicit states against seeded rows.

### Task 2 — Change-preview before deploy

**Files:** new `components/admin/deploy-change-preview.tsx` — given a course's `differences[]` + `hasImmutableMismatch`, render "this transaction will write: …" (updateable fields) and reuse `ImmutableMismatchWarning` (rewrite its copy per ambiguity 5) for immutable ones; a Confirm-deploy button that then calls `/api/admin/courses/sync`. Wire into `course-sync-table.tsx` so deploy/redeploy opens the preview instead of firing immediately.
**TDD:** preview lists updateable diffs; immutable mismatch shows the warning + telegraphs the recreate path; no-diff → "no changes, redeploy?" state.
**Verify:** click-through on a drifted course shows the preview before any tx.

### Task 3 — #400: creator mismatch surfaced (UI; detection if not already landed)

**Files:** IF detection missing: `lib/admin/sync-diff.ts` — add a `creator` entry (immutable, `updateable:false`) to `diffCourse` comparing on-chain `creator` vs the instructor wallet (`AdminCourse.creatorWallet` / resolved `instructor.wallet`), and add missing/invalid creatorWallet to `getMissingCourseFields`. ALWAYS: ensure the change-preview + `ImmutableMismatchWarning` render the creator diff loudly.
**TDD:** synthetic on-chain creator ≠ instructor wallet → `creator` immutable diff present, `hasImmutableMismatch:true`, preview renders it; missing creatorWallet → `missing_fields`.
**Verify:** seeded mismatch renders the loud warning on `/admin/deploy`.

### Task 4 (SENSITIVE) — #402: denylist + platform-authority refusal in the signer

**Files:** `lib/solana/admin-signer.ts::deployCoursePda` — after the on-curve check, refuse when `creator` ∈ a denylist of well-known program IDs (System `11111111111111111111111111111111`, Token/Token-2022, the ed25519 identity point) OR `creator.equals(_authority.publicKey)` (platform authority), with an explicit `allowUnusualCreator` override param for the deliberate case. Surface the same denylist check client-side in the change-preview (warn/refuse before the tx).
**TDD:** unit — each denylisted id throws without override, passes with it; `creator == authority` refused; a normal wallet passes.
**Verify (devnet):** attempt a deploy with `creator = System program` → refused with a clear error; with a real instructor wallet → succeeds. Capture as the sensitive evidence in the PR.

### Task 5 — i18n + wiring polish

**Files:** en/pt-BR/es `admin` message keys for the preview, the three state badges, the #400 warning, the #402 refusal. Deep-parity test green.

### Task 6 — E2E verification pack

- Per-item states correct against `onchain_deployments` rows (deployed/drifted/never-deployed + content-drift).
- Change-preview shows updateable diffs and blocks on immutable mismatch.
- Synthetic creator mismatch (#400) renders the loud immutable warning.
- Denylisted creator (#402) refused on devnet; normal deploy succeeds.
- All captured in the PR description.

## Out of scope

#349 (learner buildable-deploy flow — wrong subsystem, dropped rev 2); moderation/status polish (SP3-D); #387/CS-4 program changes (SP3-C's deploy calls coordinate with but don't perform them); mainnet.

## Gates

SAFE-lane for Tasks 1-3/5-6; **Task 4 is SENSITIVE** (on-chain deploy signer) → full independent adversarial re-exploit review before the PR (single claude[bot] gate is insufficient for on-chain-authority-touching changes). Blocked on SP2-B completion. If #387 changes the program, Task 4's deploy calls coordinate with CS-4.
