# RECTOR Academy — Phase 1: Stabilize & Baseline (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the existing `superteam-academy` app to a clean, building, test-passing baseline from the current HEAD, and stand up a fresh **private** Vercel preview — the de-risked foundation for the de-brand + redesign phases.

**Architecture:** Discard the uncommitted formatting churn, reinstall dependencies, verify the production build and the test suites, then create a fresh `rector-academy` Vercel project and deploy a private preview from `app/`. No app behavior changes in this phase.

**Tech Stack:** Next.js 15 (App Router), pnpm 10, Tailwind v4, shadcn/ui, Vitest (unit), Playwright (e2e), Vercel. Node 24, repo root `/Users/rector/local-dev/superteam-academy`, deploy root `app/`.

---

## Roadmap (this plan = Phase 1 of 5)

Each phase is its own plan, produced when reached; each ships working software.

1. **Stabilize & Baseline** ← this plan. Clean build, green tests, private preview.
2. **De-brand → RECTOR Academy.** Rename strings (en/pt/es i18n catalogs, metadata, package, README), remove Superteam logo/marks, new wordmark + OG/favicon. Verify zero "Superteam" strings remain; e2e still green.
3. **Design-system foundation.** Remap shadcn/ui CSS variables to the rectorspace.com palette + JetBrains Mono; light theme = cream; reskin the shared shell (nav, footer, sidebar). App-wide token reskin (Tier-2 done).
4. **Bespoke page redesigns (Tier-1, ~12 screens).** One plan-per-batch, executed with the `frontend-design` skill + visual verification per page (landing, courses, course detail, lesson, challenge, challenges/library, dashboard, leaderboard, profile, credentials, certificates).
5. **Demo polish + public launch.** Seed data on every Tier-1 page, devnet wallet, hide OAuth/CMS/minting, attach `academy.rectorspace.com`, public deploy.

---

## Task 1: Establish a clean baseline working tree

**Files:**
- Working tree: `/Users/rector/local-dev/superteam-academy`

- [ ] **Step 1: Confirm the dirty state before touching it**

Run:
```bash
cd /Users/rector/local-dev/superteam-academy
git status --short | wc -l
git log -1 --oneline
```
Expected: ~313 lines of changes; HEAD = `6c34f55 docs: add RECTOR Academy design spec ...`.

- [ ] **Step 2: Stash the formatting churn (recoverable safety net)**

The 304 modified files are a verified single→double-quote reformat (not logic). Stash rather than hard-discard so it is recoverable.

Run:
```bash
git stash push --include-untracked -m "phase1: pre-stabilize formatting churn + untracked"
```
Expected: `Saved working directory and index state ...`.

- [ ] **Step 3: Verify a clean tree at HEAD**

Run:
```bash
git status --porcelain | wc -l
```
Expected: `0` (clean). If non-zero, inspect with `git status` and stash/remove remaining cruft before continuing.

- [ ] **Step 4: Commit nothing (checkpoint only)**

No commit — this task only cleans the working tree. Proceed to Task 2.

---

## Task 2: Reinstall dependencies and verify the production build

**Files:**
- `app/package.json`, `app/pnpm-lock.yaml`

- [ ] **Step 1: Clean-install dependencies (lockfile-faithful)**

Run:
```bash
cd /Users/rector/local-dev/superteam-academy/app
pnpm install --frozen-lockfile
```
Expected: completes with `Done`. If it errors on the lockfile, rerun without `--frozen-lockfile` and note the drift in the commit message.

- [ ] **Step 2: Run the production build**

Run:
```bash
pnpm build
```
Expected: `✓ Compiled successfully` / a completed Next.js build with a route table. If it fails, read the first error, fix that single issue (record each fix in the Task 5 commit), and rerun until green. Do not proceed with a red build.

- [ ] **Step 3: Capture the build result**

Run:
```bash
pnpm build 2>&1 | tail -30
```
Expected: the route/page summary table prints with no errors.

---

## Task 3: Run the test suites and record the baseline

**Files:**
- `app/` (Vitest config + `e2e/` Playwright suite)

- [ ] **Step 1: Run unit tests (Vitest)**

