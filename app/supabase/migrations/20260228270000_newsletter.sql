CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  wallet_address TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_newsletter" ON newsletter_subscribers FOR SELECT USING (true);
CREATE POLICY "anon_insert_newsletter" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_upsert_newsletter" ON newsletter_subscribers FOR UPDATE USING (true);
