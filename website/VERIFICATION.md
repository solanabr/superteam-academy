# Manual verification and current phase

Use this to confirm the work done so far and see where development stands.

---

## Current phase: **Phase 1 done**, **Phase 2 in progress**

| Phase | Plan doc | Status | Notes |
|-------|----------|--------|--------|
| **Phase 0** | IMPLEMENTATION_PLAN_WEBSITE.md | ✅ Done | App scaffold, Tailwind, design tokens, globals.css, shadcn, next-intl, logo |
| **Phase 1** | Layout, auth, data layer | ✅ Done | Header, Footer, Privy, Supabase (anon + service key), Prisma + migrations, LearningProgressService, API routes |
| **Phase 2** | CMS and course discovery | 🔶 In progress | Sanity configured; `/courses` exists; need course detail `/courses/[slug]`, enrollment CTA, mock course |
| **Phase 3** | Lesson view + CodeMirror | ⬜ Not started | `/courses/[slug]/lessons/[id]`, editor, challenge runner, complete-lesson UI |
| **Phase 4** | Dashboard, profile, leaderboard | 🔶 Partial | Dashboard, leaderboard, settings, achievements pages exist; need real data wiring |
| **Phase 5** | Settings, certificates, gamification | ⬜ Not started | Certificate view, finalize course, achievements logic |
| **Phase 6** | Analytics, performance, docs | ⬜ Not started | GA4, Sentry, Lighthouse, ARCHITECTURE, CMS_GUIDE |

**Last phase completed:** **Phase 1** (layout, auth, Supabase + Prisma, LearningProgressService, API routes).

---

## Manual checks (run these to verify)

### 1. Environment and database

```bash
cd app
```

- [ ] `.env` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `DATABASE_URL`, Privy vars.
- [ ] **Prisma:** `pnpm prisma migrate dev` (or `prisma migrate status`) — no pending migrations; DB in sync.
- [ ] **Prisma Studio (optional):** `pnpm prisma studio` — opens DB UI; confirm `users`, `enrollments`, `progress`, `credentials` exist.

### 2. Build and dev server

```bash
pnpm install
pnpm build
```

- [ ] Build completes with no errors.
- [ ] `pnpm dev` — app runs (e.g. http://localhost:3000).

### 3. Supabase client (anon key)

- [ ] Open app in browser; check console for no Supabase/client errors.
- [ ] If you have a “Connect wallet” or any Supabase-backed UI, use it; it should use the anon key (no 401 from Supabase).

### 4. API routes (need a logged-in user / wallet for some)

- [ ] **GET /api/progress** — with no auth may 401 or return empty; with valid session/wallet should return progress shape.
- [ ] **GET /api/user** — same idea; confirms user resolution.
- [ ] **POST /api/enroll** and **POST /api/complete-lesson** — require body/auth; call from UI or curl with correct payload to confirm 200/201 or expected error.

### 5. Pages (smoke test)

- [ ] **Landing:** `/` — loads, no crash.
- [ ] **Courses:** `/courses` — loads (catalog or empty).
- [ ] **Dashboard:** `/dashboard` — loads (may redirect if auth required).
- [ ] **Leaderboard:** `/leaderboard` — loads.
- [ ] **Settings:** `/settings` — loads.

### 6. Auth (Privy)

- [ ] “Connect wallet” or login flow opens Privy; after connect, UI shows logged-in state (if implemented).
- [ ] First connect should create or update user row in Supabase/Prisma (check via Prisma Studio or DB).

---

## Where to look in the repo

| What | Where |
|------|--------|
| **Website phases** | `docs/IMPLEMENTATION_PLAN_WEBSITE.md` |
| **On-chain program phases** | `docs/IMPLEMENTATION_ORDER.md` (Solana/Anchor; separate from website) |
| **App README** | `app/README.md` |
| **Supabase client** | `app/src/lib/supabase/client.ts`, `server.ts` (use anon key) |
| **Prisma schema** | `app/prisma/schema.prisma` |
| **Learning progress** | `app/src/lib/learning-progress/` (interface, types, prisma-impl) |
| **API routes** | `app/src/app/api/` (progress, enroll, complete-lesson, user) |

---

## Next steps (after Phase 1)

1. **Phase 2:** Add `/courses/[slug]` (course detail from Sanity), enrollment CTA, and a mock course in Sanity.
2. **Phase 3:** Add lesson route, CodeMirror editor, challenge runner, and “Mark complete” flow.
