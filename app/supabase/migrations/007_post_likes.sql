-- Post likes: user-post many-to-many
CREATE TABLE post_likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY likes_read ON post_likes FOR SELECT USING (true);
CREATE POLICY likes_write ON post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY likes_delete ON post_likes FOR DELETE USING (true);
