# Architecture

## System Overview

Solana Quest follows a **layered architecture** with clean separation between the UI, business logic, and data layers. This enables swapping the stubbed local storage implementation for on-chain program calls.

```
┌─────────────────────────────────────────────┐
│                  UI Layer                    │
│  Next.js App Router Pages + Components      │
│  (React Server/Client Components)           │
├─────────────────────────────────────────────┤
│              State Layer                     │
│  Zustand Stores (persisted to localStorage) │
├─────────────────────────────────────────────┤
│             Service Layer                    │
│  Clean interfaces with swappable impl       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Learning │  │ Gamifi-  │  │   Auth   │ │
│  │ Progress │  │ cation   │  │ Service  │ │
│  └──────────┘  └──────────┘  └──────────┘ │
├─────────────────────────────────────────────┤
│             Data Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Local    │  │ Solana   │  │ CMS      │ │
│  │ Storage  │  │ Program  │  │ (Sanity) │ │
│  │ (Stub)   │  │ (Future) │  │ (Future) │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────┘
```

## Component Architecture

### Page Hierarchy

```
RootLayout
├── Providers (Theme + Wallet + Toast + Tooltip)
├── Header (Navigation + XP Display + User Menu)
├── Page Content
│   ├── / (Landing Page)
│   ├── /courses (Course Catalog)
│   ├── /courses/[slug] (Course Detail)
│   ├── /courses/[slug]/lessons/[id] (Lesson View)
│   ├── /dashboard (User Dashboard)
│   ├── /leaderboard (Rankings)
│   ├── /profile (User Profile)
│   ├── /settings (User Settings)
│   └── /certificates/[id] (Credential View)
└── Footer
```

### Component Categories

| Category | Path | Purpose |
|----------|------|---------|
| UI Primitives | `components/ui/` | shadcn/ui base components |
| Layout | `components/layout/` | Header, Footer |
| Providers | `components/providers.tsx` | Theme, Wallet, Toast context |

## Data Flow

### Authentication Flow

```
User Action → Wallet Adapter / Supabase Auth
           → Zustand Store (persisted)
           → UI Re-render
```

### Learning Progress Flow

```
Complete Lesson → LearningProgressService.completeLesson()
              → Update localStorage
              → Update Zustand store (XP, streak)
              → Trigger XP animation
              → (Future: Sign + send on-chain transaction)
```

### XP & Leveling Flow

```
XP Earned → calculateLevel(newXP) = floor(sqrt(xp/100))
         → Update Zustand store
         → Header XP bar animates
         → Check achievement conditions
         → (Future: Mint XP tokens via on-chain program)
```

## Service Interfaces

### LearningProgressService

The core service interface that abstracts all progress tracking:

```typescript
interface LearningProgressService {
  getProgress(userId, courseId): Promise<Progress>
  completeLesson(userId, courseId, lessonIndex): Promise<void>
  getXP(userId): Promise<number>
  getStreak(userId): Promise<StreakData>
  getLeaderboard(timeframe): Promise<LeaderboardEntry[]>
  getCredentials(wallet): Promise<Credential[]>
}
```

**Current Implementation**: `LocalLearningProgressService` using localStorage
**Future Implementation**: `OnChainLearningProgressService` using Anchor program

### On-Chain Integration Points

| Service Method | On-Chain Equivalent |
|----------------|-------------------|
| `completeLesson()` | `complete_lesson` instruction (backend-signed) |
| `getXP()` | Read XP token balance (Token-2022) |
| `getStreak()` | Read Learner PDA `last_activity_ts` |
| `getLeaderboard()` | Helius DAS API: index XP token balances |
| `getCredentials()` | Helius DAS API: getAssetsByOwner (cNFTs) |
| `claimAchievement()` | `claim_achievement` instruction |

## State Management

### Zustand Stores

**UserStore** (`stores/user-store.ts`):
- User authentication state
- Gamification profile (XP, level, streak)
- Persisted to localStorage via Zustand persist middleware

### Why Zustand over Context?

1. No provider nesting required
2. Built-in persistence middleware
3. Works outside React components (services)
4. Minimal re-renders (selective subscriptions)

## Routing

Uses Next.js App Router with route groups:

```
app/
├── (marketing)/     # Public pages (landing)
├── (app)/          # App pages (may require auth)
│   ├── courses/
│   ├── dashboard/
│   ├── leaderboard/
│   ├── profile/
│   ├── settings/
│   └── certificates/
├── layout.tsx      # Root layout
└── page.tsx        # Landing page
```

## Theme System

### Design Tokens

The theme uses CSS custom properties with Tailwind CSS v4:

- **Dark Mode Primary**: Purple/cyan/gold color palette inspired by RPG games
- **Solana Brand Colors**: Purple (#9945FF), Green (#14F195), Blue (#00D1FF)
- **Gamification Colors**: Gold (XP), Green (Health/Complete), Purple (Mana/Primary), Orange (Streak/Fire)

### Glow Effects

Custom CSS classes for RPG-style glow effects:
- `.glow-purple`, `.glow-cyan`, `.glow-gold` - Box shadows
- `.glow-text-purple`, `.glow-text-cyan`, `.glow-text-gold` - Text shadows
- `.gradient-quest` - Background gradient
- `.border-animated` - Animated gradient border

## Performance Considerations

- **Static Generation**: Landing, courses, leaderboard pages are statically generated
- **Dynamic Routes**: Course detail and lesson pages use dynamic rendering
- **Code Splitting**: Each page is automatically code-split by Next.js
- **Image Optimization**: Next.js Image component for all images
- **Font Optimization**: Google Fonts (Inter, JetBrains Mono) loaded via next/font

## Security

- No private keys stored client-side
- Wallet signatures for authentication
- Backend-signed transactions for lesson completion (future)
- Environment variables for all secrets
- CSP headers recommended for production
