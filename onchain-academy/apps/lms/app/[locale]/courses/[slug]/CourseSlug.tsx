'use client'

import { StandardLayout } from '@/components/layout/StandardLayout'
import {
  courseDetailExtras,
  extendedModules,
  extendedReviews,
} from '@/libs/constants/courseDetail.constants'
import { courses } from '@/libs/constants/mockData'
import { motion } from 'framer-motion'
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code,
  FileText,
  GraduationCap,
  Lock,
  Play,
  Shield,
  Star,
  Users,
  Video,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'

// ─── Helpers ───────────────────────────────────────────────────

const lessonIcon = (type: string, size = 14) => {
  switch (type) {
    case 'Video':
      return <Video size={size} strokeWidth={1.5} />
    case 'Reading':
      return <FileText size={size} strokeWidth={1.5} />
    case 'Code Challenge':
      return <Code size={size} strokeWidth={1.5} />
    default:
      return <Play size={size} strokeWidth={1.5} />
  }
}

const difficultyStyleMap: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Beginner: {
    bg: 'rgba(82,221,160,0.22)',
    text: '#52dda0',
    border: '1px solid rgba(82,221,160,0.45)',
  },
  Intermediate: {
    bg: 'rgba(255,210,63,0.14)',
    text: '#ffd23f',
    border: '1px solid rgba(255,210,63,0.35)',
  },
  Advanced: {
    bg: 'rgba(163,217,184,0.15)',
    text: '#a3d9b8',
    border: '1px solid rgba(163,217,184,0.3)',
  },
}

const difficultyStyleLight: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Beginner: {
    bg: 'hsl(var(--green-mint) / 0.1)',
    text: 'hsl(var(--green-primary))',
    border: '1px solid hsl(var(--green-mint) / 0.3)',
  },
  Intermediate: {
    bg: 'hsl(var(--amber) / 0.1)',
    text: 'hsl(var(--amber-dark))',
    border: '1px solid hsl(var(--amber) / 0.3)',
  },
  Advanced: {
    bg: 'hsl(var(--green-mint-soft) / 0.2)',
    text: 'hsl(var(--green-dark))',
    border: '1px solid hsl(var(--green-mint-soft) / 0.3)',
  },
}

// ─── Star Rating ───────────────────────────────────────────────

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className='flex items-center gap-0.5'>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          strokeWidth={1.5}
          className={
            n <= Math.round(rating)
              ? 'text-amber fill-amber'
              : 'text-charcoal/20'
          }
        />
      ))}
    </div>
  )
}

// ─── Module Accordion ──────────────────────────────────────────

