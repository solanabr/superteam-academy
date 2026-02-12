-- Seed achievements
insert into public.achievements (code, title, description, icon, xp_threshold) values
  ('first_lesson', 'First Steps', 'Complete your first lesson', '🎯', 0),
  ('xp_100', 'Rising Star', 'Earn 100 XP', '⭐', 100),
  ('xp_500', 'Knowledge Seeker', 'Earn 500 XP', '🌟', 500),
  ('xp_1000', 'Expert Learner', 'Earn 1000 XP', '💫', 1000),
  ('streak_3', '3-Day Streak', 'Learn for 3 days in a row', '🔥', 0),
  ('streak_7', 'Week Warrior', 'Learn for 7 days in a row', '🔥🔥', 0),
  ('streak_30', 'Monthly Master', 'Learn for 30 days in a row', '🔥🔥🔥', 0),
  ('course_complete', 'Course Conqueror', 'Complete your first course', '🎓', 0),
  ('community_contributor', 'Community Helper', 'Make your first community post', '💬', 0)
on conflict (code) do nothing;

-- Sample courses (will be synced from Sanity)
insert into public.courses (sanity_id, title, slug, description, difficulty, category, estimated_hours, is_published) values
  ('intro-to-solana', 'Introduction to Solana', 'intro-to-solana', 'Learn the fundamentals of Solana blockchain development', 'beginner', 'Blockchain Basics', 8, true),
  ('rust-for-solana', 'Rust Programming for Solana', 'rust-for-solana', 'Master Rust programming essentials for Solana development', 'intermediate', 'Programming', 12, true),
  ('solana-nfts', 'Building NFTs on Solana', 'solana-nfts', 'Create and deploy NFT projects on Solana', 'intermediate', 'Web3 Development', 10, true),
  ('anchor-framework', 'Anchor Framework Deep Dive', 'anchor-framework', 'Build complex Solana programs with Anchor', 'advanced', 'Smart Contracts', 16, true)
on conflict (sanity_id) do nothing;

-- Sample lessons for first course
insert into public.lessons (sanity_id, course_id, title, slug, description, content_type, xp_reward, order_index, estimated_minutes, is_published)
select 
  'lesson-' || c.sanity_id || '-' || l.ord::text,
  c.id,
  l.title,
  l.slug,
  l.description,
  l.content_type,
  l.xp_reward,
  l.ord,
  l.estimated_minutes,
  true
from public.courses c
cross join lateral (
  values 
    (1, 'What is Solana?', 'what-is-solana', 'Introduction to the Solana blockchain', 'video', 10, 15),
    (2, 'Solana Architecture', 'solana-architecture', 'Understanding Solana''s unique architecture', 'article', 15, 20),
    (3, 'Your First Transaction', 'first-transaction', 'Send your first transaction on Solana', 'interactive', 20, 30),
    (4, 'Quiz: Solana Basics', 'quiz-basics', 'Test your knowledge', 'quiz', 25, 10)
) as l(ord, title, slug, description, content_type, xp_reward, estimated_minutes)
where c.sanity_id = 'intro-to-solana'
on conflict (sanity_id) do nothing;
