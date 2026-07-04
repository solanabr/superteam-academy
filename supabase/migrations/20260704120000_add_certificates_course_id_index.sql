-- Migration: add_certificates_course_id_index
-- The teacher per-course overview (#285) counts certificates by course_id via a
-- head+count query. `certificates` was only indexed on user_id, so that query
-- would sequential-scan as certificate volume grows. Mirror the existing
-- idx_enrollments_course_id and add the missing index.
CREATE INDEX IF NOT EXISTS idx_certificates_course_id
  ON certificates (course_id);
