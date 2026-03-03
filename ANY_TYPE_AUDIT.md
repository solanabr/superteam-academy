# `any` Type Audit Report

**Generated**: 2026-03-03  
**Total `any` usages found**: ~145 instances across 46 files  
**Severity**: High – violates `strict: true` TypeScript standards

---

## Legend

| Category | Meaning |
|----------|---------|
| **easy** | Obvious replacement: `string`, `number`, `Error`, known lib type |
| **medium** | Needs a new interface definition or uses existing `lib/types` |
| **hard** | SDK/library type (Anchor, Supabase, Monaco, NextAuth) needing investigation |

| Form | Meaning |
|------|---------|
| `: any` | Type annotation |
| `as any` | Type assertion |
| `<any>` | Generic type parameter |

---

## FILE 1: `lib/api/api-client.ts` (12 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 47 | `body?: any` | `: any` | `body?: Record<string, unknown>` | easy |
| 2 | 92 | `this.request<{ user: any; token: string }>` | `: any` | `{ user: User; token: string }` (import from `lib/types`) | medium |
| 3 | 100 | `this.request<{ user: any; token: string }>` | `: any` | `{ user: User; token: string }` | medium |
| 4 | 106 | `data: any` | `: any` | `data: { email?: string; name?: string; image?: string }` | medium |
| 5 | 107 | `this.request<{ user: any; token: string }>` | `: any` | `{ user: User; token: string }` | medium |
| 6 | 117 | `this.request<any>('GET', '/user/profile')` | `<any>` | `this.request<User>` | easy |
| 7 | 126 | `this.request<any>('PATCH', '/user/profile', updates)` | `<any>` | `this.request<User>` | easy |
| 8 | 139 | `this.request<any>('POST', ...)` (completeLesson) | `<any>` | `this.request<{ progress: Progress; xpAwarded: number }>` | medium |
| 9 | 145 | `this.request<any>('GET', '/user/progress')` | `<any>` | `this.request<Progress>` (from `lib/types`) | easy |
| 10 | 149 | `this.request<any>('GET', '/user/achievements')` | `<any>` | `this.request<{ allAchievements: Achievement[]; unlockedAchievements: Achievement[] }>` | medium |
| 11 | 155 | `this.request<any[]>('GET', '/leaderboard...')` | `<any[]>` | `this.request<LeaderboardEntry[]>` (from `lib/types`) | easy |
| 12 | 159 | `this.request<any>('GET', '/user/.../rank')` | `<any>` | `this.request<{ rank: number; totalXp: number }>` | medium |

---

## FILE 2: `lib/hooks/useOnchain.ts` (12 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 12 | `function getProgram(provider: AnchorProvider): Program<any>` | `<any>` | `Program` (untyped — see note¹) | hard |
| 2 | 13 | `new Program<any>(PROGRAM_IDL as any, provider as any)` | `<any>` | `new Program(PROGRAM_IDL as Idl, provider)` | hard |
| 3 | 13 | `PROGRAM_IDL as any` | `as any` | `PROGRAM_IDL as Idl` (import `Idl` from `@coral-xyz/anchor`) | hard |
| 4 | 13 | `provider as any` | `as any` | Remove — provider is already `AnchorProvider` | hard |
| 5 | 93 | `{} as any` (wallet placeholder) | `as any` | Create `READONLY_WALLET` const implementing `Wallet` interface | hard |
| 6 | 98 | `(program.account as any).enrollment` | `as any` | Use typed `program.account['enrollment']` with generated types | hard |
| 7 | 114 | `{} as any` (wallet placeholder) | `as any` | Use `READONLY_WALLET` const | hard |
| 8 | 117 | `(program.account as any).course.all()` | `as any` | Use typed `program.account['course']` | hard |
| 9 | 118 | `(c: any) => c.account.isActive` | `: any` | `(c: { publicKey: PublicKey; account: OnChainCourse }) =>` | medium |
| 10 | 118 | `(c: any) => c.account` | `: any` | Same as above | medium |
| 11 | 134 | `{} as any` (wallet placeholder) | `as any` | Use `READONLY_WALLET` const | hard |
| 12 | 138 | `(program.account as any).course.fetch(coursePda)` | `as any` | Use typed `program.account['course']` | hard |

> **Note¹**: All `Program<any>` usages across the codebase stem from missing generated Anchor types. Fix: run `anchor build` → generate IDL types → `import { Academy } from './academy'` → `Program<Academy>`. This fixes ~30 instances across multiple files.

