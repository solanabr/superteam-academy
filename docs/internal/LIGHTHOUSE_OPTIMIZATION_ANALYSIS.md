# Lighthouse Performance Optimization Analysis

**Status**: Analysis Complete  
**Date**: March 3, 2026  
**Build Status**: ⚠️ Build has pre-render errors (need to fix before Lighthouse)

---

## Executive Summary

The codebase has **MODERATE** performance optimization opportunities. While some optimizations are already in place, significant improvements can be made in third-party script loading and dynamic imports.

**Current Implementation Status**: ~40% complete

---

## 1. THIRD-PARTY SCRIPTS ANALYSIS

### ✅ DONE

#### Google Analytics (GA4)
- **Status**: OPTIMIZED ✓
- **Location**: [app/layout.tsx](app/layout.tsx#L31-L43)
- **Strategy**: `lazyOnload` ✓
- **Details**:
  ```tsx
  <Script
    strategy="lazyOnload"
    src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
  />
  ```
- **Impact**: GA4 loads after interactive content

#### Sentry (Server-Side)
- **Status**: OPTIMIZED ✓
- **Location**: [instrumentation.ts](instrumentation.ts)
- **Details**: Initialized in register() hook, only runs on server
- **Impact**: No client bundle impact

### ⚠️ PARTIAL

#### Sentry (Client-Side)
- **Status**: PARTIALLY OPTIMIZED
- **Location**: [instrumentation-client.ts](instrumentation-client.ts)
- **Issues**:
  - Client Sentry replays enabled (captures 10% of sessions)
  - Session replay can be heavy with maskAllText and blockAllMedia
- **Recommendation**: Set `replaysSessionSampleRate: 0.01` (1% instead of 10%)

#### PostHog
- **Status**: OPTIMIZED ✓
- **Location**: [lib/analytics/posthog.ts](lib/analytics/posthog.ts)
- **Strategy**: Lazy loaded via dynamic import
- **Details**:
  ```typescript
  const { default: posthog } = await import('posthog-js');
  ```
- **Impact**: PostHog only loads when needed

---

## 2. HEAVY COMPONENTS DYNAMIC IMPORT ANALYSIS

### ❌ NOT OPTIMIZED

#### Monaco Editor
- **Location**: 
  - [components/editor/CodeEditor.tsx](components/editor/CodeEditor.tsx#L4)
  - [components/editor/RustEditor.tsx](components/editor/RustEditor.tsx)
  - [components/editor/SolanaCodeLesson.tsx](components/editor/SolanaCodeLesson.tsx)
- **Current**: Statically imported
- **Bundle Impact**: ~1.2MB (Monaco minified ~800KB + deps ~400KB)
- **Status**: ❌ **NOT DYNAMICALLY IMPORTED**
- **Recommendation**: Dynamic import with Suspense boundary
- **Estimated Savings**: -1.2MB from initial bundle

#### Solana Wallet Adapters
- **Location**: [components/providers/WalletProvider.tsx](components/providers/WalletProvider.tsx)
- **Current**: 12 wallet adapters statically imported
- **Bundle Impact**: ~400KB total
- **Status**: ❌ **NOT DYNAMICALLY IMPORTED**
- **Adapters Used**:
  1. PhantomWalletAdapter (~50KB)
  2. SolflareWalletAdapter (~45KB)
  3. WalletConnectWalletAdapter (~80KB)
  4. LedgerWalletAdapter (~40KB)
  5. TorusWalletAdapter (~50KB)
  6. Coin98WalletAdapter (~25KB)
  7. BitKeepWalletAdapter (~25KB)
  8. TrustWalletAdapter (~25KB)
  9. CloverWalletAdapter (~20KB)
  10. CoinhubWalletAdapter (~20KB)
  11. OntoWalletAdapter (~15KB)
  12. CoinbaseWalletAdapter (~25KB)
- **Recommendation**: Dynamic import on demand (e.g., in WalletModal)
- **Estimated Savings**: -300KB from initial bundle

#### Recharts
- **Location**: [components/profile/SkillRadar.tsx](components/profile/SkillRadar.tsx#L11)
- **Current**: Statically imported
- **Bundle Impact**: ~180KB
- **Status**: ❌ **NOT DYNAMICALLY IMPORTED**
- **Used on**: Profile page
- **Recommendation**: Dynamic import with Suspense
- **Estimated Savings**: -180KB from initial bundle

### ✅ LAZY LOAD PATTERNS (Reference)
Documentation for dynamic imports exists in:
- [.claude/rules/typescript.md](../.claude/rules/typescript.md#L353)

---

## 3. FONT & IMAGE OPTIMIZATION

### ✅ FONTS - DONE

**Status**: OPTIMIZED ✓
- **Location**: [app/layout.tsx](app/layout.tsx#L10-L12)
- **Strategy**: Using `next/font/google`
- **Fonts**:
  - Inter (system font, minimal weight)
  - JetBrains Mono (monospace, development focused)
  - Space Grotesk (display, selected weights)
- **Details**:
  ```tsx
  const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
  const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
  const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
  ```
- **Impact**: Fonts self-hosted, no external requests

### ❌ IMAGES - NOT IMPLEMENTED

**Status**: NOT YET OPTIMIZED
- **Next/Image Usage**: 0%
- **Current Issues**:
  1. Avatar in [components/auth/AuthButtons.tsx](components/auth/AuthButtons.tsx#L32): Using raw `<img>`
  2. Sanity images in next.config.js configured for cdn.sanity.io but no optimization
  3. No lazy loading of images
- **Recommendation**: 
  1. Create [lib/components/OptimizedImage.tsx](lib/components/OptimizedImage.tsx) wrapper
  2. Update [components/auth/AuthButtons.tsx](components/auth/AuthButtons.tsx) to use next/image
  3. Add priority for above-the-fold images
- **Estimated Impact**: 
  - Initial page load savings: ~50-100KB
  - Lazy loading deferred images: Better LCP

---

## 4. BUILD & BUNDLE ANALYSIS

### Current Build Status
```
✓ Compiled successfully
✗ Linting and type checking: FAILED (see errors below)
```

### Build Errors to Fix First

```
Type Error: Missing @sanity/vision (React 19 requirement - incompatible)
  → Fixed: Removed visionTool() from sanity.config.ts

Type Error: crateType comparison in route.ts
  → Fixed: Changed ternary to constant

Pre-render Errors: useSearchParams() not wrapped in Suspense
  → Pages affected: /dashboard, /profile, /leaderboard, /courses, /, /auth/*
  → Action: Wrap pages with Suspense or use 'use client'
```

### Estimated Bundle Sizes (Unverified until build completes)

| Component | Size | Status |
|-----------|------|--------|
| Monaco Editor | ~1.2MB | ❌ Not dynamic |
| Wallet Adapters | ~400KB | ❌ Not dynamic |
| Recharts | ~180KB | ❌ Not dynamic |
| Solana Web3.js | ~450KB | ⚠️ Needed |
| Next.js Framework | ~450KB | ✅ Optimized |
| **Total Estimated Increase from Heavy Libs** | **~2.28MB** | 🚨 |

---

## 5. IMPLEMENTATION CHECKLIST

### Priority 1: Critical Fixes (Required for Build)
- [ ] Fix pre-render Suspense errors
- [ ] Complete build successfully
- [ ] Capture actual bundle sizes via `next/bundle-analyzer`

### Priority 2: High Impact (~1.6MB savings)
- [ ] Dynamic import Monaco Editor
- [ ] Dynamic import Wallet Adapters & Modal
- [ ] Optimize Recharts import

### Priority 3: Medium Impact (~50KB+ savings)
- [ ] Implement next/image wrapper
- [ ] Add image lazy loading
- [ ] Optimize Sentry replay sampling

### Priority 4: Monitoring
- [ ] Add bundle size tracking
- [ ] Run Lighthouse in CI/CD
- [ ] Set performance budgets

---

## 6. DETAILED RECOMMENDATIONS

### A. Fix Monaco Editor Dynamic Import

**File**: [components/editor/CodeEditor.tsx](components/editor/CodeEditor.tsx)

**Current**:
```tsx
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
```

**Recommended**:
```tsx
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const Editor = dynamic(() => import('@monaco-editor/react').then(m => m.Editor), {
  loading: () => <div>Loading editor...</div>,
  ssr: false,
})

// Or create a wrapper component with Suspense...
```

**Expected Impact**: -1.2MB from main bundle

---

### B. Optimize Wallet Adapters

**File**: [components/providers/WalletProvider.tsx](components/providers/WalletProvider.tsx)

**Current**:
```tsx
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
// ... 10 more adapters
```

**Recommended**:
```tsx
// Only import adapters when wallet modal opens
const lazyLoadWalletAdapters = async () => {
  const [
    phantom, solflare, walletConnect, // ...
  ] = await Promise.all([
    import('@solana/wallet-adapter-phantom'),
    import('@solana/wallet-adapter-solflare'),
    import('@solana/wallet-adapter-walletconnect'),
    // ...
  ])
  return [
    new phantom.PhantomWalletAdapter(),
    // ...
  ]
}
```

**Expected Impact**: -300KB from main bundle

---

### C. Optimize Recharts

**File**: [components/profile/SkillRadar.tsx](components/profile/SkillRadar.tsx)

**Current**:
```tsx
import { RadarChart, PolarGrid, ... } from 'recharts'
```

**Recommended**:
```tsx
import dynamic from 'next/dynamic'

const SkillRadarContent = dynamic(() => import('./SkillRadarContent'), {
  loading: () => <div className="h-350 bg-gray-100 rounded" />,
})

export function SkillRadar(props) {
  return <SkillRadarContent {...props} />
}
```

**Expected Impact**: -180KB from initial bundle

---

### D. Implement Next/Image

**File**: [lib/components/OptimizedImage.tsx](lib/components/OptimizedImage.tsx) (NEW)

```tsx
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  fill?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  priority = false,
  fill = false
}: OptimizedImageProps) {
  // Validate Sanity URLs
  if (src.includes('cdn.sanity.io')) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        fill={fill}
      />
    )
  }
  
  // Fallback for external URLs
  return <img src={src} alt={alt} />
}
```

**Expected Impact**: ~50KB saving + improved LCP

---

### E. Optimize Sentry Client Replays

**File**: [instrumentation-client.ts](instrumentation-client.ts)

**Current**:
```typescript
replaysSessionSampleRate: 0.1,  // 10% of sessions
```

**Recommended for Performance**:
```typescript
replaysSessionSampleRate: 0.01,  // 1% of sessions (still monitored, less overhead)
```

**Expected Impact**: ~30KB reduction in session replay overhead

---

## 7. LIGHTHOUSE SCORE EXPECTATIONS

### Current State (Estimated)
- **Performance**: 65-75 (without optimizations)
- **Accessibility**: 85-90 (good, semantic HTML used)
- **Best Practices**: 75-85 (some console errors)
- **SEO**: 85-90 (metadata in place)

### After Optimizations
- **Performance**: 85-92 (with dynamic imports + image optimization)
- **Accessibility**: 90-95 (add aria labels)
- **Best Practices**: 90-95 (fix build errors)
- **SEO**: 90-95 (add structured data)

---

## 8. NEXT STEPS

1. **Fix build errors** (Suspense boundaries)
2. **Install bundle analyzer**:
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ```
3. **Run analysis**:
   ```bash
   ANALYZE=true npm run build
   ```
4. **Implement optimizations** in priority order
5. **Run Lighthouse**:
   ```bash
   npm run build
   npm run start
   # Then run Chrome DevTools Lighthouse on production build
   ```

---

## Files Requiring Changes

| File | Change | Priority |
|------|--------|----------|
| [components/editor/CodeEditor.tsx](components/editor/CodeEditor.tsx) | Dynamic import Monaco | P1 |
| [components/editor/RustEditor.tsx](components/editor/RustEditor.tsx) | Dynamic import Monaco | P1 |
| [components/editor/SolanaCodeLesson.tsx](components/editor/SolanaCodeLesson.tsx) | Dynamic import Monaco | P1 |
| [components/providers/WalletProvider.tsx](components/providers/WalletProvider.tsx) | Dynamic import adapters | P1 |
| [components/profile/SkillRadar.tsx](components/profile/SkillRadar.tsx) | Dynamic import chart | P2 |
| [instrumentation-client.ts](instrumentation-client.ts) | Reduce replay sampling | P2 |
| [lib/components/OptimizedImage.tsx](lib/components/OptimizedImage.tsx) | NEW FILE | P2 |
| [components/auth/AuthButtons.tsx](components/auth/AuthButtons.tsx) | Use OptimizedImage | P2 |

---

## Summary

**Completion Status**: 40% optimized

✅ Completed:
- Google Analytics (lazyOnload)
- Fonts with next/font
- PostHog lazy loading
- Sentry server-side optimization

❌ Not Yet Optimized:
- Monaco Editor dynamic import (1.2MB)
- Wallet Adapters dynamic import (400KB)
- Recharts dynamic import (180KB)
- next/image implementation (50KB+)
- Build errors (Suspense boundaries)

**Total Possible Savings**: ~1.8MB bundle size reduction

**Estimated Lighthouse Improvement**: +15-20 points in Performance

