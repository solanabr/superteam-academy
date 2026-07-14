# Instructor identity from the academy profile (delete the content `instructors/` folder)

**Status:** design — no code. Expands and un-defers **#439**; touches the WS-1 deploy content model (#440).
**Owner decision (2026-07-14):** the instructor's identity comes from their **academy profile** (the wallet-linked `profiles` row), not a content doc. No profile yet → show the **wallet, no name**, until they create one. Delete the `instructors/` content folder entirely.

---

## 1. Why

Today instructor identity is authored twice: once as a content doc in `courses-academy/instructors/*.yaml` (name, bio, avatar, socials) and again — for the same person — as their academy `profiles` row. The content copy is the source of truth for display, and the wallet is the only real link between them. That duplication is why the 6 seed courses currently point four placeholder instructor docs at **one shared test wallet**, and why #439 (instructor avatars) had to be deferred with "no live data."

Collapsing to one source of truth — the academy profile, keyed by wallet — makes instructor identity **self-served** (an instructor controls their own name/avatar/bio by having an account), removes the duplication, and dissolves the placeholder-identity problem: the deploy content only needs the **real creator wallet per course**, not authored names.

## 2. The model

```
course.yaml:  creator: <SolanaAddress>          (the wallet — no instructor ref)
                     │
   sync ────────────┤ course.creator (wallet) → Course.creator (on-chain, immutable)
                     │
   display ──────────┴─→ resolve wallet → public academy profile
                            found    → { username, avatar, bio, socials }
                            not found → truncated wallet, no name
```

- The **wallet lives on the course** (the owner's earlier call: "move the instructor wallet to the course"). It is the on-chain `Course.creator` (the XP recipient) and the identity key (`profiles.wallet_address`).
- The **content `instructors/` folder and the `Instructor` schema are deleted.**
- **Display resolves at read time** from the academy profile by wallet, with a graceful wallet fallback.

## 3. Changes (cross-repo)

### 3.1 Schema + content (`packages/content-schema`, `courses-academy`)
- **Delete** `src/instructor.ts` (the `Instructor` type) and the `instructors/` load branch in the compiler; remove the `instructors/*.yaml` folder from `courses-academy`.
- **Course** (`src/course.ts`): replace `instructor: InstructorId.optional()` with `creator: SolanaAddress` (the instructor wallet, required — a course with no creator is rejected at sync, as today). Sync simplifies from `course.instructor → instructor.wallet → Course.creator` to `course.creator → Course.creator` (no deref).
- The 6 course docs each carry the real creator wallet (this is the WS-1 Phase-4 content, §5).

### 3.2 DB exposure — the one SENSITIVE piece (`supabase/`)
`profiles` is RLS own-row SELECT, so a public instructor read needs a deliberate exposure surface. Add a **`public_profiles` view** exposing only non-sensitive fields **by wallet** — `wallet_address`, `username`, `avatar_url`, `bio`, `social_links` — following the existing `public_user_xp` pattern (and the `get_leaderboard` SECURITY DEFINER precedent). No email, no `google_id`/`github_id`, no `deleted_at` rows (the view filters `deleted_at IS NULL` + `is_public`). This is the mechanism #439 named ("a view, following `public_user_xp`").

### 3.3 Frontend (`apps/web`)
- The projector stops deref'ing an instructor content doc; the course carries the creator wallet.
- The course page (and the recommended-course mini shape) resolve `creator wallet → public_profiles` and render `{ username, avatar, bio, socials }`, or a **truncated wallet with no name** when absent.
- `/api/content/instructor-wallet` flips from "wallet → content instructor doc" to "wallet → public profile."

## 4. What this fixes for free
- **Dissolves the placeholder-identity gap.** No instructor docs to author → no invented names → the deploy content just needs real creator wallets. The humans behind those wallets self-serve their display by making a profile.
- **Un-defers and completes #439** (avatars) — as the full identity, not just the avatar.

## 5. Scope & sequencing
- **Schema + wallet-on-course is deploy-critical** (`Course.creator` reads from it) → it rides the **WS-1 Phase-4 content wave**, in the same `courses-academy` PR + `content.lock` bump as `creatorRewardXp: 30` and the `minCompletionsForReward` removal.
- **DB exposure + display degrades gracefully to the wallet**, so it can land **pre-launch or as a fast-follow** — owner's call on urgency. Until it lands, courses show the creator wallet (acceptable, and the intended fallback).

## 6. Gate
- The `public_profiles` view is **SENSITIVE** (RLS / data exposure): full adversarial review + confirm it exposes *only* the non-sensitive set and excludes deleted/private rows. Migration-before-code (apply via MCP → verify the exposed columns on prod → then merge).
- The schema/content/frontend parts are SAFE-lane (both gates + verify).

## 7. Non-goals
- Not a change to XP, the reward, or `Course.creator` *semantics* — only how the creator wallet is sourced (course field, not instructor deref) and how identity is *displayed*.
- No course-level display override — the profile is the single source of truth (that's the point). Revisit only if a curated display name is ever needed.
- Not editing instructor profiles from the course flow — instructors manage their own academy profile.

## 8. Open question for the owner
- **Public profile fields:** default exposure is `username`, `avatar_url`, `bio`, `social_links` (wallet already public on-chain). Anything to exclude or add?
