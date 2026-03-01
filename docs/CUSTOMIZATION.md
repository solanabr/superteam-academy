# Customization Guide — Superteam Academy

How to adapt Superteam Academy for your own community, branding, and curriculum.

---

## Theme & Branding

### Colors

All colours are defined as CSS custom properties in `app/globals.css`. To change the platform palette, edit the HSL values:

```css
/* app/app/globals.css */
:root {
  --background: 0 0% 100%;        /* page background */
  --foreground: 240 10% 3.9%;     /* primary text */
  --primary: 142.1 76.2% 36.3%;  /* brand green (Superteam Brazil) */
  --primary-foreground: 355.7 100% 97.3%;
  --card: 0 0% 100%;
  --accent: 240 4.8% 95.9%;
  --muted: 240 4.8% 95.9%;
}

.dark {
  --background: 20 14.3% 4.1%;   /* dark mode background */
  --primary: 142.1 70.6% 45.3%;  /* lighter green for dark mode */
}
```

The default palette uses Superteam Brazil's green. To switch to a different brand colour, change `--primary` in both `:root` and `.dark`.

### Logo & Favicon

| Asset | Location | Recommended Size |
|-------|----------|-----------------|
| Site favicon | `app/public/favicon.ico` | 32×32 |
| Logo PNG | `app/public/images/logo.png` | 200×50 |
| Apple icon | `app/public/apple-touch-icon.png` | 180×180 |
| OG image | `app/public/og-image.png` | 1200×630 |

Replace the files in `app/public/` to rebrand. The Next.js metadata config is in `app/app/layout.tsx`:

```ts
export const metadata: Metadata = {
  title: 'Superteam Academy',          // ← change to your platform name
  description: 'Learn Solana...',
  openGraph: { images: ['/og-image.png'] },
};
```

### Typography

The platform uses **Inter** (body) and a mono font for code. To change fonts, update `app/app/layout.tsx`:

```ts
import { Inter, JetBrains_Mono } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });        // body font
const mono = JetBrains_Mono({ subsets: ['latin'] }); // code font
```

---

## Languages

### Adding a new language

1. **Create translation file:**
   ```bash
   cp app/messages/en.json app/messages/de.json  # example: German
   # Translate all values in de.json
   ```

2. **Register the locale:**
   ```ts
   // app/i18n/routing.ts
   export const routing = defineRouting({
     locales: ['en', 'es', 'pt-BR', 'de'],  // add your locale
     defaultLocale: 'en',
   });
   ```

3. **Update URL slugs for routes** (if your locale uses different words):
   ```ts
   // app/i18n/routing.ts
   pathnames: {
     '/courses': {
       en: '/courses',
       es: '/cursos',
       'pt-BR': '/cursos',
       de: '/kurse',    // ← add
     },
   }
   ```

4. **Add to CMS**: In Sanity Studio, add the new locale to content type fields (see `docs/CMS_GUIDE.md`).

### Changing the default locale

Edit `defaultLocale` in `app/i18n/routing.ts`. The root `/` URL will redirect to the new default.

### Translation file structure

The `app/messages/*.json` files use nested keys. Example:

```json
{
  "Navigation": { "courses": "Courses", "dashboard": "Dashboard" },
  "Landing": { "hero_title": "Learn Solana.", "cta_button": "Get Started" },
  "Courses": { "all_courses": "All Courses", "enroll": "Enroll" }
}
```

Missing keys fall back to English automatically via `next-intl`.

---

## Gamification

### XP Formula

The leveling formula is defined in `app/lib/gamification.ts`:

```ts
// Current formula: Level = floor(sqrt(totalXP / 100))
// XP to next level: (level + 1)² × 100 - currentXP
export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100));
}
```

To adjust progression speed, change the divisor (100). A larger number makes leveling slower.

### XP Rewards

