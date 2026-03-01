-- Add post type and tags to community_posts
ALTER TABLE community_posts ADD COLUMN type TEXT NOT NULL DEFAULT 'post';
ALTER TABLE community_posts ADD COLUMN tags TEXT[] DEFAULT '{}';

-- GIN index for fast tag lookups
CREATE INDEX idx_community_posts_tags ON community_posts USING GIN(tags);
