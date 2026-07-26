# Course salvage ledger — carry / prose-only / DELETE-DO-NOT-PORT

**Closes #601.** Per-lesson disposition for the six legacy courses in `solanabr/courses-academy`, so the
C1–C4 migration (and the C5 build) carries forward assets, not actively-false material, under the word
"rewrite".

This is the operational companion to **UNIFIED-LAUNCH-SPEC §3 item 19b** and **catalog-redesign-spec §7**
(the "source ledger"). Item 19b restored the salvage plan but named only the highlights; this document
resolves it to all 76 lessons with `file:line` evidence.

## How to read this

Six legacy courses, 76 lessons total (12 each × 5, plus 16 in `building-your-first-solana-program`).
Every course is **retired or close+recreated** — no lesson is edited in place (catalog §7; unified §3
item 19 table). So "carry" and "prose-only" mean *port into a new course id*, never *keep the live lesson*.

**Disposition legend:**

| Tag | Meaning |
| --- | --- |
| **CARRY** | Sound asset. Port structure + code (renamed slug OK). Spot-verified, not evidence-cited. |
| **PROSE-ONLY** | Exposition is sound; every exercise is rebuilt against the current stack (Kit / Anchor 1.x). Carried prose does **not** inherit a version stamp (item 8) — the stamp is authored fresh. |
| **DELETE (false)** | Actively-false material. **Do not port, do not cite as prior art, do not "fix in place."** This is the prohibition list — it goes in the C2/C3/C4 PR templates as a checkbox (item 19b), not just here. |
| **DELETE (retired)** | Not false, but dropped with a no-successor course (or superseded by a fresh spine). No destination. |

**Grounding:** every prose word-count and every DELETE claim below was re-verified against the content
repo at `origin/main`; the catalog-spec ledger matched the live content to the word (e.g. `pda-deep-dive`
599 w, `cpi-overview` 623 w, `anchor-accounts` 478 w, `transaction-ui` 744 w, `token-standards` 882 w).
Paths are relative to `courses/` in `solanabr/courses-academy`.

---

## 1. `solana-fundamentals` → retired; **C1** created fresh (Kit-based spine)

C1's lesson spine is authored new (catalog §7 C1 table — all-new slugs like `accounts-are-just-bytes`,
`derive-the-vault-pda`). Nothing here is a planned carry; the evergreen intros are salvageable prose but
optional. Every code challenge imports `@solana/web3.js` **v1** and is graded by the mock SDK (see §7),
so all six challenge lessons are DELETE.

| Lesson | Kind | Disposition | Evidence | Dest |
| --- | --- | --- | --- | --- |
| `what-is-solana` | prose | PROSE-ONLY | evergreen network concepts | C1 (optional) |
| `setup-environment` | prose | DELETE (retired) | stale local-toolchain steps; §7 names it in the delete set | none |
| `wallet-setup` | prose | PROSE-ONLY | evergreen; C1 uses Wallet Standard, not this flow | C1 (optional) |
| `keypair-challenge` | code(ts) | DELETE (false) | `keypair-challenge/exercise/solution.ts:1` imports `@solana/web3.js` v1; graded by mock `isOnCurve()→true` (§7) → `isValid:true` unconditionally | none |
| `first-transaction` | prose | PROSE-ONLY | evergreen tx-lifecycle prose | C1 (optional) |
| `transfer-challenge` | code(ts) | DELETE (retired) | `transfer-challenge/exercise/solution.ts:1-2` web3.js v1 `PublicKey`/mock-graded; not in §7 either list — see Decision D1 | none |
| `token-overview` | prose | PROSE-ONLY | evergreen SPL intro | C5 L2 overlaps `token-standards` (prefer that) |
| `create-token-challenge` | code(ts) | DELETE (false) | `create-token-challenge/exercise/solution.ts:1-2` web3.js v1 `Connection`/`createMint` against mock `mockCreateMint()` (`challenge-runner.tsx:114`) — fabricated success | none |
| `account-model` | prose | PROSE-ONLY | evergreen; C1 L2 `accounts-are-just-bytes` covers it fresh | C1 (optional) |
| `account-challenge` | code(ts) | DELETE (false) | `account-challenge/exercise/solution.ts:1` web3.js v1; `createMockAccount` over mock `PublicKey` — §7 delete set | none |
| `programs-overview` | prose | PROSE-ONLY | evergreen program-model intro | C1 (optional) |
| `program-challenge` | code(ts) | DELETE (retired) | `program-challenge/exercise/solution.ts:1` web3.js v1; mock-graded; not in §7 either list — see Decision D1 | none |

