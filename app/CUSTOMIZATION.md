# Customization Guide

Theming, localization, gamification extensions, branding.

## Theming

### CSS Variables

Design system uses CSS variables for colors, spacing, typography.

**File:** `src/app/globals.css`

```css
:root {
  /* Brand colors */
  --brand-primary: 220 100% 50%;      /* HSL */
  --brand-secondary: 280 80% 60%;

  /* Semantic colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode overrides */
}
```

### Changing Brand Colors

Edit HSL values in `globals.css`:

```css
:root {
  --brand-primary: 280 100% 60%;    /* Purple */
  --brand-secondary: 45 100% 50%;   /* Gold */
}
```

Use in components:
```tsx
<div className="bg-brand-primary text-white">
  Superteam Academy
</div>
```

### Dark/Light Mode

Toggle via next-themes:

```tsx
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

**Auto-detect system preference:**
```typescript
// layout.tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

### Tailwind Customization

**File:** `tailwind.config.ts`

```typescript
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... up to 950
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  }
}
```

Usage:
```tsx
<h1 className="font-sans text-brand-500 animate-pulse-slow">
  Welcome
</h1>
```

### Typography

Define font variables in `layout.tsx`:

```tsx
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

## Internationalization (i18n)

### Adding a New Language

**1. Create message file:**

`src/messages/fr.json`:
```json
{
  "common": {
    "welcome": "Bienvenue",
    "courses": "Cours"
  },
  "courses": {
    "enroll": "S'inscrire",
    "start": "Commencer"
  }
}
```

**2. Update i18n config:**

`src/i18n.ts`:
```typescript
export const locales = ['en', 'pt-BR', 'es', 'fr'] as const;
export const defaultLocale = 'en';
```

**3. Update middleware:**

`middleware.ts`:
```typescript
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'pt-BR', 'es', 'fr'],
  defaultLocale: 'en'
});
```

**4. Test:**
```
http://localhost:3000/fr/courses
```

### Translation Guidelines

**Keep keys organized:**
```json
{
  "navigation": { /* nav items */ },
  "courses": { /* course-related */ },
  "lessons": { /* lesson-related */ },
  "dashboard": { /* dashboard */ },
  "errors": { /* error messages */ }
}
```

**Use plural forms:**
```json
{
  "courseCount": "{count, plural, =0 {No courses} =1 {1 course} other {# courses}}"
}
```

Usage:
```tsx
const t = useTranslations('common');
<p>{t('courseCount', { count: 5 })}</p>
// Renders: "5 courses"
```

**Rich text formatting:**
```json
{
  "welcome": "Welcome <bold>{name}</bold>!"
}
```

Usage:
```tsx
const t = useTranslations('common');
<p>{t.rich('welcome', {
  name: user.name,
  bold: (chunks) => <strong>{chunks}</strong>
})}</p>
```

## Gamification Extensions

### Achievements Bitmask

Achievements stored as 32-bit bitmask in Supabase.

**Current achievements (first 8 bits):**
- `0b00000001` - First lesson completed
- `0b00000010` - First course completed
- `0b00000100` - 10-day streak
- `0b00001000` - 1000 XP earned
- `0b00010000` - Code challenge master (10 challenges)
- `0b00100000` - Social learner (5 forum posts)
- `0b01000000` - Early adopter
- `0b10000000` - Credential collector (3 credentials)

**Add new achievement:**

1. Define constant:
```typescript
// lib/gamification/achievements.ts
export const ACHIEVEMENTS = {
  FIRST_LESSON: 1 << 0,
  FIRST_COURSE: 1 << 1,
  // ... existing
  NIGHT_OWL: 1 << 8,        // Complete lesson at night
  SPEED_RUNNER: 1 << 9,     // Complete course in < 1 day
} as const;
```

2. Award achievement:
```typescript
import { gamificationService } from '@/lib/services';

await gamificationService.unlockAchievement(
  userId,
  ACHIEVEMENTS.NIGHT_OWL
);
```

3. Check if unlocked:
```typescript
const userAchievements = await gamificationService.getUserAchievements(userId);
const hasNightOwl = (userAchievements & ACHIEVEMENTS.NIGHT_OWL) !== 0;
```

4. Add metadata:
```typescript
// lib/gamification/metadata.ts
export const ACHIEVEMENT_METADATA = {
  [ACHIEVEMENTS.NIGHT_OWL]: {
    name: 'Night Owl',
    description: 'Complete a lesson between 10 PM and 6 AM',
    icon: '🦉',
    xpReward: 50,
  },
  // ...
};
```

### XP Sources

**Current XP sources:**
- Lesson completion (on-chain, per `Course.xp_per_lesson`)
- Course finalization bonus (on-chain, 10% of total)
- Daily challenge completion (off-chain, Supabase)
- Code challenge completion (off-chain, Supabase)

**Add new XP source:**

1. Award XP via service:
```typescript
await gamificationService.awardXP(userId, {
  amount: 25,
  source: 'forum_post',
  metadata: { postId: '...' }
});
```

2. Sync to on-chain (optional):
If XP should be reflected on-chain, backend service must mint Token-2022 XP tokens.

3. Track in analytics:
```typescript
posthog.capture('xp_awarded', {
  userId,
  amount: 25,
  source: 'forum_post'
});
```

### Daily Challenges

**Schema (Supabase):**
```sql
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  challenge_type VARCHAR NOT NULL,  -- 'lesson' | 'quiz' | 'forum'
  target_id VARCHAR,                -- lessonId, quizId, etc.
  xp_reward INTEGER NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE user_daily_progress (
  user_id UUID REFERENCES auth.users(id),
  challenge_id UUID REFERENCES daily_challenges(id),
  completed_at TIMESTAMP,
  PRIMARY KEY (user_id, challenge_id)
);
```

**Generate daily challenge:**
```typescript
// scripts/generate-daily-challenge.ts
import { supabase } from '@/lib/supabase/client';

