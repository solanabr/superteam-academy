'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';
import { courses } from '@/lib/data/courses';
import { HeroSection } from '@/components/HeroSection';
import { CourseCardIcon } from '@/components/CourseCardIcon';
import { useI18n } from '@/lib/i18n/context';
import { DIFFICULTY_LABELS } from '@/lib/data/courses';

function WalletStepIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
    </svg>
  );
}
function CodeStepIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  );
}
function TrophyStepIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 5 20" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 19 20" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

const StatsCharts = dynamic(() => import('@/components/StatsCharts').then((m) => ({ default: m.StatsCharts })), {
  ssr: true,
  loading: () => (
    <div className="mb-16 min-h-[320px] rounded-xl border border-border/50 bg-surface p-6 animate-pulse" aria-hidden>
      <div className="mb-6 h-6 w-48 rounded bg-surface-elevated" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-surface-elevated" />
        ))}
      </div>
      <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-surface-elevated" />
        <div className="h-64 rounded-xl bg-surface-elevated" />
      </div>
    </div>
  ),
});

export function HomeContent() {
  const { t } = useI18n();

  return (
    <>
      <HeroSection />
      {/* Trust strip — overcome Web3 hesitation (light mode: soft purple/gray) */}
      <section className="mb-10 rounded-xl border border-border/40 bg-[rgb(var(--trust-bg))] px-4 py-5 sm:px-6" aria-label="Trust and safety">
        <ul className="flex flex-wrap gap-x-6 gap-y-3 text-[13px] text-[rgb(var(--text-muted))] sm:gap-x-8">
          <li className="flex items-center gap-2">
            <span className="text-accent" aria-hidden>✓</span>
            {t('trustNoEmail')}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-accent" aria-hidden>✓</span>
            {t('trustProgressWallet')}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-accent" aria-hidden>✓</span>
            <a href="https://github.com/solanabr/superteam-academy" target="_blank" rel="noopener noreferrer" className="text-accent underline decoration-accent/50 underline-offset-2 hover:decoration-accent">
              {t('trustOpenSource')}
            </a>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-accent" aria-hidden>✓</span>
            {t('trustSuperteam')}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-accent" aria-hidden>✓</span>
            {t('trustDevnet')}
          </li>
        </ul>
      </section>
      {/* Social proof & platform highlights */}
      <section className="mb-10 flex flex-wrap items-center justify-between gap-6 rounded-xl border border-border/40 bg-[rgb(var(--surface))]/50 px-5 py-6 pb-8 sm:px-6" aria-label="Social proof and platform highlights">
        <div className="flex flex-wrap items-center gap-6 text-caption text-[rgb(var(--text-muted))]">
          <span className="flex items-center gap-2">
            <span className="font-semibold text-accent">{courses.reduce((s, c) => s + c.lessons.length, 0)}</span>
            lessons
          </span>
          <span className="flex items-center gap-2">
            <span className="font-semibold text-[rgb(var(--text))]">{courses.length}</span>
            courses
          </span>
          <span className="rounded-full bg-[rgb(var(--surface-elevated))] px-2.5 py-0.5 font-medium text-[rgb(var(--text-subtle))]">PT · ES · EN</span>
        </div>
        <ul className="flex flex-wrap gap-4 text-[13px] text-[rgb(var(--text-subtle))]" role="list">
          <li className="flex items-center gap-1.5"><span className="text-accent" aria-hidden>✓</span> Interactive courses</li>
          <li className="flex items-center gap-1.5"><span className="text-accent" aria-hidden>✓</span> On-chain credentials</li>
          <li className="flex items-center gap-1.5"><span className="text-chart-3" aria-hidden>✓</span> XP &amp; streaks</li>
          <li className="flex items-center gap-1.5"><span className="text-accent" aria-hidden>✓</span> Open-source</li>
        </ul>
      </section>
      <section className="mb-12 sm:mb-16" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="text-title mb-6 font-semibold text-[rgb(var(--text))] sm:mb-8">
          {t('howItWorks')}
        </h2>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <div className="group relative rounded-xl border border-border/50 bg-surface p-6 transition hover:border-accent/40 hover:shadow-[0_0_0_1px_rgb(var(--accent)/0.2)] focus-within:ring-2 focus-within:ring-accent/50 focus-within:ring-offset-2 focus-within:ring-offset-[rgb(var(--bg-page))]">
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-accent opacity-80" aria-hidden />
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent" aria-hidden>
                <WalletStepIcon />
              </span>
              <div className="text-body font-semibold text-[rgb(var(--text))]">{t('stepConnect')}</div>
            </div>
            <p className="mt-3 text-caption text-[rgb(var(--text-muted))]">{t('stepConnectBullet')}</p>
          </div>
          <div className="group relative rounded-xl border border-border/50 bg-surface p-6 transition hover:border-accent-secondary/50 hover:shadow-[0_0_0_1px_rgb(var(--accent-secondary)/0.2)] focus-within:ring-2 focus-within:ring-accent-secondary/50 focus-within:ring-offset-2 focus-within:ring-offset-[rgb(var(--bg-page))]">
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-accent-secondary opacity-80" aria-hidden />
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-secondary/20 text-accent-secondary" aria-hidden>
                <CodeStepIcon />
              </span>
              <div className="text-body font-semibold text-[rgb(var(--text))]">{t('stepLearn')}</div>
            </div>
            <p className="mt-3 text-caption text-[rgb(var(--text-muted))]">{t('stepLearnBullet')}</p>
          </div>
          <div className="group relative rounded-xl border border-border/50 bg-surface p-6 transition hover:border-chart-3/40 hover:shadow-[0_0_0_1px_rgb(var(--chart-3)/0.2)] focus-within:ring-2 focus-within:ring-chart-3/50 focus-within:ring-offset-2 focus-within:ring-offset-[rgb(var(--bg-page))]">
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-chart-3 opacity-80" aria-hidden />
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-3/20 text-chart-3" aria-hidden>
                <TrophyStepIcon />
              </span>
              <div className="text-body font-semibold text-[rgb(var(--text))]">{t('stepTrack')}</div>
            </div>
            <p className="mt-3 text-caption text-[rgb(var(--text-muted))]">{t('stepTrackBullet')}</p>
          </div>
        </div>
      </section>
      <Suspense fallback={null}>
        <StatsCharts />
      </Suspense>
      <section aria-labelledby="courses-heading">
        <h2 id="courses-heading" className="text-title mb-6 font-semibold text-[rgb(var(--text))]">
          {t('coursesTitle')}
        </h2>
        {/* Featured course — spotlight first */}
        {courses[0] && (
          <Link
            href={`/courses/${courses[0].slug}`}
            className="mb-6 flex flex-col overflow-hidden rounded-xl border-2 border-accent/40 bg-surface shadow-card transition duration-200 hover:border-accent/60 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none sm:flex-row"
          >
            <div className="h-32 w-full shrink-0 bg-gradient-to-br from-cyan-500/25 via-cyan-400/10 to-transparent flex items-center justify-center sm:h-auto sm:w-48 text-cyan-400">
              <CourseCardIcon index={0} />
            </div>
            <div className="flex flex-1 flex-col justify-center p-6">
              <span className="text-caption font-semibold uppercase tracking-wide text-accent">{t('featuredStartHere')}</span>
              <h3 className="text-title mt-1 font-semibold text-[rgb(var(--text))]">{courses[0].title}</h3>
              <p className="text-caption mt-1 line-clamp-2 text-[rgb(var(--text-muted))]">{courses[0].description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-caption text-[rgb(var(--text-subtle))]">
                <span className="rounded-full bg-accent/20 px-2.5 py-0.5 font-medium text-accent">{DIFFICULTY_LABELS[courses[0].difficulty]}</span>
                <span>{courses[0].duration}</span>
                <span>{courses[0].lessons.length} lessons</span>
                <span className="font-medium text-accent">{t('earnCredential').replace('{xp}', String(courses[0].xpReward))}</span>
              </div>
              <span className="mt-4 inline-flex w-fit items-center rounded-lg bg-accent px-4 py-2 text-caption font-semibold text-[rgb(12_16_28)]">
                Enroll now →
              </span>
            </div>
          </Link>
        )}
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, i) => {
            const gradients = [
              'from-cyan-500/25 via-cyan-400/10 to-transparent',
              'from-violet-500/25 via-violet-400/10 to-transparent',
              'from-amber-500/25 via-amber-400/10 to-transparent',
            ];
            return (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="group block overflow-hidden rounded-xl border border-border/50 bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none"
              >
                <div
                  className={`h-28 bg-gradient-to-br ${gradients[i % 3]} flex items-center justify-center ${i % 3 === 0 ? 'text-cyan-400' : i % 3 === 1 ? 'text-violet-400' : 'text-amber-400'}`}
                  aria-hidden
                >
                  <CourseCardIcon index={i} />
                </div>
                <div className="p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-surface-elevated px-2.5 py-0.5 text-caption font-medium text-[rgb(var(--text-muted))]">
                      {DIFFICULTY_LABELS[course.difficulty]}
                    </span>
                    <span className="text-caption text-[rgb(var(--text-subtle))]">{course.duration}</span>
                  </div>
                  <h3 className="text-title mb-1.5 font-semibold text-[rgb(var(--text))] group-hover:text-accent">
                    {course.title}
                  </h3>
                  <p className="text-caption line-clamp-2 text-[rgb(var(--text-muted))]">
                    {course.description}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-caption text-[rgb(var(--text-subtle))]">
                    <span>{course.lessons.length} lessons</span>
                    <span className="font-medium text-accent">{t('earnCredential').replace('{xp}', String(course.xpReward))}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Platform features — after courses */}
      <section className="mt-16 mb-12 sm:mb-16" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-title mb-6 font-semibold text-[rgb(var(--text))] sm:mb-8">
          Platform features
        </h2>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative rounded-xl border border-border/50 bg-surface p-5 transition hover:border-accent/40 hover:shadow-[0_0_0_1px_rgb(var(--accent)/0.15)]">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-accent/60" aria-hidden />
            <p className="text-body font-semibold text-[rgb(var(--text))]">Interactive courses</p>
            <p className="text-caption mt-1 text-[rgb(var(--text-muted))]">Project-based lessons with integrated code editing and challenges.</p>
          </div>
          <div className="relative rounded-xl border border-border/50 bg-surface p-5 transition hover:border-accent-secondary/40 hover:shadow-[0_0_0_1px_rgb(var(--accent-secondary)/0.15)]">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-accent-secondary/60" aria-hidden />
            <p className="text-body font-semibold text-[rgb(var(--text))]">XP &amp; credentials</p>
            <p className="text-caption mt-1 text-[rgb(var(--text-muted))]">Earn XP, level up, and receive on-chain soulbound credentials.</p>
          </div>
          <div className="relative rounded-xl border border-border/50 bg-surface p-5 transition hover:border-chart-3/40 hover:shadow-[0_0_0_1px_rgb(var(--chart-3)/0.15)]">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-chart-3/60" aria-hidden />
            <p className="text-body font-semibold text-[rgb(var(--text))]">Multi-language</p>
            <p className="text-caption mt-1 text-[rgb(var(--text-muted))]">UI in English, Portuguese, and Spanish. Forkable for your community.</p>
          </div>
          <div className="relative rounded-xl border border-border/50 bg-surface p-5 transition hover:border-accent/40 hover:shadow-[0_0_0_1px_rgb(var(--accent)/0.15)]">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-accent/60" aria-hidden />
            <p className="text-body font-semibold text-[rgb(var(--text))]">Open source</p>
            <p className="text-caption mt-1 text-[rgb(var(--text-muted))]">Clean service interfaces. Connect to the Superteam Academy program or your own.</p>
          </div>
        </div>
      </section>

      {/* What builders say — testimonials after courses */}
      <section className="mb-12 sm:mb-16" aria-labelledby="testimonials-heading">
        <h2 id="testimonials-heading" className="text-title mb-6 font-semibold text-[rgb(var(--text))] sm:mb-8">
          What builders say
        </h2>
        <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <blockquote className="relative rounded-xl border border-border/50 bg-surface p-6 pl-7 transition hover:border-accent/30">
            <span className="absolute left-4 top-6 text-2xl font-serif leading-none text-accent/50" aria-hidden>&ldquo;</span>
            <p className="text-body text-[rgb(var(--text-muted))]">Clear and practical. Got my first dApp deployed on Devnet.</p>
            <footer className="mt-3 text-caption font-medium text-[rgb(var(--text))]">— Builder_42</footer>
          </blockquote>
          <blockquote className="relative rounded-xl border border-border/50 bg-surface p-6 pl-7 transition hover:border-accent-secondary/30">
            <span className="absolute left-4 top-6 text-2xl font-serif leading-none text-accent-secondary/50" aria-hidden>&ldquo;</span>
            <p className="text-body text-[rgb(var(--text-muted))]">Finalmente aprendi Anchor sem mil cadastros!</p>
            <footer className="mt-3 text-caption font-medium text-[rgb(var(--text))]">— @devBR</footer>
          </blockquote>
          <blockquote className="relative rounded-xl border border-border/50 bg-surface p-6 pl-7 transition hover:border-chart-3/30">
            <span className="absolute left-4 top-6 text-2xl font-serif leading-none text-chart-3/50" aria-hidden>&ldquo;</span>
            <p className="text-body text-[rgb(var(--text-muted))]">On-chain certs são incríveis pra portfólio.</p>
            <footer className="mt-3 text-caption font-medium text-[rgb(var(--text))]">— @solbuilder</footer>
          </blockquote>
        </div>
      </section>
    </>
  );
}
