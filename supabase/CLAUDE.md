# supabase

`migrations/` is the source of truth. `schema.sql` is a generated snapshot (`supabase db dump`), so
don't edit it by hand and don't run it to make changes.

## Writing a migration

- Name it `YYYYMMDDHHMMSS_<what>.sql` with a timestamp that is unique across the whole
  `migrations/` directory, not just the recent files.
- Make it idempotent: `IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`,
  `CREATE OR REPLACE FUNCTION`, `ON CONFLICT DO NOTHING`. A backfill must be safe to re-run.
- Every table has RLS. Users read and write only their own rows (`auth.uid()`), and never write a
  row the platform trusts (XP, progress, achievements, roles, wallet fields).
- SECURITY DEFINER functions set a fixed `search_path` and `REVOKE` execute from `anon`,
  `authenticated` and `public`, granting only `service_role`. The app calls them through
  `createAdminClient()`.
- Before replacing a trigger function body, diff the guarded column set against every earlier
  version of that function. Rewrites have dropped guards before.
- If a route can't run without the new object, add it to
  `apps/web/src/lib/supabase/schema-expectations.ts`.

## Applying it

Vercel deploys `main` on merge, so code can reach production before its schema exists.

1. Apply the migration through the Supabase MCP (`apply_migration`) before the PR merges, or state
   the outage window in the PR.
2. Run the advisors (`get_advisors`) and fix what the migration introduced.
3. The MCP stamps its own version, not the filename's. Record the MCP-stamped version in
   `docs/DB-MIGRATION-LEDGER.md` in the same PR.

## Operator gotcha

`enforce_profile_wallet_write()` and `enforce_profile_deleted_at_write()` let only `service_role`
change the guarded `profiles` columns. A bare `postgres` session, such as MCP `execute_sql` or the
SQL editor, raises `permission denied`. For a deliberate operator write, run `SET LOCAL ROLE
service_role;` inside the transaction.
