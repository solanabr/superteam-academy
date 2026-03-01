-- Testimonials: user-submitted, admin-curated for homepage
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quote TEXT NOT NULL,
  role TEXT,
  featured BOOLEAN DEFAULT false,
  featured_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_testimonials_featured ON testimonials(featured, featured_order);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY testimonials_read ON testimonials FOR SELECT USING (true);
CREATE POLICY testimonials_write ON testimonials FOR INSERT WITH CHECK (true);

CREATE TRIGGER testimonials_updated_at BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