Run:
```bash
cd /Users/rector/local-dev/superteam-academy/app
pnpm test run 2>&1 | tail -25
```
Expected: a pass/fail summary. Record the numbers (e.g. "N passed"). If the script name differs, discover it with `pnpm run` and use the Vitest run script.

- [ ] **Step 2: Install Playwright browsers (first run only)**

Run:
```bash
pnpm exec playwright install --with-deps chromium
```
Expected: chromium downloaded / already present.

- [ ] **Step 3: Run e2e tests against a local build**

Run:
```bash
pnpm exec playwright test 2>&1 | tail -25
```
Expected: a Playwright summary. Record pass/fail counts as the baseline. e2e failures here are **recorded, not necessarily fixed** in Phase 1 (the redesign phases will rewrite many selectors) — note which specs fail so later phases know.

---

## Task 4: Local smoke test of key routes

**Files:**
- none (runtime check)

- [ ] **Step 1: Start the dev server**

Run (background):
```bash
cd /Users/rector/local-dev/superteam-academy/app
pnpm dev
```
Expected: `Ready` on `http://localhost:3000` (note the exact port if 3000 is taken).

- [ ] **Step 2: Smoke-test the Tier-1 routes return 200**

Run:
```bash
for p in "/en" "/en/courses" "/en/dashboard" "/en/leaderboard" "/en/challenges"; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$p)  $p"
done
```
Expected: `200` for each (a locale-prefixed redirect `307`/`308` to the same path is also acceptable). Note any non-2xx/3xx route for follow-up.

- [ ] **Step 3: Stop the dev server**

Stop the backgrounded `pnpm dev` process.

---

## Task 5: Commit the stabilized baseline

**Files:**
- Any config/source files changed to make the build green in Task 2

- [ ] **Step 1: Review what changed**

Run:
```bash
cd /Users/rector/local-dev/superteam-academy
git status
git diff --stat
```
Expected: only the files you edited to fix the build (often none). The formatting churn stays stashed.

- [ ] **Step 2: Commit (only if build fixes were needed)**

Run:
```bash
git add <only-the-files-you-fixed>
git commit -m "chore: stabilize build baseline for RECTOR Academy revival"
```
If no fixes were needed, skip the commit and note "baseline clean at HEAD, no fixes required".

---

## Task 6: Fresh Vercel project + private preview deploy

**Files:**
- `.vercel/project.json` (currently linked to the old `superteam-academy` project)

> Requires the `vercel` CLI logged in to RECTOR's account (`vercel whoami`). This step is outward-facing — confirm with RECTOR before creating the project.

- [ ] **Step 1: Unlink the old Vercel project**

Run:
```bash
cd /Users/rector/local-dev/superteam-academy
rm -rf .vercel
```
Expected: the stale link to `prj_80Ef…` is removed.

- [ ] **Step 2: Link/create a fresh `rector-academy` project with root `app/`**

Run:
```bash
vercel link --project rector-academy
```
Answer the prompts: link to a new project named `rector-academy`. Then set the **Root Directory to `app`** — either when the CLI offers to modify settings, or afterward in the Vercel dashboard (Project → Settings → Build & Deployment → Root Directory). Expected: `.vercel/project.json` written for the new project.

- [ ] **Step 3: Deploy a private preview**

Run (builds on Vercel, returns a preview URL):
```bash
vercel deploy 2>&1 | tail -15
```
Expected: a preview URL (`https://rector-academy-<hash>-….vercel.app`). It will still show Superteam branding — that is fine; this only proves the build+deploy pipeline works.

- [ ] **Step 4: Verify the preview loads**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" "<preview-url>/en"
```
Expected: `200`/`30x`. If `401`, the project has deployment protection on (expected for a private preview) — confirm in the Vercel dashboard that the deployment exists and the build succeeded.

- [ ] **Step 5: Commit the new Vercel link**

Run:
```bash
git add .vercel/project.json 2>/dev/null; git status --short
```
Note: `.vercel` is typically git-ignored — if so, nothing to commit; record the new `projectId` in the phase notes instead.

---

## Done criteria

- Working tree clean at HEAD; formatting churn stashed (recoverable).
- `pnpm build` is green.
- Unit + e2e baselines recorded (e2e failures catalogued, not blocking).
- Tier-1 routes return 2xx/3xx locally.
- A fresh `rector-academy` Vercel project exists with a successful private preview deploy.
