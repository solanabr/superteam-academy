# DB migration ledger — filename ↔ prod ledger reconciliation (#708)

**Status:** the database is correct; the _record_ of it is not. Every migration
applied to prod via the Supabase **MCP** `apply_migration` was stamped with MCP's
own wall-clock version, not the repo filename's version. So
`supabase_migrations.schema_migrations` (the ledger the CLI keys on) diverges
from the repo filenames on every MCP-applied migration. The objects are really
there — verified present and, for several, exploit-tested — but a CLI-driven
deploy (`supabase db push` / `migration list`) would consider them unapplied.

This file is the authoritative cross-reference until the ledger is repaired, plus
the going-forward rule so it stops recurring. It is **documentation** — applying
the repair is a prod action held by the gate (this repo ships SQL/docs only and
never touches prod).

> **PENDING-GATE-VERIFY** marks a prod-side fact this doc cannot verify from the
> repo. The ledger versions below are as **reported by the gate** in #708 (and
> #699 for `drop_teacher_role`); rows without a gate-reported version are marked
> so the gate fills them from `select version, name from
supabase_migrations.schema_migrations order by version`.

## Cause

MCP `apply_migration` runs the SQL and records the migration under a version it
generates at apply time (UTC wall-clock), ignoring the `NNNNNNNNNNNNNN` prefix in
the filename. The CLI, by contrast, keys the ledger on the filename's version.
Nothing in the repo recorded that MCP-applied ≠ CLI-tracked, which is why five
migrations drifted in a single day (2026-07-26) unnoticed.

## Consequences (why this matters before mainnet)

1. **`supabase db push` would re-apply the diverged migrations** — the CLI finds
   none of the repo versions in the ledger. Most are idempotent by construction
   (`ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`,
   `ON CONFLICT DO NOTHING`, `CREATE OR REPLACE FUNCTION`), so a re-apply is most
   likely a no-op — but `add_xp_transactions_source` carries a **backfill**, and
   per-migration idempotency should never be discovered during a deploy.
2. **`supabase migration list` is misleading** — it shows live migrations as
   local-only, the exact signal used to judge whether a deploy is safe.
3. **A duplicate repo version existed** (`20260726120000` shared by
   `add_xp_transactions_source` and `lockdown_deployed_programs_rls`). Fixed by
   #735/#762 (renamed the latter to `20260726121000`). Under a CLI apply that
   keyed on version, one could have been recorded applied without running.

## Mapping — repo filename ↔ prod ledger version

