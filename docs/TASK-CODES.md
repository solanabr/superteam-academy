# Task Codes — How to Read the Launch Backlog

Legend for the task IDs used across the launch backlog (the mainnet-readiness checklist,
the launch plan, and the issues filed from them). Every task ID encodes **priority tier**,
sometimes a **domain section**, and an item number. Severity, area, and owner are separate axes.

---

## 1. ID anatomy

```
P0 - A 1
│    │ └─ item number within the section
│    └─── domain section letter (P0 only — see §3)
└──────── priority tier (see §2)
```

| Pattern | Example | Read as |
| --- | --- | --- |
| `P0-{L}{n}` | `P0-A1` | P0 blocker · section A (on-chain) · item 1 |
| `P1-{n}` | `P1-11` | P1 must-fix · item 11 *(flat — no section letter)* |
| `P2-{n}` | `P2-4` | P2 polish · item 4 *(flat)* |
| `D-{n}` | `D-1` | Open decision · item 1 |
| `G-{n}` | `G-7` | Final launch gate · item 7 |

> ⚠️ **`D` is overloaded — mind the dash.** Standalone **`D-1`/`D-2`** = an *Open Decision*.
> But **`P0-D1`** = P0 *section D* (Docs), item 1. The hyphen position tells them apart:
> `D-#` (decision) vs `P0-D#` (docs task).

---

## 2. Priority tiers (the prefix)

| Tier | Name | Meaning | Gate on launch? |
| --- | --- | --- | --- |
| **D** | Open Decision | Must be answered before dependent work can be sequenced; forks the plan | Blocks the work it gates |
| **P0** | Launch Blocker | Blocks launch / data-loss / fund-loss. Cannot ship to mainnet open | **Yes — hard blocker** |
| **P1** | Must Fix Before Launch | Required for a safe public launch; not necessarily fund-critical | **Yes** |
| **P2** | Polish | Quality/cleanup; some feed Lighthouse (G-6) or the audit gate (G-2) | Mostly no |
| **G** | Final Launch Gate | Go/no-go verification checked at deploy time; aggregates P0/P1 work | **Yes — the deploy checklist** |

> **Tiers vs gates:** P0/P1/P2 are *work items* (someone writes code). **G-#** items are
> *verification checkpoints* — they confirm the work is done and the deploy is safe. A gate often
> "closes" only once its underlying P0/P1 items are merged (e.g. **G-3** ← **P1-4**, **G-7** ← **P1-2**).

---

## 3. P0 domain sections (the middle letter)

Only **P0** is subdivided by domain. P1/P2 are flat lists.

| Letter | Section | Typical owner |
| --- | --- | --- |
| **A** | On-Chain Program | @thomgabriel |
| **B** | Database & Security | @Potolski |
| **C** | Frontend & Tooling | @Potolski |
| **D** | Docs / Setup correctness | @Potolski |

---

## 4. Severity (independent of tier)

Set per task in `MAINNET-READINESS.md` as `[severity]`. A task can be P1 but Critical, or P0 but
Medium — tier = *when we fix it*, severity = *how bad if it breaks*.

| Severity | Meaning |
| --- | --- |
| **Critical** | Blocks launch / data-loss / fund-loss |
| **High** | Must fix |
| **Medium** | Should fix |
| **Low** | Polish |

---

## 5. Area tags → GitHub labels

The `[area]` tags in the readiness doc map 1:1 to issue labels.

| Tag | Label | Scope |
| --- | --- | --- |
| `[on-chain]` | `area:onchain` | `onchain-academy/**` |
| `[db]` | `area:db` | `supabase/**` |
| `[frontend]` | `area:frontend` | `apps/web/**` |
| `[ci]` | `area:ci` | `.github/**`, build/release tooling |
| `[security]` | `area:security` | auth, rate limits, isolation |
| `[testing]` | `area:testing` | test suites, fuzzing, CU profiling |
| `[docs]` | `area:docs` | `docs/**`, README, `.env.example` |
| `[ops]` | `area:ops` | secrets, runbooks, multisig, budget |

---

## 6. Worked example

> **`P0-A1` `[on-chain][High]` — Bind `track_collection` to the course on-chain**

Decodes to: **P0** launch blocker · section **A** (on-chain) · item **1** · area `area:onchain` ·
severity **High** · owner @thomgabriel · `blocked:D-1` (because all §A work waits on the
Pinocchio-vs-Anchor decision). One issue, one branch, one PR.
