course has milestones, 
1 milestone has resources  (videos, docs, tests)
after completing a milestone, the user would get a tests
if user pass test, user gets exp and milestone would be marked as completed
and users level would increase
1 level = floor(sqrt(xp/100))


Scope of Work
1. Landing Page (/)
Hero with value proposition and primary CTAs (Sign Up, Explore Courses). Learning path previews with progression indicators. Social proof (testimonials, partner logos, completion stats). Platform feature highlights. Footer with links, social, newsletter signup.

2. Course Catalog (/courses)
Filterable course grid by difficulty, topic, and duration. Curated learning paths (e.g., "Solana Fundamentals", "DeFi Developer"). Course cards with thumbnail, title, description, difficulty, duration, progress %. Full-text search.

3. Course Detail (/courses/[slug])
Course header with title, description, instructor, duration, difficulty. Expandable module/lesson list with completion status. Progress bar and XP to earn. Enrollment CTA. Reviews section (can be static for MVP).

4. Lesson View (/courses/[slug]/lessons/[id])
Split layout: content (left) + code editor (right), resizable. Markdown rendering with syntax highlighting. Previous/Next navigation and module overview. Lesson completion tracking with auto-save. Expandable hints and solution toggle.

5. Code Challenge Interface
Challenge prompt with clear objectives and expected output. Visible test cases with pass/fail indicators. Pre-populated starter code, editable. Run button with loading state and output display. Real-time error messages and success celebration. Mark complete and award XP.

6. User Dashboard (/dashboard)
Current courses with completion % and next lesson. XP balance, level progress bar, and rank. Current streak with calendar visualization. Recent achievements and badges. Recommended next courses. Recent activity feed.

7. User Profile (/profile, /profile/[username])
Profile header with avatar, name, bio, social links, join date. Skill radar chart (Rust, Anchor, Frontend, Security, etc.). Achievement badge showcase. On-chain credential display — evolving cNFTs with track, level, and verification links. Completed courses list. Public/private visibility toggle.

8. Leaderboard (/leaderboard)
Global rankings by XP. Weekly/monthly/all-time filters, filterable by course. User cards with rank, avatar, name, XP, level, streak. Current user highlighted.

9. Settings (/settings)
Profile editing (name, bio, avatar, social links). Account management (email, connected wallets, Google/GitHub). Preferences (language, theme, notifications). Privacy (profile visibility, data export).

10. Certificate/Credential View (/certificates/[id])
Visual certificate with course name, date, and recipient. On-chain verification link (Solana Explorer). Social sharing buttons and downloadable image. NFT details: mint address, metadata, ownership proof.

Gamification System
XP & Leveling
XP comes from on-chain soulbound tokens. Display the balance and derive level: Level = floor(sqrt(totalXP / 100)).

Rewards are tracked on-chain through interaction with the program at github.com/solanabr/superteam-academy. For the stubbed implementation, track XP locally — on-chain minting will be connected later.

XP rewards (configurable per course):

Complete lesson — 10–50 XP (based on difficulty)

Complete challenge — 25–100 XP

Complete course — 500–2,000 XP

Daily streak bonus — 10 XP

First completion of the day — 25 XP

Streaks
Track consecutive days with activity. Visual calendar showing streak history. Streak freeze (bonus feature). Milestone rewards at 7, 30, and 100 days. Streaks are a frontend-managed feature — implement them using local storage or your database/CMS.

Achievements/Badges
Progress — "First Steps", "Course Completer", "Speed Runner"

Streaks — "Week Warrior", "Monthly Master", "Consistency King"

Skills — "Rust Rookie", "Anchor Expert", "Full Stack Solana"

Community — "Helper", "First Comment", "Top Contributor"

Special — "Early Adopter", "Bug Hunter", "Perfect Score"

On-chain, achievements are managed through AchievementType and AchievementReceipt PDAs. Each achievement award mints a soulbound Metaplex Core NFT to the recipient. AchievementTypes support configurable supply caps and XP rewards.