Ledger versions per the gate's #708 probe against prod (`pywhtmidcrptomrabbrw`).
"Objects verified" = the migration's objects were confirmed present on prod
(schema.sql mirror + gate exploit tests, #708 / #731).

| repo filename (version)                                                                       | prod ledger version               | ledger name                               | evidence                                                                                                                                         |
| --------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `20260710120000_drop_teacher_role.sql`                                                        | `20260711152518`                  | `drop_teacher_role_lock_wallet_writes`    | role column/trigger absent; wallet lock live (#699)                                                                                              |
| `20260725120000_billed_assists_counter.sql`                                                   | `20260726143513`                  | `billed_assists_counter`                  | objects verified (#708)                                                                                                                          |
| `20260726120000_add_xp_transactions_source.sql`                                               | `20260726143846`                  | `add_xp_transactions_source`              | objects verified; **carries a backfill** (#708)                                                                                                  |
| `20260726121000_lockdown_deployed_programs_rls.sql` (was `20260726120000`, renamed #735/#762) | `20260726143927`                  | `lockdown_deployed_programs_rls`          | RLS lockdown verified (#708)                                                                                                                     |
| `20260726130000_route_public_profile_reads_through_view.sql`                                  | `20260726144047`                  | `route_public_profile_reads_through_view` | objects verified (#708)                                                                                                                          |
| `20260726140000_review_items_spaced_repetition.sql`                                           | `20260726162147`                  | `review_items_spaced_repetition`          | re-apply confirmed idempotent (#708)                                                                                                             |
| `20260726150000_add_profiles_segment_state.sql`                                               | `20260726173332`                  | `add_profiles_segment_state`              | re-apply confirmed idempotent (#708)                                                                                                             |
| `20260726160000_add_profiles_prefs.sql`                                                       | **PENDING-GATE-VERIFY**           | `add_profiles_prefs`                      | applied per loop records; ledger version not in #708                                                                                             |
| `20260726170000_review_quest_kind.sql`                                                        | **PENDING-GATE-VERIFY**           | `review_quest_kind`                       | **NOTE:** #750 found prod's `get_daily_quest_state` has NO review branch — this migration may **not** be applied to prod; verify before assuming |
| `20260726180000_ai_spend_ledger.sql`                                                          | **PENDING-GATE-VERIFY**           | `ai_spend_ledger`                         | applied per #731 reconciliation; ledger version not in #708                                                                                      |
| `20260726190000_streak_forgiveness.sql`                                                       | **PENDING-GATE-VERIFY** (partial) | `streak_forgiveness`                      | schema half (column + table) applied; **function bodies NOT yet applied** (blocked on #750) — #731                                               |
| `20260726200000_cohort_leagues.sql`                                                           | **PENDING-GATE-VERIFY**           | `cohort_leagues`                          | applied per loop records (#734)                                                                                                                  |
| `20260726210000_course_changelog.sql`                                                         | **PENDING-GATE-VERIFY**           | `course_changelog`                        | applied per loop records (#732)                                                                                                                  |
| `20260726220000_course_changelog_status_kinds.sql`                                            | **PENDING-GATE-VERIFY**           | `course_changelog_status_kinds`           | applied per loop records (#732)                                                                                                                  |

Migrations with prefix `< 20260710120000` predate the MCP-apply era and are
assumed ledger-consistent unless a probe shows otherwise — **PENDING-GATE-VERIFY**
if a full `migration list` reconciliation is ever run.

## Reconciliation — GATE / owner action (needs prod)

For each diverged row, repair the ledger so `version` matches the repo filename,
**without** re-running the SQL (the objects already exist):

```
supabase migration repair --status applied <repo-filename-version>
# and, if the MCP-stamped row should not linger as a phantom:
supabase migration repair --status reverted <mcp-ledger-version>
```

Do this per row in the table above. Verify with `supabase migration list` showing
every repo version as applied and no MCP-stamped phantom remaining. This repo
cannot perform it (no prod DB URL / CLI / psql in this environment); it is a gate
action with owner authorization.

## Going-forward convention (so this stops recurring)

Whenever a migration is applied through MCP `apply_migration` (the only path
available to the loop's environment), **one** of the following is mandatory
before the PR is considered done:

1. **Preferred — name the file to match what MCP will stamp is impossible** (MCP
   picks the version at apply time), so instead: **record the MCP-stamped version
   in this file** in the same change that applies it — add the row to the table
   with the real ledger version, not PENDING-GATE-VERIFY.
2. **And** the applier runs `supabase migration repair --status applied
<repo-version>` (or leaves a checked TODO here) so the ledger and filenames
   reconverge. An MCP-applied migration is not "done" until its ledger row is
   reconciled or recorded here.
3. **Timestamp uniqueness** is checked against the **full** `supabase/migrations/`
   directory (not just recent files) — the `20260726120000` duplicate predated
   the mid-loop checks and was never back-audited (#735).

Migration PRs also carry the #731 discipline in their routing record: **"apply
before merge, or accept a documented outage window"** — Vercel auto-deploys from
`main` on merge, so code can reach production before its schema exists.

## Related

#699 (schema.sql drift — same "records wrong about prod" family), #735 (the
duplicate this de-dupes), #731 (merge→apply outage window + reconciliation),
#750 (streak_forgiveness rollback / review-branch apply state), #707/#734
(surfaced the divergence).
