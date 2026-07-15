-- ---------------------------------------------------------------------------
-- GLOBAL deploy-window freeze (reset wave B2)
-- ---------------------------------------------------------------------------
-- A single-row, platform-wide "freeze" flag. When `frozen = true`, every
-- server-side on-chain WRITE path (the login drainer's Pass-2 cases, the
-- learner-facing lessons/complete + certificates/mint routes, the Helius
-- webhook's finalize/credential/achievement cascade, and the admin course /
-- achievement on-chain-mutation routes) refuses/queues instead of sending a tx.
--
-- This is SEPARATE from the per-course `onchain_deployments.in_maintenance` gate
-- (#502), which `recreateCourse` ACQUIRES per-course around each recreate. That
-- flag cannot be reused for the window: a pre-set global value keyed by course
-- would collide with recreateCourse's own conditional acquire. This is a
-- dedicated GLOBAL flag with no per-course semantics.
--
-- SAFETY POSTURE. After the v-next program deploys, writes to not-yet-reset
-- (v1, 224-byte) courses fail at the PROGRAM level, so this freeze is
-- maintenance-window HYGIENE (clean UX + stop login-drainer churn), NOT the sole
-- orphan guard. The read path (`isPlatformFrozen`, apps/web) therefore fails to
-- LAST-KNOWN-VALUE on a read error (never hard fail-closed, which would freeze
-- prod on a transient blip).
--
-- The reset operation itself (recreateCourse / the recreate routes) is EXEMPT —
-- it runs DURING the freeze and is never gated on this flag.
--
-- STORAGE. Singleton table: the `id boolean primary key default true` + the
-- `platform_freeze_singleton` CHECK constraint make exactly one row possible.
-- RLS is enabled with NO policies, so only the service_role (which bypasses RLS)
-- can read or write it — the house pattern already used by `onchain_deployments`
-- and the SECURITY DEFINER RPCs. All app access is server-only via the
-- service-role client.
--
-- Default = NOT frozen.
-- ---------------------------------------------------------------------------

create table if not exists public.platform_freeze (
  id boolean primary key default true,
  frozen boolean not null default false,
  reason text,
  updated_at timestamptz not null default now(),
  constraint platform_freeze_singleton check (id = true)
);

comment on table public.platform_freeze is
  'Singleton global deploy-window freeze flag (reset wave B2). frozen=true refuses/queues every server-side on-chain write path. Separate from the per-course onchain_deployments.in_maintenance gate. service_role only (RLS on, no policies).';

-- Seed the single row as NOT frozen so `isPlatformFrozen` reads a concrete
-- value from day one (a missing row is also treated as not-frozen by the app,
-- but seeding keeps the state explicit and set/clear a pure UPDATE-or-upsert).
insert into public.platform_freeze (id, frozen)
values (true, false)
on conflict (id) do nothing;

-- RLS on, no policies → service_role only (bypasses RLS). Matches the
-- onchain_deployments base-table pattern: no authenticated/anon can read or
-- write this operational flag.
alter table public.platform_freeze enable row level security;

-- Belt-and-suspenders: explicitly REVOKE from the non-privileged roles so a
-- future accidental GRANT/policy cannot silently expose the flag. service_role
-- is unaffected (it bypasses RLS and these grants).
revoke all on table public.platform_freeze from anon, authenticated;
