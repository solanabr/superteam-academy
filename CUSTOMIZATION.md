# Customization Guide

This guide covers how to customize Superteam Academy for your own brand, features, and requirements.

---

## Table of Contents

1. [Theme & Branding](#theme--branding)
2. [Adding Languages](#adding-languages)
3. [Gamification System](#gamification-system)
4. [AI Mentor Configuration](#ai-mentor-configuration)
5. [On-Chain Configuration](#on-chain-configuration)
6. [Third-Party Integrations](#third-party-integrations)

---

## Theme & Branding

### Primary Colors

Edit `app/globals.css` to customize the color palette:

```css
:root {
  --primary: 142 76% 36%;      /* Green (default) */
  --primary-foreground: 355.7 100% 97.3%;
  --secondary: 240 4.8% 95.9%;
  --accent: 240 3.7% 15.9%;
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
}
```

### Dark Mode

The theme respects system preferences via CSS media queries. Override in:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
  }
}
```

### Logo & Favicon

| Asset | Location |
|-------|----------|
| Logo | `app/favicon.ico` (replace) |
| OG Image | `app/opengraph-image.png` |

### UI Components

All components use shadcn/ui. Customize in `app/components/ui/`.

---

## Adding Languages

### Step 1: Configure Locale

Edit `app/i18n/config.ts`:

```typescript
export const locales = ['en', 'es', 'pt-BR'] as const;
export type Locale = (typeof locales)[number];
```

### Step 2: Create Translation Files

Create `app/locales/[locale].json`:

```json
{
  "nav": {
    "courses": "Courses",
    "leaderboard": "Leaderboard"
  },
  "hero": {
    "title": "Learn Solana Development"
  }
}
```

### Step 3: Update Middleware

In `app/middleware.ts`, add the new locale to the matcher:

```typescript
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

### Step 4: Generate Static Params

Update `app/[locale]/layout.tsx`:

```typescript
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
```

---

## Gamification System

### XP Rewards

Configure XP per activity in two places:

**Lesson Completion** (Sanity CMS):
- Edit lesson document in Sanity Studio
- Set `xpReward` field (default: 50)

**Achievements** (Supabase):
```sql
UPDATE achievements SET xp_reward = 500 WHERE id = 'solana_developer';
```

### Level Formula

The level formula is in `app/lib/services/stubs.ts`:

```typescript
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}
```

| XP Required | Level |
|-------------|-------|
| 0 | 1 |
| 100 | 2 |
| 400 | 3 |
| 900 | 4 |
| 1600 | 5 |
| 2500 | 6 |

### Achievement Types

Add new achievements in Supabase `achievements` table:

```sql
INSERT INTO achievements (title, description, icon, rarity, xp_reward)
VALUES ('Quick Learner', 'Complete 5 lessons in one day', '⚡', 'rare', 200);
```

### Streak System

Streak logic uses localStorage for simplicity. To persist streaks:

1. Create `streaks` table in Supabase
2. Update `app/lib/services/stubs.ts` to call backend API

---

## AI Mentor Configuration

### Changing the Model

Edit `app/api/ai-mentor/route.ts`:

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': ' claude-3-5-sonnet-20241022'  // Change model here
  },
  // ...
});
```

### Custom System Prompt

Modify the system prompt in the route:

```typescript
const systemPrompt = `You are an expert Solana developer...
  
  Guidelines:
  - Always provide working code examples
  - Use Anchor framework when applicable
  - Include explanation before code
  ...
`;
```

### Supported Models

| Model | Use Case |
|-------|----------|
| claude-3-haiku-20240307 | Fast, cheap |
| claude-3-sonnet-20240229 | Balanced |
| claude-3-opus-20240229 | Best quality |

---

## On-Chain Configuration

### Program ID

Update everywhere:
```bash
# Anchor.toml
[programs.devnet]
onchain_academy = "YOUR_PROGRAM_ID"

# app/.env.local
NEXT_PUBLIC_PROGRAM_ID=YOUR_PROGRAM_ID
```

### XP Token Mint

```bash
# Update in app/lib/onchain/xp.ts
export const XP_MINT = new PublicKey("YOUR_XP_MINT_ADDRESS");
```

### Backend Signer

The backend signer PDA is derived from the program. Update `app/lib/solana/client.ts`:

```typescript
export async function getBackendSigner(): Promise<PublicKey> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("backend_signer")],
    new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!)
  )[0];
}
```

---

## Third-Party Integrations

### Google Analytics 4

```bash
# .env.local
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Microsoft Clarity (Heatmaps)

```bash
# .env.local
NEXT_PUBLIC_CLARITY_ID=xxxxxxxxxx
```

### Supabase

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Helius (Solana RPC)

```bash
# .env.local
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_key
```

---

## Extending Features

### Adding a New Page

1. Create route: `app/[locale]/feature/page.tsx`
2. Add to navigation: `app/components/landing/header.tsx`
3. Add i18n keys: `app/locales/en.json`

### Adding a New Service

1. Define interface in `app/lib/services/types.ts`
2. Implement in `app/lib/services/stubs.ts`
3. Use dependency injection pattern for swapping implementations

### Database Migrations

```bash
# Create migration
supabase migration new migration_name

# Apply migrations
supabase db push
```

---

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_HELIUS_API_KEY` | Helius RPC API key |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity ID |
| `ANTHROPIC_API_KEY` | Claude API key |
| `ADMIN_PASSWORD` | Admin dashboard password |
| `NEXT_PUBLIC_PROGRAM_ID` | On-chain program ID |