---

## FILE 3: `backend/src/anchor/onchain.service.ts` (12 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 24 | `private program: Program<any>` | `<any>` | `Program<Academy>` (generated IDL type) | hard |
| 2 | 33 | `signAllTransactions: async (txs: any[])` | `: any[]` | `txs: VersionedTransaction[]` (from `@solana/web3.js`) | hard |
| 3 | 39 | `signTransaction: async (tx: any)` | `: any` | `tx: VersionedTransaction` | hard |
| 4 | 45 | `backendWallet as any` | `as any` | Implement `Wallet` interface from `@coral-xyz/anchor` | hard |
| 5 | 50 | `new Program<any>(programIdl as any, PROGRAM_ID as any, provider as any)` | `<any>` + 3× `as any` | `new Program<Academy>(programIdl as Idl, provider)` | hard |
| 6 | 74 | `(this.program.rpc as any).completeLesson(...)` | `as any` | Use `this.program.methods.completeLesson(...).rpc()` | hard |
| 7 | 113 | `(this.program.rpc as any).finalizeCourse(...)` | `as any` | Use `this.program.methods.finalizeCourse(...).rpc()` | hard |
| 8 | 153 | `(this.program.rpc as any).issueCredential(...)` | `as any` | Use `this.program.methods.issueCredential(...).rpc()` | hard |
| 9 | 197 | `(this.program.rpc as any).upgradeCredential(...)` | `as any` | Use `this.program.methods.upgradeCredential(...).rpc()` | hard |

---

## FILE 4: `lib/services/onchain-course.service.ts` (10 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 31 | `private program: Program<any>` | `<any>` | `Program<Academy>` | hard |
| 2 | 34 | `{} as any` (wallet placeholder) | `as any` | Use `READONLY_WALLET` const | hard |
| 3 | 43 | `(this.program.account as any).course.all()` | `as any` | Use typed account accessor | hard |
| 4 | 45 | `.filter((c: any) => c.account.isActive)` | `: any` | `(c: { publicKey: PublicKey; account: OnChainCourse })` | medium |
| 5 | 46 | `.map((c: any) => c.account)` | `: any` | Same typed parameter | medium |
| 6 | 47 | `.sort((a: any, b: any) => ...)` | `: any` × 2 | `(a: OnChainCourse, b: OnChainCourse)` | medium |
| 7 | 60 | `(this.program.account as any).course.fetch(coursePda)` | `as any` | Use typed account accessor | hard |
| 8 | 98 | `Promise<(any) \| null>` | `: any` | Define `OnChainEnrollment` interface | medium |
| 9 | 101 | `(this.program.account as any).enrollment.fetchNullable(...)` | `as any` | Use typed account accessor | hard |

---

## FILE 5: `lib/services/course.service.ts` (9 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 31 | `getLesson(...): Promise<any>` | `: any` | `Promise<Lesson \| null>` (from `lib/types`) | easy |
| 2 | 621 | `mapSanityLesson(rawLesson: any): any` | `: any` × 2 | `(rawLesson: SanityLesson): Lesson` | medium |
| 3 | 623 | `(tc: any, idx: number)` | `: any` | `(tc: { input?: string; expectedOutput?: string; description?: string }, idx: number)` | medium |
| 4 | 652 | `(module: any)` | `: any` | `(module: SanityModule)` (from `lib/sanity`) | easy |
| 5 | 658 | `(lesson: any)` | `: any` | `(lesson: SanityLesson)` | easy |
| 6 | 723 | `(oc: any)` | `: any` | `(oc: OnChainCourse)` (from `lib/anchor`) | medium |
| 7 | 793 | `(onChainCourse as any).difficulty` | `as any` | Cast to `OnChainCourse` — `(onChainCourse as OnChainCourse).difficulty` | medium |
| 8 | 867 | `getLesson(...): Promise<any>` | `: any` | `Promise<Lesson \| null>` | easy |

---

