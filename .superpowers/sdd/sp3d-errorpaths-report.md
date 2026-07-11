# SP3-D follow-up — admin action-error path i18n

**Branch:** `fix/admin-error-path-i18n-11-07-2026` (off `origin/main` @ `8a59ba6`)

## What changed

The SP3-D review's Minor: the admin panels' ACTION-ERROR paths still set raw
`e.message` / `"Network error"` / `"Request failed (N)"` strings as displayed
error state. Applied the same kind-mapping treatment SP3-D's `useAdminStatus`
uses — errors become localized kinds surfaced via the panel's next-intl
namespace; the raw message stays in `console.error` for devtools.

### `components/admin/flags-panel.tsx`

- `error` state: `string | null` → `ActionError | null` (`"fetch" | "network"`).
- Non-ok action response → `console.error(raw)` + `setError("fetch")` (was
  `setError(body.error ?? "Request failed (N)")`).
- `catch` → `console.error(e)` + `setError("network")` (was `setError(e.message)`).
- Render maps the kind: `t(error === "network" ? "errorNetwork" : "errorFetch")`.

### `components/admin/data-resync-panel.tsx`

- Identical treatment (same kind union, same console-log + kind mapping,
  same render mapping under `admin.resync`).

### i18n keys (en / pt-BR / es)

Added two keys to each panel's existing namespace, real translations in all
three locales:

- `admin.resync.errorFetch`, `admin.resync.errorNetwork`
- `admin.flags.errorFetch`, `admin.flags.errorNetwork`

Reused the two-kind vocabulary from `useAdminStatus`; did NOT reuse
`admin.states.fetchError` ("Failed to fetch status") because that copy is
status-screen specific and wrong for a flag-resolve / resync action.

## Tests

- **New:** `components/admin/__tests__/flags-panel.test.tsx` (2),
  `components/admin/__tests__/data-resync-panel.test.tsx` (2). Both panels
  previously had NO dedicated test (their parents stub them with
  "carries its own tests" comments). Each asserts: non-ok → localized
  `errorFetch` shown AND the raw server message stays out of the DOM AND
  `console.error` was called; throw → localized `errorNetwork` shown, raw
  message not in DOM. This is the changed-behavior assertion (localized string,
  not raw message).
- No existing assertions changed — no prior test asserted the raw error text
  (the panels were stubbed in `moderation-client.test.tsx` /
  `status-client.test.tsx`).
- Deep-parity guard (`src/messages/__tests__/parity.test.ts`, 4 tests): green.
- Full `pnpm --filter web test`: **65 files, 459 tests, all pass**.
- `tsc --noEmit`: clean. `next lint` on changed files: no warnings/errors.

## Sweep inventory

Grepped every `components/admin/*.tsx` for `catch` / `.message` /
`"Network error"` / `setError`.

**Touched (in scope — already-i18n'd panels whose action-error path was missed):**

- `flags-panel.tsx`
- `data-resync-panel.tsx`

**Deliberately excluded:**

- `content-sync-panel.tsx`, `sync-diff-view.tsx` — SP2-C-doomed (delete-Sanity,
  `2026-07-11-sp2c-delete-sanity.md`). Explicitly named as untouchable by the task.
- `course-sync-table.tsx`, `achievement-sync-table.tsx` — display raw `e.message`
  and are NOT in the SP2-C deletion set (they deploy Course/Achievement PDAs via
  `/api/admin/{courses,achievements}/sync`, which survive; live in the SP3-C
  deploy screen). **Excluded anyway** for two reasons: (1) they are NOT i18n'd at
  all — every string is hardcoded English ("Deploy", "Syncing...", "Sync All",
  table headers, "Missing:") — so localizing only the error line would be
  incoherent; (2) they are owned by the **open, not-yet-implemented** SP3-C
  deploy-screen-v2 plan, whose Tasks 2/3/5 rewrite these tables and add their
  en/pt-BR/es keys wholesale. Touching their error paths now would collide with
  that pending rewrite. Same spirit as the SP2-C carve-out: leave migration-owned
  surfaces to their owning workstream.

## Concerns

- The kind-mapping intentionally drops the server-provided `body.error` string
  from the UI (now console-only), matching `useAdminStatus`. If an admin needs
  the specific server reason, it is in devtools, not on screen. This is the
  documented SP3-D pattern, applied consistently.
- `course-sync-table` / `achievement-sync-table` remain fully-hardcoded English
  including their error paths; that is left to SP3-C by design (noted above), not
  an oversight.
