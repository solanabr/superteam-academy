-- ============================================
-- On-chain deployments: relocate onChainStatus off Sanity (SP2-B)
-- (spec docs/superpowers/specs/2026-07-10-sp2-remove-sanity-design.md rev 2.1)
-- ============================================
-- SP2 removes Sanity as a runtime data plane. Content moves to a committed
-- bundle (SP2-A); this migration moves the OTHER half — the mutable on-chain
-- sync status that today lives in each managed doc's `onChainStatus` field —
-- into Postgres, where the deploy/deactivate/reactivate routes already have a
-- service-role write path.
--
-- WHY A NEW TABLE (not `deployed_programs`).
-- `deployed_programs` is per-LEARNER practice deploys (UUID pk, user_id FK,
-- own-row RLS). This table is per-CONTENT platform state: one row per synced
-- course (`course-*`) or achievement (`achievement-*`), keyed by the Sanity
-- content `_id` used verbatim as an on-chain PDA seed (memory: never strip ids
-- before PDA seeds). The two never mix — hence a distinct table with a TEXT pk.
--
-- COLUMNS mirror the frozen `onChainStatus` union across both doc kinds:
--   course:      status, course_pda, tx_signature, track_collection_address,
--                is_active, last_synced
--   achievement: status, achievement_pda, collection_address, last_synced
-- Every column is NULLABLE — a course carries no achievement_pda and vice
-- versa, and `is_active` is deliberately tri-state: NULL means "legacy doc, no
-- explicit flag" and the read seam coalesces NULL -> true (mirrors the old
-- GROQ `coalesce(onChainStatus.isActive, true)` gate). Preserving NULL vs an
-- explicit `false` is load-bearing, so the backfill copies the raw value.
-- `track_collection_address` (the credential-mint pointer) and `is_active` were
-- both absent from rev-1's column list — both are carried here.
--
-- SECURITY — house pattern (see `public_user_xp`, 20260703130652).
-- Supabase RLS is ROW-level, not column-level, so a minimal PUBLIC READ SURFACE
-- is a VIEW, not a policy. The base table has RLS enabled with NO policies:
-- only service_role (which bypasses RLS) can read or write it. anon/authenticated
-- get their reads from `public_onchain_deployments`, which exposes ONLY the
-- columns the public visibility gate + catalog reads need
-- (content_id, kind, status, is_active, achievement_pda) — never the raw
-- pubkeys/signatures or `track_collection_address` (a reward-path secret the
-- server reads via service_role). Writes are service_role-only: the four writer
-- sites all use createAdminClient().
--
-- Idempotent: CREATE TABLE / INDEX IF NOT EXISTS, CREATE OR REPLACE VIEW,
-- guarded RLS enable. Re-running is a no-op.

-- (a) The table. content_id is the Sanity `_id` verbatim (`course-*` /
-- `achievement-*`); it doubles as the on-chain PDA seed, so it is never
-- transformed. `kind` partitions the two doc types.
CREATE TABLE IF NOT EXISTS public.onchain_deployments (
  content_id               TEXT PRIMARY KEY,
  kind                     TEXT NOT NULL CHECK (kind IN ('course', 'achievement')),
  status                   TEXT,
  course_pda               TEXT,
  tx_signature             TEXT,
  collection_address       TEXT,
  track_collection_address TEXT,
  achievement_pda          TEXT,
  is_active                BOOLEAN,
  last_synced              TIMESTAMPTZ,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onchain_deployments_kind
  ON public.onchain_deployments (kind);

-- (b) RLS on, no policies: base table is service_role-only (bypasses RLS).
-- Idempotent — re-enabling is a no-op.
ALTER TABLE public.onchain_deployments ENABLE ROW LEVEL SECURITY;

-- (c) Public read surface. Column-level exposure via a view (RLS can't do
-- column-level). Exposes ONLY the gate/catalog columns — no pubkeys, no
-- signatures, no track_collection_address. Owner-privilege view over a
-- service-role-only table; the SELECT column list IS the access control.
-- INVARIANT: never add a raw pubkey / signature / track_collection_address
-- column here — those are reward-path reads served via service_role only.
CREATE OR REPLACE VIEW public.public_onchain_deployments AS
  SELECT content_id, kind, status, is_active, achievement_pda
  FROM public.onchain_deployments;

REVOKE ALL ON public.public_onchain_deployments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_onchain_deployments TO anon, authenticated;
