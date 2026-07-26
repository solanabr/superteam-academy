-- ============================================
-- Lock down deployed_programs writes to service_role
-- ============================================
-- The authenticated INSERT/UPDATE policies let any signed-in user write
-- deployment rows directly via the Supabase client (devtools), bypassing the
-- on-chain verification in /api/deploy/save (#560 / LX-E1) entirely: a
-- learner could claim ANYONE's public program id as their own deploy and
-- farm the capstone credential gate (LX-E2). deployed_programs was the lone
-- trusted table still client-writable — user_progress, enrollments, user_xp,
-- and user_achievements are all service_role-write-only.
--
-- The only legitimate writer is /api/deploy/save, which now upserts through
-- the service_role admin client (bypasses RLS) after verifying on-chain that
-- the program is a live, executable upgradeable program whose upgrade
-- authority is the learner's linked wallet. The SELECT policy ("Users can
-- view their own deployments") is intentionally left in place — the GET
-- handler and any client reads use it. Mirrors the pending_onchain_actions
-- pattern (service_role-only writes, own-row SELECT) and the lockdowns in
-- 20260624164418_restrict_user_progress_writes.sql /
-- 20260624190000_lockdown_enrollments_rls.sql.

DROP POLICY IF EXISTS "Users can insert their own deployments" ON deployed_programs;
DROP POLICY IF EXISTS "Users can update their own deployments" ON deployed_programs;
