-- ============================================
-- threads / answers updated_at trigger (P2-8)
-- ============================================
-- updated_at was only set at INSERT (DEFAULT now()) and never advanced, so it
-- always equalled created_at. Maintain it automatically — but ONLY on genuine
-- content edits, not on the denormalized-counter updates (vote_score,
-- answer_count, view_count, last_activity_at, is_solved, accepted_answer_id,
-- deleted_at, slug, is_accepted) that fire constantly via other triggers and
-- service_role writes. Otherwise updated_at would track activity, not edits.

CREATE OR REPLACE FUNCTION set_thread_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.category_id IS DISTINCT FROM OLD.category_id
     OR NEW.course_id IS DISTINCT FROM OLD.course_id
     OR NEW.lesson_id IS DISTINCT FROM OLD.lesson_id THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_answer_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.body IS DISTINCT FROM OLD.body THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_threads_set_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW EXECUTE FUNCTION set_thread_updated_at();

CREATE OR REPLACE TRIGGER trg_answers_set_updated_at
  BEFORE UPDATE ON answers
  FOR EACH ROW EXECUTE FUNCTION set_answer_updated_at();

-- updated_at is now maintained server-side by the triggers above; revoke the
-- author's column-level write so it can't be forged on a non-content update.
REVOKE UPDATE (updated_at) ON threads FROM authenticated;
REVOKE UPDATE (updated_at) ON answers FROM authenticated;