## FILE 6: `lib/services/onchain.service.ts` (7 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 22 | `private program: Program<any>` | `<any>` | `Program<Academy>` | hard |
| 2 | 31 | `signAllTransactions: async (txs: any[])` | `: any[]` | `txs: VersionedTransaction[]` | hard |
| 3 | 37 | `signTransaction: async (tx: any)` | `: any` | `tx: VersionedTransaction` | hard |
| 4 | 43 | `backendWallet as any` | `as any` | Implement `Wallet` interface | hard |
| 5 | 69 | `(this.program.account as any).config.fetch(...)` | `as any` | Use typed account accessor | hard |
| 6 | 70 | `(this.program.account as any).course.fetch(...)` | `as any` | Use typed account accessor | hard |
| 7 | 113 | `(this.program.account as any).course.fetch(...)` | `as any` | Use typed account accessor | hard |

---

## FILE 7: `lib/sanity.ts` (6 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 14 | `urlFor(source: any)` | `: any` | `source: SanityImageSource` (from `@sanity/image-url`) | medium |
| 2 | 59 | `thumbnail?: any` | `: any` | `thumbnail?: SanityImageSource` | medium |
| 3 | 62 | `avatar?: any` | `: any` | `avatar?: SanityImageSource` | medium |
| 4 | 65 | `modules?: any[]` | `: any[]` | `modules?: SanityModule[]` | easy |
| 5 | 74 | `lessons?: any[]` | `: any[]` | `lessons?: SanityLesson[]` | easy |
| 6 | 84 | `challenge?: any` | `: any` | Define `SanityChallenge` interface: `{ prompt?: string; starterCode?: string; testCases?: Array<{input?: string; expectedOutput?: string; description?: string}>; hints?: string[] }` | medium |

---

## FILE 8: `lib/auth.ts` (10 instances — 6 unique semantic usages)

All these share a root cause: NextAuth session/token types are not augmented.

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 50 | `(user as any).provider = account?.provider` | `as any` | Augment `next-auth` `User` type (see fix²) | medium |
| 2 | 56 | `(session as any).needsProfile` | `as any` | Augment `Session` type | medium |
| 3 | 57 | `(token as any).needsProfile = (session as any).needsProfile` | `as any` × 2 | Augment `JWT` type | medium |
| 4 | 78 | `(session.user as any).id = (token as any).id` | `as any` × 2 | Augment `Session['user']` and `JWT` | medium |
| 5 | 79 | `(session.user as any).provider = (token as any).provider` | `as any` × 2 | Same augmentation | medium |
| 6 | 80 | `(session.user as any).needsProfile = Boolean((token as any).needsProfile)` | `as any` × 2 | Same augmentation | medium |

> **Fix²**: Create `types/next-auth.d.ts`:
> ```typescript
> import { DefaultSession, DefaultUser } from 'next-auth'
> import { DefaultJWT } from 'next-auth/jwt'
> 
> declare module 'next-auth' {
>   interface User extends DefaultUser {
>     provider?: string
>   }
>   interface Session {
>     user: DefaultSession['user'] & {
>       id: string
>       provider?: string
>       needsProfile?: boolean
>     }
>   }
> }
> 
> declare module 'next-auth/jwt' {
>   interface JWT extends DefaultJWT {
>     id?: string
>     provider?: string
>     needsProfile?: boolean
>   }
> }
> ```
> This single file eliminates **~25 `session.user as any` casts** across the entire codebase (files 8, 9, 19, 20, 26, 30, 34, 45).

---

## FILE 9: `app/auth/complete-profile/page.tsx` (7 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 26 | `const user = session.user as any` | `as any` | Remove cast after NextAuth augmentation (Fix²) | medium |
| 2 | 82 | `(session?.user as any)?.id` | `as any` | Remove after Fix² | medium |
| 3 | 82 | `(session?.user as any)?.email` | `as any` | Remove after Fix² | medium |
| 4 | 89 | `(session?.user as any)?.provider` | `as any` | Remove after Fix² | medium |
| 5 | 92 | `(session?.user as any)?.email` | `as any` | Remove after Fix² | medium |
| 6 | 95 | `(session?.user as any)?.image` | `as any` | Remove after Fix² | medium |
| 7 | 208 | `(session?.user as any)?.email` | `as any` | Remove after Fix² | medium |

---

## FILE 10: `app/api/credentials/issue/route.ts` (6 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 39 | `.maybeSingle()) as any` | `as any` | Remove — use Supabase generic: `.from('enrollments').select<...>()` or typed DB (see note³) | hard |
| 2 | 61 | `.maybeSingle()) as any` | `as any` | Same fix | hard |
| 3 | 80 | `.maybeSingle()) as any` | `as any` | Same fix | hard |
| 4 | 102 | `...insert({...})) as any` | `as any` | Same fix | hard |
| 5 | 143 | `db: any` param | `: any` | `db: SupabaseClient` (import from `@supabase/supabase-js`) | medium |
| 6 | 170 | `db: any` param | `: any` | `db: SupabaseClient` | medium |

