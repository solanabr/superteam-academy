# Customization Guide — Superteam Academy

## Theme Customization

### Colors

All design tokens are in `src/app/globals.css` under the `:root` and `.dark` selectors:

```css
:root {
  --primary: 263 85% 63%;      /* Solana purple #9945FF */
  --background: 240 20% 4%;   /* Dark background */
  --card: 240 15% 7%;          /* Card background */
  /* ... */
}
```

**To change the primary brand color:**

1. Update `--primary` in `globals.css`
2. Update `--color-solana-purple` in `@theme`
3. Update hardcoded `#9945FF` occurrences (use global search)

### Typography

Fonts are configured in `src/app/layout.tsx`:

```typescript
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

To change fonts, replace the Google Fonts imports and update `--font-sans` / `--font-mono` in `@theme`.

### XP Level Colors

Edit `src/lib/utils/xp.ts`:

```typescript
export function getLevelColor(level: number): string {
  if (level >= 10) return "#FFD700"; // legendary
  if (level >= 8) return "#FF6B00";  // orange
  if (level >= 6) return "#9945FF";  // epic
  // ...
}
```

## Adding Languages

1. Create `src/messages/{locale}.json` — copy `en.json` as template
2. Add locale to `validLocales` in `src/i18n/request.ts`:
   ```typescript
   const validLocales = ["en", "pt-BR", "es", "fr"];
   ```
3. Add to language switcher in `src/components/layout/navbar.tsx`:
   ```typescript
   const languages = [
     { code: "fr", label: "Français", flag: "🇫🇷" },
     // ...
   ];
   ```
4. Add to settings page language options

## Extending Gamification

### Adding XP Sources

Add to `src/lib/services/learning-progress.ts`:

```typescript
// Quiz completion bonus
async completeQuiz(userId: string, quizId: string, score: number): Promise<void> {
  const xpReward = Math.floor(score * 2); // 2 XP per point
  await this.addXp(userId, xpReward);
}
```

### New Achievement Types

Add to `src/lib/mock-data.ts`:

```typescript
{
  id: "ach-new",
  achievementId: "my-achievement",
  name: "Achievement Name",
  description: "How to unlock this achievement",
  category: "special", // progress | streak | skill | community | special
  xpReward: 250,
  rarity: "rare", // common | rare | epic | legendary
  isUnlocked: false,
}
```

Then trigger via the service:
```typescript
await learningProgressService.awardAchievement(userId, "my-achievement");
```

### Streak Milestones

Edit `src/components/gamification/streak-calendar.tsx`:

```typescript
const milestones = [
  { days: 7, label: "Week", emoji: "🔥" },
  { days: 30, label: "Month", emoji: "⚡" },
  { days: 100, label: "100 Days", emoji: "👑" },
  { days: 365, label: "Year", emoji: "💎" }, // add new milestone
];
```

## Adding New Course Tracks

1. Add to `TRACKS` in `src/lib/mock-data.ts`
2. Create track document in Sanity CMS
3. Add track color and icon

## Connecting to a New Backend

Replace the service implementation:

```typescript
// src/lib/services/learning-progress.ts

class OnChainLearningProgressService implements LearningProgressService {
  async completeLesson(userId: string, courseId: string, lessonIndex: number) {
    // Call your backend endpoint which signs the transaction
    const response = await fetch("/api/complete-lesson", {
      method: "POST",
      body: JSON.stringify({ userId, courseId, lessonIndex }),
    });
    // ...
  }
  
  async getXpBalance(walletAddress: string): Promise<XPBalance> {
    return fetchXpBalance(connection, new PublicKey(walletAddress), XP_MINT);
  }
}

export const learningProgressService = new OnChainLearningProgressService();
```

## Forking for Your Community

1. Fork the repo
2. Update `NEXT_PUBLIC_PROGRAM_ID` if you deploy your own on-chain program
3. Update brand colors (see Theme Customization above)
4. Update logo in `src/components/layout/navbar.tsx`
5. Update social links in `src/components/layout/footer.tsx`
6. Add your community's courses to Sanity CMS
7. Deploy to Vercel

## Performance Optimization

### Image Optimization

All images should use Next.js `<Image>` component:

```tsx
import Image from "next/image";
<Image src={course.thumbnail} alt={course.title} width={800} height={450} />
```

### Bundle Analysis

```bash
npm install @next/bundle-analyzer
ANALYZE=true npm run build
```

### Code Splitting

Heavy components (Monaco Editor) are already lazy-loaded:

```typescript
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
```
