# Backend

This project uses Next.js API Routes (App Router) as the backend layer rather than a separate backend service. All server-side logic lives in `app/src/app/api/`.

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/[...nextauth]` | NextAuth.js authentication (Google, GitHub, wallet) |
| `/api/auth/configured-providers` | List available auth providers |
| `/api/leaderboard` | XP leaderboard with caching |
| `/api/complete-lesson` | Backend-signed lesson completion |
| `/api/finalize-course` | Course finalization with XP award |
| `/api/issue-credential` | Metaplex Core credential issuance |
| `/api/upgrade-credential` | Credential upgrade (track progression) |
| `/api/claim-achievement` | Achievement claim with XP reward |
| `/api/award-streak-freeze` | Streak freeze token award |
| `/api/execute-rust` | Sandboxed Rust code execution (playground) |
| `/api/activity-feed` | User activity feed |
| `/api/rpc` | Solana RPC proxy (hides Helius API key) |
| `/api/courses/[slug]` | Course data by slug |
| `/api/courses/[slug]/finalize` | Course finalization trigger |
| `/api/user/profile` | User profile CRUD |
| `/api/user/delete` | Account deletion |
| `/api/community/threads` | Community forum threads (list/create) |
| `/api/community/threads/[id]` | Thread detail |
| `/api/community/threads/[id]/replies` | Thread replies |
| `/api/community/threads/[id]/answer` | Mark answer on thread |
| `/api/community/threads/[id]/moderate` | Thread moderation |
| `/api/community/votes` | Community voting |
| `/api/admin/auth` | Admin authentication |
| `/api/admin/stats` | Platform statistics |
| `/api/admin/users` | User management |
| `/api/admin/courses` | Course management (list/create) |
| `/api/admin/courses/[courseId]` | Course management (update/delete) |
| `/api/admin/courses/[courseId]/publish` | Course publishing |
| `/api/admin/courses/[courseId]/register-onchain` | On-chain course registration |
| `/api/admin/modules` | Module management (list/create) |
| `/api/admin/modules/[id]` | Module management (update/delete) |
| `/api/admin/lessons` | Lesson management (list/create) |
| `/api/admin/lessons/[id]` | Lesson management (update/delete) |
| `/api/admin/upload` | File upload |
| `/api/admin/sanity-courses` | Sanity CMS course sync |
| `/api/admin/sanity-courses/[id]` | Sanity CMS course detail |
| `/api/admin/cms/test-connection` | Sanity CMS connection test |

## Why Next.js API Routes?

For an LMS with moderate traffic, Next.js API routes provide:
- Zero-config deployment (single Vercel project)
- Shared TypeScript types between frontend and backend
- Edge runtime support for low-latency responses
- Built-in middleware for auth/rate limiting

A separate backend service can be extracted if scaling demands it. The service abstraction layer (`app/src/lib/services/`) ensures all business logic is decoupled from the routing layer.