> **Note³**: All Supabase `as any` casts (across files 10, 11, 23) are caused by missing database type generation. Fix: run `supabase gen types typescript` to generate `Database` type, then `createClient<Database>(...)`. This eliminates ~15 `as any` casts.

---

## FILE 11: `app/api/courses/finalize/route.ts` (6 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 38 | `.maybeSingle()) as any` | `as any` | Typed Supabase client (Note³) | hard |
| 2 | 64 | `.maybeSingle()) as any` | `as any` | Same | hard |
| 3 | 95 | `.eq('id', enrollment?.id)) as any` | `as any` | Same | hard |
| 4 | 120 | `...insert({...})) as any` | `as any` | Same | hard |
| 5 | 127 | `.maybeSingle()) as any` | `as any` | Same | hard |
| 6 | 136 | `.eq('id', userId)) as any` | `as any` | Same | hard |

---

## FILE 12: `lib/anchor/client.ts` (11 instances — 5 unique patterns)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 16 | `getProgram(...): Program<any>` | `<any>` | `Program<Academy>` once IDL types exist | hard |
| 2 | 17 | `new Program<any>(PROGRAM_IDL as any, provider as any)` | `<any>`, `as any` × 2 | `new Program<Academy>(PROGRAM_IDL as Idl, provider)` | hard |
| 3 | 27 | `getProgramWithKeypair(...): Program<any>` | `<any>` | `Program<Academy>` | hard |
| 4 | 30 | `signAllTransactions: async (txs: any[])... signTransaction: async (tx: any)... } as any` | `: any[]`, `: any`, `as any` | Create typed `ReadonlyWallet` implementing `Wallet` interface | hard |
| 5 | 34 | `new Program<any>(PROGRAM_IDL as any, provider as any)` | `<any>`, `as any` × 2 | Same as #2 | hard |

---

## FILE 13: `app/courses/[slug]/lessons/[id]/page.tsx` (5 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 528 | `setCourse(courseData as any)` | `as any` | `setCourse(courseData as CourseData)` — or fix `Course` → `CourseData` mapping | medium |
| 2 | 529 | `(courseData as any).modules` | `as any` | Same — cast to `CourseData` | medium |
| 3 | 544 | `(session?.user as any)?.id` | `as any` | Remove after Fix² (NextAuth augmentation) | medium |
| 4 | 696 | `({ node, inline, ...p }: any)` ReactMarkdown | `: any` | `({ node, inline, ...p }: { node?: Element; inline?: boolean; [key: string]: unknown })` | medium |
| 5 | 786 | `({ node, inline, ...p }: any)` ReactMarkdown | `: any` | Same as above | medium |

---

## FILE 14: `backend/src/services/user.service.ts` (4 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 19 | `profile: any` | `: any` | `profile: { email?: string; name?: string; login?: string; image?: string; avatar_url?: string }` | medium |
| 2 | 128 | `const updates: any = {}` | `: any` | `const updates: Partial<{ display_name: string }>` | easy |
| 3 | 150 | `(e: any)` | `: any` | `(e: { id: string; course_id: string; lessons_completed: number; total_xp_earned: number; enrolled_at: string; completed_at: string \| null })` | medium |
| 4 | 172 | `(u: any)` | `: any` | `(u: { id: string; display_name: string; avatar_url: string \| null; total_xp: number; level: number })` | medium |

---

## FILE 15: `lib/services/learning-progress.service.ts` (3 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 86 | `private program: Program<any> \| null` | `<any>` | `Program<Academy> \| null` | hard |
| 2 | 99 | `{} as any` (wallet placeholder) | `as any` | Use `READONLY_WALLET` | hard |
| 3 | 117 | `(this.program.account as any).config.fetch(...)` | `as any` | Typed account accessor | hard |

---

## FILE 16: `lib/services/code-execution.service.ts` (3 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 36 | `console.log = (...args: any[])` | `: any[]` | `(...args: unknown[])` | easy |
| 2 | 39 | `console.error = (...args: any[])` | `: any[]` | `(...args: unknown[])` | easy |
| 3 | 42 | `console.warn = (...args: any[])` | `: any[]` | `(...args: unknown[])` | easy |

