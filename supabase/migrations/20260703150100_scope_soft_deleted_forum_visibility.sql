-- Scope soft-deleted forum content out of the public SELECT (readiness audit).
--
-- The threads/answers "Anyone can view" policies were USING(true), so a
-- soft-deleted row (deleted_at set by soft_delete_thread / soft_delete_answer)
-- stayed publicly readable. Scope the public read to deleted_at IS NULL.
-- Moderation/admin paths use the service-role client, which bypasses RLS, so
-- they still see deleted content for review.

DROP POLICY IF EXISTS "Anyone can view threads" ON threads;
CREATE POLICY "Anyone can view threads"
  ON threads FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Anyone can view answers" ON answers;
CREATE POLICY "Anyone can view answers"
  ON answers FOR SELECT USING (deleted_at IS NULL);