Default reward amounts (configurable via the Anchor program's `create_course` instruction):

| Event | XP |
|-------|-----|
| Lesson completion | 10–50 (set per lesson in CMS) |
| Challenge solved | 25–100 (set per challenge in CMS) |
| Course completion | 500–2,000 (set in on-chain `create_course`) |
| Daily first completion | +10 |
| 7-day streak | +25 bonus |
| 30-day streak | +100 bonus |

### Streak Logic

Streaks are tracked via the `streak_last_active_date` field in the user's profile (stored in the database/local storage, not on-chain). The frontend updates this on every lesson completion:

```ts
// app/app/api/complete-lesson/route.ts
// Update streak on POST
const today = new Date().toDateString();
if (lastActive !== today) {
  const daysSince = Math.floor((Date.now() - lastActiveMs) / 86400000);
  newStreak = daysSince === 1 ? streak + 1 : 1; // reset if gap > 1 day
}
```

### Achievements

Achievements are defined in the Anchor program via `create_achievement_type`. Frontend badges are in `app/lib/achievements.ts`. To add a new achievement:

1. Call `create_achievement_type` with `authority` wallet (on-chain)
2. Add badge SVG to `app/public/badges/`
3. Add metadata to `app/lib/achievements.ts`

---

## Course Tracks

Current tracks and their colors/icons are defined in `app/lib/constants.ts`:

```ts
export const TRACKS = {
  solana:   { label: 'Solana',   color: '#9945FF', icon: 'layers' },
  defi:     { label: 'DeFi',     color: '#14F195', icon: 'trending-up' },
  nft:      { label: 'NFTs',     color: '#FF6B6B', icon: 'image' },
  anchor:   { label: 'Anchor',   color: '#FB923C', icon: 'anchor' },
  security: { label: 'Security', color: '#EF4444', icon: 'shield' },
};
```

To add a track, extend this object and add courses in Sanity with the new track value.

---

## On-Chain Configuration

The Anchor program's `Config` PDA stores platform-wide settings. To update them after deployment, call `update_config` with the `authority` wallet:

```ts
// scripts/update-config.ts
await program.methods
  .updateConfig(newBackendSigner, null)
  .accounts({ config, authority })
  .rpc();
```

**Key on-chain parameters:**
| Parameter | Where | Description |
|-----------|-------|-------------|
| `authority` | Config PDA | Admin wallet address |
| `backend_signer` | Config PDA | Backend co-signer for lesson completion |
| `xp_mint` | Config PDA | Token-2022 mint address for XP tokens |
| `xp_per_lesson` | Course PDA | XP minted per `complete_lesson` call |
| `completion_bonus` | Course PDA | XP bonus when all lessons done |
| `creator_reward` | Course PDA | XP minted to course creator on finalization |

---

## Deployment

### Environment Variables

See `app/.env.local.example` for the full list. Minimum required variables:

```env
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=3Yr5EZrq8t4fMunuHUZoN9Q6cn4Sf6p3AFAdvWEMaxKU
NEXT_PUBLIC_XP_MINT_ADDRESS=<your_xp_mint>

# Auth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<random_32_char_secret>
GOOGLE_CLIENT_ID=<your_google_oauth_client_id>
GOOGLE_CLIENT_SECRET=<your_google_oauth_client_secret>

# CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=<your_sanity_project_id>
NEXT_PUBLIC_SANITY_DATASET=production
```

### Vercel One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TheAuroraAI/superteam-academy)

1. Click the button above
2. Fill in environment variables in the Vercel dashboard
3. Deploy — CI runs automatically on every push

### Custom Domain

In Vercel → your project → Settings → Domains, add your custom domain. Remember to update `NEXTAUTH_URL` to match.

---

## Admin Panel

The admin panel (`/[locale]/admin`) is accessible to wallets in the `ADMIN_WALLETS` env var:

```env
ADMIN_WALLETS=<wallet_address_1>,<wallet_address_2>
```

Admin features:
- **Analytics**: Page views, lesson completions, XP distribution charts
- **Course management**: Publish/unpublish courses, view enrollment stats
- **User management**: View top learners, flag suspicious activity
- **Achievements**: Trigger manual achievement awards
- **System**: Health check, cache invalidation, environment info

---

## Fork Checklist

When forking for a new community:

- [ ] Update `metadata` in `app/app/layout.tsx` (title, description, OG image)
- [ ] Replace `app/public/favicon.ico` and `app/public/og-image.png`
- [ ] Change `--primary` color in `app/app/globals.css`
- [ ] Update `TRACKS` in `app/lib/constants.ts` if needed
- [ ] Create `app/messages/<locale>.json` for your community language
- [ ] Deploy Anchor program to devnet/mainnet (`onchain-academy/`)
- [ ] Configure Sanity CMS and add course content
- [ ] Set all environment variables in Vercel
- [ ] Update `ADMIN_WALLETS` with your authority wallet
