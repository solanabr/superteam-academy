# Lighthouse Performance Optimization - Implementation Roadmap

**Status**: ~40% Complete  
**Last Updated**: March 3, 2026

---

## 🎯 Quick Status Summary

### ✅ Already Optimized (40% done)
- [x] GA4 with `lazyOnload` strategy
- [x] Sentry server-side initialization
- [x] PostHog lazy-loaded dynamically
- [x] Fonts via next/font/google
- [x] next.config.js Sentry integration with source map hiding

### ❌ Not Yet Optimized (60% remaining)

| Task | Impact | Est. Time | Difficulty |
|------|--------|-----------|------------|
| Dynamic import Monaco Editor | 1.2MB | 2h | Medium |
| Dynamic import Wallet Adapters | 400KB | 1.5h | Medium |
| Dynamic import Recharts | 180KB | 45m | Easy |
| Implement next/image wrapper | 50KB | 1h | Easy |
| Fix build Suspense errors | Blocker | 1h | Medium |
| Reduce Sentry replay sampling | 30KB | 15m | Easy |
| Add bundle analyzer | Monitoring | 30m | Easy |

**Total Implementation Time**: ~7-8 hours

---

## Phase 1: Fix Build Errors (BLOCKER - Must do first)

### Task 1.1: Fix useSearchParams() Suspense Errors

**Status**: ❌ Not started  
**Impact**: Unblocks build

**Files with issues**:
- `/dashboard/page.tsx` - uses useSearchParams()
- `/profile/page.tsx` - uses useSearchParams()
- `/leaderboard/page.tsx` - uses useSearchParams()
- `/courses/page.tsx` - uses useSearchParams()
- `/page.tsx` (home) - uses useSearchParams()

**Solution**: Wrap pages with Suspense or use 'use client'

```tsx
// Example fix
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const params = useSearchParams()
  // ... rest of component
}
```

---

## Phase 2: High-Impact Dynamic Imports (1.8MB savings potential)

### Task 2.1: Dynamically Import Monaco Editor

**Status**: ❌ Not started  
**Priority**: P1 - High Impact  
**Estimated Savings**: 1.2MB  
**Estimated Time**: 2 hours  

**Files to modify**:
1. [components/editor/CodeEditor.tsx](components/editor/CodeEditor.tsx)
2. [components/editor/RustEditor.tsx](components/editor/RustEditor.tsx)
3. [components/editor/SolanaCodeLesson.tsx](components/editor/SolanaCodeLesson.tsx)

**Implementation steps**:

1. Create wrapper component [components/editor/MonacoEditorWrapper.tsx](components/editor/MonacoEditorWrapper.tsx) (NEW)

```tsx
'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { EditorProps } from '@monaco-editor/react'

const MonacoEditor = dynamic(() => 
  import('@monaco-editor/react').then(m => m.default), {
    loading: () => (
      <div className="border-2 border-terminal-border rounded-lg overflow-hidden bg-gray-900 h-[500px] flex items-center justify-center">
        <script>
          <span className="text-gray-400">Loading editor...</span>
        </script>
      </div>
    ),
    ssr: false,
  }
)

export function EditorWrapper(props: EditorProps) {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <MonacoEditor {...props} />
    </Suspense>
  )
}
```

2. Update CodeEditor.tsx to use wrapper

```tsx
// OLD:
import Editor, { OnMount, OnChange } from '@monaco-editor/react'

// NEW:
import { EditorWrapper as Editor } from './MonacoEditorWrapper'
```

3. Repeat for RustEditor.tsx and SolanaCodeLesson.tsx

**Testing**:
- [ ] Load page with editor (should show loading state)
- [ ] Editor should mount after page interactive
- [ ] No console errors

---

### Task 2.2: Dynamically Import Wallet Adapters

**Status**: ❌ Not started  
**Priority**: P1 - High Impact  
**Estimated Savings**: 400KB  
**Estimated Time**: 1.5 hours  

**File**: [components/providers/WalletProvider.tsx](components/providers/WalletProvider.tsx)

**Current Code**:
```tsx
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
// ... 10 more imports
```

**Solution**: Lazy load adapters on demand

Create [lib/utils/wallet-adapters-loader.ts](lib/utils/wallet-adapters-loader.ts) (NEW):

