# Deployment and Infrastructure

## Table of Contents

- [Deployment Architecture](#deployment-architecture)
- [Vercel Deployment](#vercel-deployment)
- [Environment Variables](#environment-variables)
- [Build Pipeline](#build-pipeline)
- [Infrastructure Dependencies](#infrastructure-dependencies)
- [Monitoring and Observability](#monitoring-and-observability)
- [PWA Configuration](#pwa-configuration)

---

## Deployment Architecture

```mermaid
graph TB
    subgraph CI_CD["CI/CD Pipeline"]
        GIT["GitHub Repository"]
        PR["Pull Request"]
        PREVIEW["Preview Deployment"]
        PROD["Production Deploy"]
    end

    subgraph Vercel_Infra["Vercel Platform"]
        EDGE["Edge Network<br/>Global CDN"]
        SERVERLESS["Serverless Functions<br/>API Routes"]
        STATIC["Static Assets<br/>ISR / SSG pages"]
        PREVIEW_URL["Preview URLs<br/>Per-branch deployments"]
    end

    subgraph Services["Managed Services"]
        SUPA_S["Supabase<br/>PostgreSQL + Auth"]
        UPSTASH_S["Upstash<br/>Redis REST API"]
        SANITY_S["Sanity.io<br/>Content CDN"]
        HELIUS_S["Helius<br/>Solana RPC + DAS"]
    end

    subgraph Monitoring_S["Monitoring"]
        SENTRY_M["Sentry<br/>Error + Performance"]
        PH_M["PostHog<br/>Product Analytics"]
        GA_M["Google Analytics<br/>Traffic"]
    end

    GIT --> PR
    PR --> PREVIEW
    PREVIEW --> PREVIEW_URL
    GIT -->|main branch| PROD
    PROD --> Vercel_Infra
    Vercel_Infra --> Services
    Vercel_Infra --> Monitoring_S
```

---

## Vercel Deployment

### Build Configuration

| Setting | Value |
|---|---|
| Framework | Next.js |
| Build Command | `prisma generate && next build` |
| Output Directory | `.next` |
| Node.js Version | 20.x |
| Install Command | `npm install` (triggers `postinstall: prisma generate`) |

### Pre-build Steps

```mermaid
flowchart LR
    INSTALL["npm install"] --> POSTINSTALL["prisma generate<br/>(postinstall hook)"]
    POSTINSTALL --> PREBUILD["node scripts/generate-translations.js<br/>(prebuild hook)"]
    PREBUILD --> BUILD["prisma generate &&<br/>next build"]
    BUILD --> DEPLOY["Deploy to Vercel"]
```

### Deployment Commands

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Local development server |
| `build` | `prisma generate && next build` | Production build |
| `start` | `next start` | Production server |
| `predev` | `node scripts/generate-translations.js` | Generate i18n before dev |
| `prebuild` | `node scripts/generate-translations.js` | Generate i18n before build |
| `postinstall` | `prisma generate` | Generate Prisma client after install |

---

## Environment Variables

### Required Variables

| Variable | Category | Where Used |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Database | Frontend + Backend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Database | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Database | Backend only |
| `DATABASE_URL` | Database | Prisma ORM |
| `AUTH_SECRET` | Auth | NextAuth JWT signing |
| `GOOGLE_CLIENT_ID` | Auth | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Auth | Google OAuth |
| `GITHUB_CLIENT_ID` | Auth | GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | Auth | GitHub OAuth |
| `NEXTAUTH_URL` | Auth | Callback URLs, CSRF |

### Optional Variables

| Variable | Category | Default | Description |
|---|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Cache | None | Redis for rate limiting (required in prod) |
| `UPSTASH_REDIS_REST_TOKEN` | Cache | None | Redis auth token |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Blockchain | devnet | Solana network |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Blockchain | Public devnet | Custom RPC endpoint |
| `NEXT_PUBLIC_HELIUS_RPC_URL` | Blockchain | None | Helius RPC URL |
| `HELIUS_RPC_URL` | Blockchain | None | Server-side Helius URL |
| `HELIUS_API_KEY` | Blockchain | None | Helius API key |
| `BACKEND_SIGNER_PRIVATE_KEY` | Blockchain | None | Backend signer for on-chain ops |
| `SANITY_PROJECT_ID` | CMS | None | Sanity project ID |
| `SANITY_DATASET` | CMS | production | Sanity dataset |
| `SANITY_API_TOKEN` | CMS | None | Sanity API token |
| `SANITY_PREVIEW_SECRET` | CMS | None | Preview mode secret |
| `NEXT_PUBLIC_GA_ID` | Analytics | None | Google Analytics ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | Analytics | None | PostHog project key |
| `SENTRY_DSN` | Monitoring | None | Sentry data source name |
| `ADMIN_WALLETS` | RBAC | None | Comma-separated admin wallet list |
| `CALLBACK_SECRET` | Auth | AUTH_SECRET | Callback token signing |
| `ALLOWED_ORIGINS` | Security | None | CORS allowed origins |

### Variable Categorization

```mermaid
graph LR
    subgraph Public["NEXT_PUBLIC_ (Client-Exposed)"]
        PUB1["SUPABASE_URL"]
        PUB2["SUPABASE_ANON_KEY"]
        PUB3["SOLANA_NETWORK"]
        PUB4["SOLANA_RPC_URL"]
        PUB5["GA_ID"]
        PUB6["POSTHOG_KEY"]
        PUB7["HELIUS_RPC_URL"]
        PUB8["APP_URL"]
    end

    subgraph Server["Server-Only (Never Exposed)"]
        SRV1["SUPABASE_SERVICE_ROLE_KEY"]
        SRV2["AUTH_SECRET"]
        SRV3["GOOGLE_CLIENT_SECRET"]
        SRV4["GITHUB_CLIENT_SECRET"]
        SRV5["BACKEND_SIGNER_PRIVATE_KEY"]
        SRV6["UPSTASH_REDIS_REST_TOKEN"]
        SRV7["SANITY_API_TOKEN"]
        SRV8["SENTRY_DSN"]
    end

    style Public fill:#3498db,color:#fff
    style Server fill:#e74c3c,color:#fff
```

---

## Build Pipeline

### Next.js Configuration

```mermaid
graph TD
    subgraph Config["next.config.ts"]
        IMAGES["Image Domains<br/>Sanity CDN, avatars"]
        WEBPACK["Webpack Config<br/>Module resolution"]
        I18N_CFG["i18n Configuration<br/>next-intl plugin"]
        SENTRY_CFG["Sentry Integration<br/>Source maps, tunnel"]
    end

    subgraph Output["Build Output"]
        SSR["Server-Rendered Pages"]
        SSG["Static Pages"]
        ISR["Incremental Static Regen"]
        API_OUT["API Route Functions"]
    end

    Config --> Output
```

---

## Infrastructure Dependencies

### Service Dependency Map

```mermaid
graph TB
    APP["Superteam Academy"]

    APP -->|Required| SUPA["Supabase<br/>PostgreSQL + Auth"]
    APP -->|Required| VERCEL_D["Vercel<br/>Hosting"]
    APP -->|Required| OAUTH_D["Google + GitHub<br/>OAuth providers"]

    APP -->|Recommended| REDIS_D["Upstash Redis<br/>Rate limiting + caching"]
    APP -->|Recommended| HELIUS_D["Helius<br/>RPC + DAS API"]
    APP -->|Recommended| SENTRY_D["Sentry<br/>Error tracking"]

    APP -->|Optional| SANITY_D["Sanity.io<br/>CMS content"]
    APP -->|Optional| PH_D["PostHog<br/>Product analytics"]
    APP -->|Optional| GA_D["Google Analytics<br/>Traffic analytics"]

    style SUPA fill:#27ae60,color:#fff
    style VERCEL_D fill:#27ae60,color:#fff
    style OAUTH_D fill:#27ae60,color:#fff
    style REDIS_D fill:#f39c12,color:#fff
    style HELIUS_D fill:#f39c12,color:#fff
    style SENTRY_D fill:#f39c12,color:#fff
    style SANITY_D fill:#3498db,color:#fff
    style PH_D fill:#3498db,color:#fff
    style GA_D fill:#3498db,color:#fff
```

---

## Monitoring and Observability

### Monitoring Stack

| Tool | Purpose | Configuration |
|---|---|---|
| Sentry | Error tracking + performance monitoring | `sentry.client.config.ts`, `sentry.server.config.ts` |
| PostHog | Product analytics, user behavior | `NEXT_PUBLIC_POSTHOG_KEY` |
| Google Analytics | Traffic and engagement metrics | `NEXT_PUBLIC_GA_ID` |

### Sentry Configuration

```mermaid
graph LR
    subgraph SentryConfig["Sentry Setup"]
        CLIENT["sentry.client.config.ts<br/>Browser error tracking"]
        SERVER["sentry.server.config.ts<br/>Server error tracking"]
    end

    subgraph Captures["Captured Events"]
        ERRORS["Unhandled errors"]
        PERF["Performance data"]
        CUSTOM["Custom events"]
    end

    SentryConfig --> Captures
```

---

## PWA Configuration

### Progressive Web App Support

| Feature | Implementation |
|---|---|
| Service Worker | `components/pwa/` |
| Offline fallback | `[locale]/offline/page.tsx` |
| Offline data sync | `useOfflineSync` hook (IndexedDB) |
| Push notifications | Web Push API via `usePushNotifications` |
| Install prompt | Native browser install |

### PWA Offline Architecture

```mermaid
graph TB
    subgraph Online["Online Mode"]
        LIVE["Live API calls"]
        LIVE_DATA["Real-time data"]
    end

    subgraph Offline["Offline Mode"]
        SW["Service Worker<br/>Cache API"]
        IDB["IndexedDB<br/>useOfflineSync"]
        FALLBACK["Offline Page<br/>/offline"]
    end

    subgraph Sync_Phase["Sync on Reconnect"]
        DETECT["Connection detected"]
        PUSH_SYNC["Push cached changes"]
        PULL_SYNC["Pull fresh data"]
    end

    Online --> Offline
    Offline --> Sync_Phase
    Sync_Phase --> Online
```

### Offline Data Sync Flow

```mermaid
sequenceDiagram
    participant User
    participant App as PWA App
    participant IDB as IndexedDB
    participant API as Backend API

    Note over User,API: Online - Normal Operation
    User->>App: Complete lesson
    App->>API: POST /api/lessons/complete
    API-->>App: Success

    Note over User,API: Goes Offline
    User->>App: Complete lesson (offline)
    App->>IDB: Store pending action
    App-->>User: Optimistic UI update

    Note over User,API: Back Online
    App->>App: Detect connection restored
    App->>IDB: Get pending actions
    loop Each Pending Action
        App->>API: Replay action
        API-->>App: Success
        App->>IDB: Remove from pending
    end
```
