-- Course reviews table
CREATE TABLE IF NOT EXISTS course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  display_name TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (course_slug, wallet_address)  -- one review per wallet per course
);

-- Anyone can read reviews
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select" ON course_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON course_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "reviews_update" ON course_reviews FOR UPDATE USING (true);