```typescript
let cachedAdapters: any[] | null = null

export async function loadWalletAdapters() {
  if (cachedAdapters) return cachedAdapters

  const [
    phantom,
    solflare,
    walletConnect,
    ledger,
    torus,
    coin98,
    bitkeep,
    trust,
    clover,
    coinhub,
    onto,
    coinbase,
  ] = await Promise.all([
    import('@solana/wallet-adapter-phantom').then(m => new m.PhantomWalletAdapter()),
    import('@solana/wallet-adapter-solflare').then(m => new m.SolflareWalletAdapter()),
    import('@solana/wallet-adapter-walletconnect').then(m => 
      new m.WalletConnectWalletAdapter({ network: 'devnet', options: {} })
    ),
    import('@solana/wallet-adapter-ledger').then(m => new m.LedgerWalletAdapter()),
    import('@solana/wallet-adapter-torus').then(m => new m.TorusWalletAdapter()),
    import('@solana/wallet-adapter-coin98').then(m => new m.Coin98WalletAdapter()),
    import('@solana/wallet-adapter-bitkeep').then(m => new m.BitKeepWalletAdapter()),
    import('@solana/wallet-adapter-trust').then(m => new m.TrustWalletAdapter()),
    import('@solana/wallet-adapter-clover').then(m => new m.CloverWalletAdapter()),
    import('@solana/wallet-adapter-coinhub').then(m => new m.CoinhubWalletAdapter()),
    import('@solana/wallet-adapter-onto').then(m => new m.OntoWalletAdapter()),
    import('@solana/wallet-adapter-coinbase').then(m => new m.CoinbaseWalletAdapter()),
  ])

  cachedAdapters = [phantom, solflare, walletConnect, ledger, torus, coin98, bitkeep, trust, clover, coinhub, onto, coinbase]
  return cachedAdapters
}
```

Update [components/providers/WalletProvider.tsx](components/providers/WalletProvider.tsx):

```tsx
'use client'

import { FC, ReactNode, useMemo, useEffect, useState } from 'react'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { loadWalletAdapters } from '@/lib/utils/wallet-adapters-loader'
import '@solana/wallet-adapter-react-ui/styles.css'

interface Props {
  children: ReactNode
}

export const WalletProvider: FC<Props> = ({ children }) => {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet')
  const [wallets, setWallets] = useState<any[]>([])

  useEffect(() => {
    loadWalletAdapters().then(setWallets)
  }, [])

  if (wallets.length === 0) {
    return <>{children}</> // Render without wallet provider until adapters load
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect localStorageKey="superteam-academy-wallet">
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
```

**Testing**:
- [ ] App loads without wallet adapters initially
- [ ] Network tab shows wallet adapters only requested when WalletProvider mounts
- [ ] Wallet connection works normally
- [ ] No console warnings

---

### Task 2.3: Dynamically Import Recharts

**Status**: ❌ Not started  
**Priority**: P2 - Medium Impact  
**Estimated Savings**: 180KB  
**Estimated Time**: 45 minutes  

**File**: [components/profile/SkillRadar.tsx](components/profile/SkillRadar.tsx)

**Solution**: Create dynamic wrapper

Create [components/profile/SkillRadarDynamic.tsx](components/profile/SkillRadarDynamic.tsx) (NEW):

```tsx
'use client'

import dynamic from 'next/dynamic'
import { SkillData } from './SkillRadar'

const SkillRadarContent = dynamic(() => import('./SkillRadar').then(m => m.SkillRadar), {
  loading: () => (
    <div className="w-full h-350 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg animate-pulse" />
  ),
  ssr: false,
})

export function SkillRadarDynamic(props: { data: SkillData[]; title?: string; size?: 'small' | 'medium' | 'large' }) {
  return <SkillRadarContent {...props} />
}
```

Update profile page to use dynamic version:

```tsx
// OLD:
import { SkillRadar } from '@/components/profile/SkillRadar'

// NEW:
import { SkillRadarDynamic as SkillRadar } from '@/components/profile/SkillRadarDynamic'
```

**Testing**:
- [ ] Profile page loads without Recharts initially
- [ ] Skill radar appears after page interactive
- [ ] No console errors

---

## Phase 3: Asset Optimization (50KB+ savings)

### Task 3.1: Implement next/image Wrapper

**Status**: ❌ Not started  
**Priority**: P2 - Medium Impact  
**Estimated Savings**: 50KB+ (lazy loading benefit)  
**Estimated Time**: 1 hour  

Create [lib/components/OptimizedImage.tsx](lib/components/OptimizedImage.tsx) (NEW):

```tsx
'use client'

import Image from 'next/image'
import { CSSProperties, useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  fill?: boolean
  className?: string
  style?: CSSProperties
  onLoad?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  priority = false,
  fill = false,
  className = '',
  style,
  onLoad,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(!priority)

  // Support Sanity CDN images
  const isSanityImage = src.includes('cdn.sanity.io')

  const handleLoadingComplete = () => {
    setIsLoading(false)
    onLoad?.()
  }

  if (isSanityImage || src.startsWith('http')) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        fill={fill}
        className={className}
        style={style}
        onLoadingComplete={handleLoadingComplete}
        loading={priority ? 'eager' : 'lazy'}
      />
    )
  }

  // Fallback for local images
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={priority ? 'eager' : 'lazy'}
    />
  )
}
```

Update [components/auth/AuthButtons.tsx](components/auth/AuthButtons.tsx) to use OptimizedImage:

