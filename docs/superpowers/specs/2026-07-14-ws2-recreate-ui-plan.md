# WS-2 — Recreate + Publish admin UI (execution plan)

**Status:** plan. Design lives in the Launch-Readiness epic (§Recreate-UI); this is the ordered execution, folding in every decision made since that design.
**Foundation:** #453 (close+recreate **server path** — route + `recreate-course.ts` + `admin-signer`, open). This plan adds the **UI** on top and reconciles the accumulated decisions.
**Depends on:** WS-1 v-next **deployed** (the recreate closes+recreates real on-chain `Course` accounts). Per the mainnet-via-Pinocchio decision, the devnet deploy is a *test* of this flow; the real use is at mainnet creation. So WS-2 is buildable now against the merged v-next client, but its execute path is only exercised once a v-next program is live.

---

## 1. What

On the Courses admin screen, an **immutable-field mismatch** (`creator` / `difficulty` / `trackId` / `trackLevel` / `prerequisite` between content and chain) currently shows a red "cannot auto-fix" card. Replace that dead-end with an honest, actionable **Recreate** action (authority-gated, same `admin_session`) that closes the stale PDA and recreates it at the same address with the new immutable values — the on-chain analogue of "this field can only be set at creation."

## 2. The flow (server path exists — #453; this plan builds the UI + hardens it)

1. **Preflight** (before anything is closed): validate the new params through the real **#427 creator guard** (denylist + not-platform-authority — and, post-#478, the `creator` wallet resolves from the course), confirm the content compiles, confirm enrollments survive. Display exactly what changes — the immutable field(s) old→new — and **"completion counters reset to 0; enrollments, learner progress, AND earned certificates are preserved."**
2. **Confirm modal** — explicit, not dismissible-by-habit: shows `creator` old→new, the reset-vs-preserved list, and a **brief-downtime warning** (close and create are *not atomic* — a closed 0-lamport PDA isn't GC'd until tx end, so there's a seconds-long window where the course PDA is absent and `enroll`/`complete` fail).
3. **Execute:** `close_course` → `create_course` at the same PDA (`["course", course_id]` seed). Hard-retry the create; if it still fails, **fail loud** with the exact recovery instruction (a course with no PDA reads as `not_deployed`, so the ordinary Deploy button recreates it).
   - **The webhook finalize gap (must fix here):** `event-handlers.ts` does a plain early-return (no `queueFailedAction`) when the course PDA is absent — a learner who finishes their last lesson *during* the absent window permanently loses auto-finalize. So the execute path **must gate the finalize/complete endpoints for the affected course** during the window (per WS-1's maintenance-gate mechanism — the gate lives inside `retryPendingOnchainActions` + the four write routes). Recovery is natural for reads but NOT self-healing for that one write.
4. **Verify:** decode the recreated account (length-aware decoder), assert `creator` / `difficulty` / the immutable set match the new content, and that `lesson_flags` preservation held (a mid-course learner still finalizes — see §4).

## 3. Certificates survive — and stamp the version (owner decision 2026-07-14)

**Verified:** earned certificates survive a recreate. They are keyed by `course_id` (stable — same PDA seed) in the `certificates` table, AND are Metaplex Core NFTs minted to the *learner's* wallet with Arweave metadata — fully independent of the `Course` PDA. A recreate cannot take them.

**Add:** stamp `course.version` into the credential metadata **at mint** (it is NOT stored today). After a recreate resets `version → 1`, a pre-existing credential still records which content version it was earned against — clean provenance, no ambiguity. Small addition to the cert-mint path; do it as part of WS-2.

## 4. Learner progress preservation is conditional (carry the WS-1 H3 constraint)

Enrollments are separate PDAs keyed by `course_id`, untouched by `close_course`; the recreated `Course` lands at the same address, so `enrollment.course == course.key()` holds and `lesson_flags` survive. **But** `finalize_course` gates on `flags & active == active` (subset), so **recreating with a `lesson_count` whose dense mask is a *superset* of what a mid-course learner completed silently flips them back to incomplete.** The recreate preflight (§2.1) must read the course's current on-chain `lesson_count` and default the recreate to **exactly that value**, warning if the operator changes it. (Same constraint as WS-1 Phase-4 H3.)

## 5. Mainnet gate = HARD assertion (not framing)

close+recreate expands the hot-key blast radius from "update fields" to "delete any course." The execute path **must assert `authority == the Squads vault` on mainnet** (post-#305) as a hard precondition — else a destructive close is reachable behind a single hot key. On devnet: unchanged, low-stakes, recreate freely. The button labels it a maintenance-window op.

## 6. Ordered steps
1. **Merge #453** (server path) — but first **delete its reward-window pre-flight** (the `#450` guard): post-WS-1 the reward window doesn't exist, so the guard is dead code. (It was load-bearing only against the *pre-v-next* deployed program; gone once v-next is live.)
2. **Cert-version stamp** — add `course.version` to the credential metadata at mint (§3). Independent, small, shippable now.
3. **Recreate UI** — the preflight card + confirm modal + execute wiring on the Courses screen, consuming #453's route. Fold the immutable-mismatch card replacement here.
4. **Window gating in execute** — wire the finalize/complete gate for the affected course during the close→create window (§2.3), reusing WS-1's maintenance-gate mechanism.
5. **Mainnet Squads assertion** (§5) — hard precondition in the execute path, gated on network.
6. **i18n** — the recreate/confirm-modal strings (en/es/pt-BR); coordinate with the #452/#448 i18n sweep so it isn't done twice.

## 7. Gates
- **SENSITIVE** (on-chain close/recreate + authority-key signing): full adversarial review + owner sign-off, same discipline as WS-1. The Squads assertion (§5) is a hard, tested precondition, not a comment. Mainnet forbidden without explicit confirmation.
- The cert-version stamp + i18n are SAFE-lane (bot + CI + verify).

## 8. Non-goals
- The **Publish half** is already coherent (Courses screen shows drift + a prefilled publish-PR link, #456); this plan doesn't change it.
- Not a durable-nonce one-prompt deploy (that's the #349 later-nicety, out of scope).
- Real instructor wallets are a mainnet-content concern (#440), not this plan.
