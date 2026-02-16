# Customization Guide

## Theme Customization

### Color Palette

The theme is defined in `src/app/globals.css` using CSS custom properties. To customize:

#### Dark Mode Colors (Primary)

```css
.dark {
  --background: oklch(0.13 0.015 280);  /* Deep purple-black */
  --foreground: oklch(0.95 0.01 280);   /* Light text */
  --primary: oklch(0.65 0.28 293);      /* Vibrant purple */
  --card: oklch(0.17 0.02 280);         /* Elevated surface */
  /* ... */
}
```

#### RPG Color Tokens

```css
@theme inline {
  --color-quest-gold: #F0B90B;     /* XP, rewards */
  --color-quest-purple: #9945FF;   /* Primary accent, Solana */
  --color-quest-cyan: #14F195;     /* Health, success */
  --color-quest-magenta: #E42575;  /* NFT track */
  --color-quest-blue: #00D1FF;     /* Info, links */
  --color-quest-orange: #FF6B35;   /* Rust, streaks */
}
```

### Glow Effects

To add RPG glow to any element:

```html
<div class="glow-purple">Purple glow box shadow</div>
<div class="glow-cyan">Cyan glow box shadow</div>
<div class="glow-gold">Gold glow box shadow</div>
<span class="glow-text-purple">Glowing text</span>
```

### Animated Borders

```html
<div class="border-animated rounded-lg">
  Animated gradient border
</div>
```

## Adding Languages

### 1. Create Translation File

Copy `src/i18n/messages/en.json` and translate all strings:

```bash
cp src/i18n/messages/en.json src/i18n/messages/fr.json
```

### 2. Register Language

Add to `SUPPORTED_LANGUAGES` in `src/config/constants.ts`:

```typescript
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },  // New!
] as const;
```

### 3. Update Type

```typescript
// src/types/index.ts
export interface UserPreferences {
  language: 'en' | 'pt-BR' | 'es' | 'fr';  // Add new code
  // ...
}
```

## Extending Gamification

### Adding Achievements

1. Define in `src/config/constants.ts`:

```typescript
export const ACHIEVEMENTS = {
  // ... existing
  NEW_ACHIEVEMENT: {
    id: 'new_achievement',
    name: 'Achievement Name',
    description: 'How to unlock',
    icon: '🏆',
    category: 'progress' as const,
    rarity: 'rare' as const,
  },
};
```

2. Achievement bitmap supports up to 256 achievements (uint256)

### Adding Learning Tracks

1. Add to `LearningTrack` type in `src/types/index.ts`:

```typescript
export type LearningTrack =
  | 'solana-fundamentals'
  | 'rust-mastery'
  | 'new-track';  // Add here
```

2. Add track info:

```typescript
export const TRACK_INFO: Record<LearningTrack, TrackInfo> = {
  // ... existing
  'new-track': {
    name: 'New Track',
    icon: '🆕',
    color: '#FF0000',
    description: 'Description of the track',
  },
};
```

### Modifying XP Values

All XP configuration is in `src/config/constants.ts`:

```typescript
export const XP_CONFIG = {
  lessonComplete: { beginner: 10, intermediate: 25, ... },
  challengeComplete: { easy: 25, medium: 50, ... },
  courseComplete: { beginner: 500, intermediate: 1000, ... },
  dailyStreakBonus: 10,
  firstDailyCompletion: 25,
};
```

### Changing the Level Formula

The default formula is: `Level = floor(sqrt(xp / 100))`

To change it, modify `XP_CONFIG.calculateLevel` in `src/config/constants.ts`.

## Adding New Pages

1. Create a new directory under `src/app/(app)/`:

```bash
mkdir -p src/app/(app)/new-page
```

2. Create `page.tsx`:

```tsx
'use client';

export default function NewPage() {
  return <div>New Page Content</div>;
}
```

3. Add to navigation in `src/components/layout/header.tsx` if needed.

## Connecting On-Chain Program

To replace the stubbed `LocalLearningProgressService` with an on-chain implementation:

1. Create `src/services/onchain-learning-progress.ts`
2. Implement the `LearningProgressService` interface
3. Use Anchor client to call program instructions
4. Update the service import where needed

```typescript
import { LearningProgressService } from '@/types';
import { Program } from '@coral-xyz/anchor';

export class OnChainLearningProgressService implements LearningProgressService {
  constructor(private program: Program) {}

  async getXP(userId: string): Promise<number> {
    // Read XP token balance using SPL Token
    const tokenAccount = await getAssociatedTokenAddress(xpMint, userPublicKey);
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    return Number(balance.value.amount);
  }

  async getCredentials(wallet: PublicKey): Promise<Credential[]> {
    // Use Helius DAS API to get cNFTs
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=KEY`, {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'get-assets',
        method: 'getAssetsByOwner',
        params: { ownerAddress: wallet.toBase58() },
      }),
    });
    // Parse and return credentials
  }

  // ... implement other methods
}
```

## Forking for Your Community

Solana Quest is designed to be forkable. To customize for your community:

1. **Fork the repo**
2. **Update branding** in `src/config/constants.ts` (APP_CONFIG)
3. **Customize colors** in `src/app/globals.css`
4. **Add your courses** via the CMS
5. **Deploy** to Vercel/Netlify
6. **Connect** to your own on-chain program (optional)