**Counts:** 6 PROSE-ONLY (optional), 6 DELETE (2 false, 4 retired), 0 CARRY.

---

## 2. `rust-for-solana` → retired; **C2** created fresh (native Rust)

All five exercises are Playground-shaped `std`-only Rust functions — none touches a Solana or Anchor
type — so they cannot be adapted to on-chain grading; they are rebuilt. `pda-challenge` is additionally
the **`DefaultHasher` false-PDA model** (the Rust twin of the anchor-framework defect). Prose is the asset.

| Lesson | Kind | Disposition | Evidence | Dest |
| --- | --- | --- | --- | --- |
| `why-rust` | prose | **SPLIT** | ownership↔account-model analogy → PROSE-ONLY; **`why-rust/intro.md:22-30` zero-cost snippet → DELETE (false)** — free-floating iterator chain over undeclared `accounts`, does not compile | C2 (analogy only) |
| `ownership-borrowing` | prose | PROSE-ONLY | three-rules skeleton, 355 w — expand ~5× across C2 L5–L7 | C2 |
| `structs-enums` | prose | PROSE-ONLY | 370 w, sound | C2 |
| `rust-basics-challenge` | code(rs) | DELETE (retired) | `rust-basics-challenge/exercise/solution.rs:1` plain `#[derive(...)]` struct, no Solana; Playground-graded | none |
| `serialization` | prose | PROSE-ONLY | 515 w incl. byte table | C2 |
| `serialization-challenge` | code(rs) | DELETE (retired) | `serialization-challenge/exercise/solution.rs:1` `fn serialize_account(...) -> Vec<u8>`, hand-rolled, not Borsh/Solana | none |
| `error-handling` | prose | PROSE-ONLY | 520 w, sound | C2 |
| `error-challenge` | code(rs) | DELETE (retired) | `error-challenge/exercise/solution.rs:1` `fn validate_transfer(...)` std-only | none |
| `program-structure` | prose | DELETE (retired) | §7 delete set; pre-Anchor-1.x native-entrypoint framing superseded | none |
| `rust-program-challenge` | code(rs) | DELETE (retired) | `rust-program-challenge/exercise/solution.rs:1` `fn process_transfer(...)` std-only | none |
| `state-management` | prose | DELETE (retired) | §7 delete set; superseded by C2/C3 account model | none |
| `pda-challenge` | code(rs) | **DELETE (false)** | `pda-challenge/exercise/solution.rs:1,5,17` — `DefaultHasher` + accepts bump when `hash % 2 == 0`; same actively-false PDA model as anchor-framework | none |

**Counts:** 4 PROSE-ONLY + 1 split-prose, 7 DELETE (2 false incl. the `why-rust` snippet and `pda-challenge`, 5 retired), 0 CARRY.

---

## 3. `anchor-framework` → retired, no successor course; **3 prose lessons merged into C3**

Verified: **no exercise in the course imports `anchor_lang`** (`grep -rn anchor_lang
anchor-framework/lessons/*/exercise/*.rs` → zero hits). Two teach the `DefaultHasher` PDA model. All five
exercises are DELETE (false). Only three prose lessons survive, into C3.

