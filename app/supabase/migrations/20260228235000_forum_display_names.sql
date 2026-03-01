ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS author_display_name TEXT;
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS author_display_name TEXT;
