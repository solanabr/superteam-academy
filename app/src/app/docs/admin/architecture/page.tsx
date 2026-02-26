import type { Metadata } from "next";
import { DocsPagination } from "@/components/docs";

export const metadata: Metadata = { title: "Architecture" };

export default function ArchitecturePage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Architecture</h1>
      <p className="lead">
        Superteam Academy is a full-stack Solana learning platform with a
        Next.js frontend, Supabase backend, Sanity CMS, and an Anchor on-chain
        program. Here&apos;s how every piece fits together.
      </p>

      <h2>Tech Stack Overview</h2>
      <table>
        <thead>
          <tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Frontend</strong></td><td>Next.js 16, React 19, Tailwind CSS 4</td><td>Server-rendered UI with App Router</td></tr>
          <tr><td><strong>UI Components</strong></td><td>shadcn/ui, Radix UI, Lucide Icons</td><td>Accessible component library</td></tr>
          <tr><td><strong>Animations</strong></td><td>Framer Motion</td><td>Page transitions, micro-interactions</td></tr>
          <tr><td><strong>State</strong></td><td>Zustand</td><td>Client-side state with localStorage persistence</td></tr>
          <tr><td><strong>Charts</strong></td><td>Recharts</td><td>Skill radar, progress visualization</td></tr>
          <tr><td><strong>Code Editor</strong></td><td>Monaco Editor</td><td>In-browser coding challenges with server-side validation</td></tr>
          <tr><td><strong>Database</strong></td><td>Supabase (PostgreSQL)</td><td>User data, progress, streaks, achievements</td></tr>
          <tr><td><strong>Auth</strong></td><td>Supabase Auth</td><td>OAuth (Google/GitHub) + wallet-based auth</td></tr>
          <tr><td><strong>CMS</strong></td><td>Sanity</td><td>Course content (lessons, modules, quizzes)</td></tr>
          <tr><td><strong>On-Chain</strong></td><td>Anchor 0.31+, Rust</td><td>Enrollment, XP minting, credentials</td></tr>
          <tr><td><strong>XP Tokens</strong></td><td>Token-2022</td><td>Soulbound XP (NonTransferable + PermanentDelegate)</td></tr>
          <tr><td><strong>Credentials</strong></td><td>Metaplex Core</td><td>Soulbound NFT certificates</td></tr>
          <tr><td><strong>RPC</strong></td><td>Helius</td><td>DAS API for NFT queries, fast RPC</td></tr>
          <tr><td><strong>Monitoring</strong></td><td>Sentry</td><td>Error tracking, performance, session replay</td></tr>
          <tr><td><strong>Analytics</strong></td><td>GA4 + PostHog</td><td>User behavior, funnel analysis</td></tr>
          <tr><td><strong>i18n</strong></td><td>next-intl</td><td>3 locales (en, pt-br, es)</td></tr>
          <tr><td><strong>Testing</strong></td><td>Playwright</td><td>E2E + Lighthouse CI</td></tr>
          <tr><td><strong>Hosting</strong></td><td>Vercel</td><td>Frontend deployment with edge functions</td></tr>
        </tbody>
      </table>

      <h2>Monorepo Structure</h2>
      <pre><code>{`superteam-academy/
├── app/                        ← Next.js frontend
│   ├── src/
│   │   ├── app/                ← App Router pages & API routes
│   │   ├── components/         ← React components
│   │   ├── hooks/              ← Custom React hooks
│   │   ├── lib/                ← Utility functions
│   │   ├── services/           ← Service layer (DI pattern)
│   │   ├── stores/             ← Zustand stores
│   │   ├── types/              ← TypeScript types
│   │   └── i18n/               ← Internationalization
│   ├── supabase/               ← Database migrations
│   ├── e2e/                    ← Playwright E2E tests
│   └── public/                 ← Static assets, PWA manifest
├── onchain-academy/            ← Anchor workspace
│   ├── programs/               ← Solana program (Rust)
│   ├── tests/                  ← Rust unit + TS integration tests
│   └── migrations/             ← Anchor migrations
├── scripts/                    ← Content push scripts
├── wallets/                    ← Keypairs (gitignored)
└── docs/                       ← Design documents`}</code></pre>

      <h2>Data Flow</h2>

      <h3>Frontend → Supabase (Off-Chain)</h3>
      <pre><code>{`User Action → API Route → Supabase Admin Client → PostgreSQL
                                    ↓
                            Response to Client`}</code></pre>
      <p>
        Most operations (enrollment, progress, profile updates) go through
        Next.js API routes that use the Supabase admin client (service role key)
        to bypass RLS for server-side operations.
      </p>

      <h3>Frontend → Solana (On-Chain)</h3>
      <pre><code>{`User Action → Wallet Adapter → Build Transaction → Sign → Send → Confirm
                                                         ↓
                                                  PDA State Updated`}</code></pre>
      <p>
        On-chain operations use the Solana wallet adapter to build, sign, and
        send transactions directly from the browser. The program validates
        all accounts and constraints.
      </p>

      <h3>Content Flow</h3>
      <pre><code>{`Sanity Studio → Sanity Content Lake → GROQ Query → Next.js SSR → Rendered Page
    or
Push Scripts → Sanity Mutation API → Content Lake`}</code></pre>

      <h3>Challenge Validation Flow</h3>
      <pre><code>{`User writes code → Monaco Editor (client)
                        ↓
            [TS only] Compile check via Monaco diagnostics
                        ↓
            POST /api/challenges/run { courseSlug, lessonId, code }
                        ↓
            API fetches test cases from Sanity (server-side)
                        ↓
            Strip comments → pattern match against expectedOutput
                        ↓
            Return { passed, results[] } — hidden test patterns never exposed`}</code></pre>
      <p>
        Challenge validation runs server-side so test case patterns cannot be
        inspected or bypassed via browser devtools. Hidden test cases are
        fully redacted in the API response. If the server is unreachable
        (offline mode), the editor falls back to client-side validation.
      </p>

      <h2>Service Layer Pattern</h2>
      <p>
        The frontend uses a dependency injection pattern with service interfaces
        and implementations:
      </p>
      <table>
        <thead>
          <tr><th>Service Interface</th><th>Implementation</th><th>Backend</th></tr>
        </thead>
        <tbody>
          <tr><td>CourseService</td><td>SanityCourseService</td><td>Sanity CMS</td></tr>
          <tr><td>EnrollmentService</td><td>SupabaseEnrollmentService</td><td>Supabase</td></tr>
          <tr><td>ProgressService</td><td>SupabaseProgressService</td><td>Supabase</td></tr>
          <tr><td>XPService</td><td>SupabaseXPService</td><td>Supabase</td></tr>
          <tr><td>CredentialService</td><td>HeliusCredentialService</td><td>Helius DAS API</td></tr>
          <tr><td>LeaderboardService</td><td>SupabaseLeaderboardService</td><td>Supabase</td></tr>
          <tr><td>StreakService</td><td>SupabaseStreakService</td><td>Supabase</td></tr>
          <tr><td>AchievementService</td><td>SupabaseAchievementService</td><td>Supabase</td></tr>
          <tr><td>ProfileService</td><td>SupabaseProfileService</td><td>Supabase</td></tr>
          <tr><td>ActivityService</td><td>SupabaseActivityService</td><td>Supabase</td></tr>
          <tr><td>CommentService</td><td>SupabaseCommentService</td><td>Supabase</td></tr>
        </tbody>
      </table>

      <h2>Provider Hierarchy</h2>
      <pre><code>{`<NextIntlClientProvider>
  <ThemeProvider>
    <SolanaProvider>        ← @solana/wallet-adapter
      <AuthProvider>        ← Supabase Auth + wallet auth
        <AnalyticsProvider> ← GA4 + PostHog
          {children}
        </AnalyticsProvider>
      </AuthProvider>
    </SolanaProvider>
  </ThemeProvider>
</NextIntlClientProvider>`}</code></pre>

      <DocsPagination />
    </article>
  );
}