| Lesson | Kind | Disposition | Evidence | Dest |
| --- | --- | --- | --- | --- |
| `anchor-intro` | prose | DELETE (retired) | superseded by C3's fresh Anchor-1.x intro | none |
| `anchor-setup-challenge` | code(rs) | DELETE (false) | `anchor-setup-challenge/exercise/solution.rs:1-2` builds an `AccountMeta` struct in plain Rust — no `anchor_lang`; teaches Anchor via a hand-rolled fake | none |
| `anchor-accounts` | prose | PROSE-ONLY | 478 w, re-authored against Anchor 1.x | C3 |
| `anchor-accounts-challenge` | code(rs) | DELETE (false) | `anchor-accounts-challenge/exercise/solution.rs:1` `fn validate_account(...)` string-compares owners — no `anchor_lang`, no `#[account]` | none |
| `pda-deep-dive` | prose | PROSE-ONLY | 599 w | C3 |
| `pda-advanced-challenge` | code(rs) | **DELETE (false)** | `pda-advanced-challenge/exercise/solution.rs:1,5,17` — `DefaultHasher`, bump accepted when `hash % 2 == 0`. Actively-false model of the most important Solana primitive | none |
| `cpi-overview` | prose | PROSE-ONLY | 623 w | C3 |
| `cpi-challenge` | code(rs) | **DELETE (false)** | `cpi-challenge/exercise/solution.rs:1,5,15` — same `DefaultHasher` / `hash % 2 == 0` model, taught a second time | none |
| `anchor-testing` | prose+code | DELETE (retired) | `anchor-testing/intro.md:60-61` teaches `anchor-bankrun`/`solana-bankrun` (`BankrunProvider`) — author-deprecated | none |
| `anchor-errors` | prose | DELETE (retired) | superseded; C3 authors error handling fresh | none |
| `deployment` | prose | DELETE (retired) | `deployment/intro.md:54-89` pre-0.30 IDL-upload / 3-arg `new Program()` flow | none |
| `testing-challenge` | code(rs) | DELETE (false) | `testing-challenge/exercise/solution.rs:1` `fn simulate_transfer_test(...)` returns a `String` — no `anchor_lang`, no test harness | none |

**Counts:** 3 PROSE-ONLY → C3, 9 DELETE (5 false = all exercises, 4 retired), 0 CARRY.

---

## 4. `solana-frontend` → retired; **C4** created fresh (Kit + Wallet Standard)

Every prose lesson is written against `@solana/web3.js` v1 / `ConnectionProvider` / `WalletProvider`
(`grep -rln '@solana/web3.js\|WalletProvider' solana-frontend/lessons/*/intro.md` → notifications,
rpc-methods, wallet-adapter-intro, react-patterns, transaction-ui, signing-messages). C4 is Kit-native, so
even the carried prose keeps concepts only, all code rewritten (there is no `connection.confirmTransaction`
in Kit).

| Lesson | Kind | Disposition | Evidence | Dest |
| --- | --- | --- | --- | --- |
| `wallet-adapter-intro` | prose | DELETE (retired) | §7 delete set; teaches the `WalletProvider`/`ConnectionProvider` stack C4 explicitly rejects for Wallet Standard | none |
| `connect-wallet-challenge` | code(ts) | **DELETE (false)** | `connect-wallet-challenge/exercise/solution.ts:3,8` — `simulateWalletConnection()` wrapping `Keypair.generate()`: a fabricated wallet flow | none |
| `signing-messages` | prose | DELETE (retired) | web3.js-v1 signing prose; superseded by C4's SIWS/Wallet-Standard path | none |
| `sign-message-challenge` | code(ts) | DELETE (false) | §7 delete set; signs with a generated keypair, not a real wallet | none |
| `rpc-methods` | prose | DELETE (retired) | `rpc-methods/intro.md` web3.js-v1 `new Connection` RPC surface; C4 uses `createSolanaRpc` | none |
| `balance-checker-challenge` | code(ts) | DELETE (retired) | §7 delete set; web3.js-v1 balance read against the mock | none |
| `parsing-data` | prose | PROSE-ONLY | binary-decoding exposition is evergreen; recode to Kit codecs | C4 (or C1 L2) |
| `parse-data-challenge` | code(ts) | **PROSE-ONLY** (shape reusable) | `parse-data-challenge/exercise/solution.ts:1` `parseAccountData(data: Uint8Array)` is a **pure byte decoder** — the one frontend exercise with no fake API; its shape is exactly C1 L2 `accounts-are-just-bytes`. See Decision D2 | C1 L2 / C4 |
| `react-patterns` | prose | PROSE-ONLY | 630 w, sound React patterns | C4 |
| `transaction-ui` | prose | PROSE-ONLY | 744 w confirmation-state/error-taxonomy spine (reused by C4 L3 + L6) | C4 |
| `notifications` | prose | PROSE-ONLY | 755 w — carry prose, but **fix `notifications/intro.md:14` `const cluster = 'mainnet-beta'`** hardcoded on devnet explorer links | C4 |
| `dapp-challenge` | code(ts) | DELETE (retired) | `dapp-challenge/exercise/solution.ts:1-2` web3.js-v1 `Connection`/`PublicKey`; mock-graded capstone | none |

