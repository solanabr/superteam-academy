-- ============================================
-- Restrict user_progress writes to service_role
-- ============================================
-- The authenticated INSERT/UPDATE policies let any user write progress rows
-- directly via the Supabase client (completed = true, arbitrary lesson_id and
-- completed_at), bypassing /api/lessons/complete. get_daily_quest_state() and
-- the lesson-complete auto-finalize path read these rows, so forged progress
-- becomes forged quest completion / course credential => real on-chain XP.
--
-- All legitimate writes already go through service_role (the Helius webhook in
-- lib/helius/event-handlers.ts and the admin resync route), which bypasses RLS.
-- SELECT policies ("Users can view their own progress" / "Public profile
-- progress is viewable") are intentionally left in place.

DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;