---

## FILE 17: `lib/hooks/useProgram.ts` (3 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 28 | `const walletAdapter = (wallet as any)` | `as any` | Type properly: `wallet` from `useWallet()` already has `signTransaction` — check type narrowing | hard |
| 2 | 32 | `signAllTransactions: async (txs: any[])` | `: any[]` | `txs: Transaction[]` (from `@solana/web3.js`) | hard |
| 3 | 41 | `return getProgram(provider) as any` | `as any` | Remove — `getProgram` already returns `Program` | hard |

---

## FILE 18: `backend/src/services/auth.service.ts` (3 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 163 | `jwt.verify(...) as any` | `as any` | `as { userId: string; email: string }` or use `jwt.verify` with generic | easy |
| 2 | 176 | `const updateData: any = {}` | `: any` | `const updateData: Partial<{ display_name: string; bio: string; avatar_url: string }> = {}` | easy |
| 3 | 189 | `const profileUpdate: any = {}` | `: any` | `const profileUpdate: Partial<{ first_name: string; last_name: string; age: number }> = {}` | easy |

---

## FILE 19: `app/dashboard/page.tsx` (3 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 31 | `((session?.user as any)?.id as string \| undefined)` | `as any` | Remove after Fix² | medium |
| 2 | 81 | `(session?.user as any)?.needsProfile` | `as any` | Remove after Fix² | medium |
| 3 | 178 | `(session?.user as any)?.needsProfile` | `as any` | Remove after Fix² | medium |

---

## FILE 20: `app/api/xp/award/route.ts` (4 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 13 | `supabase: any` | `: any` | `supabase: SupabaseClient` | medium |
| 2 | 47 | `supabase: any` | `: any` | `supabase: SupabaseClient` | medium |
| 3 | 71 | `supabase: any` | `: any` | `supabase: SupabaseClient` | medium |
| 4 | 74 | `): Promise<any \| null>` | `: any` | Define return type: `Promise<{ id: string; course_id: string; [key: string]: unknown } \| null>` | medium |

---

## FILE 21: `app/api/users/[userId]/profile/route.ts` (4 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 3 | `function mapUser(user: any, ...)` | `: any` | Define `SupabaseUserRow` interface with DB columns | medium |
| 2 | 35 | `supabase: any` | `: any` | `supabase: SupabaseClient` | medium |
| 3 | 71 | `supabase: any` | `: any` | `supabase: SupabaseClient` | medium |
| 4 | 136 | `const updates: Record<string, any>` | `: any` | `Record<string, string>` (all values are strings) | easy |

---

## FILE 22: `app/api/enrollments/route.ts` (4 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 13 | `supabase: any` | `: any` | `supabase: SupabaseClient` | medium |
| 2 | 47 | `supabase: any` | `: any` | `supabase: SupabaseClient` | medium |
| 3 | 71 | `supabase: any` | `: any` | `supabase: SupabaseClient` | medium |
| 4 | 74 | `): Promise<any \| null>` | `: any` | `Promise<{ id: string; course_id: string } \| null>` | medium |

---

## FILE 23: `app/api/enrollments/[userId]/completion/route.ts` (3 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 32 | `.maybeSingle()) as any` | `as any` | Typed Supabase (Note³) | hard |
| 2 | 61 | `.maybeSingle()) as any` | `as any` | Same | hard |
| 3 | 83 | `.maybeSingle()) as any` | `as any` | Same | hard |

---

## FILE 24: `lib/services/test-runner.service.ts` (3 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 47 | `{ functionName?: string; args?: any[] }` | `: any[]` | `args?: (string \| number \| boolean \| object)[]` or `args?: unknown[]` | easy |
| 2 | 50 | `{ functionName?: string; args?: any[] }` | `: any[]` | Same as above | easy |
| 3 | 112 | `const scope: Record<string, any>` | `: any` | `Record<string, unknown>` | easy |

---

## FILE 25: `lib/hooks/useProgress.ts` (5 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 68 | `useState<any[]>([])` (achievements) | `<any[]>` | `useState<Achievement[]>([])` (from `lib/types`) | easy |
| 2 | 69 | `useState<any[]>([])` (unlocked) | `<any[]>` | `useState<Achievement[]>([])` | easy |
| 3 | 102 | `useState<any[]>([])` (leaderboard) | `<any[]>` | `useState<LeaderboardEntry[]>([])` | easy |
| 4 | 124 | `(entry: any, idx: number)` | `: any` | Define inline type or use `LeaderboardEntry` from API | medium |
| 5 | 158 | `useState<any>(null)` (rank) | `<any>` | `useState<{ rank: number; totalXp: number } \| null>(null)` | easy |