**Counts:** 5 PROSE-ONLY (incl. `parse-data-challenge` as reusable shape), 7 DELETE (2 false, 5 retired), 0 CARRY.

---

## 5. `defi-on-solana` → retired, no successor; **only `token-standards` salvaged, into C5 L2**

All five challenges contain **zero Solana** (`grep -rln '@solana\|Connection\|PublicKey\|web3'
defi-on-solana/lessons/*/exercise/*.ts` → zero hits): they are pure JS math/data functions. The concept
prose is theory in a no-successor course. Only `token-standards` is a genuine asset.

| Lesson | Kind | Disposition | Evidence | Dest |
| --- | --- | --- | --- | --- |
| `defi-overview` | prose | DELETE (retired) | no successor course; generic DeFi theory | none |
| `amm-concepts` | prose | DELETE (retired) | no successor | none |
| `lending-concepts` | prose | DELETE (retired) | no successor | none |
| `amm-challenge` | code(ts) | DELETE (false) | `amm-challenge/exercise/solution.ts:1` `function swap(reserveIn, reserveOut, ...)` — pure arithmetic, "DeFi on Solana" with no Solana | none |
| `token-standards` | prose | PROSE-ONLY | 882 w — the one genuine asset. **Three corrections (catalog §7 C5 L2):** (a) delete the "Token-2022: newer / Limited DEX support / Mature ✅❌" table at `token-standards/intro.md:243-245` (npm parity, not limited); (b) replace `getAssociatedTokenAddress` (`:37`) with Kit `findAssociatedTokenPda`; (c) re-date/drop the Francium/Tulip exemplars | **C5 L2** |
| `token-math-challenge` | code(ts) | DELETE (false) | `token-math-challenge/exercise/solution.ts:1` `function baseToDisplay(baseAmount, decimals)` — pure math | none |
| `staking-mechanisms` | prose | DELETE (retired) | no successor | none |
| `staking-challenge` | code(ts) | DELETE (false) | `staking-challenge/exercise/solution.ts:1` `calculateStakingRewards(...)` — pure math | none |
| `orderbook-design` | prose | DELETE (retired) | no successor | none |
| `oracle-design` | prose | DELETE (retired) | no successor | none |
| `vault-challenge` | code(ts) | DELETE (false) | `vault-challenge/exercise/solution.ts:1` `const vault = {...}` — plain JS object, no on-chain vault | none |
| `liquidation-challenge` | code(ts) | DELETE (false) | `liquidation-challenge/exercise/solution.ts:1` `checkLiquidation(collateral, debt, ...)` — pure math | none |

**Counts:** 1 PROSE-ONLY → C5, 11 DELETE (5 false = all challenges, 6 retired), 0 CARRY.

---

## 6. `building-your-first-solana-program` → **close + recreate as C3** (trackLevel 2→3)

The only course that is recreated rather than replaced by a new spine, so it holds most of the CARRY set.
Slot-ID reconciliation is out of scope here — see `2026-07-26-c3-slot-reconciliation.md`.

