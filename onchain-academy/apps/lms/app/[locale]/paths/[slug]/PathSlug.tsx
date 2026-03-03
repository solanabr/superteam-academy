'use client'

import { StandardLayout } from '@/components/layout/StandardLayout'
import { PATHS, PathSVGs } from '@/libs/constants/home.constants'
import { courses } from '@/libs/constants/mockData'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Lock,
  PlayCircle,
  Sparkles,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

// ─── Path slug → PATHS index mapping ─────────────────────────────────────────
const SLUG_MAP: Record<string, number> = {
  'solana-foundations': 0,
  'on-chain-programs': 1,
  'defi-token-programs': 2,
}

// ─── Path → courses mapping (which courses belong to this path) ───────────────
const PATH_COURSE_SLUGS: Record<string, string[]> = {
  'solana-foundations': ['solana-fundamentals', 'intro-to-rust'],
  'on-chain-programs': ['anchor-development', 'advanced-anchor'],
  'defi-token-programs': ['defi-protocols', 'spl-tokens'],
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'text-green-primary bg-green-primary/10 border-green-primary/20',
  Intermediate: 'text-amber-dark bg-amber/10 border-amber/20',
  Advanced: 'text-red-600 bg-red-50 border-red-200',
}

const LESSON_ICON: Record<string, React.ElementType> = {
  Video: PlayCircle,
  Reading: BookOpen,
  'Code Challenge': Zap,
}

// ─── What you'll learn sections per path ─────────────────────────────────────
const PATH_OUTCOMES: Record<string, string[]> = {
  'solana-foundations': [
    'Understand the Solana account model & runtime',
    'Derive and use Program Derived Addresses (PDAs)',
    'Send transactions and inspect on-chain state',
    'Connect wallets with Solana Wallet Adapter',
    'Use Solana Explorer & debugging tools',
  ],
  'on-chain-programs': [
    'Write production-quality Rust code for Solana',
    'Build, test, and deploy Anchor programs',
    'Implement CPIs and cross-program composability',
    'Manage on-chain state safely with constraints',
    'Audit your programs for common vulnerabilities',
  ],
  'defi-token-programs': [
    'Create SPL tokens and Token-2022 extensions',
    'Build an AMM from scratch with liquidity pools',
    'Integrate with Jupiter, Raydium, and Orca',
    'Design protocol tokenomics and fee structures',
    'Conduct a basic security audit of a DeFi program',
  ],
}

