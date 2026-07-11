# SP3 — Admin Panel v2 (Design)

**Date:** 2026-07-10
**Status:** Approved by owner (in-session). Pending tri-audit before plan execution.
**Epic context:** Third of three sub-projects (SP1 ✅ → SP2 remove Sanity → **SP3 admin panel v2**). SP3 rebuilds the admin console against the final post-Sanity data model, so it's built once. **Hard dependency: SP2 complete** (Publish screen needs `content.lock`; Deploy screen reads Supabase `onchain_deployments`).

## Goal

Turn the single stacked `/admin` page into a nav'd multi-screen console organized around what the platform operates: Publish, On-chain Deploy, Moderation, Platform Status. Rebuild the deploy experience with clear state, a change-preview, and fewer wallet prompts.

## Owner intent

- Admin must retain **full sync + on-chain deploy + moderation** capability (never lost across the epic) — SP3 restructures its UX, not its powers.
- A **nav bar** with distinct screens for different uses (moderation, sync, deploy, status).
- The on-chain deploy flow done "in a proper, UX-improved manner."

## Screen decomposition

| Route | Absorbs | Job |
|---|---|---|
| `/admin/publish` | content-sync-panel + sync-diff | `content.lock` SHA vs courses-academy HEAD, validation status, **bump-pin publish** action (replaces "Sync"). |
| `/admin/deploy` | course-sync-table + achievement-sync-table + immutable-mismatch-warning | Per-item deploy state (from Supabase), deploy/redeploy, change-preview with immutable-field warnings. |
| `/admin/moderation` | flags-panel | Community flags queue. |
| `/admin/status` | status + data-resync-panel | Platform health, deploy counts, resync tools. |

Persistent nav (left rail or top tabs) replaces the scroll. Each screen is its own route under the existing HMAC `admin_session` middleware gate — auth unchanged.

## Deploy screen v2 (the UX rebuild)

1. **Explicit per-item state** — deployed / drifted / never-deployed, read from `onchain_deployments` (SP2), not inferred.
2. **Change-preview before deploy** — drift diff of what the transaction will write, with **immutable-field warnings**: creator is set once and permanent. This is where:
   - **#400** (drift engine blind to creator mismatch) surfaces — compare on-chain creator vs `instructor.wallet`, flag mismatch loudly.
   - **#402** (program-ID / platform-authority denylist) surfaces — warn/refuse when a resolved creator is a known program id or the platform authority.
3. **Fewer wallet prompts** — batch deploy instructions so a single course deploy is one signature, not many (**#349**).

## Staged PRs (all SAFE-lane — frontend over SP2's model, no migrations)

- **SP3-A** — Nav shell + route split. Move surviving panels into `/admin/{publish,deploy,moderation,status}` behind a nav. Behavior-preserving refactor; each panel renders where it did, just on its own route.
- **SP3-B** — Publish screen: `content.lock` pin-bump flow (drift vs HEAD, validate, bump). Depends on SP2's `content.lock`.
- **SP3-C** — Deploy screen v2: the three upgrades above. #400/#402/#349 land here.
- **SP3-D** — Moderation + Status screen polish.

## Verification

- SP3-A: every surviving admin capability reachable via nav; e2e click-through of each route; no capability lost vs the pre-SP3 stacked page.
- SP3-B: pin bump updates `content.lock` + triggers a rebuild; drift indicator matches courses-academy HEAD.
- SP3-C: change-preview shows a synthetic creator mismatch (#400) and refuses a denylisted creator (#402); a course deploy issues one signature prompt, not many (#349); immutable-field warning renders.
- SP3-D: moderation actions work end-to-end; status counts match Supabase.
- All strings next-intl en/pt-BR/es parity (the SP1 deep-parity test guards this).

## Out of scope

- Content/data-model changes (SP2 owns those).
- On-chain program changes (#387/CS-4).
- Mainnet.
- New analytics beyond relocating what exists (admin analytics dashboards, if wanted, are a later feature).

## Issue remapping

- **#400, #402, #349** resolve in SP3-C (deploy screen). Update each when SP3-C lands.
- SP3 is the "admin restructure" deferred throughout SP1/SP2.

## Gates

- All SP3 PRs are SAFE-lane (frontend, no migrations, no trust-boundary changes) unless a PR incidentally touches `onchain_deployments` write logic — then SENSITIVE.
- Blocked on SP2 completion. Independent of #387 EXCEPT SP3-C's deploy actions, which invoke the on-chain program — if #387 changes the program, SP3-C's deploy calls coordinate with CS-4.