| Lesson | Kind | Disposition | Evidence | Dest |
| --- | --- | --- | --- | --- |
| `from-code-to-chain` | prose | PROSE-ONLY | build-pipeline intro, sound | C3 |
| `your-first-build` | code(rs) | **CARRY** | `your-first-build/lesson.yaml:18` `hints:` — first successful build + its 3 hints; catalog §7 carry-verbatim | C3 |
| `anatomy-anchor-program` | prose | PROSE-ONLY | 272 w | C3 |
| `add-instruction` | code(rs) | PROSE-ONLY | scrambled-fragment exercise; C3 L reshapes it (catalog §7 C3 `add-an-instruction`) — reuse the salvageable prose half | C3 |
| `on-chain-state` | prose | PROSE-ONLY | 324 w | C3 |
| `define-counter-account` | code(rs) | **CARRY** | catalog §7 carry-verbatim (`define-counter-account` → renamed to vault) | C3 |
| `account-constraints-deep-dive` | prose | PROSE-ONLY | 349 w | C3 |
| `wire-up-initialize` | code(rs) | **CARRY** | `wire-up-initialize/exercise/starter.rs:35` `// BUG: Something is missing here...` — the DEBUG rung, the crown jewel: the one rung that teaches reading a failure | C3 |
| `adding-instructions` | prose | DELETE (retired) | trivial module-1 independent-write, retired (catalog §7 / item 22); salvageable prose folds into `add-instruction` | none |
| `build-increment` | code(rs) | CARRY | increment instruction, sound worked rung | C3 |
| `complete-counter-program` | code(rs) | CARRY | full counter assembly, sound | C3 |
| `deploy-to-devnet` | code(rs) | **DELETE (retired)** | slot 11 duplicate of the module-4 deploy (`deploy-to-devnet/lesson.yaml:1` `lesson-bfsp-deploy-to-devnet`); §7 + item 22 retire this slot | none |
| `airdrop-fund-wallet` | prose+block | **CARRY** | `airdrop-fund-wallet/lesson.yaml:12-13` `type: wallet-funding` / `produces: funded-wallet` — reused verbatim by C4 too | C3 (+C4) |
| `deploy-program-devnet` | code+block | **CARRY** | `deploy-program-devnet/lesson.yaml:15` `deployable: true` + `:22` Resume hint | C3 |
| `interact-with-program` | prose+block | **CARRY** | `interact-with-program/lesson.yaml:13` `type: program-explorer` (+ `program.idl.json`) | C3 |
| `what-you-built` | prose+block | **CARRY** | `what-you-built/lesson.yaml:12` `type: deployed-program-card`; **retarget its next-step pointer off `defi-on-solana`** (unified item 20a) | C3 |

**Counts:** 8 CARRY, 6 PROSE-ONLY, 2 DELETE (0 false, 2 retired).

Plus one cross-course CARRY asset: `courses/_template/lessons/basics/lesson.yaml:11` `type: quiz` — the
quiz syntax, carried into every new course.

---

## 7. The DELETE-DO-NOT-PORT prohibition list (the actively-false subset)

**This is the checkbox for the C2/C3/C4 PR templates (item 19b).** These are not "retired"; they are
false and must never be ported, cited as prior art, or "fixed in place":

1. **The `DefaultHasher` PDA model — taught 3×.** `anchor-framework/lessons/pda-advanced-challenge`,
   `anchor-framework/lessons/cpi-challenge`, and `rust-for-solana/lessons/pda-challenge`. All derive a PDA
   with `std::collections::hash_map::DefaultHasher` and accept a bump when `hash % 2 == 0`. False model of
   the most important Solana primitive.
2. **The JS mock SDK.** `apps/web/src/components/editor/challenge-runner.tsx:45-74` — `class MockPublicKey`
   with `static isOnCurve() { return true; }` (`:65`) and `static findProgramAddressSync(...)` that
   hardcodes bump `254` and fabricates the hash (`:71,:74`). The JavaScript twin of the `DefaultHasher`
   model; documented root cause of `keypair-challenge` grading `isValid:true` unconditionally. Retire with
   the legacy web3.js-v1 exercises (item 11 / PB-6). This is a **monorepo** change, not a content change —
   file it in the C1/C4 PR, not the content PR.
3. **`why-rust`'s zero-cost-abstractions snippet** (`rust-for-solana/lessons/why-rust/intro.md:22-30`) —
   does not compile (iterator chain over an undeclared `accounts`).
4. **`connect-wallet-challenge`'s fabricated wallet flow**
   (`solana-frontend/lessons/connect-wallet-challenge/exercise/solution.ts:3,8`) —
   `Keypair.generate()` hidden behind `simulateWalletConnection()`.
5. **All 5 `anchor-framework` exercises** — none imports `anchor_lang`; they teach Anchor via hand-rolled
   fakes (`AccountMeta` structs, string owner-compares, `String`-returning "tests").
6. **All 5 `defi-on-solana` challenges** — zero Solana; pure JS math.

---

## 8. Redesign cross-reference — does C1–C5 plan to carry anything this ledger marks DELETE?

**No conflict.** The catalog redesign already codes every DELETE (false) call into its own lesson plans —
this ledger and the C-course plans agree:

- C1 L3 `derive-the-vault-pda` (catalog §7:113) states verbatim: *"The `DefaultHasher` PDA exercises in
  `anchor-framework` are deleted, not adapted — and so is the JS mock's `findProgramAddressSync`."* ✅