// ─── Component helpers ────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | number
}) {
  return (
    <div className='flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-white/10 border-white/10'>
      <Icon
        size={15}
        strokeWidth={1.5}
        style={{ color: 'hsl(var(--green-mint))' }}
      />
      <div>
        <div
          className='font-ui text-[0.6rem] uppercase tracking-wider'
          style={{ color: 'rgba(247,234,203,0.4)' }}
        >
          {label}
        </div>
        <div
          className='font-display text-sm font-bold'
          style={{ color: 'hsl(var(--cream))' }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

function ModuleStep({
  label,
  done,
  active,
  index,
  isLast,
}: {
  label: string
  done?: boolean
  active?: boolean
  index: number
  isLast: boolean
}) {
  return (
    <div className='flex gap-4'>
      {/* Timeline column */}
      <div className='flex flex-col items-center'>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 font-display text-xs font-bold z-10 ${
            done
              ? 'border-green-primary bg-green-primary text-cream'
              : active
                ? 'border-green-primary bg-green-primary/15 text-green-primary'
                : 'border-border-warm bg-cream text-text-tertiary'
          }`}
        >
          {done ? (
            <CheckCircle2 size={14} strokeWidth={2.5} />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>
        {!isLast && (
          <div
            className='w-0.5 flex-1 mt-1'
            style={{
              background: done
                ? 'hsl(var(--green-primary))'
                : 'hsl(var(--border-warm))',
            }}
          />
        )}
      </div>

      {/* Content column */}
      <div className={`pb-6 flex-1 ${isLast ? '' : ''}`}>
        <div className='flex items-center gap-2'>
          <span
            className={`font-ui text-[0.8rem] font-semibold ${
              done
                ? 'text-charcoal'
                : active
                  ? 'text-green-primary font-bold'
                  : 'text-text-secondary'
            }`}
          >
            {label}
          </span>
          {active && (
            <span className='font-ui text-[0.55rem] font-bold px-2 py-0.5 rounded-full border bg-green-primary/10 text-green-primary border-green-primary/20'>
              In Progress
            </span>
          )}
          {done && (
            <span className='font-ui text-[0.55rem] font-bold px-2 py-0.5 rounded-full border bg-green-primary/10 text-green-primary border-green-primary/20'>
              Completed
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

interface PathSlugProps {
  slug: string
}

const PathSlug = ({ slug }: PathSlugProps) => {
  const idx = SLUG_MAP[slug] ?? 0
  const path = PATHS[idx]

  // Match courses that belong to this path
  const pathCourseSlugs = PATH_COURSE_SLUGS[slug] ?? []
  const pathCourses = courses.filter((c) => pathCourseSlugs.includes(c.slug))
  // If no courses matched (fallback), show first 2 courses
  const displayCourses =
    pathCourses.length > 0 ? pathCourses : courses.slice(0, 2)

  const outcomes = PATH_OUTCOMES[slug] ?? PATH_OUTCOMES['solana-foundations']
  const totalLessons = displayCourses.reduce((acc, c) => acc + c.lessons, 0)

  if (!path) {
    return (
      <StandardLayout>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-center'>
            <h1 className='font-display text-2xl font-black text-charcoal'>
              Path not found
            </h1>
            <Link
              href='/en/courses'
              className='font-ui text-sm text-green-primary mt-4 inline-block hover:underline'
            >
              ← Back to Courses
            </Link>
          </div>
        </div>
      </StandardLayout>
    )
  }

  return (
    <StandardLayout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className='px-[5%] pt-14 pb-0 pattern-diagonal relative overflow-hidden'
        style={{ background: 'hsl(var(--green-secondary))' }}
      >
        {/* Ambient glow */}
        <div
          className='absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none'
          style={{
            background: path.featured
              ? 'rgba(0,140,76,0.18)'
              : 'rgba(82,221,160,0.08)',
          }}
        />

        <div className='max-w-[1200px] mx-auto'>
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className='flex items-center gap-2 mb-8'
          >
            <Link
              href='/en/courses'
              className='flex items-center gap-1.5 font-ui text-xs font-semibold transition-opacity hover:opacity-80'
              style={{ color: 'rgba(247,234,203,0.5)' }}
            >
              <ArrowLeft size={13} strokeWidth={2} />
              Courses
            </Link>
            <ChevronRight
              size={12}
              style={{ color: 'rgba(247,234,203,0.25)' }}
            />
            <span
              className='font-ui text-xs'
              style={{ color: 'rgba(247,234,203,0.4)' }}
            >
              Learning Paths
            </span>
            <ChevronRight
              size={12}
              style={{ color: 'rgba(247,234,203,0.25)' }}
            />
            <span
              className='font-ui text-xs font-semibold'
              style={{ color: 'rgba(247,234,203,0.7)' }}
            >
              {path.title}
            </span>
          </motion.div>

          <div className='grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12'>
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className='lg:col-span-7'
            >
              {/* Tag + level */}
              <div className='flex items-center gap-3 mb-5'>
                <span
                  className='font-ui text-[0.6rem] font-extrabold tracking-[0.12em] uppercase py-1 px-3 rounded-full'
                  style={{ background: path.tagColor, color: path.tagText }}
                >
                  {path.tag}
                </span>
                <div className='flex items-center gap-1.5'>
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className={`rounded-full ${n <= path.level ? 'w-2 h-2' : 'w-1.5 h-1.5 opacity-20'}`}
                      style={{
                        background:
                          n <= path.level
                            ? 'hsl(var(--green-mint))'
                            : 'hsl(var(--cream))',
                      }}
                    />
                  ))}
                  <span
                    className='font-ui text-[0.65rem] font-bold'
                    style={{ color: 'rgba(247,234,203,0.5)' }}
                  >
                    Level {path.level}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1
                className='font-display text-4xl md:text-5xl font-black mb-5 leading-tight'
                style={{ color: 'hsl(var(--cream))', letterSpacing: '-0.02em' }}
              >
                {path.title}
              </h1>

              <p
                className='font-ui text-base mb-8 max-w-xl leading-relaxed'
                style={{ color: 'rgba(247,234,203,0.65)' }}
              >
                {path.desc}
              </p>

              {/* Stats row */}
              <div className='flex flex-wrap gap-3 mb-8'>
                <StatPill icon={Clock} label='Duration' value={path.duration} />
                <StatPill
                  icon={BookOpen}
                  label='Lessons'
                  value={totalLessons || path.lessons}
                />
                <StatPill icon={Zap} label='XP Reward' value={path.xp} />
                <StatPill
                  icon={Award}
                  label='Credential'
                  value='NFT on Solana'
                />
              </div>

              {/* Progress bar (if started) */}
              {path.progress > 0 && (
                <div className='mb-2'>
                  <div className='flex items-center justify-between mb-2'>
                    <span
                      className='font-ui text-xs'
                      style={{ color: 'rgba(247,234,203,0.5)' }}
                    >
                      Path Progress
                    </span>
                    <span
                      className='font-display text-sm font-black'
                      style={{ color: 'hsl(var(--green-mint))' }}
                    >
                      {path.progress}%
                    </span>
                  </div>
                  <div
                    className='h-2 rounded-full overflow-hidden'
                    style={{ background: 'rgba(247,234,203,0.08)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${path.progress}%` }}
                      transition={{
                        duration: 0.8,
                        delay: 0.3,
                        ease: 'easeOut',
                      }}
                      className='h-full rounded-full'
                      style={{ background: 'hsl(var(--green-mint))' }}
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right: Path icon + CTA card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className='lg:col-span-5 flex items-end'
            >
              <div
                className='w-full rounded-2xl p-6 border'
                style={{
                  background: 'rgba(247,234,203,0.04)',
                  borderColor: 'rgba(247,234,203,0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div
                  className='w-16 h-16 rounded-2xl flex items-center justify-center mb-5'
                  style={{
                    background: 'rgba(247,234,203,0.08)',
                    border: '1px solid rgba(247,234,203,0.12)',
                  }}
                >
                  {PathSVGs[path.svgKey]}
                </div>

                <div className='flex flex-col gap-2 mb-6'>
                  {path.modules.slice(0, 4).map((m) => (
                    <div key={m.label} className='flex items-center gap-2'>
                      {m.done ? (
                        <CheckCircle2
                          size={13}
                          className='shrink-0'
                          style={{ color: 'hsl(var(--green-mint))' }}
                        />
                      ) : m.active ? (
                        <Circle
                          size={13}
                          className='shrink-0'
                          style={{ color: 'hsl(var(--green-mint))' }}
                          strokeWidth={2}
                        />
                      ) : (
                        <Lock
                          size={12}
                          className='shrink-0'
                          style={{ color: 'rgba(247,234,203,0.2)' }}
                        />
                      )}
                      <span
                        className={`font-ui text-[0.75rem] ${
                          m.done || m.active ? '' : 'opacity-40'
                        }`}
                        style={{
                          color: m.active
                            ? 'hsl(var(--green-mint))'
                            : 'hsl(var(--cream))',
                        }}
                      >
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/en/courses/${displayCourses[0]?.slug ?? 'solana-fundamentals'}`}
                  className='flex items-center justify-center gap-2 w-full py-3 rounded-xl font-ui font-bold text-sm text-cream transition-all hover:opacity-90 hover:gap-3'
                  style={{ background: 'hsl(var(--green-primary))' }}
                >
                  {path.progress > 0 ? 'Continue Path' : 'Begin Path'}
                  <ChevronRight size={16} strokeWidth={2} />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className='bg-background'>
        <div className='max-w-[1200px] mx-auto px-[5%] py-14'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-12'>
            {/* ── LEFT COLUMN ── */}
            <div className='lg:col-span-8 flex flex-col gap-14'>
              {/* What you'll learn */}
              <section>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className='flex items-center gap-2 mb-6'>
                    <Sparkles
                      size={18}
                      className='text-amber'
                      strokeWidth={1.5}
                    />
                    <h2 className='font-display text-xl font-black text-foreground'>
                      What you&apos;ll learn
                    </h2>
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {outcomes.map((outcome) => (
                      <div
                        key={outcome}
                        className='flex items-start gap-3 p-4 rounded-xl border'
                        style={{
                          background: 'hsl(var(--card-warm))',
                          borderColor: 'hsl(var(--border-warm))',
                        }}
                      >
                        <CheckCircle2
                          size={15}
                          className='shrink-0 mt-0.5 text-green-primary'
                          strokeWidth={2}
                        />
                        <span className='font-ui text-sm text-charcoal leading-relaxed'>
                          {outcome}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </section>

              {/* Path Roadmap */}
              <section>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className='flex items-center gap-2 mb-6'>
                    <BookOpen
                      size={18}
                      className='text-green-primary'
                      strokeWidth={1.5}
                    />
                    <h2 className='font-display text-xl font-black text-foreground'>
                      Path Roadmap
                    </h2>
                  </div>

                  <div
                    className='p-6 rounded-2xl border'
                    style={{
                      background: 'hsl(var(--card-warm))',
                      borderColor: 'hsl(var(--border-warm))',
                    }}
                  >
                    {path.modules.map((mod, i) => (
                      <ModuleStep
                        key={mod.label}
                        label={mod.label}
                        done={mod.done}
                        active={mod.active}
                        index={i}
                        isLast={i === path.modules.length - 1}
                      />
                    ))}
                  </div>
                </motion.div>
              </section>

              {/* Courses in this path */}
              <section>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className='flex items-center justify-between mb-6'>
                    <div className='flex items-center gap-2'>
                      <Award
                        size={18}
                        className='text-green-primary'
                        strokeWidth={1.5}
                      />
                      <h2 className='font-display text-xl font-black text-foreground'>
                        Courses in this Path
                      </h2>
                    </div>
                    <span className='font-ui text-sm text-text-tertiary'>
                      {displayCourses.length} courses
                    </span>
                  </div>

                  <div className='flex flex-col gap-4'>
                    {displayCourses.map((course, i) => {
                      const isLocked = i > 0 && !displayCourses[i - 1].enrolled
                      return (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className={`rounded-2xl border overflow-hidden transition-all group ${
                            isLocked
                              ? 'opacity-60'
                              : 'hover:shadow-md hover:-translate-y-0.5'
                          }`}
                          style={{
                            background: 'hsl(var(--card-warm))',
                            borderColor: 'hsl(var(--border-warm))',
                          }}
                        >
                          {/* Course header */}
                          <div className='p-5 flex items-start gap-4'>
                            {/* Number badge */}
                            <div
                              className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-display font-black text-sm'
                              style={{
                                background:
                                  course.progress > 0
                                    ? 'hsl(var(--green-primary))'
                                    : 'hsl(var(--green-primary) / 0.1)',
                                color:
                                  course.progress > 0
                                    ? 'hsl(var(--cream))'
                                    : 'hsl(var(--green-primary))',
                              }}
                            >
                              {course.progress >= 100 ? (
                                <CheckCircle2 size={18} strokeWidth={2.5} />
                              ) : (
                                i + 1
                              )}
                            </div>

                            <div className='flex-1 min-w-0'>
                              <div className='flex items-start justify-between gap-3'>
                                <div>
                                  <div className='flex items-center gap-2 flex-wrap mb-1'>
                                    <h3 className='font-display text-base font-bold text-charcoal'>
                                      {course.title}
                                    </h3>
                                    <span
                                      className={`font-ui text-[0.6rem] font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[course.difficulty]}`}
                                    >
                                      {course.difficulty}
                                    </span>
                                  </div>
                                  <p className='font-ui text-xs text-text-secondary leading-relaxed line-clamp-2'>
                                    {course.description}
                                  </p>
                                </div>
                                {isLocked && (
                                  <Lock
                                    size={16}
                                    className='text-text-tertiary shrink-0 mt-1'
                                  />
                                )}
                              </div>

                              {/* Meta row */}
                              <div className='flex items-center gap-4 mt-3'>
                                <span className='flex items-center gap-1 font-ui text-[0.65rem] text-text-tertiary'>
                                  <Clock size={11} strokeWidth={1.5} />
                                  {course.duration}
                                </span>
                                <span className='flex items-center gap-1 font-ui text-[0.65rem] text-text-tertiary'>
                                  <BookOpen size={11} strokeWidth={1.5} />
                                  {course.lessons} lessons
                                </span>
                                <span className='flex items-center gap-1 font-ui text-[0.65rem] text-amber-dark font-bold'>
                                  <Zap size={11} strokeWidth={1.5} />
                                  {course.xp} XP
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Progress bar if enrolled */}
                          {course.enrolled && course.progress > 0 && (
                            <div className='px-5 pb-4'>
                              <div className='flex items-center justify-between mb-1.5'>
                                <span className='font-ui text-[0.6rem] text-text-tertiary'>
                                  Progress
                                </span>
                                <span className='font-ui text-[0.6rem] font-bold text-green-primary'>
                                  {course.progress}%
                                </span>
                              </div>
                              <div className='h-1.5 rounded-full bg-cream-dark overflow-hidden'>
                                <div
                                  className='h-full rounded-full'
                                  style={{
                                    width: `${course.progress}%`,
                                    background: 'hsl(var(--green-primary))',
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Lesson preview (collapsed, shown on hover) */}
                          <div
                            className='border-t px-5 py-3 flex items-center justify-between'
                            style={{ borderColor: 'hsl(var(--border-warm))' }}
                          >
                            <div className='flex items-center gap-3'>
                              {course.modules[0]?.lessons
                                .slice(0, 3)
                                .map((lesson) => {
                                  const LIcon =
                                    LESSON_ICON[lesson.type] ?? BookOpen
                                  return (
                                    <div
                                      key={lesson.id}
                                      className='flex items-center gap-1'
                                    >
                                      <LIcon
                                        size={11}
                                        strokeWidth={1.5}
                                        className={
                                          lesson.completed
                                            ? 'text-green-primary'
                                            : 'text-text-tertiary'
                                        }
                                      />
                                      <span className='font-ui text-[0.6rem] text-text-tertiary hidden sm:block truncate max-w-[80px]'>
                                        {lesson.title}
                                      </span>
                                    </div>
                                  )
                                })}
                              {(course.modules[0]?.lessons.length ?? 0) > 3 && (
                                <span className='font-ui text-[0.6rem] text-text-tertiary'>
                                  +
                                  {course.modules.reduce(
                                    (acc, m) => acc + m.lessons.length,
                                    0,
                                  ) - 3}{' '}
                                  more
                                </span>
                              )}
                            </div>
                            {!isLocked && (
                              <Link
                                href={`/en/courses/${course.slug}`}
                                className='font-ui text-[0.7rem] font-bold text-green-primary hover:underline flex items-center gap-1 shrink-0'
                              >
                                {course.enrolled
                                  ? course.progress > 0
                                    ? 'Continue'
                                    : 'Start'
                                  : 'View Course'}
                                <ChevronRight size={12} strokeWidth={2} />
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              </section>
            </div>

            {/* ── RIGHT COLUMN (sticky sidebar) ── */}
            <div className='lg:col-span-4'>
              <div className='sticky top-6 flex flex-col gap-5'>
                {/* Enroll / Continue CTA card */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className='rounded-2xl border overflow-hidden shadow-md'
                  style={{
                    background: 'hsl(var(--card-warm))',
                    borderColor: 'hsl(var(--border-warm))',
                  }}
                >
                  {/* Green top bar */}
                  <div
                    className='h-1 w-full'
                    style={{ background: 'hsl(var(--green-primary))' }}
                  />

                  <div className='p-6'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='font-display text-2xl font-black text-amber-dark'>
                        {path.xp}
                      </span>
                      <span className='font-ui text-xs text-text-tertiary'>
                        to earn
                      </span>
                    </div>
                    <p className='font-ui text-xs text-text-tertiary mb-5'>
                      Complete this path to earn a soulbound on-chain credential
                      NFT.
                    </p>

                    <div className='flex flex-col gap-2.5 mb-5'>
                      {[
                        {
                          label: 'Duration',
                          value: path.duration,
                          icon: Clock,
                        },
                        {
                          label: 'Lessons',
                          value: `${totalLessons || path.lessons} lessons`,
                          icon: BookOpen,
                        },
                        { label: 'Difficulty', value: path.tag, icon: Award },
                        {
                          label: 'Credential',
                          value: 'Solana NFT',
                          icon: Sparkles,
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className='flex items-center justify-between py-2 border-b last:border-0'
                          style={{ borderColor: 'hsl(var(--border-warm))' }}
                        >
                          <div className='flex items-center gap-2'>
                            <row.icon
                              size={13}
                              className='text-text-tertiary'
                              strokeWidth={1.5}
                            />
                            <span className='font-ui text-xs text-text-tertiary'>
                              {row.label}
                            </span>
                          </div>
                          <span className='font-ui text-xs font-semibold text-charcoal'>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Link
                      href={`/en/courses/${displayCourses[0]?.slug ?? 'solana-fundamentals'}`}
                      className='flex items-center justify-center gap-2 w-full py-3 rounded-xl font-ui font-bold text-sm text-cream transition-all hover:opacity-90 hover:shadow-[0_6px_22px_rgba(0,140,76,0.35)]'
                      style={{ background: 'hsl(var(--green-primary))' }}
                    >
                      {path.progress > 0 ? 'Continue Path' : 'Begin Path'}
                      <ChevronRight size={16} strokeWidth={2} />
                    </Link>

                    {path.progress > 0 && (
                      <div className='mt-4'>
                        <div className='flex justify-between mb-1.5'>
                          <span className='font-ui text-[0.65rem] text-text-tertiary'>
                            Overall progress
                          </span>
                          <span className='font-display text-[0.65rem] font-black text-green-primary'>
                            {path.progress}%
                          </span>
                        </div>
                        <div className='h-2 rounded-full bg-cream-dark overflow-hidden'>
                          <div
                            className='h-full rounded-full'
                            style={{
                              width: `${path.progress}%`,
                              background: 'hsl(var(--green-primary))',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Related paths */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className='rounded-2xl border p-5'
                  style={{
                    background: 'hsl(var(--card-warm))',
                    borderColor: 'hsl(var(--border-warm))',
                  }}
                >
                  <h3 className='font-display text-sm font-bold text-charcoal mb-4'>
                    Other Paths
                  </h3>
                  <div className='flex flex-col gap-2'>
                    {PATHS.filter((_, i) => i !== idx).map((relPath, i) => {
                      const relSlug =
                        Object.keys(SLUG_MAP).find(
                          (k) => SLUG_MAP[k] === PATHS.indexOf(relPath),
                        ) ?? '#'
                      return (
                        <Link
                          key={relPath.title}
                          href={`/en/paths/${relSlug}`}
                          className='flex items-center gap-3 p-3 rounded-xl hover:bg-cream transition-colors group'
                        >
                          <div
                            className='w-8 h-8 rounded-lg flex items-center justify-center shrink-0'
                            style={{
                              background: 'hsl(var(--green-primary) / 0.1)',
                            }}
                          >
                            {PathSVGs[relPath.svgKey]}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='font-ui text-xs font-semibold text-charcoal truncate group-hover:text-green-primary transition-colors'>
                              {relPath.title}
                            </div>
                            <div className='font-ui text-[0.6rem] text-text-tertiary'>
                              {relPath.duration} · {relPath.xp}
                            </div>
                          </div>
                          <ChevronRight
                            size={14}
                            className='text-text-tertiary group-hover:text-green-primary transition-colors shrink-0'
                          />
                        </Link>
                      )
                    })}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StandardLayout>
  )
}

export default PathSlug
