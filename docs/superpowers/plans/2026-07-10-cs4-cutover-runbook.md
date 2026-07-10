# CS-4 Devnet Program-v2 Deploy + Course Reset — Coordinated Cutover Runbook

> **For the human/Fable executing this:** this is an **ordered operations runbook**, not an
> implementation plan. Execute the steps **in order**. Every step is `preconditions → exact
> command(s) → expected output → STOP-if`. A **STOP-if** that fires halts the lane: do not
> improvise past it. Steps use checkbox (`- [ ]`) syntax for tracking. This document is written
> to be run; the author did **not** run any of it.

**Goal:** Deploy on-chain program **v2** (the `active_lessons` mask, `Course::SIZE` 224 → 255) to
devnet and reset the 7 live `Course` PDAs to the v2 layout, landing the on-chain reset and the
frontend v2 deploy **in the same window** so the platform is never live against a Course layout its
reader cannot decode — closing issue **#356 (CS-4)**.

**Architecture:** One coordinated cutover across three surfaces that are inseparable. (1) The
program at `7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V` is upgraded in place to v2; the moment it
lands, the 7 existing 224-byte `Course` accounts can no longer be loaded by any instruction that
resolves `Account<Course>`. (2) Those accounts are `close_course`-d and recreated at 255 bytes via
the admin Sync path. (3) The devnet-live v1 frontend reads Course accounts with a raw `BorshCoder`
pinned to the **v1** IDL (`academy-reads.ts`), so it misreads 255-byte v2 accounts — the frontend
v2 (PR #384 + PR #389) and a **regenerated v2 IDL** must go live in the same window. Prod
(`superteam-academy-web.vercel.app`) **auto-deploys from `main`** — merging the frontend PRs *is*
the prod deploy.

**Tech Stack:** Anchor 0.31.1, `solana`/`anchor` CLI, Helius devnet RPC (mandatory — see Global
Constraints), `@coral-xyz/anchor` `BorshCoder` + `@solana/web3.js` for PDA reads, `curl` + `jq`
JSON-RPC, the CS-9 content-sync route (`POST /api/admin/content/sync`) and admin course Sync
(`POST /api/admin/courses/sync`), David's Supabase (`obqlljsagzslxarwphxv`) for the SENSITIVE
id-rewrite migrations.

---

## Global Constraints

Every step's requirements implicitly include this section. Values are copied verbatim from source.

- **This is ONE coordinated cutover, not independent steps.** Deploying program v2 *forces* the
  reset (v2 cannot deserialize the existing 224-byte `Course` accounts), and the reset to 255-byte
  v2 accounts *breaks* the currently-deployed v1 frontend (`academy-reads.ts` `BorshCoder` decodes
  at v1 offsets). The on-chain reset (Phase B steps 1,5,6) and the frontend v2 deploy (Phase B step
  3 — merge #384 + #389) **MUST land in the same window**. There is a hard **broken-window** from
  the moment v2 deploys (B1) until v2 accounts exist (B6) *and* the v2 frontend has propagated to
  prod (B3): course reads/writes are down platform-wide. See "Broken-window hazard" below.
- **Deploy is Helius-RPC ONLY.** The public `api.devnet.solana.com` **silently corrupts large
  deploys** (confirmed). Every `solana`/`anchor` deploy and every PDA read in this runbook is pinned
  to the Helius devnet RPC. **Never** let a deploy touch `api.devnet.solana.com`.
- **The current frontend IDL lacks `active_lessons`** (verified: `Course` fields in
  `apps/web/src/lib/solana/idl/superteam_academy.json` are still v1 `…,lesson_count,…`). The IDL
  **must be regenerated** from the v2 program source and committed so `academy-reads.ts` /
  `academy-program.ts` decode v2 accounts (B2).
- **Program id:** `7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V` (devnet, `Anchor.toml`
  `[programs.devnet]`, `declare_id!` in `lib.rs`).
- **`Course::SIZE`:** v1 = **224 bytes**, v2 = **255 bytes** (−1 for the deleted `lesson_count: u8`,
  +32 for `active_lessons: [u64; 4]`; `_reserved: [u8; 8]` preserved — `state/course.rs`).
- **PDA seeds** (never strip/transform an id before seeding — project rule):
  - Config: `["config"]` → `HmQsZaBKvADBvnUuyxG8G3hdDKYSyZsQbpmeMcPWoPn`
  - Course: `["course", course_id_utf8]`
  - Enrollment: `["enrollment", course_id_utf8, learner_pubkey]` (**untouched** by `close_course`)
- **Keypairs** (in `wallets/`, gitignored; paths are relative to `onchain-academy/` as `../wallets/…`):
  - `wallets/program-keypair.json` — program-id keypair (address `7NeJaSRy…SgwE8V`).
  - `wallets/signer.json` — authority / payer. Also the assumed **upgrade authority** and the
    `Config.authority` that `close_course`/`create_course` require via `has_one = authority`.
    **CONFIRM before B1** that this is the live upgrade authority (single-hot-key custody, #305;
    it may instead be the keypair behind `PROGRAM_AUTHORITY_SECRET`). See "Open items".
- **Content authoring is frozen** for the whole window: `/teach` authoring disabled, no Studio
  writes (spec §15.4 Phase 0). Nothing of value is at risk — all enrollments/completions are devnet
  test data (§15.1). The count grows as testing continues; the cutover asserts the **Enrollment PDA
  SET is preserved** (snapshot before == after), not a fixed count.
- **Rollback is cheap up to mainnet** (§15.7): Sanity is rebuildable from git, the devnet program
  keeps its upgrade authority until the Squads handoff (#305), Course accounts can be closed and
  recreated again. The only irreversible step (mainnet deploy) is out of scope here.

### The 7 live Course PDAs (derived offline from the program id + seeds)

| Sanity `_id` (= on-chain `course_id` seed) | lessons | enrolled | completed | xp/lesson | Course PDA | expected v2 `active_lessons` |
|---|---|---|---|---|---|---|
| `aD45H1NEbb1bqELwloGCqI` (solana-101, **current** seed) | 3 | 1 | 1 | **100** | `HXQ9oBbK5VtfN7F9PLM2xddrLjtAV2WgTTeCd9mvRVXL` | `[7,0,0,0]` |
| `course-anchor-framework` | 12 | 2 | 0 | 20 | `3PrmfVEAJhR5XRDH4zUyjxLofoymUZ5751cPmLNQQB3v` | `[4095,0,0,0]` |
| `course-building-first-program` | 16 | 2 | 0 | 20 | `FeeLjiHdok9DAdy9huWYUdJVHmDECsqxoo7RCSVc9kyF` | `[65535,0,0,0]` |
| `course-defi-on-solana` | 12 | 2 | 1 | 40 | `33qMLNnEBaBq2f6Ssgq5Uj7CBAD2aafkAUsr76CcwvCU` | `[4095,0,0,0]` |
| `course-rust-for-solana` | 12 | 2 | 2 | 20 | `2DKQYgryi2qGa1ApXLZcUHv81JtqCq3WkyhiEf9Qp5MQ` | `[4095,0,0,0]` |
| `course-solana-frontend` | 12 | 2 | 1 | 20 | `7t64peSmcbjRGbbUZAnsXC6a1raxEx76qXhpFjFwDv6u` | `[4095,0,0,0]` |
| `course-solana-fundamentals` | 12 | 2 | 1 | 10 | `8WmT5r1hrd2To28YD99XAaXddufp1m4PJnwRoRSQTP1w` | `[4095,0,0,0]` |
| **total** | | **37** | **152** | | | |

> **`enrolled`/`completed` counts are a point-in-time snapshot, informational only** (as of the
> 2026-07-10 live re-verification: **37 enrollments / 152 completions** — test data keeps growing).
> The cutover's invariant is **set-preservation** of the Enrollment PDAs (A6 snapshot == C2 snapshot),
> **not** any fixed number. Do not gate on these totals; gate on the before/after PDA-set diff.

`active_lessons` expectations are `dense_mask(lesson_count)` (bits `0..lesson_count` set): 3 → `2³−1
= 7`; 12 → `2¹²−1 = 4095`; 16 → `2¹⁶−1 = 65535`. All 7 migrated courses are **dense** (every live
lesson still live), so `create_course`'s `dense_mask(lesson_count)` is already the exact target mask
— no `update_course(new_active_lessons)` reshaping is needed for CS-4.

**The two draft courses are NOT closed:** `ops2aYkxIM6NMo1gE18U1o` / `xcvxcv-z1pie4` — draft, never
synced, no on-chain PDA. Test junk. Deleted in Sanity only (spec §15.5); no on-chain action.

**solana-101 rename decision (§15.5, policy — confirm before B6/B7):** since every Course account is
closed and recreated anyway, this is the free moment to reseed `aD45H1NEbb1bqELwloGCqI` →
`course-solana-101` (new PDA `FxyePgoU1huRoX9i89iXzNz9dNacjYcvWiCnwvAEWyM5`). The Sanity `_id` is
stored as `course_id TEXT` (no FK) in **five Postgres tables** — `enrollments`, `user_progress`,
`certificates`, `deployed_programs`, `threads` — plus one orphaned devnet Enrollment PDA. If the
rename proceeds, B7 rewrites `course_id` across all five (or explicitly accepts losing those devnet
rows). If the rename is deferred, recreate at the **old** seed and skip B7's course_id rewrites.
`xpPerLesson: 100` (schema max, 10× the flagship) is a separate policy call (§17), not a technical
blocker for the reset.

### Broken-window hazard (read before opening the window)

```
timeline within Phase B          Course reads       Course writes      note
────────────────────────────     ────────────       ─────────────      ────
before B1 (v1 live)              OK (v1↔v1)         OK                 steady state
B1 v2 deployed, accts still v1   OK (v1 FE↔v1 acct) BROKEN             v2 program can't load 224B acct
B5 close_course ×7               null (no acct)     n/a                course pages empty
B6 create_course ×7 (255B)       BROKEN if v1 FE    OK (v2)            v1 BorshCoder misreads 255B
B3 #384+#389 merged→prod v2 FE   OK (v2 FE↔v2 acct) OK                 window closes
```

The window is **hard-down for all Course-touching reads/writes from B1 until B6 completes AND the
B3 prod deploy has propagated.** Non-Course reads (XP balance, leaderboard, community, enrollment
lists that don't decode `Course`) are unaffected. Mitigation: (a) content freeze is already on;
(b) post a maintenance banner before B1; (c) execute B1→B6 back-to-back to minimise wall-clock; (d)
kick the #384+#389 merge (B3) early in the window so Vercel's build is finishing as B6 lands.
Confirm the prod deploy is **live** (see B3 STOP-if) before declaring the window closed.

---

## Phase A — Pre-cutover prep (reversible, read-only; do NOT deploy or close anything here)

Nothing in Phase A mutates the chain or Sanity. Its job is to prove every precondition and capture
the enrollment baseline the DONE gate compares against.

- [ ] **A1: CS-8 extraction complete and `academy-courses` pushed**

  **Preconditions:** CS-8 lane (PR #388 plan) has produced the `academy-courses` tree with each
  course's `slots.lock.json` frozen from **today's live lesson order** (§15.3), and a **human has
  pushed** it to `solanabr/academy-courses` (the lane commits locally; the push is
  `blocked:needs-human`).
  **Command(s):**
  ```bash
  gh api repos/solanabr/academy-courses/commits/main --jq '.sha'   # HEAD sha of the content repo
  ```
  **Expected:** a commit SHA prints; the tree contains 7 course dirs + `slots.lock.json` per course.
  **STOP-if:** the tree is not pushed, or any `slots.lock.json` is missing/hand-edited. The chain
  sync (B4/B6) reads these lockfiles as the only carrier of the "slots are never reused" invariant.

- [ ] **A2: The bit-verify PASSES for every completion (§15.3) — the load-bearing gate**

  **Preconditions:** A1 done. The bit-verify cross-checks, for **every** on-chain completion (152 as of 2026-07-10, and growing — enumerate live,
  do not hardcode) across all enrollments, that the slot the frozen `slots.lock.json` assigns equals the bit
  actually set in that learner's on-chain `Enrollment.lesson_flags` **at completion time** (bits
  were set by array position in the flattened `modules[].lessons[]`, and enrollments survive the
  reset — §15.3). This is CS-8's built-in gate (its "bit-verification gate").
  **Command(s):** (run CS-8's verifier, e.g.)
  ```bash
  pnpm tsx scripts/cs8-extraction/verify-bits.ts   # exact path per PR #388; asserts EVERY completion matches (count enumerated live)
  ```
  **Expected:** `N/N completions: generated slot == on-chain set bit` (N = live completion count) (or equivalent all-pass).
  **STOP-if:** **ANY bit mismatches → STOP the entire cutover and file a P0.** Do NOT proceed to a
  destructive reset with an unverified bit mapping: a wrong lockfile makes all 13 surviving
  enrollments point at the wrong lessons *forever* (`close_enrollment` needs `learner: Signer`,
  which we do not hold — §15.3). Reconcile any moved lesson in the lockfile and re-run until N/N.

- [ ] **A3: #384 + #389 are green and approved**

  **Preconditions:** PR **#389** (CS-9 content-sync route + `apps/web/src/lib/content-sync/`) and PR
  **#384** (frontend v2 — `academy-reads.ts`/`academy-program.ts` v2 layout + block-model app) both
  pass CI and both pass the Claude review gate (green check ≠ review posted — confirm the review
  comment exists per launch memory).
  **Command(s):**
  ```bash
  gh pr checks 384 && gh pr view 384 --json reviewDecision,mergeStateStatus
  gh pr checks 389 && gh pr view 389 --json reviewDecision,mergeStateStatus
  ```
  **Expected:** both `checks` all green; both `reviewDecision: "APPROVED"`; both mergeable.
  **STOP-if:** either PR is red, unreviewed, or has conflicts against `main`. Do not open the window
  with a frontend that can't land — a v2 chain with a v1 frontend is the broken-window with no exit.

- [ ] **A4: v2 program builds clean locally (dry, no deploy)**

  **Preconditions:** on the `main`-tip commit that carries program v2 (#378 merged). Toolchain
  pinned (`anchor_version = "0.31.1"`, `package_manager = "pnpm"`).
  **Command(s):** (from repo root)
  ```bash
  cd onchain-academy
  anchor build                         # emits target/deploy/onchain_academy.so + target/idl/onchain_academy.json
  cargo test --manifest-path tests/rust/Cargo.toml   # 128 Rust unit tests
  grep -c '"active_lessons"' target/idl/onchain_academy.json   # >0 → v2 IDL has the mask
  ```
  **Expected:** build succeeds; Rust tests pass; the `grep` prints a non-zero count (the freshly
  built IDL contains `active_lessons`).
  **STOP-if:** build fails, tests fail, or the built IDL still shows `lesson_count` and no
  `active_lessons` (you are on a pre-v2 commit — do not deploy it).

- [ ] **A5: Announce the window / enable maintenance banner**

  **Preconditions:** A1–A4 pass. Stakeholders notified of the hard-down window (Broken-window
  hazard). **Command(s):** operational (banner toggle / status post) — no chain action.
  **STOP-if:** you cannot put the platform into a maintenance state; the broken-window will surface
  raw decode errors to live users otherwise.

- [ ] **A6: Snapshot the full Enrollment PDA set (baseline for the Phase C DONE gate)**

  **This is the immediately-preceding action before the window opens.** `close_course` must not
  touch enrollments; this snapshot is what proves it. Capture the **exact set of Enrollment PDA
  pubkeys** (whatever the count) — the invariant the cutover preserves is set-equality, not a fixed
  number (the count grows with ongoing devnet testing; ~37 as of 2026-07-10, informational only).
  **Preconditions:** Helius RPC resolved and confirmed **not** public devnet:
  ```bash
  # From apps/web/.env.local (SOLANA_RPC_URL already carries the Helius key), or construct it:
  export HELIUS_RPC="$(grep -E '^SOLANA_RPC_URL=' apps/web/.env.local | cut -d= -f2- | tr -d '"')"
  # Fallback: export HELIUS_RPC="https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY:?set HELIUS_API_KEY}"
  case "$HELIUS_RPC" in *helius-rpc.com*) echo "OK Helius RPC";; *) echo "ABORT: not a Helius RPC" && exit 1;; esac
  ```
  **Command(s):** enumerate every `Enrollment` PDA program-wide (memcmp on the 8-byte Enrollment
  discriminator `[249,210,64,145,197,241,57,51]`, base58 `inacXgeoHEa`, at offset 0), sorted, with
  raw base64 data + lamports:
  ```bash
  curl -s "$HELIUS_RPC" -X POST -H 'Content-Type: application/json' -d '{
    "jsonrpc":"2.0","id":1,"method":"getProgramAccounts",
    "params":["7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V",
      {"encoding":"base64","filters":[{"memcmp":{"offset":0,"bytes":"inacXgeoHEa"}}]}]
  }' | jq -S '[.result[] | {pubkey, data: .account.data[0], lamports: .account.lamports}] | sort_by(.pubkey)' \
     > /tmp/enrollments-before.json
  # Capture the enumerated set of Enrollment PDA pubkeys as the BEFORE snapshot (the set is the
  # invariant — the object count is informational only and grows with ongoing devnet testing):
  jq -r '.[].pubkey' /tmp/enrollments-before.json | sort > /tmp/enrollment-pubkeys-before.txt
  wc -l < /tmp/enrollment-pubkeys-before.txt   # informational: how many enrollments exist right now
  ```
  **Expected:** `/tmp/enrollments-before.json` holds one object per live Enrollment PDA, each with a
  base64 `data` blob and `lamports`; `/tmp/enrollment-pubkeys-before.txt` is the sorted pubkey set.
  Keep **both** files for Phase C. (No fixed count is asserted — C2 diffs this set, not a number.)
  **STOP-if:** the enumeration errors or returns zero accounts (RPC/filter problem — the Enrollment
  discriminator memcmp must match at least the known enrollments). A non-empty, stable set is all
  that's required; the exact size is captured, not gated.

---

## Phase B — The coordinated cutover window (destructive; execute back-to-back)

The window is open from B1. Keep it short. Re-verify after each step.

- [ ] **B1: Deploy program v2 to devnet — Helius RPC only**

  **Preconditions:** A6 done; `HELIUS_RPC` exported and confirmed Helius; `wallets/signer.json` is
  the live upgrade authority (Global Constraints — CONFIRM). Build artifact from A4 present at
  `onchain-academy/target/deploy/onchain_academy.so`.
  **Command(s):** (from `onchain-academy/`) — Anchor form, cluster pinned to Helius:
  ```bash
  anchor deploy \
    --program-name onchain_academy \
    --provider.cluster "$HELIUS_RPC" \
    --provider.wallet ../wallets/signer.json \
    --program-keypair ../wallets/program-keypair.json
  ```
  Equivalent raw form (use if `anchor deploy` reports a stuck buffer):
  ```bash
  solana program deploy \
    --url "$HELIUS_RPC" \
    --keypair ../wallets/signer.json \
    --upgrade-authority ../wallets/signer.json \
    --program-id ../wallets/program-keypair.json \
    target/deploy/onchain_academy.so
  ```
  **Byte-verify the deploy** (matches the "byte-verified live on devnet" bar):
  ```bash
  solana program show 7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V --url "$HELIUS_RPC"
  solana program dump 7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V /tmp/deployed.so --url "$HELIUS_RPC"
  # Compare on-chain bytes to the local artifact (trailing zero-padding on-chain is expected):
  shasum -a 256 target/deploy/onchain_academy.so /tmp/deployed.so
  ```
  **Expected:** `Program Id: 7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V` / `Deploy success`;
  `solana program show` reports the expected upgrade authority and a fresh "Last Deployed Slot";
  the local `.so` bytes are a prefix of the dumped bytes.
  **STOP-if:** the deploy used any non-Helius RPC; `Deploy success` not reached; the on-chain bytes
  don't match the local artifact; or the upgrade authority is not the key you signed with. A
  corrupted large deploy over public devnet RPC is the known failure mode — redeploy over Helius.

- [ ] **B2: Regenerate + commit the v2 frontend IDL**

  **Preconditions:** B1 done. The IDL must derive from the **same source commit** that produced the
  deployed `.so` (Anchor emits both from one `anchor build`; deployment does not alter the IDL, so
  they are guaranteed to match when built from the deploy commit).
  **Command(s):**
  ```bash
  # target/idl/onchain_academy.json was produced by the A4/B1 build (metadata.name = onchain_academy,
  # address = 7NeJaSRy…SgwE8V). The frontend file is that same IDL, renamed:
  cp onchain-academy/target/idl/onchain_academy.json \
     apps/web/src/lib/solana/idl/superteam_academy.json
  grep -c '"active_lessons"' apps/web/src/lib/solana/idl/superteam_academy.json   # >0
  grep -c '"lesson_count"'   apps/web/src/lib/solana/idl/superteam_academy.json   # 0
  ```
  Land it on `main` — either fold this commit into the #384 merge (preferred, so the v2 frontend and
  its v2 IDL are one deploy) or push it as a tiny follow-up PR merged immediately before B3.
  **Expected:** the frontend IDL's `Course` type now lists `…,content_tx_id,version,active_lessons,…`
  (no `lesson_count`); `active_lessons` grep > 0, `lesson_count` grep == 0.
  **STOP-if:** the copied IDL still contains `lesson_count`, or its `address` ≠
  `7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V`. `academy-reads.ts` would then decode v2 accounts
  at v1 offsets — the exact break this step prevents.

- [ ] **B3: Merge #384 + #389 → frontend v2 auto-deploys to prod**

  **Preconditions:** B2's IDL is on the merge set (or already merged). Both PRs still green (A3).
  **Command(s):**
  ```bash
  gh pr merge 384 --squash --delete-branch
  gh pr merge 389 --squash --delete-branch
  # Prod (superteam-academy-web.vercel.app, stbr-true) AUTO-deploys from main — NO manual vercel --prod.
  # Watch the deploy reach READY:
  gh run watch --repo <org>/<repo> || true      # or the Vercel dashboard for the main-branch deploy
  ```
  **Expected:** both PRs merged to `main`; Vercel starts a `main` production build; it reaches
  `Ready`. The live site is now the v2 frontend (v2 IDL, block-model reads).
  **STOP-if:** either merge fails, or the Vercel prod deploy fails / does not reach `Ready`. The
  window cannot close on a v1 frontend against v2 accounts — roll forward (fix + re-merge) rather
  than leaving prod stuck mid-window.

- [ ] **B4: Run the CS-9 content sync (reshape live Sanity → `blocks[]`, refuse-on-red)**

  **Preconditions:** B3 merged; `academy-courses` HEAD (A1) is green in the content repo's CI (the
  sync route **refuses to sync a commit whose CI is red** — spec §11.1 `blocked`). Admin session
  cookie valid.
  **Command(s):**
  ```bash
  curl -s -X POST https://superteam-academy-web.vercel.app/api/admin/content/sync \
    -H 'Content-Type: application/json' \
    -H "Cookie: admin_session=<HMAC-signed session>" \
    -d '{"sha":"<academy-courses HEAD sha from A1>"}' | jq .
  ```
  **Expected:** `200` with the synced counts; Sanity `contentSync` singleton now caches the HEAD
  SHA; every lesson doc now carries `blocks[]`. Drift panel shows `up_to_date`.
  **STOP-if:** the route returns `blocked` (content-repo CI is red) or any non-2xx. Refuse-on-red is
  by design — fix the content-repo CI and re-run; do NOT bypass the gate to push invalid content
  past Zod. Also STOP if the two quest GROQ couplings would silently degrade — confirm post-sync
  that `challengeLessonIds` and `moduleLessonMap` are non-empty for all 5 quests (§15.4a) before
  trusting the sync (this is a Phase-6 concern but verify it did not regress here).

- [ ] **B5: `close_course` × 7 (drain + free the 7 stale 224-byte PDAs)**

  **Preconditions:** B1 done (v2 program live). `close_course` is authority-gated
  (`config.has_one = authority`) and takes the course as an `UncheckedAccount`, so it closes the
  stale, size-mismatched accounts (its documented migration purpose). **There is no CLI and no admin
  UI for `close_course`** — run a one-shot script. Enrollments are separate PDAs and are untouched.
  **Command(s):** run a script `scripts/cs4-close-courses.ts` with this exact shape (call signature
  verified against `onchain-academy/tests/onchain-academy.ts`):
  ```ts
  // scripts/cs4-close-courses.ts — one-shot, Helius RPC, authority = wallets/signer.json
  // For each id below: program.methods.closeCourse(id).accountsPartial({ config, course, authority }).rpc()
  //   config  = ["config"]                     → HmQsZaBKvADBvnUuyxG8G3hdDKYSyZsQbpmeMcPWoPn
  //   course  = ["course", id]                 → the PDA from the Global-Constraints table
  //   authority = signer.publicKey (wallets/signer.json)
  const IDS = [
    "aD45H1NEbb1bqELwloGCqI",           // solana-101 (current seed)
    "course-anchor-framework",
    "course-building-first-program",
    "course-defi-on-solana",
    "course-rust-for-solana",
    "course-solana-frontend",
    "course-solana-fundamentals",
  ];
  ```
  ```bash
  pnpm tsx scripts/cs4-close-courses.ts --url "$HELIUS_RPC" --authority wallets/signer.json
  ```
  **Verify all 7 are freed** (owner back to System Program, 0 data):
  ```bash
  for PDA in HXQ9oBbK5VtfN7F9PLM2xddrLjtAV2WgTTeCd9mvRVXL 3PrmfVEAJhR5XRDH4zUyjxLofoymUZ5751cPmLNQQB3v \
             FeeLjiHdok9DAdy9huWYUdJVHmDECsqxoo7RCSVc9kyF 33qMLNnEBaBq2f6Ssgq5Uj7CBAD2aafkAUsr76CcwvCU \
             2DKQYgryi2qGa1ApXLZcUHv81JtqCq3WkyhiEf9Qp5MQ 7t64peSmcbjRGbbUZAnsXC6a1raxEx76qXhpFjFwDv6u \
             8WmT5r1hrd2To28YD99XAaXddufp1m4PJnwRoRSQTP1w; do
    echo -n "$PDA  "; solana account "$PDA" --url "$HELIUS_RPC" --output json 2>/dev/null \
      | jq -r '.account | "owner=\(.owner) lamports=\(.lamports) len=\(.data[0]|@base64d|length)"' \
      || echo "closed (account not found)"
  done
  ```
  **Expected:** each `closeCourse` emits `CourseClosed`; every PDA is now empty (owner
  `11111111111111111111111111111111`, `lamports=0`, `len=0`) or "account not found". The admin
  `diffCourse` now reports `not_deployed` for all 7.
  **STOP-if:** any `closeCourse` reverts with `Unauthorized` (wrong authority) or
  `InvalidCourseAccount` (wrong PDA / not a Course). Do not proceed to recreate a subset — resolve
  and close all 7 first.

- [ ] **B6: Admin Sync → `create_course` recreates all 7 at 255 bytes with the dense mask**

  **Preconditions:** B5 done (all 7 report `not_deployed`); B3's v2 frontend/route live. The admin
  course Sync path calls `create_course`, which sets `active_lessons = dense_mask(lesson_count)` and
  `Course::SIZE = 255`; the CS-9 route asserts, right before signing, that the mask equals the one
  derived from the course's committed `slots.lock.json` and writes the git SHA into `content_tx_id`
  (spec §11.0). Route already accepts `activeLessons`.
  **Decision gate:** apply the solana-101 rename here or not (Global Constraints). If renaming,
  create solana-101 under seed `course-solana-101` (PDA
  `FxyePgoU1huRoX9i89iXzNz9dNacjYcvWiCnwvAEWyM5`); else under `aD45H1NEbb1bqELwloGCqI` (PDA
  `HXQ9oBbK5VtfN7F9PLM2xddrLjtAV2WgTTeCd9mvRVXL`).
  **Command(s):** for each of the 7 courses, trigger admin Sync (panel "Sync" button, or):
  ```bash
  curl -s -X POST https://superteam-academy-web.vercel.app/api/admin/courses/sync \
    -H 'Content-Type: application/json' \
    -H "Cookie: admin_session=<HMAC-signed session>" \
    -d '{"courseId":"<course id>"}' | jq .
  ```
  **Expected:** each returns success with a `create_course` tx sig; `CourseCreated` emitted; the 7
  PDAs are back, each 255 bytes, `is_active=true`, `total_completions=0`, `total_enrollments=0`
  (the counter reset is the known cost, §15.2 — noise on devnet).
  **STOP-if:** any Sync errors, or a recreated account's size ≠ 255, or its `active_lessons` ≠ the
  expected mask in the table (checked in Phase C). If a course reports the stale-224-byte error, its
  B5 close did not complete — re-close then re-sync.

- [ ] **B7: solana-101 id rewrites — SENSITIVE, human-applied Supabase migrations**

  **Preconditions:** B6 done AND the rename decision was "yes". These are **human-applied** SQL
  migrations against David's Supabase (`obqlljsagzslxarwphxv`), not run by any agent. Flagged
  SENSITIVE.
  **Command(s):** (illustrative — a human reviews and applies) rewrite `course_id` across the five
  FK-less `TEXT` tables and the 3 Studio-created UUID lesson ids across `user_progress.lesson_id`
  (§15.5):
  ```sql
  -- solana-101 course_id rewrite (5 tables, no FK):
  UPDATE enrollments        SET course_id = 'course-solana-101' WHERE course_id = 'aD45H1NEbb1bqELwloGCqI';
  UPDATE user_progress      SET course_id = 'course-solana-101' WHERE course_id = 'aD45H1NEbb1bqELwloGCqI';
  UPDATE certificates       SET course_id = 'course-solana-101' WHERE course_id = 'aD45H1NEbb1bqELwloGCqI';
  UPDATE deployed_programs  SET course_id = 'course-solana-101' WHERE course_id = 'aD45H1NEbb1bqELwloGCqI';
  UPDATE threads            SET course_id = 'course-solana-101' WHERE course_id = 'aD45H1NEbb1bqELwloGCqI';
  -- 3 UUID lesson ids → proper ids (user_progress.lesson_id, FK-less TEXT):
  -- UPDATE user_progress SET lesson_id = '<new lesson id>' WHERE lesson_id = '<uuid>';   (×3)
  ```
  **Expected:** each `UPDATE` reports the expected row count (matching §15.1: 1 solana-101
  enrollment, its progress/cert/deployed_program/thread rows). The on-chain solana-101 Enrollment
  PDA under the **old** seed `aD45H1NEbb1bqELwloGCqI` is now an accepted DB-vs-chain **orphan**
  (nobody re-enrolled under the new seed) — this is the documented, deliberate cost of the rename.
  **STOP-if:** any rewrite touches an unexpected number of rows, or partially applies. Do not
  half-migrate the id — either all five tables move together or none do (wrap them in one
  transaction and roll back on any surprise). If the rename decision was "no", **skip B7 entirely**
  and confirm B6 recreated solana-101 under the old seed.

---

## Phase C — Verify (the DONE gate)

All three invariants must hold. **Any failure → STOP the lane, file a P0, roll back per §15.7**
(re-close/recreate the offending course, or redeploy; nothing here is irreversible on devnet).

- [ ] **C1: All 7 Course PDAs are 255 bytes with the correct `active_lessons` mask**

  **Command(s):** raw length check + decoded-mask check. Length (Course::SIZE includes the 8-byte
  discriminator, so a v2 account is exactly 255 bytes):
  ```bash
  for PDA in HXQ9oBbK5VtfN7F9PLM2xddrLjtAV2WgTTeCd9mvRVXL 3PrmfVEAJhR5XRDH4zUyjxLofoymUZ5751cPmLNQQB3v \
             FeeLjiHdok9DAdy9huWYUdJVHmDECsqxoo7RCSVc9kyF 33qMLNnEBaBq2f6Ssgq5Uj7CBAD2aafkAUsr76CcwvCU \
             2DKQYgryi2qGa1ApXLZcUHv81JtqCq3WkyhiEf9Qp5MQ 7t64peSmcbjRGbbUZAnsXC6a1raxEx76qXhpFjFwDv6u \
             8WmT5r1hrd2To28YD99XAaXddufp1m4PJnwRoRSQTP1w; do
    LEN=$(curl -s "$HELIUS_RPC" -X POST -H 'Content-Type: application/json' \
      -d '{"jsonrpc":"2.0","id":1,"method":"getAccountInfo","params":["'"$PDA"'",{"encoding":"base64"}]}' \
      | jq -r '.result.value.data[0]' | base64 -d | wc -c)
    echo "$PDA len=$LEN (expect 255)"
  done
  ```
  (If solana-101 was renamed, replace its PDA with `FxyePgoU1huRoX9i89iXzNz9dNacjYcvWiCnwvAEWyM5`.)
  Decoded-mask check via a one-shot verify script `scripts/cs4-verify-courses.ts` using the **v2**
  IDL (`decodeCourse` from `apps/web/src/lib/solana/academy-reads.ts` → snake_case fields):
  ```ts
  // For each PDA: const c = decodeCourse(accountInfo.data);
  //   assert (c.active_lessons as [BN,BN,BN,BN]).map(Number) deep-equals the expected mask
  //   expected: solana-101 [7,0,0,0]; building-first-program [65535,0,0,0]; all others [4095,0,0,0]
  //   assert c.is_active === true; c.total_completions === 0; c.total_enrollments === 0
  //   assert c.content_tx_id is NOT all-zero (carries the left-padded academy-courses HEAD sha, §11.0)
  ```
  ```bash
  pnpm tsx scripts/cs4-verify-courses.ts --url "$HELIUS_RPC"
  ```
  **Expected:** every course `len=255`; every mask equals its table value; `content_tx_id` carries
  the HEAD SHA (proves §11.0 commitment landed).
  **STOP-if:** any `len ≠ 255`, any mask mismatch, or any `content_tx_id` still all-zero.

- [ ] **C2: The Enrollment PDA set is preserved and byte-identical to the A6 snapshot**

  `close_course` must not have touched enrollments. Re-enumerate exactly as A6, capture the AFTER
  set, and assert **set-equality against A6 (no PDA added or missing)** plus byte-identity:
  ```bash
  curl -s "$HELIUS_RPC" -X POST -H 'Content-Type: application/json' -d '{
    "jsonrpc":"2.0","id":1,"method":"getProgramAccounts",
    "params":["7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V",
      {"encoding":"base64","filters":[{"memcmp":{"offset":0,"bytes":"inacXgeoHEa"}}]}]
  }' | jq -S '[.result[] | {pubkey, data: .account.data[0], lamports: .account.lamports}] | sort_by(.pubkey)' \
     > /tmp/enrollments-after.json
  # AFTER snapshot set of pubkeys:
  jq -r '.[].pubkey' /tmp/enrollments-after.json | sort > /tmp/enrollment-pubkeys-after.txt
  # (1) SET-EQUALITY: the sorted pubkey sets must match — any missing/added PDA fails the gate.
  diff /tmp/enrollment-pubkeys-before.txt /tmp/enrollment-pubkeys-after.txt   # MUST be empty
  # (2) BYTE-IDENTITY: raw data + lamports of every enrollment unchanged.
  diff /tmp/enrollments-before.json /tmp/enrollments-after.json               # MUST be empty
  ```
  **Expected:** both `diff`s produce **no output** — the Enrollment PDA set is exactly the A6 set
  (nothing dropped or added by `close_course`), and every enrollment's raw base64 `data` and
  `lamports` are byte-for-byte unchanged, which proves `lesson_flags` still map to the right lessons
  via the frozen `slots.lock.json` (the A2 bit-verify guarantees the mapping; C2 guarantees the
  bitmaps themselves never moved). The object count is informational (whatever A6 captured).
  **STOP-if:** the set-equality `diff` is non-empty (any PDA missing or added), or the byte-identity
  `diff` shows any change. Note the **expected, non-failing** case if
  solana-101 was renamed in B7: the on-chain solana-101 Enrollment PDA (seed
  `aD45H1NEbb1bqELwloGCqI`) is still byte-identical here (we never touched it) — the rename is a
  DB-only rewrite, so C2 still passes for the full enrollment set; the DB now points that one row at the new id by
  design (accepted orphan).

- [ ] **C3: Live smoke — v2 frontend reads v2 accounts**

  **Command(s):** load a course page on prod and confirm no decode errors; confirm one enrolled
  learner's progress renders. (Manual / lightweight.)
  **Expected:** course pages render; lesson `blocks[]` render; no `BorshCoder`/offset errors in the
  console.
  **STOP-if:** the v2 frontend throws on Course decode (indicates the B2 IDL didn't land with B3) —
  re-check B2/B3 before closing the window and lifting the maintenance banner.

**DONE:** C1 + C2 + C3 all pass → close the window, lift the maintenance banner (A5), re-enable
authoring only if/when the rest of the content migration (Phases 5–8, out of scope here) is ready.

---

## Phase D — Post-cutover (out of scope here; do NOT do these as part of CS-4)

- **PRE-MAINNET gates that remain OUT of scope (spec §15.8):**
  - **On-chain audit re-sign-off** for `complete_lesson`, `finalize_course`, and `update_course`.
    "Byte-verified on devnet" does **not** survive this change — the three instructions were
    rewritten from `lesson_count` to the `active_lessons` mask (§5.2) and must be re-audited before
    any mainnet deploy.
  - **Squads custody handoff (#305)** still gates mainnet, unchanged (single-hot-key custody today).
  - If the mask were added *after* mainnet, `close_course` would reset `total_completions` on
    courses whose creator rewards depend on `min_completions_for_reward` — which is exactly why this
    reset is done on devnet, pre-mainnet, now (§15.8).
- **CS-10 doc updates** (spec §16.3, per-phase, out of scope here): `DEPLOY-PROGRAM.md` (program v2;
  `close_course` → `create_course` at 255 bytes; `content_tx_id` carries the content SHA),
  `ARCHITECTURE.md` (`Course.active_lessons`, `repo → Sanity → chain` flow), and the generated
  field tables. This runbook does not touch them.
- **Later migration phases** the cutover unblocks but does not perform: Sanity schema move to
  inline module objects + read-only Studio (Phase 5), block-registry app + inverted completion gate
  + the two quest GROQ rewrites (Phase 6, §15.4a), drift UI (Phase 7), authoring retirement (Phase
  8).

---

## STOP gates at a glance

| Gate | Where | Condition to STOP | Action |
|---|---|---|---|
| G1 | A1 | `academy-courses` not pushed / lockfile missing or hand-edited | Wait for human push; re-run |
| **G2** | **A2** | **Any completion's bit ≠ generated slot (all enumerated live, not a fixed count)** | **STOP whole cutover, file P0** |
| G3 | A3 | #384 or #389 red / unreviewed / conflicting | Fix PRs; do not open window |
| G4 | A4 | v2 build fails or IDL still has `lesson_count` | On wrong commit; do not deploy |
| G5 | A6 | Enrollment enumeration errors / returns zero accounts | Fix RPC/filter; capture a non-empty set (count informational) |
| **G6** | **B1** | **Non-Helius RPC used, deploy corrupt, or bytes mismatch** | **Redeploy over Helius** |
| G7 | B2 | Copied IDL still has `lesson_count` / wrong address | Rebuild + recopy from deploy commit |
| G8 | B3 | Merge fails or prod deploy not `Ready` | Roll forward; do not leave prod mid-window |
| G9 | B4 | Sync returns `blocked` (CI red) or non-2xx / quest GROQ degrades | Fix content CI; never bypass gate |
| G10 | B5 | `closeCourse` reverts `Unauthorized`/`InvalidCourseAccount` | Fix authority/PDA; close all 7 |
| G11 | B6 | Sync errors, size ≠ 255, or mask wrong | Re-close/re-sync the course |
| G12 | B7 | Any id rewrite hits unexpected row count / partial apply | One txn; roll back on surprise |
| **G13** | **C1/C2/C3** | **Any invariant fails (size, mask, byte-identity, live read)** | **STOP lane, file P0, roll back §15.7** |

---

## Open items (confirm exact value before executing the referenced step)

1. **Upgrade-authority keypair path (B1).** Assumed `wallets/signer.json` (= `Config.authority`,
   the provider wallet in `Anchor.toml`). Single-hot-key custody (#305) — confirm this is the live
   upgrade authority and not a separate keypair behind `PROGRAM_AUTHORITY_SECRET` before signing B1.
2. **PR #384 scope (A3/B3).** Referenced as "frontend v2" (v2 reads in
   `academy-reads.ts`/`academy-program.ts` + block-model app that must land with #389). Confirm its
   exact diff, and whether the B2 IDL commit belongs inside #384 or as a follow-up PR.
3. **solana-101 rename go/no-go + `xpPerLesson: 100` (B6/B7).** Policy calls (§15.5, §17). The
   runbook branches on the decision; make it before B6.
4. **the full set of Enrollment PDA addresses and the 3 UUID lesson ids / 1 UUID module id.** Not derivable
   offline (need live Supabase/on-chain reads for the learner pubkeys and UUIDs). A6 enumerates the
   enrollments at runtime via `getProgramAccounts`; B7's 3 lesson-id `UPDATE`s need the actual UUIDs
   filled from `user_progress`.
5. **CS-9 admin-signer mask threading (B6).** The CS-9 create leg sets `active_lessons` via
   `create_course(lesson_count) → dense_mask`, which is exactly correct for the 7 dense courses, so
   CS-4 needs no `update_course(new_active_lessons)`. If a future course needs a non-dense mask,
   confirm the update leg threads `new_active_lessons` (the code note says it threaded only
   `content_tx_id` "until v2" — now that v2 is live, verify).
6. **Vercel prod deploy watch (B3).** `gh run watch --repo <org>/<repo>` placeholder — fill the
   actual repo slug, or watch the Vercel dashboard for the `main`-branch production deploy.

---

## Source of truth

- Spec: `docs/superpowers/specs/2026-07-09-course-content-standard-design.md` — §15 (whole
  migration), esp. §15.1 (inventory), §15.3 (bit-verify), §15.4 (phase order), §15.5 (content
  decisions incl. solana-101 rename across 5 tables), §15.7 (rollback), §15.8 (pre-mainnet), §5.2
  (size derivation 224→255), §11.0 (`content_tx_id` commitment + mask assertion).
- Program v2 (on `main` via #378): `onchain-academy/programs/onchain-academy/src/` —
  `state/course.rs` (`active_lessons`, `SIZE = 255`, `dense_mask`, `is_active_slot`,
  `live_lesson_count`), `instructions/{close_course,create_course,update_course,finalize_course}.rs`.
- CS-8 extraction plan: PR #388 (`docs/superpowers/plans/2026-07-10-cs8-academy-courses-extraction.md`).
- CS-9 sync route: PR #389 (`apps/web/src/app/api/admin/content/sync/route.ts`,
  `apps/web/src/lib/content-sync/`, admin `courses/sync` v2-wired to accept `activeLessons`).
- Frontend reads: `apps/web/src/lib/solana/academy-reads.ts` (raw `BorshCoder`, snake_case),
  `apps/web/src/lib/solana/pda.ts` (`findCoursePDA`, `findEnrollmentPDA`), IDL at
  `apps/web/src/lib/solana/idl/superteam_academy.json`.
- Deployment topology + Helius-only deploy: launch memory (`deployment-topology-vercel-helius`,
  `devnet-deploy-and-lms-db-state`).