---

## FILE 26: `lib/hooks/useGamification.ts` (2 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 75 | `(session?.user as any)?.id` | `as any` | Remove after Fix² | medium |
| 2 | 95 | `(session?.user as any)?.id` (in deps array) | `as any` | Remove after Fix² | medium |

---

## FILE 27: `lib/hooks/useConfig.ts` (2 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 15 | `{} as any` (wallet placeholder) | `as any` | Use `READONLY_WALLET` const | hard |
| 2 | 19 | `(program.account as any).config.fetch(...)` | `as any` | Typed account accessor | hard |

---

## FILE 28: `components/editor/SolanaCodeLesson.tsx` (4 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 397 | `useRef<any>(null)` | `<any>` | `useRef<editor.IStandaloneCodeEditor \| null>(null)` (from `monaco-editor`) | medium |
| 2 | 451 | `(model: any, position: any)` | `: any` × 2 | `(model: editor.ITextModel, position: Position)` from `monaco-editor` | medium |

---

## FILE 29: `components/editor/RustEditor.tsx` (2 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 16 | `onRun?: (code: string, output: any) => void` | `: any` | `output: RunResult` — define: `{ stdout: string; stderr: string; success: boolean; compileTime?: number; warnings?: string[] }` | medium |
| 2 | 31 | `useRef<any>(null)` | `<any>` | `useRef<editor.IStandaloneCodeEditor \| null>(null)` | medium |

---

## FILE 30: `components/courses/CourseCatalog.tsx` (2 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 32 | `((session?.user as any)?.id as string \| undefined)` | `as any` | Remove after Fix² | medium |
| 2 | 55 | `(e: any) => String(e.courseId)` | `: any` | `(e: { courseId: string }) =>` | easy |

---

## FILE 31: `backend/src/services/transaction.service.ts` (3 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 31 | `let IDL: any` | `: any` | `let IDL: Record<string, unknown> \| null` | easy |
| 2 | 111 | `programIdl as any` | `as any` | `programIdl as Idl` (from `@coral-xyz/anchor`) | hard |
| 3 | 111 | `this.programId as any` | `as any` | Remove — `PublicKey` is valid here | hard |

---

## FILE 32: `backend/src/services/enrollment.service.ts` (2 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 133 | `(l: any) => l.lesson_id` | `: any` | `(l: { lesson_id: string })` | easy |
| 2 | 159 | `(e: any) => ({...})` | `: any` | `(e: { course_id: string; lessons_completed: number; total_xp_earned: number; enrolled_at: string; completed_at: string \| null })` | medium |

---

## FILE 33: `app/settings/page.tsx` (2 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 84 | `setLanguage(e.target.value as any)` | `as any` | `as 'en' \| 'pt-br' \| 'es'` | easy |
| 2 | 97 | `setTheme(e.target.value as any)` | `as any` | `as 'light' \| 'dark' \| 'auto'` | easy |

---

## FILE 34: `app/courses/[slug]/page.tsx` (2 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 40 | `((session?.user as any)?.id as string \| undefined)` | `as any` | Remove after Fix² | medium |
| 2 | 79 | `(item: any) => String(item.courseId)` | `: any` | `(item: { courseId: string })` | easy |

---

## FILE 35: `app/api/users/oauth/route.ts` (2 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 4 | `function mapUser(user: any)` | `: any` | Define `SupabaseUserRow` interface | medium |
| 2 | 20 | `supabase: any` | `: any` | `supabase: SupabaseClient` | medium |

---

## FILE 36: `app/api/gamification/[userId]/route.ts` (2 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 33 | `parseOnchainAmount(data: any)` | `: any` | `data: { uiAmount?: number; uiAmountString?: string; amount?: string; decimals?: number }` | medium |
| 2 | 81 | `supabase: any` | `: any` | `supabase: SupabaseClient` | medium |

---

## FILE 37: `lib/i18n/translations.ts` (1 instance)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 500 | `let value: any = translations[lang]` | `: any` | `let value: Record<string, unknown> \| string = ...` — or define `TranslationTree` recursive type | medium |

