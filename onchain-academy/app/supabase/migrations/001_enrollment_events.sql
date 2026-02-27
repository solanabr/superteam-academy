CREATE TABLE IF NOT EXISTS enrollment_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN ('enroll','complete_lesson','finalize_course')),
  wallet text NOT NULL,
  course_id text NOT NULL,
  lesson_index integer,
  signature text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_enrollment_events_created ON enrollment_events(created_at);
CREATE INDEX IF NOT EXISTS idx_enrollment_events_course ON enrollment_events(course_id);