- C1 L2 `accounts-are-just-bytes` (§7:112) is graded as a pure decoder over injected byte fixtures — it
  does **not** reach for the mock SDK. ✅
- C2 L6/L7 (§7:160) explicitly *"Delete `why-rust`'s zero-cost-abstractions snippet — it does not
  compile."* ✅
- C4 L3 `connect-fund-and-send` (§7:123) reuses only `airdrop-fund-wallet`'s `wallet-funding` block
  (a CARRY asset) and rewrites all code; it does not carry `connect-wallet-challenge`. ✅
- C4 L6 `states-errors-and-reads` (§7:276) salvages the `transaction-ui`/`notifications` **prose** and
  *"fix[es] the latter's hardcoded `cluster = 'mainnet-beta'`"* — matches this ledger's PROSE-ONLY +
  fix note for `notifications`. ✅
- C5 L2 `token-or-token-2022` (§7:297) reuses `token-standards` with the three corrections — matches. ✅

**No case exists where a C-course plan carries material this ledger marks DELETE.** The single adjacent
tension is not a salvage conflict: **unified item 20(b)** inserts `rust-for-solana` and `anchor-framework`
into `solana-core.yaml` so the live path stops visibly skipping them — routing new learners into two
courses this ledger retires one wave later. Item 20 already names and accepts that cost (it belongs to
O-9, the retirement mechanism), so it is flagged here, not re-litigated.

---

## 9. Decisions to flag (genuine judgment calls — do not silently resolve)

- **D1 — `solana-fundamentals/transfer-challenge` and `program-challenge`.** Both import `@solana/web3.js`
  v1 and are mock-graded, but §7 names neither in its delete *or* carry lists. Consistent with their five
  siblings, this ledger marks them **DELETE (retired)**. Confirm no C1 lesson plans to reuse them (the C1
  table suggests not). *Options:* (a) DELETE, consistent — recommended; (b) PROSE-ONLY if the transfer /
  custom-instruction exposition is wanted for a C1 intro.
- **D2 — `solana-frontend/parse-data-challenge`.** Unlike every other frontend challenge it is a **pure
  byte decoder** (`parseAccountData(data: Uint8Array)`, no fake API) — structurally identical to what C1 L2
  `accounts-are-just-bytes` is authored to be. *Options:* (a) PROSE-ONLY, cite it as the reference shape
  for C1 L2 / C4 (recommended — it is the one salvage-shaped exercise in the course); (b) DELETE and
  author C1 L2 from scratch. §7 does not cite it, so this is a real call, not an omission to rubber-stamp.
- **D3 — Optional fundamentals prose (`what-is-solana`, `wallet-setup`, `first-transaction`,
  `account-model`, `programs-overview`, `token-overview`).** Marked PROSE-ONLY but **not planned** carries
  — C1's spine is authored fresh. Decision: treat as an available reference, or DELETE (retired) to keep
  the salvage set tight. Recommendation: leave PROSE-ONLY/optional; zero cost, and evergreen concept prose
  is cheap to reference.

---

## 10. Consolidated counts

| Course | CARRY | PROSE-ONLY | DELETE (false) | DELETE (retired) | Lessons | Fate |
| --- | --- | --- | --- | --- | --- | --- |
| `solana-fundamentals` | 0 | 6* | 2 | 4 | 12 | retire → C1 fresh |
| `rust-for-solana` | 0 | 4 (+1 split) | 2 | 5 | 12 | retire → C2 fresh |
| `anchor-framework` | 0 | 3 | 5 | 4 | 12 | retire → 3 prose to C3 |
| `solana-frontend` | 0 | 5 | 2 | 5 | 12 | retire → C4 fresh |
| `defi-on-solana` | 0 | 1 | 5 | 6 | 12 | retire → `token-standards` to C5 |
| `building-your-first-solana-program` | 8 | 6 | 0 | 2 | 16 | close+recreate → C3 |
| **Total** | **8** | **~25** | **16** | **26** | **76** | |

\* optional/unplanned (Decision D3). Plus one cross-course CARRY: the `_template` quiz syntax.

**16 DELETE (false)** is the prohibition list in §7 — that is the number that must land as a checkbox in
the C2/C3/C4 PR templates.
