# SP3-A — Admin Nav Shell + Route Split (Implementation Plan)

**Date:** 2026-07-11 · **Spec:** `docs/superpowers/specs/2026-07-10-sp3-admin-panel-v2-design.md` (rev 2), SP3-A
**Lane:** SAFE (frontend-only, no migrations, no trust-boundary change, auth unchanged). **Independent of SP2** (moves existing panels; doesn't touch the data model).

## Ambiguities resolved (read before executing)

1. **`/admin` root behavior after the split (controller-corrected).** Today `app/[locale]/admin/page.tsx` renders `AdminLoginForm` unauthenticated and the stacked `AdminClient` authenticated. The middleware redirects unauthenticated `/admin/*` sub-routes to `/admin` (`middleware.ts:163-178`) — so an unconditional `redirect()` in the root page would LOOP for unauthenticated users (`/admin` → `/admin/status` → middleware → `/admin` → …). **Resolution:** the root `page.tsx` checks the session itself: valid `admin_session` → `redirect(/{locale}/admin/status)`; invalid → render `<AdminLoginForm/>` (exactly as today). The new `layout.tsx` renders the console chrome + `<AdminNav/>` only when the session is valid, and plain `{children}` otherwise (so the login form isn't wrapped in a nav). No middleware change.
2. **Status data fetch split.** `AdminClient` fetches `/api/admin/status` once and fans out. **Resolution:** each screen's client component fetches what it needs from the UNCHANGED `/api/admin/status` (deploy: `courses`+`achievements`; status: `program`+counts). Do NOT split the API in SP3-A; small refetch duplication is acceptable and behavior-preserving.
3. **i18n scope.** The admin console has zero next-intl today (hardcoded English). **Resolution:** add an `admin` namespace for the NEW nav/screen chrome only (nav labels, screen titles, console header) in en/pt-BR/es. Pre-existing hardcoded strings inside moved panels stay as-is (behavior-preserving). The SP1 deep-parity test enforces structural parity of the new keys.

## Screen map (grounded in the real files)

| Route | Renders (moved as-is) | Source today |
|---|---|---|
| `/admin/publish` | `ContentSyncPanel` (+ its `sync-diff-view`) | `components/admin/content-sync-panel.tsx` |
| `/admin/deploy` | `CourseSyncTable` + `AchievementSyncTable` (+ `immutable-mismatch-warning` inside them) | `components/admin/{course,achievement}-sync-table.tsx` |
| `/admin/moderation` | `FlagsPanel` | `components/admin/flags-panel.tsx` |
| `/admin/status` | **the inline program-status bar** (spec rev-2 mandate — must not be dropped) + `DataResyncPanel` + deploy counts | inline in `admin-client.tsx` + `components/admin/data-resync-panel.tsx` |

**SP2-C/D deletability constraint:** `/admin/publish` renders `<ContentSyncPanel/>` as-is, no new coupling — SP2-C/D deletes it by removing one file + one nav entry.

## Tasks

### Task 1 — Layout + nav shell + root-page session split + i18n scaffold
**Files:**
- `app/[locale]/admin/layout.tsx` (new) — server component; `isValidAdminSession(cookies().get("admin_session"))`: valid → console chrome (`max-w-6xl` shell + i18n'd "Admin Console" header) + `<AdminNav/>` + `{children}`; invalid → plain `{children}` (login form renders unwrapped).
- `app/[locale]/admin/admin-nav.tsx` (new) — client component; persistent left rail (desktop) / top tabs (mobile) with 4 links, `aria-current` via `usePathname`, keyboard-navigable, focus-visible rings (house a11y rules). Labels from the `admin` namespace.
- `app/[locale]/admin/page.tsx` — session check: valid → `redirect(/{locale}/admin/status)`; invalid → `<AdminLoginForm/>` (today's path preserved; NO unconditional redirect — see ambiguity 1).
- `messages/{en,pt-BR,es}.json` — `admin` namespace: `console.title`, `console.subtitle`, `nav.{publish,deploy,moderation,status}`, screen titles. Identical structure across locales.

**TDD:** `admin-nav` test (4 links, active marking from mocked pathname, labels resolve); parity test covers the new keys.
**Verify:** unauth `/admin` → login form, no nav, no redirect loop (curl -L bounded); auth `/admin` → `/admin/status`; nav on every sub-route; `next build` clean.

### Task 2 — Publish + Moderation screens (straight moves)
**Files:** `app/[locale]/admin/publish/page.tsx` (renders `<ContentSyncPanel/>`, no new coupling), `app/[locale]/admin/moderation/page.tsx` (renders `<FlagsPanel/>`; the flag-count badge's `onCountChange` lift moves into a thin client wrapper local to this screen).

**TDD:** render smoke only (panels carry their own tests).
**Verify:** click-through — publish shows content-sync + drift UI exactly as before; moderation actions work.

### Task 3 — Deploy + Status screens (table wiring + status-bar relocation) + delete `admin-client.tsx`
**Files:** `app/[locale]/admin/deploy/{page,deploy-client}.tsx` (fetch `/api/admin/status`, render both sync tables with the same `onRefresh` wiring), `app/[locale]/admin/status/{page,status-client}.tsx` (fetch `/api/admin/status`, render the relocated program-status bar — moved verbatim — + `<DataResyncPanel/>` + counts). Delete `admin-client.tsx` once relocated.

**TDD:** both clients — mock `/api/admin/status`; tables/status bar render; refresh refetches; authority-mismatch banner shows on `authorityMatch.matches === false`.
**Verify:** deploy actions (sync/deactivate) identical; status shows program bar + banner; resync works; counts match.

### Task 4 — i18n parity + full e2e capability check
- Parity test green with the new namespace across en/pt-BR/es.
- E2E click-through proving NO capability lost vs the stacked page: sync a course, deploy an achievement, act on a flag, run a resync, read program status.
- Regression: unauthenticated GET of each `/admin/*` sub-route redirects to `/admin` (middleware, no code change).

**Verify:** captured click-through = the SP3-A evidence (spec: "every surviving admin capability reachable via nav; no capability lost").

## Notes
- SAFE-lane; per-task review + whole-branch review. If any task incidentally touches deploy write logic it becomes SENSITIVE — it should not here.
- Merge-order note: SP3-A moves panels; SP2-C/D later deletes the content-sync panel at its new location. If SP2-C lands first, rebase this branch and drop `/admin/publish` to a placeholder pointing at the SP3-B publish screen.

## Out of scope (SP3-B/C/D)
Publish pin-bump flow (SP3-B, needs SP2). Deploy-screen v2 (change-preview, #400 UI, #402) — SP3-C. Moderation/status polish — SP3-D. No API-route changes.
