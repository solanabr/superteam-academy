# E2E — critical learner paths (#781)

Playwright end-to-end coverage for the three learner paths the gate's manual
runtime smokes used to cover by hand (and which died with the gate's session).
Runs against a **production build** (`next build && next start`), not `next dev`.

## Run locally

```bash
pnpm --filter web e2e            # headless, builds + starts everything
pnpm --filter web e2e:ui         # Playwright UI mode
pnpm --filter web e2e:report     # open the last HTML report
```

`playwright.config.ts`'s `webServer` runs `e2e/harness/serve.mjs`, which owns the
whole harness so ordering is deterministic:

1. generate a fresh self-signed cert for `127.0.0.1` (openssl — nothing committed);
2. start the **mock Supabase** server (`e2e/harness/mock-supabase.mjs`) over HTTPS
   and wait for `/health`;
3. `next build` with the E2E env (skipped when `E2E_NO_BUILD=1`);
4. `next start` on `:3100` with `NODE_EXTRA_CA_CERTS` pointing at the cert.

`E2E_APP_PORT` and `E2E_MOCK_PORT` override the two ports, for running next to
another worktree's harness. Set them for the whole command, build included.

Prereqs: `pnpm --filter web exec playwright install chromium` once, and `openssl`
on `PATH` (present on macOS and GitHub `ubuntu-latest`).

## Why a mock Supabase (and why HTTPS)

The catalog's active-course set is resolved **server-side**
(`lib/content/deployments.ts` reads the `public_onchain_deployments` view), so it
cannot be mocked from the browser. A real endpoint returning a fixed fixture is
the only way to make the catalog deterministic under `next start`. The same
server answers the browser-side profile/enrollment/progress reads for the learn
loop.

`env.ts` requires `NEXT_PUBLIC_SUPABASE_URL` to be `https://` in production (and
`next start` is production), so the mock speaks TLS with the per-run self-signed
cert. The app's Node process trusts it via `NODE_EXTRA_CA_CERTS`; the browser via
`ignoreHTTPSErrors`.

Everything is fake by construction — no real keys, no real JWT, no real wallet,
no network, no on-chain tx. The learner "session" is a locally-minted cookie
(`harness/session.ts`) the specs attach; the mock signs and verifies nothing.

## The three specs

| Spec         | File                      | Auth           | What it locks in                                                                                                        |
| ------------ | ------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Catalog gate | `catalog.spec.ts`         | none           | Anonymous `/en/courses` renders **only** active courses; a deactivated course is absent (#711 regression, permanent).   |
| Learn loop   | `learn-loop.spec.ts`      | mocked session | Signed-in, enrolled learner works a quiz-only lesson and reaches the completed state.                                   |
| Unsubscribe  | `unsubscribe.spec.ts`     | none           | **Skipped until #769** (email feature). GET bad token → failure page; POST always-200.                                  |
| Editor size  | `mobile-editor.spec.ts`   | none           | The mounted Monaco stays usable from 375px to 1440px; typing and the go-to-editor link work at 375px.                   |
| Page layout  | `layout-overflow.spec.ts` | both           | No sideways page scroll on phones, header and quiz controls stay tappable, code lessons don't scroll into a blank page. |

## Mock-boundary map

| Seam                                      | Who owns it | How it's mocked                                                                                                                        |
| ----------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog active set (SSR)                  | mock server | `GET /rest/v1/public_onchain_deployments` → fixed `DEPLOYMENTS` fixture                                                                |
| Browser session                           | test        | locally-minted `sb-127-auth-token` cookie (no network)                                                                                 |
| Profile / enrollment / progress (browser) | mock server | `GET /rest/v1/{profiles,enrollments,user_progress}` fixtures                                                                           |
| `getUser` (middleware, SSR)               | mock server | `POST /auth/v1/user`                                                                                                                   |
| Monaco CDN (browser)                      | test        | `page.route` serves jsdelivr's `monaco-editor/min` from `node_modules` (mobile-editor spec only)                                       |
| On-chain completion (`completeLesson`)    | test        | `page.route` fulfils `POST /api/lessons/complete` — the E2E owns the browser↔route seam; the chain seam is the unit suites' job (#751) |

## Determinism

- No `waitForTimeout`; only Playwright auto-waiting + explicit assertions.
- The catalog spec asserts active courses are present **before** asserting the
  deactivated one is absent, so the absence check can't pass on an empty page.
- Fixtures (`harness/fixtures.mjs`) are the single source of truth shared by the
  mock server and the specs.
- No spec names a course or lesson. `pickTargets` picks them from the committed
  bundle (the active and deactivated courses, a code lesson, a quiz-only lesson
  and its answer key), so a content release never needs a spec edit.