const challenge = {
  date: new Date().toISOString().split('T')[0],
  challenge_type: 'lesson',
  target_id: 'random-lesson-id',
  xp_reward: 50,
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
};

await supabase.from('daily_challenges').insert(challenge);
```

Run via cron (Vercel Cron or GitHub Actions):
```yaml
# .github/workflows/daily-challenge.yml
name: Generate Daily Challenge
on:
  schedule:
    - cron: '0 0 * * *'  # Midnight UTC
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm tsx scripts/generate-daily-challenge.ts
```

**Display in UI:**
```tsx
const { data: challenge } = useQuery({
  queryKey: ['daily-challenge'],
  queryFn: async () => {
    const { data } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('date', new Date().toISOString().split('T')[0])
      .single();
    return data;
  }
});
```

## Adding New Tracks/Courses

### 1. Create On-Chain Collection

Metaplex Core collection for credentials:

```bash
# Using Metaplex CLI or TypeScript
metaplex create-collection \
  --name "Solana Advanced Track" \
  --uri https://arweave.net/metadata.json
```

Save collection address for Sanity.

### 2. Create Track in Sanity

1. Navigate to Sanity Studio
2. Create new Track
3. Set `trackId` (e.g., `solana-advanced`)
4. Set `collectionAddress` from step 1
5. Publish

### 3. Create Courses in Sanity

Follow [CMS_GUIDE.md](./CMS_GUIDE.md) workflow.

### 4. Create On-Chain Course PDA

For each course:

```bash
anchor run create-course -- \
  --course-id advanced-programs \
  --track-id solana-advanced \
  --xp-per-lesson 200 \
  --lesson-count 12
```

### 5. Update Frontend Routes (if needed)

Dynamic routes automatically handle new courses:
- `/courses` - Catalog (all courses)
- `/courses/[courseId]` - Course detail
- `/courses/[courseId]/lessons/[lessonSlug]` - Lesson view

No code changes required if using standard structure.

## Custom Branding

### Logo

Replace files:
- `public/logo.svg` - Main logo (light mode)
- `public/logo-dark.svg` - Dark mode logo
- `public/favicon.ico` - Favicon
- `public/apple-touch-icon.png` - iOS icon
- `public/og-image.png` - Social share image

Update metadata:
```typescript
// layout.tsx
export const metadata = {
  title: 'Your Academy',
  description: 'Learn blockchain development',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    images: ['/og-image.png'],
  }
};
```

### Footer Links

Edit `components/Footer.tsx`:
```tsx
const links = {
  product: [
    { name: 'Courses', href: '/courses' },
    { name: 'Community', href: '/community' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
  ],
  legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
  ]
};
```

### Navigation

Edit `components/Navigation.tsx`:
```tsx
const navItems = [
  { name: 'Courses', href: '/courses' },
  { name: 'Leaderboard', href: '/leaderboard' },
  { name: 'Community', href: '/community' },
  { name: 'About', href: '/about' },
];
```

### Email Templates

Transactional emails (course completion, credential issued) use React Email.

**File:** `emails/CourseCompleted.tsx`

```tsx
import { Html, Text, Button } from '@react-email/components';

export default function CourseCompleted({ userName, courseName }) {
  return (
    <Html>
      <Text>Congratulations {userName}!</Text>
      <Text>You've completed {courseName}</Text>
      <Button href="https://academy.example.com/credentials">
        View Credential
      </Button>
    </Html>
  );
}
```

Send via API route:
```typescript
import { Resend } from 'resend';
import CourseCompleted from '@/emails/CourseCompleted';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'academy@example.com',
  to: user.email,
  subject: 'Course Completed!',
  react: CourseCompleted({ userName: user.name, courseName: course.title })
});
```

## Analytics Customization

### Custom PostHog Events

```typescript
import { usePostHog } from 'posthog-js/react';

const posthog = usePostHog();

// Track custom event
posthog.capture('lesson_rating', {
  lessonId: 'intro-solana',
  rating: 5,
  userId: user.id
});

// User properties
posthog.identify(user.id, {
  email: user.email,
  enrolledCourses: 3,
  totalXP: 1500
});
```

### Feature Flags

```typescript
const showNewDashboard = posthog.isFeatureEnabled('new-dashboard');

return showNewDashboard ? <NewDashboard /> : <OldDashboard />;
```

Enable/disable in PostHog dashboard.

### Custom GA4 Events

```typescript
import { event } from '@/lib/analytics/gtag';

event({
  action: 'course_enroll',
  category: 'engagement',
  label: courseId,
  value: 1
});
```

## PWA Customization

**File:** `public/manifest.json`

```json
{
  "name": "Your Academy",
  "short_name": "Academy",
  "description": "Learn blockchain development",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service worker config:** `next.config.mjs`

```javascript
import withPWA from 'next-pwa';

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});
```

## Environment-Specific Config

**Development:**
```env
USE_MOCKS=true
NEXT_PUBLIC_SOLANA_RPC_URL=http://localhost:8899
```

**Staging:**
```env
USE_MOCKS=false
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Production:**
```env
USE_MOCKS=false
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=...
```

Switch via `process.env.NODE_ENV` or custom env var.

---

For content management, see [CMS_GUIDE.md](./CMS_GUIDE.md). For architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).