```tsx
// OLD:
<img
  src={session.user.image || '/default-avatar.png'}
  alt={session.user.name || 'User'}
  className="w-10 h-10 rounded-full"
/>

// NEW:
<OptimizedImage
  src={session.user.image || '/default-avatar.png'}
  alt={session.user.name || 'User'}
  width={40}
  height={40}
  className="w-10 h-10 rounded-full"
  priority={false}
/>
```

**Testing**:
- [ ] Images load in browser
- [ ] above-the-fold images have priority=true
- [ ] lazy loading works (network tab shows deferred requests)
- [ ] No layout shift (CLS)

---

### Task 3.2: Optimize Sentry Client Replay Sampling

**Status**: ❌ Not started  
**Priority**: P3 - Low Impact  
**Estimated Savings**: 30KB (session replay overhead)  
**Estimated Time**: 15 minutes  

Update [instrumentation-client.ts](instrumentation-client.ts):

```typescript
// OLD:
replaysSessionSampleRate: 0.1,  // 10% of sessions

// NEW:
replaysSessionSampleRate: 0.01,  // 1% of sessions
```

**Rationale**: Still captures meaningful session data for errors but reduces memory overhead

---

## Phase 4: Monitoring & Verification

### Task 4.1: Install Bundle Analyzer

**Status**: ❌ Not started  
**Priority**: P3 - Monitoring  
**Estimated Time**: 30 minutes  

```bash
npm install --save-dev @next/bundle-analyzer
```

Update [next.config.js](next.config.js):

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const { withSentryConfig } = require('@sentry/nextjs')

const nextConfig = {
  images: {
    domains: ['cdn.sanity.io'],
  },
}

module.exports = withBundleAnalyzer(
  withSentryConfig(nextConfig, {
    silent: true,
    org: 'solana-academy',
    project: 'solana-academy-platform',
  }, {
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
  })
)
```

Run analysis:

```bash
ANALYZE=true npm run build
```

---

### Task 4.2: Run Lighthouse Tests

**Status**: ❌ Not started  
**Priority**: P3 - Verification  
**Estimated Time**: 30 minutes (per test)  

After completing all optimizations:

```bash
npm run build
npm run start
# Open http://localhost:3000 in Chrome
# Open DevTools > Lighthouse > Analyze page load
```

**Target Scores**:
- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

---

## 📋 Implementation Checklist

### Phase 1: Build Fixes
- [ ] Fix useSearchParams() Suspense errors
- [ ] Verify build completes successfully
- [ ] No pre-render errors

### Phase 2: Dynamic Imports
- [ ] Create MonacoEditorWrapper.tsx
- [ ] Update CodeEditor.tsx to use wrapper
- [ ] Update RustEditor.tsx to use wrapper
- [ ] Update SolanaCodeLesson.tsx to use wrapper
- [ ] Create wallet-adapters-loader.ts
- [ ] Update WalletProvider.tsx for lazy adapters
- [ ] Create SkillRadarDynamic.tsx
- [ ] Update profile page imports

### Phase 3: Asset Optimization
- [ ] Create OptimizedImage.tsx component
- [ ] Update AuthButtons.tsx to use OptimizedImage
- [ ] Reduce Sentry replay sampling to 1%

### Phase 4: Monitoring
- [ ] Install @next/bundle-analyzer
- [ ] Run bundle analysis
- [ ] Document before/after sizes
- [ ] Run Lighthouse tests
- [ ] Verify all scores ≥ 90

---

## 📊 Expected Results

### Bundle Size Reduction

| Optimization | Before | After | Savings |
|--------------|--------|-------|---------|
| Monaco (lazy) | +1.2MB | 0KB* | -1.2MB |
| Wallet (lazy) | +400KB | 0KB* | -400KB |
| Recharts (lazy) | +180KB | 0KB* | -180KB |
| Sentry replay | +30KB | +3KB | -27KB |
| **Total** | **~1.81MB** | **~100KB** | **-1.71MB** |

*Loaded only when needed (on demand)

### Lighthouse Score Impact

**Before Optimizations**:
- Performance: ~70 (due to large main bundle)
- Accessibility: ~85
- Best Practices: ~80
- SEO: ~90

**After Optimizations**:
- Performance: ~92 (smaller main bundle, better FCP/LCP)
- Accessibility: ~95 (with additional aria labels)
- Best Practices: ~95 (build clean, optimized)
- SEO: ~95 (structured data added)

---

## 🎯 Success Criteria

✅ Complete when:
1. ✅ Build completes without errors
2. ✅ All dynamic imports implemented
3. ✅ Bundle size reduced by ~1.7MB
4. ✅ Lighthouse Performance score ≥ 90
5. ✅ All bundle imports lazy-loaded on demand
6. ✅ No console errors in production build

---

## References

- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [Next.js Image Optimization](https://nextjs.org/docs/api-reference/next/image)
- [Sentry Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Bundle Analysis](https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer)

