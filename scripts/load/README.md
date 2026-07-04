# Read-path load test (k6)

Readiness item **G8**. A [k6](https://k6.io) script that exercises Superteam
Academy's **public, read-only** paths under a ramping load, so you can gauge
latency and error rates before a launch push.

> [!CAUTION]
> **NEVER run this against production.** The script defaults to
> `http://localhost:3000` and refuses to target the known prod hosts
> (`solarium.courses`, `superteam-academy-web.vercel.app`). Point it at
> **localhost** or a dedicated **staging** deploy only. Load-testing prod can
> trip rate limits, skew analytics, exhaust Supabase/Helius quotas, and page
> on-call.

## What it hits (all GET, no auth, no writes)

| Tag               | Path                          | Notes                                   |
| ----------------- | ----------------------------- | --------------------------------------- |
| `landing`         | `/{locale}`                   | Marketing landing page                  |
| `courses_list`    | `/{locale}/courses`           | Course catalog                          |
| `course_detail`   | `/{locale}/courses/{slug}`    | One course (slug auto-discovered)       |
| `leaderboard_api` | `/api/leaderboard?timeframe=weekly` | XP rankings API (public GET)      |
| `community`       | `/{locale}/community`         | Forum home                              |
| `sitemap`         | `/sitemap.xml`                | Dynamic sitemap                         |

The course slug is discovered at runtime from `/sitemap.xml` in the k6 `setup()`
stage, so the test always hits a real course. If discovery fails and no
`COURSE_SLUG` is set, the course-detail request is skipped rather than 404ing.

The script makes **only** `GET` requests. It never authenticates, posts, mints
XP, touches the chain, or mutates data. Do not add non-GET requests to it.

## Install k6

k6 is a standalone Go binary — no Node dependency.

```bash
# macOS
brew install k6

# Debian / Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows
winget install k6 --source winget

# Docker (no install)
docker run --rm -i grafana/k6 run - < scripts/load/load-test.js
```

Other options: <https://grafana.com/docs/k6/latest/set-up/install-k6/>.

## Run it

### Against a local dev server (default target)

```bash
cd apps/web && pnpm dev          # in one terminal — starts http://localhost:3000
k6 run scripts/load/load-test.js # in another — no BASE_URL needed
```

### Against a staging deploy

`BASE_URL` is **required** to target anything other than localhost. No trailing
slash.

```bash
BASE_URL=https://academy-staging.example.com k6 run scripts/load/load-test.js
```

### Optional overrides

| Env var       | Default                 | Purpose                                             |
| ------------- | ----------------------- | --------------------------------------------------- |
| `BASE_URL`    | `http://localhost:3000` | Target origin. Required for non-localhost.          |
| `LOCALE`      | `en`                    | Locale prefix (`en`, `pt-BR`, `es`).                |
| `COURSE_SLUG` | _(auto from sitemap)_   | Force a specific course slug.                       |
| `ALLOW_PROD`  | _(unset)_               | Escape hatch for the prod-host guard. Avoid.        |

## Load profile & thresholds

**Profile** (`options.stages`): ramp 0 → 50 VUs over 30s, hold at 50 VUs for
1m, ramp down to 0 over 30s. Adjust `stages` to model your expected traffic.

**Thresholds** (`options.thresholds`) — the run **fails** (non-zero exit) if any
are breached, so it's CI-friendly:

| Threshold                                  | Meaning                                            |
| ------------------------------------------ | -------------------------------------------------- |
| `http_req_duration: p(95)<800`             | 95% of all requests finish in under 800ms.         |
| `http_req_failed: rate<0.02`               | Fewer than 2% of requests fail.                    |
| `http_req_duration{name:landing}<800`      | Per-endpoint p95 budgets (each tag has its own).   |
| `…{name:courses_list}<1000`                | Catalog page.                                      |
| `…{name:course_detail}<1200`               | Course page (heavier — CMS content).               |
| `…{name:leaderboard_api}<600`              | Leaderboard API.                                   |
| `…{name:community}<1000`                   | Forum home.                                        |
| `…{name:sitemap}<800`                      | Sitemap.                                           |

Each request is `tags`-named, so the end-of-run summary breaks latency down per
endpoint. Tune the numbers to your infra; these are sane starting budgets for a
Vercel + Supabase read path, not hard SLAs.

## Interpreting results

- `http_req_duration` — response time. Watch `p(95)` / `p(99)`, not `avg`.
- `http_req_failed` — error rate. Should stay well under the 2% budget.
- `checks` — per-request status assertions (2xx/3xx). Any failures point at a
  broken route or an overloaded backend.
- A red `✗` next to a threshold in the summary = that budget was breached.

## Related

- Standing up the staging target this runs against: [`docs/STAGING.md`](../../docs/STAGING.md)
- Env vars for a staging deploy: [`.env.staging.example`](../../.env.staging.example)