function ModuleAccordion({
  module,
  index,
  enrolled,
}: {
  module: {
    id: string
    title: string
    lessons: Array<{
      id: string
      title: string
      type: string
      duration: string
      completed: boolean
      active?: boolean
      locked?: boolean
    }>
  }
  index: number
  enrolled: boolean
}) {
  const [open, setOpen] = useState(index === 0)
  const completed = module.lessons.filter((l) => l.completed).length
  const total = module.lessons.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div
      className='rounded-xl border transition-all duration-200 overflow-hidden'
      style={{
        background: 'hsl(var(--card-warm))',
        borderColor: open
          ? 'hsl(var(--green-primary) / 0.25)'
          : 'hsl(var(--border-warm))',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className='w-full flex items-center gap-3 p-4 cursor-pointer text-left group'
      >
        <div
          className='w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-ui text-[0.7rem] font-bold'
          style={{
            background:
              pct === 100
                ? 'hsl(var(--green-primary) / 0.12)'
                : 'rgba(139,109,56,0.08)',
            color:
              pct === 100
                ? 'hsl(var(--green-primary))'
                : 'hsl(var(--text-tertiary))',
          }}
        >
          {pct === 100 ? <CheckCircle2 size={16} strokeWidth={2} /> : index + 1}
        </div>

        <div className='flex-1 min-w-0'>
          <div className='font-display text-[0.88rem] font-bold text-charcoal truncate group-hover:text-green-primary transition-colors'>
            {module.title}
          </div>
          <div className='font-ui text-[0.65rem] text-text-tertiary mt-0.5'>
            {total} lessons · {completed}/{total} completed
          </div>
        </div>

        {enrolled && completed > 0 && (
          <div className='hidden sm:flex items-center gap-2 mr-2'>
            <div className='w-16 h-1.5 rounded-full overflow-hidden bg-charcoal/8'>
              <div
                className='h-full rounded-full gradient-progress'
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className='font-ui text-[0.58rem] font-bold text-text-tertiary'>
              {pct}%
            </span>
          </div>
        )}

        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className='text-text-tertiary transition-transform duration-200 flex-shrink-0'
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Lessons */}
      {open && (
        <div className='border-t border-border-warm'>
          {module.lessons.map((lesson, li) => (
            <div
              key={lesson.id}
              className='flex items-center gap-3 px-4 py-3 transition-colors'
              style={{
                background: lesson.active
                  ? 'hsl(var(--green-primary) / 0.04)'
                  : 'transparent',
                borderBottom:
                  li < module.lessons.length - 1
                    ? '1px solid hsl(var(--border-warm))'
                    : 'none',
                opacity: lesson.locked ? 0.45 : 1,
              }}
            >
              {/* Status icon */}
              <div className='w-5 flex-shrink-0 flex items-center justify-center'>
                {lesson.completed ? (
                  <CheckCircle2
                    size={16}
                    strokeWidth={2}
                    className='text-green-primary'
                  />
                ) : lesson.locked ? (
                  <Lock
                    size={14}
                    strokeWidth={1.5}
                    className='text-text-tertiary'
                  />
                ) : lesson.active ? (
                  <div
                    className='w-3 h-3 rounded-full border-2 border-green-primary'
                    style={{
                      background: 'hsl(var(--green-primary) / 0.2)',
                    }}
                  />
                ) : (
                  <div className='w-3 h-3 rounded-full border-2 border-charcoal/20' />
                )}
              </div>

              {/* Type icon */}
              <div
                className='w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0'
                style={{
                  background:
                    lesson.type === 'Code Challenge'
                      ? 'hsl(var(--amber) / 0.12)'
                      : lesson.type === 'Video'
                        ? 'hsl(var(--green-primary) / 0.1)'
                        : 'rgba(139,109,56,0.08)',
                  color:
                    lesson.type === 'Code Challenge'
                      ? 'hsl(var(--amber-dark))'
                      : lesson.type === 'Video'
                        ? 'hsl(var(--green-primary))'
                        : 'hsl(var(--text-secondary))',
                }}
              >
                {lessonIcon(lesson.type, 13)}
              </div>

              {/* Info */}
              <div className='flex-1 min-w-0'>
                <div
                  className='font-ui text-[0.78rem] font-medium truncate'
                  style={{
                    color: lesson.active
                      ? 'hsl(var(--green-primary))'
                      : 'hsl(var(--charcoal))',
                  }}
                >
                  {lesson.title}
                </div>
              </div>

              {/* Meta */}
              <div className='flex items-center gap-2 flex-shrink-0'>
                <span className='font-ui text-[0.6rem] px-2 py-0.5 rounded-full bg-charcoal/5 text-text-tertiary'>
                  {lesson.type}
                </span>
                <span className='font-ui text-[0.62rem] text-text-tertiary flex items-center gap-1'>
                  <Clock size={10} strokeWidth={1.5} />
                  {lesson.duration}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────

interface CourseSlugProps {
  slug: string
}

export const CourseSlug = ({ slug }: CourseSlugProps) => {
  const course = useMemo(() => courses.find((c) => c.slug === slug), [slug])
  const extra = course ? courseDetailExtras[course.slug] : null

  // Merge extended modules/reviews if stubs
  const modules = useMemo(() => {
    if (!course) return []
    const ext = extendedModules[course.slug]
    return course.modules.length > 0 ? course.modules : (ext ?? [])
  }, [course])

  const reviews = useMemo(() => {
    if (!course) return []
    const ext = extendedReviews[course.slug]
    return course.reviews.length > 0 ? course.reviews : (ext ?? [])
  }, [course])

  if (!course || !extra) {
    return (
      <StandardLayout>
        <div className='max-w-[1200px] mx-auto py-20 text-center'>
          <p className='font-ui text-lg text-text-secondary'>
            Course not found.
          </p>
        </div>
      </StandardLayout>
    )
  }

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const completedLessons = modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.completed).length,
    0,
  )
  const progressPct =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Find first incomplete lesson for "Continue Learning"
  const firstLesson = modules[0]?.lessons[0]
  const nextLesson = (() => {
    for (const mod of modules) {
      for (const lesson of mod.lessons) {
        if (!lesson.completed) return lesson
      }
    }
    return firstLesson // fallback to first if all complete
  })()

  const ds =
    difficultyStyleMap[course.difficulty] ?? difficultyStyleMap.Beginner
  const dsLight =
    difficultyStyleLight[course.difficulty] ?? difficultyStyleLight.Beginner

  return (
    <StandardLayout>
      {/* ─── HERO ──────────────────────────────────────────── */}
      <div className='relative overflow-hidden bg-green-secondary'>
        <div className='absolute inset-0 pattern-diagonal' />
        <div
          className='absolute -top-24 right-8 w-80 h-80 rounded-full pointer-events-none'
          style={{
            background: 'rgba(0,140,76,0.28)',
            filter: 'blur(64px)',
            animation: 'aurora 12s ease-in-out infinite',
          }}
        />
        <div
          className='absolute bottom-[-40px] left-[-20px] w-48 h-48 rounded-full pointer-events-none'
          style={{
            background: 'rgba(82,221,160,0.18)',
            filter: 'blur(48px)',
            animation: 'aurora 16s ease-in-out infinite reverse',
          }}
        />

        <div className='relative z-10 max-w-[1200px] mx-auto px-[5%] py-10 lg:py-14'>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Breadcrumb */}
            <div className='flex items-center gap-2 mb-4'>
              <a
                href='/en/courses'
                className='font-ui text-[0.68rem] text-cream/40 hover:text-cream/70 transition-colors'
              >
                Courses
              </a>
              <span className='font-ui text-[0.68rem] text-cream/25'>/</span>
              <span className='font-ui text-[0.68rem] text-cream/55'>
                {course.title}
              </span>
            </div>

            <div className='flex flex-col lg:flex-row gap-8 lg:items-start'>
              {/* Left info */}
              <div className='flex-1 min-w-0'>
                {/* Difficulty + Topic */}
                <div className='flex items-center gap-2 mb-3'>
                  <span
                    className='font-ui text-[0.6rem] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full'
                    style={{
                      background: ds.bg,
                      color: ds.text,
                      border: ds.border,
                    }}
                  >
                    {course.difficulty}
                  </span>
                  <span className='font-ui text-[0.6rem] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-cream/8 text-cream/50 border border-cream/15'>
                    {course.topic}
                  </span>
                </div>

                <h1 className='font-display text-[1.8rem] lg:text-[2.4rem] font-black tracking-[-0.025em] leading-tight text-cream mb-3'>
                  {course.title}
                </h1>

                <p className='font-ui text-[0.92rem] text-cream/60 max-w-2xl mb-4 leading-relaxed'>
                  {extra.longDescription}
                </p>

                {/* Instructor + Rating */}
                <div className='flex flex-wrap items-center gap-4 mb-4'>
                  <div className='flex items-center gap-2'>
                    <div className='w-8 h-8 rounded-full bg-cream/15 flex items-center justify-center'>
                      <GraduationCap
                        size={16}
                        strokeWidth={1.5}
                        className='text-cream/60'
                      />
                    </div>
                    <div>
                      <span className='font-ui text-[0.72rem] font-semibold text-cream/80'>
                        {course.instructor.name}
                      </span>
                      {course.instructor.verified && (
                        <CheckCircle2
                          size={11}
                          strokeWidth={2}
                          className='inline ml-1 text-green-mint'
                        />
                      )}
                    </div>
                  </div>

                  <span className='w-[1px] h-4 bg-cream/15' />

                  <div className='flex items-center gap-1.5'>
                    <StarRating rating={extra.rating} size={13} />
                    <span className='font-ui text-[0.7rem] font-bold text-amber'>
                      {extra.rating}
                    </span>
                    <span className='font-ui text-[0.62rem] text-cream/40'>
                      ({extra.ratingCount} reviews)
                    </span>
                  </div>
                </div>

                {/* Meta pills */}
                <div className='flex flex-wrap items-center gap-3'>
                  {[
                    {
                      icon: <Clock size={12} strokeWidth={1.5} />,
                      label: course.duration,
                    },
                    {
                      icon: <BookOpen size={12} strokeWidth={1.5} />,
                      label: `${course.lessons} lessons`,
                    },
                    {
                      icon: <Users size={12} strokeWidth={1.5} />,
                      label: `${extra.enrolledCount.toLocaleString()} enrolled`,
                    },
                    {
                      icon: <Zap size={12} strokeWidth={1.5} />,
                      label: `${course.xp.toLocaleString()} XP`,
                    },
                  ].map((pill) => (
                    <span
                      key={pill.label}
                      className='flex items-center gap-1.5 font-ui text-[0.65rem] text-cream/45'
                    >
                      {pill.icon}
                      {pill.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right — Enrollment card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className='lg:w-[320px] flex-shrink-0'
              >
                <div
                  className='rounded-2xl p-6 border backdrop-blur-sm'
                  style={{
                    background: 'rgba(247,234,203,0.08)',
                    borderColor: 'rgba(247,234,203,0.12)',
                  }}
                >
                  {course.enrolled ? (
                    <>
                      <div className='mb-4'>
                        <div className='flex justify-between mb-1.5'>
                          <span className='font-ui text-[0.65rem] text-cream/50'>
                            Progress
                          </span>
                          <span className='font-ui text-[0.65rem] font-bold text-green-mint'>
                            {progressPct}%
                          </span>
                        </div>
                        <div className='h-2 rounded-full overflow-hidden bg-cream/10'>
                          <div
                            className='h-full rounded-full gradient-progress transition-all duration-1000'
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className='flex justify-between mt-1.5'>
                          <span className='font-ui text-[0.6rem] text-cream/35'>
                            {completedLessons}/{totalLessons} lessons
                          </span>
                          <span className='font-ui text-[0.6rem] text-cream/35'>
                            {course.xp} XP total
                          </span>
                        </div>
                      </div>
                      <a
                        href={`/en/courses/${slug}/lesson/${nextLesson?.id || 'l1'}`}
                        className='block w-full font-ui text-[0.85rem] font-semibold px-4 py-3 rounded-xl bg-green-primary text-cream text-center hover:bg-green-dark transition-all duration-200 shadow-[0_2px_14px_rgba(0,140,76,0.38)] hover:shadow-[0_6px_22px_rgba(0,140,76,0.48)] hover:-translate-y-0.5 cursor-pointer'
                      >
                        Continue Learning →
                      </a>
                    </>
                  ) : (
                    <>
                      <div className='text-center mb-4'>
                        <div className='font-display text-[1.4rem] font-black text-cream mb-1'>
                          Free
                        </div>
                        <p className='font-ui text-[0.7rem] text-cream/45'>
                          Full access · Earn {course.xp} XP
                        </p>
                      </div>
                      <a
                        href={`/en/courses/${slug}/lesson/${firstLesson?.id || 'l1'}`}
                        className='block w-full font-ui text-[0.85rem] font-semibold px-4 py-3 rounded-xl bg-green-primary text-cream text-center hover:bg-green-dark transition-all duration-200 shadow-[0_2px_14px_rgba(0,140,76,0.38)] hover:shadow-[0_6px_22px_rgba(0,140,76,0.48)] hover:-translate-y-0.5 cursor-pointer mb-3'
                      >
                        Enroll Now — It&rsquo;s Free
                      </a>
                      <p className='font-ui text-[0.58rem] text-cream/30 text-center'>
                        Instant access · No credit card required
                      </p>
                    </>
                  )}

                  {/* Credential badges */}
                  <div className='flex items-center gap-2 mt-4 pt-4 border-t border-cream/10'>
                    {extra.certificate && (
                      <span className='flex items-center gap-1 font-ui text-[0.58rem] text-cream/45'>
                        <Award size={11} strokeWidth={1.5} />
                        Certificate
                      </span>
                    )}
                    {extra.onChainCredential && (
                      <span className='flex items-center gap-1 font-ui text-[0.58rem] text-cream/45'>
                        <Shield size={11} strokeWidth={1.5} />
                        On-chain cNFT
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── CONTENT ───────────────────────────────────────── */}
      <div className='max-w-[1200px] mx-auto flex flex-col gap-6 py-12'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* ─── LEFT — 2/3 ──────────────────────────────── */}
          <div className='lg:col-span-2 flex flex-col gap-6'>
            {/* What you'll learn */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className='card-warm rounded-2xl p-6'
            >
              <h2 className='font-display text-[1.1rem] font-bold text-charcoal mb-4 flex items-center gap-2'>
                <GraduationCap
                  size={18}
                  strokeWidth={1.5}
                  className='text-green-primary'
                />
                What You&rsquo;ll Learn
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                {extra.learningOutcomes.map((outcome, i) => (
                  <div
                    key={i}
                    className='flex items-start gap-2.5 p-3 rounded-lg'
                    style={{
                      background: 'hsl(var(--green-primary) / 0.04)',
                    }}
                  >
                    <CheckCircle2
                      size={14}
                      strokeWidth={2}
                      className='text-green-primary flex-shrink-0 mt-0.5'
                    />
                    <span className='font-ui text-[0.78rem] text-text-secondary leading-snug'>
                      {outcome}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Course Content — Module Accordion */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className='card-warm rounded-2xl p-6'
            >
              <div className='flex items-center justify-between mb-5'>
                <h2 className='font-display text-[1.1rem] font-bold text-charcoal flex items-center gap-2'>
                  <BookOpen
                    size={18}
                    strokeWidth={1.5}
                    className='text-amber'
                  />
                  Course Content
                </h2>
                <span className='font-ui text-[0.65rem] text-text-tertiary'>
                  {modules.length} modules · {totalLessons} lessons
                </span>
              </div>

              {modules.length > 0 ? (
                <div className='flex flex-col gap-2.5'>
                  {modules.map((mod, i) => (
                    <ModuleAccordion
                      key={mod.id}
                      module={mod}
                      index={i}
                      enrolled={course.enrolled}
                    />
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <BookOpen
                    size={32}
                    strokeWidth={1}
                    className='mx-auto text-text-tertiary mb-2'
                  />
                  <p className='font-ui text-[0.8rem] text-text-tertiary'>
                    Course content is being prepared.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.26 }}
              className='card-warm rounded-2xl p-6'
            >
              <div className='flex items-center justify-between mb-5'>
                <h2 className='font-display text-[1.1rem] font-bold text-charcoal flex items-center gap-2'>
                  <Star size={18} strokeWidth={1.5} className='text-amber' />
                  Student Reviews
                </h2>
                <div className='flex items-center gap-2'>
                  <StarRating rating={extra.rating} />
                  <span className='font-ui text-[0.72rem] font-bold text-charcoal'>
                    {extra.rating}
                  </span>
                  <span className='font-ui text-[0.62rem] text-text-tertiary'>
                    ({extra.ratingCount})
                  </span>
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className='flex flex-col gap-3'>
                  {reviews.map((review, i) => (
                    <div
                      key={i}
                      className='p-4 rounded-xl border border-border-warm'
                      style={{ background: 'hsl(var(--card-warm-hover))' }}
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                          <div className='w-7 h-7 rounded-full bg-green-secondary/30 flex items-center justify-center'>
                            <span className='font-ui text-[0.6rem] font-bold text-cream/70'>
                              {review.name.charAt(0)}
                            </span>
                          </div>
                          <span className='font-ui text-[0.76rem] font-semibold text-charcoal'>
                            {review.name}
                          </span>
                        </div>
                        <span className='font-ui text-[0.6rem] text-text-tertiary'>
                          {review.date}
                        </span>
                      </div>
                      <StarRating rating={review.rating} size={12} />
                      <p className='font-ui text-[0.8rem] text-text-secondary mt-2 leading-relaxed'>
                        {review.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <Star
                    size={32}
                    strokeWidth={1}
                    className='mx-auto text-text-tertiary mb-2'
                  />
                  <p className='font-ui text-[0.8rem] text-text-tertiary'>
                    No reviews yet. Be the first to review!
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* ─── RIGHT — 1/3 ─────────────────────────────── */}
          <div className='flex flex-col gap-5'>
            {/* Course Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className='card-warm rounded-2xl p-6'
            >
              <h3 className='font-display text-[1rem] font-bold text-charcoal mb-4'>
                Course Details
              </h3>
              <div className='flex flex-col gap-3'>
                {[
                  {
                    label: 'Difficulty',
                    value: course.difficulty,
                    pill: true,
                  },
                  { label: 'Duration', value: course.duration },
                  { label: 'Lessons', value: `${course.lessons} lessons` },
                  {
                    label: 'XP Reward',
                    value: `${course.xp.toLocaleString()} XP`,
                  },
                  {
                    label: 'Students',
                    value: extra.enrolledCount.toLocaleString(),
                  },
                  { label: 'Language', value: extra.language },
                  { label: 'Last Updated', value: extra.lastUpdated },
                ].map((row) => (
                  <div
                    key={row.label}
                    className='flex items-center justify-between py-2 border-b border-border-warm last:border-0'
                  >
                    <span className='font-ui text-[0.72rem] text-text-tertiary'>
                      {row.label}
                    </span>
                    {row.pill ? (
                      <span
                        className='font-ui text-[0.62rem] font-bold px-2 py-0.5 rounded-full'
                        style={{
                          background: dsLight.bg,
                          color: dsLight.text,
                          border: dsLight.border,
                        }}
                      >
                        {row.value}
                      </span>
                    ) : (
                      <span className='font-ui text-[0.78rem] font-semibold text-charcoal'>
                        {row.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Prerequisites */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className='card-warm rounded-2xl p-6'
            >
              <h3 className='font-display text-[1rem] font-bold text-charcoal mb-3 flex items-center gap-2'>
                <Shield
                  size={16}
                  strokeWidth={1.5}
                  className='text-green-mint'
                />
                Prerequisites
              </h3>
              {extra.prerequisites.length > 0 ? (
                <ul className='flex flex-col gap-2'>
                  {extra.prerequisites.map((p, i) => (
                    <li
                      key={i}
                      className='flex items-start gap-2 font-ui text-[0.76rem] text-text-secondary'
                    >
                      <span className='w-1.5 h-1.5 rounded-full bg-green-primary flex-shrink-0 mt-1.5' />
                      {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='font-ui text-[0.76rem] text-text-tertiary'>
                  No prerequisites — anyone can start!
                </p>
              )}
            </motion.div>

            {/* Credentials earned */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className='card-warm rounded-2xl p-6'
            >
              <h3 className='font-display text-[1rem] font-bold text-charcoal mb-3 flex items-center gap-2'>
                <Award size={16} strokeWidth={1.5} className='text-amber' />
                Earn on Completion
              </h3>
              <div className='flex flex-col gap-2.5'>
                <div className='flex items-center gap-3 p-3 rounded-xl bg-green-primary/5 border border-green-primary/15'>
                  <Zap
                    size={18}
                    strokeWidth={1.5}
                    className='text-green-primary'
                  />
                  <div>
                    <div className='font-ui text-[0.76rem] font-semibold text-charcoal'>
                      {course.xp.toLocaleString()} XP
                    </div>
                    <div className='font-ui text-[0.6rem] text-text-tertiary'>
                      Experience points
                    </div>
                  </div>
                </div>
                {extra.certificate && (
                  <div className='flex items-center gap-3 p-3 rounded-xl bg-amber/5 border border-amber/15'>
                    <Award
                      size={18}
                      strokeWidth={1.5}
                      className='text-amber-dark'
                    />
                    <div>
                      <div className='font-ui text-[0.76rem] font-semibold text-charcoal'>
                        Completion Certificate
                      </div>
                      <div className='font-ui text-[0.6rem] text-text-tertiary'>
                        Shareable credential
                      </div>
                    </div>
                  </div>
                )}
                {extra.onChainCredential && (
                  <div className='flex items-center gap-3 p-3 rounded-xl bg-green-mint/5 border border-green-mint/15'>
                    <Shield
                      size={18}
                      strokeWidth={1.5}
                      className='text-green-mint'
                    />
                    <div>
                      <div className='font-ui text-[0.76rem] font-semibold text-charcoal'>
                        On-Chain cNFT
                      </div>
                      <div className='font-ui text-[0.6rem] text-text-tertiary'>
                        Evolving credential
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </StandardLayout>
  )
}

export default CourseSlug
