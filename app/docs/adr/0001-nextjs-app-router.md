# ADR 0001: Next.js App Router as Frontend Framework

**Date:** 2026-02-12
**Status:** Accepted

## Context

The bounty requires a production-ready LMS with 10 core pages, server-side rendering, and Lighthouse scores of 90+. Three framework options were offered: Next.js (React), Nuxt 3 (Vue), and SvelteKit (Svelte).

Key requirements driving the decision:

- **ISR/SSG** for course catalog and detail pages (content changes infrequently)
- **Server Components** to minimize client JavaScript bundle
- **Dynamic routes** for courses, lessons, certificates, and profiles
- **Solana Wallet Adapter** integration (React-only ecosystem)
- **shadcn/ui** as the component library (React + Radix UI)
- **next-intl** for cookie-based i18n with server-side locale resolution
- **next/image** for automatic image optimization (AVIF/WebP)

## Decision

Use **Next.js 16 with App Router** (React 19) as the frontend framework.

App Router was chosen over Pages Router because:

1. **React Server Components** — Course catalog, landing page, and course detail pages are server components with `revalidate = 3600` (ISR). Only interactive leaves (filters, code editor, wallet) use `"use client"`. This reduces the client JS bundle significantly.
2. **Nested layouts** — Each route group (`/courses`, `/dashboard`, `/settings`) has its own `layout.tsx` with section-specific providers, `loading.tsx` skeletons, and `error.tsx` boundaries.
3. **`generateStaticParams`** — Pre-renders all 6 course slugs and 3 certificate IDs at build time as static HTML.
4. **Server Actions** — Locale switching uses a server action to set the cookie without a client-side API call.
5. **`template.tsx`** — The root template re-mounts on navigation, enabling page transition animations without a client-side router wrapper.

## Consequences

### Positive

- Server components eliminate React hydration cost for read-only pages (landing, catalog, course detail)
- ISR with `revalidate = 3600` means CMS content updates propagate within 1 hour without redeploy
- `loading.tsx` files provide automatic Suspense boundaries with skeleton UIs
- `error.tsx` files provide per-route error recovery with retry buttons
- next/image handles responsive sizing, lazy loading, and format negotiation (AVIF > WebP > JPEG)
- Turbopack in dev provides sub-second HMR

### Negative

- Wallet adapter components must be wrapped in `"use client"` boundaries since they depend on browser APIs
- `useSearchParams()` requires a Suspense boundary in server-rendered pages (course catalog wraps the client filter component in `<Suspense>`)
- Framer Motion `useReducedMotion` hook requires client components — page transitions moved to CSS `@keyframes` to avoid CLS from client-only rendering
- App Router caching behavior can be surprising (full-route cache, router cache) — mitigated by explicit `revalidate` exports and `dynamic = "force-dynamic"` where needed

### Alternatives Considered

- **Nuxt 3**: Comparable SSR/ISR capabilities, but Solana Wallet Adapter has no Vue binding. Would require a custom wrapper.
- **SvelteKit**: Excellent performance characteristics, but no shadcn/ui equivalent and minimal Solana ecosystem support.
- **Pages Router**: Simpler mental model, but no server components, no streaming, and layout/loading/error patterns require manual implementation.
