import { Link } from '@/i18n/routing'

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'pages', label: 'Core Pages' },
  { id: 'courses', label: 'Course Flow' },
  { id: 'gamification', label: 'Gamification' },
  { id: 'wallet', label: 'Wallet & Auth' },
  { id: 'community', label: 'Community Forum' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'cms', label: 'CMS' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'links', label: 'External Links' }
]

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-2xl font-black tracking-tight">{title}</h2>
      <div className="space-y-2 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  )
}

export default function DocsPage() {
  return (
    <div className="container py-12">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Documentation</p>
            <nav className="space-y-1">
              {sections.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-white/5 hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <main className="space-y-6">
          <Section id="overview" title="Platform Overview">
            <p>Superteam Academy is a Solana-native learning platform with interactive courses, XP progression, streaks, achievements, on-chain credentials, wallet auth, and a community forum.</p>
            <p>Primary stack: Next.js App Router, Supabase, Sanity CMS, Solana wallet adapter, Tailwind UI.</p>
          </Section>

          <Section id="pages" title="Core Pages">
            <p>Home, Courses, Course Detail, Lesson View, Dashboard, Profile, Leaderboard, Settings, Certificates, Community, About, Contact, Privacy Policy, Terms & Conditions, and Docs.</p>
          </Section>

          <Section id="courses" title="Course Flow">
            <p>Users enroll into courses, complete lessons, earn XP, and progress through lock-aware lesson ordering.</p>
            <p>Course and lesson content are sourced from Sanity and synced into Supabase tables for app queries.</p>
          </Section>

          <Section id="gamification" title="Gamification">
            <p>XP and levels come from `user_progress`. Daily check-in updates streak and rewards XP. Achievements are awarded from progress milestones.</p>
            <p>Achievements now support locked/unlocked display and mint actions for unlocked items.</p>
          </Section>

          <Section id="wallet" title="Wallet & Authentication">
            <p>Email/password auth is provided by Supabase. Wallet sign-in derives deterministic credentials from wallet signature.</p>
            <p>Wallet addresses are linked to user profiles via API and used for certificate/achievement minting.</p>
          </Section>

          <Section id="community" title="Community Forum">
            <p>Community includes post listing, post detail page, search, create-post modal, replies, and upvote toggle.</p>
            <p>Routes include `/community` and `/community/[postId]` with API routes for post/reply/upvote actions.</p>
          </Section>

          <Section id="certificates" title="Certificates">
            <p>Course completion can trigger certificate mint preparation, wallet signing, and confirmation save flow.</p>
            <p>User certificates are listed on `/certificates` and can be opened as detail pages.</p>
          </Section>

          <Section id="leaderboard" title="Leaderboard">
            <p>Leaderboard supports `global`, `monthly`, `weekly`, and `daily` ranges.</p>
            <p>Global ranks by total XP, period ranges rank by XP earned from lesson completions within the period.</p>
          </Section>

          <Section id="cms" title="CMS Integration">
            <p>Sanity defines the content model. Supabase acts as app-facing cache and progress database.</p>
            <p>For content operations and sync notes, use <Link href="/docs#links" className="text-primary hover:underline">External Links</Link> below.</p>
          </Section>

          <Section id="analytics" title="Analytics">
            <p>Client-side provider supports GA4, Clarity, and PostHog hooks from environment variables.</p>
            <p>Page view tracking is wired in the app router via a pathname-based analytics hook.</p>
          </Section>

          <Section id="links" title="External Links">
            <p>
              Project README:{' '}
              <a className="text-primary hover:underline" href="https://github.com/solanabr/superteam-academy/blob/main/README.md" target="_blank" rel="noreferrer noopener">
                github.com/solanabr/superteam-academy/README.md
              </a>
            </p>
            <p>
              Architecture:{' '}
              <a className="text-primary hover:underline" href="https://github.com/solanabr/superteam-academy/blob/main/ARCHITECTURE.md" target="_blank" rel="noreferrer noopener">
                github.com/solanabr/superteam-academy/ARCHITECTURE.md
              </a>
            </p>
            <p>
              CMS Guide:{' '}
              <a className="text-primary hover:underline" href="https://github.com/solanabr/superteam-academy/blob/main/CMS_GUIDE.md" target="_blank" rel="noreferrer noopener">
                github.com/solanabr/superteam-academy/CMS_GUIDE.md
              </a>
            </p>
            <p>
              Customization:{' '}
              <a className="text-primary hover:underline" href="https://github.com/solanabr/superteam-academy/blob/main/CUSTOMIZATION.md" target="_blank" rel="noreferrer noopener">
                github.com/solanabr/superteam-academy/CUSTOMIZATION.md
              </a>
            </p>
          </Section>
        </main>
      </div>
    </div>
  )
}
