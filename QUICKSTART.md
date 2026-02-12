# Quick Start Guide

Get Superteam Academy running locally in 5 minutes.

## Prerequisites Check

- ✅ Node.js 18+ installed
- ✅ npm or pnpm installed
- ✅ Supabase project connected (via v0 integration)
- ✅ Git repository connected

## Step 1: Install Dependencies

```bash
npm install
# or
pnpm install
```

This will install all required packages including Next.js 16, React 19, Supabase, Solana libraries, and UI components.

## Step 2: Environment Variables

Your Supabase environment variables should already be configured via the v0 integration. Verify they exist:

```bash
# Check if variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

If not set, create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

## Step 3: Database Setup

The database schema has already been applied to your Supabase project with:
- 10 tables created
- RLS policies enabled
- Triggers configured
- 9 initial achievements seeded

Verify by checking your Supabase dashboard.

## Step 4: Run Development Server

```bash
npm run dev
```

The app will start at [http://localhost:3000](http://localhost:3000)

## Step 5: Test the Application

### Create Your First Account

1. Navigate to http://localhost:3000
2. Click "Get Started" or "Sign Up"
3. Create an account with email/password
4. Check your email for confirmation link
5. Confirm your email
6. Log in to see your dashboard

### Explore the Platform

- **Home Page** (`/`) - Hero, stats, featured courses
- **Course Catalog** (`/courses`) - Browse all courses
- **Dashboard** (`/dashboard`) - Your enrolled courses and progress
- **Profile** (`/profile`) - Your achievements and stats
- **Leaderboard** (`/leaderboard`) - Top learners by XP

## Development Workflow

### Adding Mock Course Data

Since Sanity isn't configured yet, you can add mock courses directly to Supabase:

```sql
-- Run in Supabase SQL Editor
INSERT INTO courses (sanity_id, title, slug, description, difficulty, category, is_published) VALUES
  ('intro-to-solana', 'Introduction to Solana', 'intro-to-solana', 'Learn the basics of Solana blockchain', 'beginner', 'blockchain', true),
  ('rust-fundamentals', 'Rust Fundamentals', 'rust-fundamentals', 'Master Rust programming for Solana', 'intermediate', 'programming', true);

INSERT INTO lessons (sanity_id, course_id, title, slug, content_type, xp_reward, order_index, is_published) VALUES
  ('what-is-solana', (SELECT id FROM courses WHERE slug = 'intro-to-solana'), 'What is Solana?', 'what-is-solana', 'article', 50, 1, true),
  ('solana-accounts', (SELECT id FROM courses WHERE slug = 'intro-to-solana'), 'Understanding Accounts', 'solana-accounts', 'article', 75, 2, true);
```

### Testing Features

1. **Enrollment**: Click "Enroll" on a course
2. **Lesson Completion**: Navigate through lessons
3. **XP System**: Complete lessons to earn XP
4. **Achievements**: Check profile for unlocked achievements
5. **Leaderboard**: See your rank among other users

### Debugging

Use the browser console to see debug logs prefixed with `[v0]`:

```typescript
console.log('[v0] User enrolled:', enrollmentData)
```

## Common Issues

### Issue: "Supabase URL not configured"
**Solution**: Verify environment variables are set in `.env.local`

### Issue: "User not found" after signup
**Solution**: Check your email for confirmation link and verify email

### Issue: "No courses available"
**Solution**: Add mock course data using SQL above, or configure Sanity CMS

### Issue: Authentication redirect loops
**Solution**: Clear browser cookies and try again

### Issue: TypeScript errors
**Solution**: Run `npm install` again to ensure all types are installed

## Next Steps

### 1. Add Content

- Configure Sanity CMS (optional)
- Add course images and thumbnails
- Create lesson content
- Add quiz questions

### 2. Customize Design

- Modify theme colors in `app/globals.css`
- Update navbar logo and branding
- Customize footer links
- Add your own imagery

### 3. Deploy

```bash
# Deploy to Vercel
vercel

# Or use the v0 "Publish" button
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Useful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Type checking
npm run type-check   # Check TypeScript errors

# Supabase (if using locally)
npx supabase start   # Start local Supabase
npx supabase db push # Push schema changes
```

## Project Structure Quick Reference

```
app/
  ├── page.tsx                    # Home page
  ├── courses/                    # Course pages
  ├── dashboard/                  # User dashboard
  ├── profile/                    # User profile
  └── leaderboard/                # Leaderboard

components/
  ├── layout/                     # Navbar, Footer
  ├── course/                     # Course cards
  ├── gamification/               # XP, achievements
  └── ui/                         # Base UI components

lib/
  ├── services/                   # Business logic
  ├── supabase/                   # Database client
  └── types.ts                    # TypeScript types
```

## Getting Help

- Check [README.md](README.md) for detailed documentation
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- Check [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for feature status

---

**Ready to build?** Run `npm run dev` and start learning! 🚀
