# apps/web: Next.js 15 App Router

API route conventions live in `src/app/api/CLAUDE.md`. Env vars are listed in the root `.env.example`.

## Code rules

- TypeScript strict, no `any`. Server components by default; add `"use client"` only when needed.
- Every UI string goes through next-intl. `en.json`, `pt-BR.json` and `es.json` in `src/messages/`
  must have identical key structures, or the page throws `MISSING_MESSAGE` at runtime.
- Import with the `@/` alias. Order: React/Next, external packages, `@/lib`, `@/components`, relative.
- Components must be keyboard-accessible, with ARIA where needed and focus-visible rings.
- The client stack is `@solana/web3.js` 1.x plus `@coral-xyz/anchor`. Don't introduce `@solana/kit`.
- UI changes: check the rendered page in a browser before calling them done. `backdrop-filter` and
  `transform` re-parent `position: fixed` children, and only the computed CSS shows it.

## Middleware

`src/middleware.ts` chains three concerns:

1. **CSP nonce** (`lib/csp.ts`): a per-request nonce set on the request headers, so Next.js stamps
   its inline scripts and server components can read `x-nonce`. Widening `script-src` is a
   high-risk change (`REVIEW.md`).
2. **Supabase auth**: `getClaims()` verifies the JWT locally against cached JWKS and refreshes the
   session when needed. Only `claims.sub` is used, with no per-request DB query. Soft-deleted
   accounts are refused at the login chokepoints (`/api/auth/callback`, `/api/auth/wallet`,
   `/api/auth/dynamic`), and every `profiles.deleted_at` writer revokes sessions.
3. **next-intl**: adds the locale prefix (default `en`).

Server components share one per-request claims read through `getAuthClaims()` (`lib/auth/dal.ts`).
Call `supabase.auth.getUser()` only when you need the full user object.

- Auth-gated: `/dashboard`, `/settings`, and `/profile` (exact path, own profile only).
- Public: `/`, `/courses`, `/leaderboard`, `/community`, `/certificates`, `/profile/[username]`.
- Admin: session-gated like the above. `requireAdmin()` (`lib/admin/auth.ts`) checks the
  service-role-only `admin_users` allowlist and 404s signed-in non-admins.
- Excluded from middleware: `/api/*`, `/_next/static`, `/_next/image`, `/_vercel`, and
  asset-extension paths. A dot in a page slug (`/en/courses/node.js-basics`) still runs middleware.

Root-level `not-found.tsx` and `error.tsx` render outside the `[locale]` layout, so they use inline
translation objects keyed by the locale from `usePathname()`. `lib/i18n/request.ts` uses
`requestLocale`, not the deprecated `locale` param.

## Gamification

XP amounts, caps and the level formula live in `lib/gamification/xp.ts`; read them there. Unlocks
are declarative: each achievement content doc carries an `award` rule, and
`lib/gamification/achievements.ts` holds `PREDICATES satisfies Record<AwardKind, Predicate>`, one
predicate per kind. A new achievement is a content doc, not code.

## Environment gotchas

- `NEXT_PUBLIC_*` is inlined at build time. After changing one on Vercel, redeploy with the build
  cache disabled, and verify by grepping the served `/_next/static` chunks, not the dashboard.
- The browser RPC (`NEXT_PUBLIC_SOLANA_RPC_URL`) and the server RPC (`SOLANA_RPC_URL`) use separate
  keys. Never put the server key behind a `NEXT_PUBLIC_` name.
- A production build fails at boot without `NEXT_PUBLIC_APP_URL`, because an empty value would pin
  a relative metadata URI into an immutable credential NFT.
- PostHog has two projects. Switch to the Academy project and confirm `$host` before reading data.

## Content bundle (compile-content)

Course content ships as a committed bundle, not a live fetch. `scripts/compile-content.ts` compiles
`solanabr/academy-courses`, pinned to the SHA in `apps/web/content.lock`, into typed JSON under
`src/content/generated/`. Images aren't copied: the compiler hashes them and points the bundle at
`<blob store>/content/<sha256>.<ext>` (`lib/content/blob-store.mjs`), and `generated/assets.json`
lists them. `scripts/sync-content-assets.ts` uploads missing ones before `next build` on Vercel and
skips locally and in CI. The compile needs no token.

```bash
pnpm --filter web compile-content
```

- The generated dir is committed and prettier-ignored. Output is a pure function of the locked SHA,
  so a recompile must be byte-identical; CI recompiles and runs `git diff --exit-code`.
- Don't hand-edit `src/content/generated/*`. An ESLint rule bans importing it outside `src/lib/content/`.
- Publishing content means one PR that bumps `content.lock` and commits the regenerated bundle. The
  Content release workflow (`.github/workflows/content-release.yml`) opens it from
  `bot/content-release` within the hour of an academy-courses merge. A human merges it, then runs
  Deploy for any course it flags. Never commit to `bot/content-release`.
- Golden tests run on a fixed fixture (`lib/content/__tests__/fixtures/golden-bundle.ts`), so a
  release never needs a test edit. Live-bundle checks assert invariants only.

### Course translations

A course is one course in every language it ships. `course.yaml` declares `sourceLocale`; other
languages are an overlay at `courses/<slug>/l10n/<locale>/` (a `strings.yaml` plus translated `.md`
prose and re-rendered images at mirrored paths). Available languages are derived, never authored.

- Compiler (`lib/content/compile/l10n.ts`): the `l10n/` branch runs first in classification. Every
  overlay key must bind to something real and every translated file must mirror a source file, or
  the compile fails. It emits a sparse `generated/l10n.json`.
- Runtime (`lib/content/localize.ts`): a per-leaf merge onto the raw docs before projection, so
  projectors and renderers stay locale-blind. `[locale]` pages pass `params.locale`;
  `/api/content/*` derives it (`?locale=`, then the `NEXT_LOCALE` cookie, then the `Referer` path).
  No locale means the source tree: grading (`getLessonByIdForGrading`), admin and email never localize.
- Teacher preview (`lib/teach/preview-store.ts`) projects through the same `localizeCourseView`, so
  a teacher checks each language by switching the UI language.
- Fallback is to the course's own source language, never to `en`; `CourseLanguageNotice` tells the
  learner. An overlay can't carry ids, `correct`, XP, `starter`/`solution`, or test
  `input`/`expectedOutput` (`L10nStrings` is a `strictObject`).