---

## FILE 38: `lib/hooks/useXPBalance.ts` (1 instance)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 32 | `parseAmount = (tokenBalance: any)` | `: any` | `tokenBalance: { value?: { uiAmount?: number; uiAmountString?: string; amount?: string; decimals?: number } }` | medium |

---

## FILE 39: `lib/hooks/useAwardXP.ts` (1 instance)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 67 | `(session.user as any).id` | `as any` | Remove after Fix² | medium |

---

## FILE 40: `lib/anchor/idl-compat.ts` (3 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 3 | `type AnyRecord = Record<string, any>` | `: any` | `Record<string, unknown>` | easy |
| 2 | 10 | `normalizeTypeNode(value: any): any` | `: any` × 2 | `(value: unknown): unknown` | medium |

---

## FILE 41: `lib/analytics/posthog.ts` (3 instances)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 4 | `let posthogInstance: any = null` | `: any` | `let posthogInstance: PostHog \| null = null` (import `PostHog` from `posthog-js`) | medium |
| 2 | 30 | `properties?: Record<string, any>` | `: any` | `Record<string, unknown>` | easy |
| 3 | 44 | `properties?: Record<string, any>` | `: any` | `Record<string, unknown>` | easy |

---

## FILE 42: `components/layout/Header.tsx` (1 instance)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 40 | `setLanguage(e.target.value as any)` | `as any` | `as 'en' \| 'pt-br' \| 'es'` | easy |

---

## FILE 43: `components/editor/CodeEditor.tsx` (1 instance)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 28 | `useRef<any>(null)` | `<any>` | `useRef<editor.IStandaloneCodeEditor \| null>(null)` | medium |

---

## FILE 44: `backend/src/index.ts` (1 instance)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 45 | `(err: any, req: Request, ...)` | `: any` | `err: Error` (Express error handler convention) | easy |

---

## FILE 45: `app/profile/page.tsx` (1 instance)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 39 | `((session?.user as any)?.id as string \| undefined)` | `as any` | Remove after Fix² | medium |

---

## FILE 46: `app/api/users/[userId]/enrollments/route.ts` (1 instance)

| # | Line | Snippet | Form | Replacement | Category |
|---|------|---------|------|-------------|----------|
| 1 | 15 | `supabase: any` | `: any` | `supabase: SupabaseClient` | medium |

---

## Summary by Root Cause

| Root Cause | Instances | Fix |
|-----------|-----------|-----|
| **Missing NextAuth type augmentation** | ~25 | Create `types/next-auth.d.ts` (Fix²) |
| **Missing Anchor IDL types (`Program<any>`)** | ~30 | Run `anchor build` + generate types → `Program<Academy>` |
| **Untyped Supabase client (`as any` casts)** | ~15 | Run `supabase gen types` → `createClient<Database>()` |
| **Missing `Wallet` interface for read-only providers (`{} as any`)** | ~8 | Create `READONLY_WALLET` const implementing `Wallet` |
| **Untyped Anchor `program.account` access** | ~12 | Generated IDL types solve this automatically |
| **Generic API response types** | ~12 | Replace `<any>` with existing types from `lib/types` |
| **Supabase helper `supabase: any` params** | ~10 | `import { SupabaseClient } from '@supabase/supabase-js'` |
| **Untyped Sanity CMS interfaces** | ~6 | Fill in existing `SanityModule`/`SanityLesson` types |
| **Easy literal type replacements** | ~15 | Simple `string`, `number`, `Error`, union types |
| **Monaco editor ref types** | ~4 | `editor.IStandaloneCodeEditor` from `monaco-editor` |

---

## Recommended Fix Order

1. **Create `types/next-auth.d.ts`** — eliminates ~25 `as any` casts across 10+ files (Fix²)
2. **Generate Anchor IDL types** — eliminates ~30 `Program<any>` and `program.account as any`
3. **Generate Supabase `Database` type** — eliminates ~15 `as any` casts in API routes  
4. **Create `READONLY_WALLET` utility** — eliminates ~8 `{} as any` wallet placeholders
5. **Fix `lib/api/api-client.ts`** — replace 12 generic `<any>` with existing `lib/types`
6. **Fix `lib/sanity.ts`** — properly type all 6 Sanity interfaces
7. **Fix remaining easy replacements** — `string`, `Error`, union types (~15 instances)
