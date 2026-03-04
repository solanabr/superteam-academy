'use client'

import Link from 'next/link'
import { Button } from '@/components/ui'
import { useI18n } from '@/lib/hooks/useI18n'
import { getCourseService } from '@/lib/services'
import { useState, useEffect, ReactNode } from 'react'
import { CourseCard } from '@/components/courses'
import { Course, LearningPath } from '@/lib/types'
import { ArrowRight, Code2, Gem, Globe2, Sparkles, Trophy, Zap } from 'lucide-react'

interface MetricCardProps {
  value: string
  label: string
  icon: ReactNode
  accentClass: string
}

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

interface PathCardProps {
  path: LearningPath
  trackLabel: string
  coursesLabel: string
  onchainReadyLabel: string
}

const WEB3_TERMS = ['Solana Programs', 'On-chain XP', 'Proof Credentials', 'Real dApps']
const PARTNER_LOGOS = ['Solana', 'Anchor', 'Metaplex', 'Superteam']

export default function Home() {
  const { t } = useI18n()
  const [courses, setCourses] = useState<Course[]>([])
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTermIndex, setActiveTermIndex] = useState(0)
  const [typedTerm, setTypedTerm] = useState('')
  const [isDeletingTerm, setIsDeletingTerm] = useState(false)

  useEffect(() => {
    let active = true

    async function fetchData() {
      try {
        const service = getCourseService()
        const [coursesData, pathsData] = await Promise.all([
          service.getCourses(),
          service.getLearningPaths(),
        ])

        if (!active) return

        setCourses(coursesData.slice(0, 3))
        setPaths(pathsData)
      } catch {
        if (!active) return
        setCourses([])
        setPaths([])
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const currentTerm = WEB3_TERMS[activeTermIndex] || ''
    const reachedEnd = typedTerm === currentTerm
    const reachedStart = typedTerm.length === 0
    const typeSpeed = isDeletingTerm ? 55 : 95

    const delay = reachedEnd && !isDeletingTerm
      ? 1100
      : reachedStart && isDeletingTerm
      ? 320
      : typeSpeed

    const timer = window.setTimeout(() => {
      if (!isDeletingTerm) {
        if (reachedEnd) {
          setIsDeletingTerm(true)
          return
        }
        setTypedTerm(currentTerm.slice(0, typedTerm.length + 1))
        return
      }

      if (reachedStart) {
        setIsDeletingTerm(false)
        setActiveTermIndex((prev) => (prev + 1) % WEB3_TERMS.length)
        return
      }
      setTypedTerm(currentTerm.slice(0, typedTerm.length - 1))
    }, delay)

    return () => window.clearTimeout(timer)
  }, [activeTermIndex, isDeletingTerm, typedTerm])

  const featuredPaths = paths.slice(0, 3)

  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 dark:from-[#050b17] dark:via-[#07132a] dark:to-[#0a1120]">
      <div className="pointer-events-none absolute -left-20 top-10 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl dark:bg-superteam-emerald/15" />
      <div className="pointer-events-none absolute right-0 top-0 h-[28rem] w-[28rem] rounded-full bg-fuchsia-300/20 blur-3xl dark:bg-superteam-navy/20" />

      {/* Hero Section */}
      <section className="relative px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neon-cyan/45 bg-neon-cyan/10 px-4 py-1.5 text-sm font-semibold text-blue-700 dark:text-neon-cyan">
                <Sparkles size={14} />
                {t('home.heroBadge')}
              </div>

              <h1 className="text-4xl font-display font-bold sm:text-5xl lg:text-6xl">
                <span className="bg-gradient-to-r from-blue-700 via-solana-purple to-emerald-600 bg-clip-text text-transparent dark:from-neon-cyan dark:via-solana-purple dark:to-neon-green">
                  {t('home.title')}
                </span>
              </h1>

              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-300/70 bg-white/85 px-3 py-2 font-mono text-sm shadow-sm dark:border-superteam-emerald/35 dark:bg-[#091226]/85 dark:shadow-none">
                <span className="text-slate-600 dark:text-gray-400">ship:</span>
                <span className="min-w-[16ch] font-semibold text-blue-700 dark:text-superteam-emerald">
                  {typedTerm}
                </span>
                <span className="animate-pulse text-blue-700 dark:text-superteam-yellow">|</span>
              </div>

              <p className="mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
                {t('home.subtitle')}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/courses" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    {t('home.exploreCourses')}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
                <Link href="/auth/signin" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    {t('home.getStarted')}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                value="1,250+"
                label={t('home.activeLearners')}
                icon={<Globe2 size={16} />}
                accentClass="text-superteam-forest dark:text-superteam-emerald"
              />
              <MetricCard
                value="12+"
                label={t('home.coursesAvailable')}
                icon={<Code2 size={16} />}
                accentClass="text-superteam-navy dark:text-superteam-offwhite"
              />
              <div className="sm:col-span-2">
                <MetricCard
                  value="500K+"
                  label={t('home.xpDistributed')}
                  icon={<Zap size={16} />}
                  accentClass="text-amber-600 dark:text-superteam-yellow"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      {featuredPaths.length > 0 && (
        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-neon-cyan">
                  {t('footer.learningPaths')}
                </p>
                <h2 className="text-3xl font-display font-bold text-superteam-navy dark:text-superteam-offwhite">
                  {t('home.whySuperteam')}
                </h2>
              </div>
              <Link href="/courses">
                <Button variant="ghost">{t('home.viewAll')}</Button>
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {featuredPaths.map((path) => (
                <PathCard
                  key={path.id}
                  path={path}
                  trackLabel={t('home.trackLabel')}
                  coursesLabel={t('home.coursesLabel')}
                  onchainReadyLabel={t('home.onchainReadyLabel')}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-superteam-emerald/35 bg-white/80 p-6 backdrop-blur-sm dark:border-superteam-navy/45 dark:bg-[#0b1731]/70 md:p-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-superteam-forest dark:text-superteam-yellow">
            {t('home.socialProofTitle')}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PARTNER_LOGOS.map((partner) => (
              <div
                key={partner}
                className="rounded-lg border border-superteam-emerald/30 bg-white/75 px-4 py-3 text-center text-sm font-semibold text-superteam-forest dark:border-superteam-navy/45 dark:bg-superteam-navy/30 dark:text-superteam-offwhite"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-superteam-navy/35 bg-white/70 p-8 backdrop-blur-sm dark:bg-[#0d1730]/70 md:p-10">
          <h2 className="mb-10 text-center text-3xl font-display font-bold text-superteam-navy dark:text-superteam-offwhite md:text-4xl">
            {t('home.whySuperteam')}
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon={<Code2 size={26} />}
              title={t('home.features.interactive')}
              description={t('home.features.interactiveDesc')}
            />
            <FeatureCard
              icon={<Gem size={26} />}
              title={t('home.features.credentials')}
              description={t('home.features.credentialsDesc')}
            />
            <FeatureCard
              icon={<Trophy size={26} />}
              title={t('home.features.leaderboard')}
              description={t('home.features.leaderboardDesc')}
            />
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-display font-bold text-superteam-navy dark:text-superteam-offwhite md:text-4xl">
              {t('home.popularCourses')}
            </h2>
            <Link href="/courses">
              <Button variant="ghost">{t('home.viewAll')}</Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, idx) => (
                <div key={`course-skeleton-${idx}`} className="h-[420px] animate-pulse rounded-lg border border-blue-200 bg-slate-100 dark:border-superteam-navy/30 dark:bg-superteam-navy/20" />
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-superteam-emerald/25 bg-white/70 p-6 text-sm text-gray-600 dark:bg-[#0f1930]/60 dark:text-gray-300">
              {t('common.noData')}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-display font-bold text-superteam-navy dark:text-superteam-offwhite md:text-4xl">
            {t('home.testimonials')}
          </h2>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                name: 'Alex Silva',
                role: 'Solana Developer',
                comment: t('home.testimonial1'),
              },
              {
                name: 'Maria Garcia',
                role: 'Blockchain Engineer',
                comment: t('home.testimonial2'),
              },
              {
                name: 'Carlos Rodriguez',
                role: 'Web3 Enthusiast',
                comment: t('home.testimonial3'),
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-xl border border-superteam-navy/35 bg-white/70 p-6 backdrop-blur-sm dark:bg-[#0f1930]/65"
              >
                <p className="mb-4 text-gray-700 dark:text-gray-200">&ldquo;{testimonial.comment}&rdquo;</p>
                <p className="font-semibold text-superteam-navy dark:text-superteam-offwhite">{testimonial.name}</p>
                <p className="text-sm text-superteam-emerald dark:text-superteam-yellow">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-superteam-emerald/40 bg-gradient-to-r from-superteam-navy/85 via-superteam-navy/75 to-superteam-emerald/40 p-8 text-center md:p-12">
          <h2 className="mb-4 text-3xl font-display font-bold text-superteam-offwhite md:text-4xl">
            {t('home.ctaTitle')}
          </h2>
          <p className="mb-8 text-lg text-gray-200">{t('home.ctaSubtitle')}</p>
          <Link href="/courses">
            <Button variant="secondary" size="lg">
              {t('home.ctaButton')}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}

function MetricCard({ value, label, icon, accentClass }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-blue-200 bg-white/95 p-4 shadow-sm dark:border-superteam-navy/35 dark:bg-[#0a1328]/80 dark:shadow-none">
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-400/35 bg-blue-100/75 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-superteam-emerald/35 dark:bg-superteam-emerald/10 dark:text-superteam-emerald">
        {icon}
        SOLANA
      </div>
      <p className={`text-3xl font-display font-bold ${accentClass}`}>{value}</p>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{label}</p>
    </div>
  )
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-xl border border-blue-200 bg-white/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/55 hover:shadow-[0_14px_28px_-20px_rgba(37,99,235,0.85)] dark:border-superteam-emerald/25 dark:bg-[#0a1328]/75 dark:hover:border-superteam-emerald/55 dark:hover:shadow-[0_14px_28px_-20px_rgba(18,157,73,0.9)]">
      <div className="mb-4 inline-flex rounded-lg border border-blue-400/35 bg-blue-100/75 p-3 text-blue-700 dark:border-superteam-yellow/40 dark:bg-superteam-yellow/10 dark:text-superteam-yellow">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-bold text-blue-900 transition-colors group-hover:text-blue-700 dark:text-superteam-offwhite dark:group-hover:text-superteam-yellow">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  )
}

function PathCard({ path, trackLabel, coursesLabel, onchainReadyLabel }: PathCardProps) {
  const progressValue = Math.min(100, 24 + path.courses.length * 18)
  return (
    <div className="rounded-xl border border-blue-200 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/55 hover:shadow-[0_14px_28px_-20px_rgba(37,99,235,0.85)] dark:border-superteam-navy/35 dark:bg-[#0d1730]/65 dark:hover:border-superteam-emerald/60 dark:hover:shadow-[0_14px_28px_-20px_rgba(35,58,117,0.95)]">
      <p className="mb-3 inline-flex rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:border-superteam-yellow/40 dark:bg-superteam-yellow/10 dark:text-superteam-yellow">
        {trackLabel}
      </p>
      <h3 className="mb-2 line-clamp-1 text-xl font-bold text-blue-900 dark:text-superteam-offwhite">
        {path.title}
      </h3>
      <p className="mb-5 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{path.description}</p>
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-300">
          <span>{coursesLabel}</span>
          <span>{progressValue}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-superteam-navy/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-superteam-emerald to-superteam-yellow"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-300">
        <span>{`${path.courses.length} ${coursesLabel}`}</span>
        <span className="font-semibold text-superteam-emerald">{onchainReadyLabel}</span>
      </div>
    </div>
  )
}
