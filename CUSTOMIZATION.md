# Platform Customization Guide

Superteam Academy is designed with customization in mind. This guide covers how to adapt the platform's visual design, add new languages, extend gamification features, and customize the learning experience.

## Table of Contents

- [Theme Customization](#theme-customization)
- [Branding](#branding)
- [Internationalization (i18n)](#internationalization-i18n)
- [Gamification](#gamification)
- [Content Types](#content-types)
- [Email Templates](#email-templates)
- [Analytics](#analytics)

## Theme Customization

The platform uses a nature-forward, premium design system built with Tailwind CSS 4 and CSS custom properties.

### Design System

**Core Principles:**

- Earthy, warm color palette
- Premium, accessible typography
- Nature-forward visual language
- 60/30/10 color distribution rule

### Color Tokens

Edit `onchain-academy/apps/academy/app/globals.css` to modify the color system:

```css
@layer base {
  :root {
    /* Primary Colors */
    --cream: 45 65% 88%; /* Background - Warm Cream #f7eacb */
    --green-primary: 158 100% 27%; /* Primary CTA - Emerald Green #008c4c */
    --green-dark: 145 40% 30%; /* Secondary UI - Forest Green #2f6b3f */
    --amber: 48 100% 63%; /* Accent - Amber Yellow #ffd23f */
    --charcoal: 140 25% 11%; /* Text - Dark Charcoal #1b231d */

    /* Semantic Colors */
    --green-mint: 165 100% 85%; /* Success states */
    --amber-dark: 38 92% 50%; /* Warning states */
    --red-error: 0 84% 60%; /* Error states */

    /* Neutral Tones */
    --border-warm: 40 20% 85%; /* Borders and dividers */
    --text-secondary: 140 15% 40%; /* Secondary text */
    --text-tertiary: 140 10% 60%; /* Tertiary text */
  }
}
```

### Typography

**Font Families:**

- **Display**: `font-display` - Used for headings and hero text
- **UI**: `font-ui` - Used for body text and interface elements
- **Mono**: `font-mono` - Used for code blocks

**Customizing Fonts:**

1. Add font files to `public/fonts/`
2. Update `app/globals.css`:

```css
@font-face {
  font-family: 'YourDisplayFont';
  src: url('/fonts/your-display-font.woff2') format('woff2');
  font-weight: 900;
  font-display: swap;
}

@layer base {
  :root {
    --font-display: 'YourDisplayFont', system-ui, sans-serif;
  }
}
```

3. Update `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        ui: ['var(--font-ui)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
}
```

### Component Styling

**Shadcn UI Components:**

Components are located in `components/ui/`. Customize by editing individual component files or updating the base styles in `globals.css`.

**Example: Customizing Button Variants**

Edit `components/ui/button.tsx`:

```typescript
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-ui font-medium transition-all',
  {
    variants: {
      variant: {
        default: 'bg-green-primary text-cream hover:bg-green-dark',
        secondary: 'bg-amber text-charcoal hover:bg-amber-dark',
        outline:
          'border-2 border-green-primary text-green-primary hover:bg-green-primary/10',
        // Add your custom variant
        custom: 'bg-gradient-to-r from-green-primary to-green-dark text-cream',
      },
    },
  },
)
```

### Dark Mode

The platform supports dark mode via `next-themes`. Customize dark mode colors:

```css
@layer base {
  .dark {
    --cream: 140 25% 11%; /* Dark background */
    --charcoal: 45 65% 88%; /* Light text */
    --green-primary: 158 100% 35%; /* Adjusted green */
    /* ... other dark mode overrides */
  }
}
```

### Responsive Design

**Breakpoints:**

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Usage:**

```tsx
<div className='px-4 md:px-8 lg:px-12'>
  <h1 className='text-2xl md:text-4xl lg:text-6xl'>Responsive Heading</h1>
</div>
```

## Branding

### Logo and Favicon

**Logo:**

1. Add logo files to `public/images/`
2. Update logo component in `components/Logo.tsx`
3. Use in navigation: `components/Navigation.tsx`

**Favicon:**

1. Generate favicon set using [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Place files in `public/`
3. Update `app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: 'Your Academy Name',
  description: 'Your academy description',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}
```

### Site Metadata

Update `app/layout.tsx` for SEO and social sharing:

```tsx
export const metadata: Metadata = {
  title: {
    default: 'Your Academy',
    template: '%s | Your Academy',
  },
  description: 'Learn web3 development on Solana',
  keywords: ['solana', 'web3', 'blockchain', 'education'],
  authors: [{ name: 'Your Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://youracademy.com',
    siteName: 'Your Academy',
    images: [
      {
        url: 'https://youracademy.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Your Academy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@youracademy',
    creator: '@youracademy',
  },
}
```

### Custom Domain

**Vercel:**

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update environment variables:
   ```env
   BETTER_AUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_BETTER_AUTH_URL=https://yourdomain.com
   ```

## Internationalization (i18n)

The platform uses Next-Intl for internationalization with support for English, Spanish, and Portuguese.

### Adding a New Language

#### 1. Update Payload Configuration

Edit `payload.config.ts`:

```typescript
export default buildConfig({
  localization: {
    locales: ['en', 'es', 'pt', 'fr'], // Add 'fr' for French
    defaultLocale: 'en',
    fallback: true,
  },
})
```

#### 2. Create Translation File

Create `messages/fr.json`:

```json
{
  "navigation": {
    "courses": "Cours",
    "dashboard": "Tableau de bord",
    "leaderboard": "Classement",
    "settings": "Paramètres"
  },
  "auth": {
    "signIn": "Se connecter",
    "signUp": "S'inscrire",
    "signOut": "Se déconnecter"
  },
  "courses": {
    "enroll": "S'inscrire",
    "continue": "Continuer",
    "completed": "Terminé"
  }
  // ... add all translations
}
```

#### 3. Update Routing Configuration

Edit `middleware.ts`:

```typescript
export default createMiddleware({
  locales: ['en', 'es', 'pt', 'fr'],
  defaultLocale: 'en',
})
```

#### 4. Add Locale Switcher

Update `components/LocaleSwitcher.tsx`:

```typescript
const locales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
]
```

#### 5. Translate Content

In Payload CMS:

1. Navigate to Collections (Courses, Modules, Lessons)
2. Edit each document
3. Switch to the new locale tab
4. Add translations for all localized fields

### Translation Best Practices

- Keep translations consistent across the platform
- Use professional translators for accuracy
- Test all UI strings in each language
- Consider text expansion (some languages are longer)
- Use ICU message format for plurals and variables:

```json
{
  "xpEarned": "{count, plural, =0 {No XP earned} one {# XP earned} other {# XP earned}}"
}
```

## Gamification

### XP Rewards

**Adjusting XP Values:**

1. **Lesson-Level XP** - Edit in Payload CMS:
   - Navigate to Lessons collection
   - Edit lesson
   - Update `xpReward` field (10-100 typical)

2. **Course-Level XP** - Edit in Payload CMS:
   - Navigate to Courses collection
   - Edit course
   - Update `xpReward` field (1000-5000 typical)

3. **Action-Based XP** - Edit in `actions/xp.actions.ts`:

```typescript
// Award XP for specific actions
export async function awardSignupXP(betterAuthUserId: string) {
  return awardXP({
    betterAuthUserId,
    amount: 100, // Change signup bonus
    source: 'account-setup',
  })
}

// Add new XP sources
export async function awardStreakXP(
  betterAuthUserId: string,
  streakDays: number,
) {
  const bonusXP = streakDays * 10 // 10 XP per day
  return awardXP({
    betterAuthUserId,
    amount: bonusXP,
    source: 'daily-streak',
  })
}
```

### Achievements

**Creating New Achievements:**

1. **Define Achievement** in `libs/constants/achievements.ts`:

```typescript
export const ACHIEVEMENTS = {
  FIRST_COURSE: {
    id: 'first-course',
    name: 'First Steps',
    description: 'Complete your first course',
    xpReward: 500,
    icon: '🎓',
  },
  SPEED_LEARNER: {
    id: 'speed-learner',
    name: 'Speed Learner',
    description: 'Complete a course in under 24 hours',
    xpReward: 1000,
    icon: '⚡',
  },
  // Add your achievement
  PERFECT_SCORE: {
    id: 'perfect-score',
    name: 'Perfectionist',
    description: 'Get 100% on all quizzes in a course',
    xpReward: 750,
    icon: '💯',
  },
}
```

2. **Implement Achievement Logic** in `services/achievements.service.ts`:

```typescript
export async function checkAchievements(
  userId: string,
  context: {
    courseCompleted?: boolean
    quizScore?: number
    // ... other context
  },
) {
  const achievements = []

  // Check for perfect score achievement
  if (context.quizScore === 100) {
    achievements.push(ACHIEVEMENTS.PERFECT_SCORE)
  }

  // Award achievements
  for (const achievement of achievements) {
    await awardAchievement(userId, achievement)
  }
}
```

3. **Award NFT Credential** (optional):

Update smart contract to mint achievement NFT:

```rust
// In programs/onchain-academy/src/instructions/award_achievement.rs
pub fn award_achievement(
    ctx: Context<AwardAchievement>,
    achievement_id: String,
) -> Result<()> {
    // Mint Metaplex Core NFT
    // Set metadata with achievement details
    Ok(())
}
```

### Leaderboard Customization

**Time Periods:**

Edit `services/leaderboard.service.ts`:

```typescript
export type LeaderboardPeriod = 'all-time' | 'monthly' | 'weekly' | 'daily'

// Add custom period
export async function getLeaderboard(period: LeaderboardPeriod = 'all-time') {
  let startDate: Date | undefined

  switch (period) {
    case 'daily':
      startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
      break
    // ... other periods
  }

  // Query XP records
}
```

**Leaderboard Categories:**

Add category-specific leaderboards:

```typescript
export async function getCategoryLeaderboard(
  category: 'defi' | 'nfts' | 'security',
  period: LeaderboardPeriod = 'all-time',
) {
  // Filter XP by course category
  // Return ranked users
}
```

### Streaks

**Streak Bonuses:**

Edit `services/streaks.service.ts`:

```typescript
export async function updateStreak(userId: string) {
  const streak = await getStreak(userId)

  // Award bonus XP for milestones
  if (streak.currentStreak === 7) {
    await awardXP({ userId, amount: 100, source: 'week-streak' })
  }
  if (streak.currentStreak === 30) {
    await awardXP({ userId, amount: 500, source: 'month-streak' })
  }

  // Add custom milestones
  if (streak.currentStreak === 100) {
    await awardXP({ userId, amount: 2000, source: 'century-streak' })
    await awardAchievement(userId, ACHIEVEMENTS.CENTURY_CLUB)
  }
}
```

## Content Types

### Adding Custom Lesson Types

1. **Update Lesson Schema** in `collections/Lessons.ts`:

```typescript
{
  name: 'type',
  type: 'select',
  required: true,
  options: [
    { label: 'Video', value: 'video' },
    { label: 'Reading', value: 'reading' },
    { label: 'Code Challenge', value: 'code_challenge' },
    { label: 'Quiz', value: 'quiz' },
    { label: 'Hybrid', value: 'hybrid' },
    // Add custom type
    { label: 'Live Session', value: 'live_session' },
  ],
}
```

2. **Add Content Fields** in `collections/LessonContents.ts`:

```typescript
{
  name: 'liveSession',
  type: 'group',
  admin: {
    condition: (data, siblingData) => siblingData?.lesson?.type === 'live_session',
  },
  fields: [
    { name: 'meetingUrl', type: 'text' },
    { name: 'scheduledDate', type: 'date' },
    { name: 'duration', type: 'number' },
    { name: 'maxParticipants', type: 'number' },
  ],
}
```

3. **Create Renderer Component** in `components/lesson/LiveSessionLesson.tsx`:

```tsx
export function LiveSessionLesson({
  content,
}: {
  content: LiveSessionContent
}) {
  return (
    <div className='space-y-4'>
      <h2>Live Session</h2>
      <p>Scheduled: {new Date(content.scheduledDate).toLocaleString()}</p>
      <Button asChild>
        <a href={content.meetingUrl} target='_blank'>
          Join Session
        </a>
      </Button>
    </div>
  )
}
```

4. **Update Lesson Renderer** in `app/(frontend)/[locale]/courses/[slug]/lessons/[lessonId]/page.tsx`:

```tsx
function renderLessonContent(lesson: Lesson, content: LessonContent) {
  switch (lesson.type) {
    case 'live_session':
      return <LiveSessionLesson content={content.liveSession} />
    // ... other types
  }
}
```

### Custom Block Types

Add custom content blocks to Lesson Contents:

```typescript
// In collections/LessonContents.ts
{
  name: 'blockType',
  type: 'select',
  options: [
    { label: 'Markdown', value: 'markdown' },
    { label: 'Video', value: 'video' },
    { label: 'Callout', value: 'callout' },
    // Add custom block
    { label: 'Interactive Demo', value: 'interactive_demo' },
  ],
}
```

## Email Templates

### Customizing Email Templates

Email templates are located in `emails/` (create this directory if it doesn't exist).

**Example: Welcome Email**

Create `emails/WelcomeEmail.tsx`:

```tsx
import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
} from '@react-email/components'

export function WelcomeEmail({
  name,
  dashboardUrl,
}: {
  name: string
  dashboardUrl: string
}) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f7eacb', fontFamily: 'sans-serif' }}>
        <Container style={{ padding: '40px' }}>
          <Text
            style={{ fontSize: '24px', fontWeight: 'bold', color: '#1b231d' }}
          >
            Welcome to Your Academy, {name}!
          </Text>
          <Text style={{ fontSize: '16px', color: '#2f6b3f' }}>
            You've earned 100 XP for signing up. Start learning today!
          </Text>
          <Button
            href={dashboardUrl}
            style={{
              backgroundColor: '#008c4c',
              color: '#f7eacb',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            Go to Dashboard
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
```

**Sending Emails:**

Use a service like Resend or SendGrid:

```typescript
import { Resend } from 'resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(user: User) {
  await resend.emails.send({
    from: 'academy@yourdomain.com',
    to: user.email,
    subject: 'Welcome to Your Academy!',
    react: WelcomeEmail({
      name: user.name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard`,
    }),
  })
}
```

## Analytics

### Custom Events

**PostHog Events:**

Add custom tracking in `libs/analytics.ts`:

```typescript
import posthog from 'posthog-js'

export const analytics = {
  // Existing events
  trackCourseEnroll: (courseId: string) => {
    posthog.capture('course_enrolled', { courseId })
  },

  // Add custom events
  trackQuizAttempt: (lessonId: string, score: number) => {
    posthog.capture('quiz_attempted', { lessonId, score })
  },

  trackAchievementUnlocked: (achievementId: string) => {
    posthog.capture('achievement_unlocked', { achievementId })
  },

  trackStreakMilestone: (days: number) => {
    posthog.capture('streak_milestone', { days })
  },
}
```

**Usage in Components:**

```tsx
import { analytics } from '@/libs/analytics'

function QuizComponent() {
  const handleSubmit = (score: number) => {
    analytics.trackQuizAttempt(lessonId, score)
    // ... rest of logic
  }
}
```

### Custom Dashboards

Create custom analytics dashboards in PostHog:

1. Go to PostHog dashboard
2. Create new insight
3. Add custom events
4. Create dashboard with multiple insights

## Advanced Customization

### Custom Smart Contract Instructions

Add new instructions to the Anchor program:

1. **Define Instruction** in `programs/onchain-academy/src/lib.rs`:

```rust
pub fn custom_instruction(
    ctx: Context<CustomInstruction>,
    param: u64,
) -> Result<()> {
    // Your logic here
    Ok(())
}
```

2. **Create Context** in `programs/onchain-academy/src/instructions/`:

```rust
#[derive(Accounts)]
pub struct CustomInstruction<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    // ... other accounts
}
```

3. **Update Frontend Hook** in `hooks/useOnchainAcademy.ts`:

```typescript
export function useOnchainAcademy() {
  // ... existing methods

  const customInstruction = async (param: number) => {
    const tx = await program.methods
      .customInstruction(new BN(param))
      .accounts({
        user: wallet.publicKey,
        // ... other accounts
      })
      .rpc()

    return tx
  }

  return { ...existing, customInstruction }
}
```

### Custom API Routes

Add custom API endpoints in `app/(frontend)/api/`:

```typescript
// app/(frontend)/api/custom/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/libs/payload'

export async function GET(request: NextRequest) {
  const payload = await getPayloadClient()

  // Your custom logic
  const data = await payload.find({
    collection: 'courses',
    // ... custom query
  })

  return NextResponse.json(data)
}
```

## Best Practices

1. **Test Thoroughly** - Test all customizations across devices and browsers
2. **Maintain Accessibility** - Ensure WCAG 2.1 AA compliance
3. **Document Changes** - Keep internal documentation of customizations
4. **Version Control** - Use Git branches for major customizations
5. **Performance** - Monitor impact on load times and Core Web Vitals
6. **Backup** - Always backup before major changes
7. **Gradual Rollout** - Test with small user group before full deployment

## Support

For customization help:

- Review `ARCHITECTURE.md` for system overview
- Check `CMS_GUIDE.md` for content management
- Open GitHub issue for bugs
- Join Discord for community support

---

Happy customizing! 🎨
