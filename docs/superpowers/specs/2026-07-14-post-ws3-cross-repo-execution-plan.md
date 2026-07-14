# Post-WS-3 execution plan — the remaining deploy-independent work (cross-repo)

**Status:** execution plan. Covers the last launch work that does **not** depend on the WS-1 devnet deploy: **#461**, **#478**, **#466**. Its whole point is to make the **`solanabr/courses-academy` content PRs first-class** — they were previously hand-waved as "a content PR," but they are real, executable work (the controller has `push` access to that repo).

## The cross-repo pattern (why each change is a *sequence*, not one PR)

Two constraints force the shape:
- **Zod strips unknown keys** — the monorepo schema/compiler must accept a new content shape **before** `courses-academy` uses it, or the new keys are silently dropped (the WS-1 reward-field lesson).
- **`content.lock` is the activation gate** — a `courses-academy` PR merges without touching the live app; the change only goes live when the monorepo bumps `content.lock` to that SHA and recompiles the bundle.

So every content-touching change is three steps:
1. **Monorepo schema PR** — teach the schema/compiler the new shape (additive / optional first). Nothing activates.
2. **`courses-academy` content PR** — the actual content. Merges safely; not yet pinned.
3. **Monorepo activation PR** — bump `content.lock` + recompile the bundle + the consuming code (display / radar) + tighten the schema (remove old fields). This is where it goes live and where the real end-to-end verify happens.

## Workstream A — #461 refuse-login (monorepo only)

Single PR. Add a `profiles.deleted_at` check in the auth flow (callback + middleware); reject sign-in on a tombstoned account with a localized "account deleted" message (en/pt-BR/es). No `courses-academy`.
- **Lane:** SAFE (auth-adjacent) → bot + CI + my verify.
- **Depends on:** nothing. **Ready now.**

## Workstream B — #478 instructor identity from the academy profile (cross-repo)

| Step | Repo | PR | Lane | Gate |
| --- | --- | --- | --- | --- |
| **B1** | monorepo | course schema: `instructor` ref → `creator: SolanaAddress`; delete the `Instructor` type; compiler drops the `instructors/` load branch | SAFE | bot + CI + verify |
| **B2** | monorepo | **`public_profiles` view** — by wallet, exposing only `username / avatar_url / bio / social_links` (filtered `is_public` + not-deleted); introspect the **live** `profiles` columns first, migration-before-code | **SENSITIVE (DB)** | **my independent gate** |
| **B3** | courses-academy | delete the `instructors/` folder; add `creator: <wallet>` to each course | content | bot + verify |
| **B4** | monorepo | `content.lock` bump + frontend display (wallet → `public_profiles` → show or truncated-wallet fallback) + flip `/api/content/instructor-wallet` to a profile lookup + tighten the schema | SAFE | bot + CI + verify |

**Blocked:** the **real creator wallets** (#440 — who the instructors are). B3 can proceed *structurally* on the current placeholder wallet; the real addresses land with the WS-1 deploy content wave (below). The folder deletion, schema wiring, and the view are **not** blocked.

## Workstream C — #466 per-lesson skill tags (cross-repo)

| Step | Repo | PR | Lane | Gate |
| --- | --- | --- | --- | --- |
| **C1** | monorepo | lesson schema: add `skills[]` (optional) + the `skills.yaml` taxonomy shape + a compiler load branch (no enforcement yet) | SAFE | bot + CI + verify |
| **C2** | courses-academy | add `skills.yaml` (the canonical vocab) + per-lesson `skills` (**AI-drafted by the controller, human-reviewed**) + drop the course-level `tags` | content | bot + verify |
| **C3** | monorepo | `content.lock` bump + tighten the schema (`skills` required + membership enforced + derive course `tags` from the lesson union) + the radar rewrite (per-lesson attribution) | SAFE | bot + CI + verify |

- **Depends on:** nothing (not deploy-coupled — activates whenever). **Ready after C1.**

## `course.yaml` coordination (the one real cross-workstream conflict)

Three separate changes edit `course.yaml`, so they must be sequenced to avoid churn:
- **B3** adds `creator: <wallet>`.
- **C2** drops the course-level `tags`.
- **WS-1 reward** (deploy-coupled) sets `creatorRewardXp: 30` and drops `minCompletionsForReward`.

Rule: **the WS-1 reward edit + B3's *real* wallets are one `courses-academy` content wave, activated AT the deploy** (both are deploy-gated and touch the same fields). C2's `tags` removal is independent (activates with #466). Sequence B3-structural and C2 so they don't collide on `course.yaml` — either one PR or ordered, controller's choice at execution.

## Sequencing & parallelism
- **A (#461)** — independent, start anytime.
- **B and C** — each is schema→content→activation; they touch different schema areas, so they run **in parallel**. The only SENSITIVE gate is **B2** (the DB view).
- Real-wallet activation (B's real creators + the WS-1 reward) waits on the deploy wave — but everything else here is executable now.

## Gates (unchanged discipline)
- **SENSITIVE — B2 (`public_profiles` view):** my independent gate — introspect the live columns first, confirm **only** the four non-sensitive fields are exposed and deleted/private rows are excluded, migration-before-code. Same as #377/#474.
- **SAFE (monorepo code + `courses-academy` content):** bot + CI + my verify. The **activation PR** (B4/C3) is where the real end-to-end verify happens — the bundle recompiles byte-clean and the app renders.

## Division of labor
- **Monorepo code PRs** (schema, view, display, radar, auth): the implementer, gated by the controller.
- **`courses-academy` content PRs** (B3, C2) + the **AI skill backfill**: the controller executes them directly (has `push` access), reviewed before the activating `content.lock` bump.
