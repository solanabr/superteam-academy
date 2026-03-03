import type { Course } from '@/libs/constants/mockData'
import { BookOpen, Clock, Zap } from 'lucide-react'
import Link from 'next/link'

/* ─────────────────────────────────────────────────────────────
   Difficulty badge styles — two contexts:
   onDark  → badge sits on #2f6b3f thumbnail → needs LIGHT text
   onLight → badge sits on white card body   → can use dark text
───────────────────────────────────────────────────────────────*/
type BadgeStyle = { bg: string; color: string; border: string }

const difficultyOnDark: Record<string, BadgeStyle> = {
  Beginner: {
    bg: 'rgba(82,221,160,0.22)',
    color: '#52dda0' /* mint — clearly readable on dark green */,
    border: '1px solid rgba(82,221,160,0.45)',
  },
  Intermediate: {
    bg: 'rgba(255,210,63,0.22)',
    color: '#ffd23f' /* amber — clearly readable on dark green */,
    border: '1px solid rgba(255,210,63,0.5)',
  },
  Advanced: {
    bg: 'rgba(163,217,184,0.2)',
    color: '#a3d9b8' /* mint-soft — clearly readable on dark green */,
    border: '1px solid rgba(163,217,184,0.45)',
  },
}

const difficultyOnLight: Record<string, BadgeStyle> = {
  Beginner: {
    bg: 'rgba(82,221,160,0.15)',
    color: '#1a7a52',
    border: '1px solid rgba(82,221,160,0.3)',
  },
  Intermediate: {
    bg: 'rgba(255,210,63,0.18)',
    color: '#8a6200',
    border: '1px solid rgba(255,210,63,0.35)',
  },
  Advanced: {
    bg: 'rgba(163,217,184,0.15)',
    color: '#2d6644',
    border: '1px solid rgba(163,217,184,0.3)',
  },
}

const CourseCard = ({ course }: { course: Course }) => {
  const diffDark =
    difficultyOnDark[course.difficulty] ?? difficultyOnDark.Beginner
  const diffLight =
    difficultyOnLight[course.difficulty] ?? difficultyOnLight.Beginner

  return (
    <Link
      href={`/courses/${course.slug}`}
      className='group flex flex-col overflow-hidden rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]
        bg-white
        border border-[rgba(27,35,29,0.10)]
        shadow-[0_2px_12px_rgba(27,35,29,0.08)]
        hover:-translate-y-[5px]
        hover:shadow-[0_16px_48px_rgba(27,35,29,0.14)]
        hover:border-[#008c4c]'
      style={{
        // Enrolled cards get a subtle green border at rest
        borderColor: course.enrolled ? 'rgba(0,140,76,0.25)' : undefined,
      }}
    >
      {/* ── Thumbnail ─────────────────────────────────────────── */}
      <div
        className='relative aspect-video overflow-hidden flex-shrink-0'
        style={{ background: 'var(--sta-green-secondary, #2f6b3f)' }}
      >
        {/* Dot-grid texture */}
        <div
          className='absolute inset-0'
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(247,234,203,0.09) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />

        {/* Centered icon */}
        <div className='absolute inset-0 flex items-center justify-center'>
          <BookOpen
            size={36}
            strokeWidth={1.5}
            style={{ color: 'rgba(247,234,203,0.25)' }}
          />
        </div>

        {/* Difficulty badge — top-left on thumbnail, light colors on dark bg */}
        <span
          className='absolute top-3 left-3 font-ui text-[0.6rem] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded'
          style={{
            background: diffDark.bg,
            color: diffDark.color,
            border: diffDark.border,
          }}
        >
          {course.difficulty}
        </span>

        {/* Enrolled progress overlay — bottom of thumbnail */}
        {course.enrolled && typeof course.progress === 'number' && (
          <div className='absolute bottom-0 inset-x-0 h-[4px] bg-black/20'>
            <div
              className='h-full transition-all duration-1000'
              style={{
                width: `${course.progress}%`,
                background: 'linear-gradient(90deg, #008c4c, #52dda0)',
              }}
            />
          </div>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className='flex flex-col flex-1 p-5'>
        {/* Title */}
        <h3 className='font-display text-[1.1rem] font-bold leading-snug text-[#1b231d] mb-1.5'>
          {course.title}
        </h3>

        {/* Description */}
        <p className='font-ui text-[0.875rem] leading-relaxed text-[rgba(27,35,29,0.58)] line-clamp-2 mb-4'>
          {course.description}
        </p>

        {/* Meta row */}
        <div className='flex items-center gap-4 font-ui text-[0.75rem] text-[rgba(27,35,29,0.45)] mb-4'>
          <span className='flex items-center gap-1.5'>
            <Clock size={13} strokeWidth={1.5} />
            {course.duration}
          </span>
          <span className='flex items-center gap-1.5'>
            <BookOpen size={13} strokeWidth={1.5} />
            {course.lessons} lessons
          </span>
          <span className='flex items-center gap-1.5'>
            <Zap size={13} strokeWidth={1.5} />
            {course.xp} XP
          </span>
        </div>

        {/* Instructor */}
        <div className='flex items-center gap-2 mb-4'>
          <div
            className='w-6 h-6 rounded-full flex items-center justify-center font-ui font-bold text-[0.55rem] flex-shrink-0'
            style={{
              background: 'var(--sta-green-dark, #1d4228)',
              color: 'var(--sta-cream, #f7eacb)',
            }}
          >
            {course.instructor.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')}
          </div>
          <span className='font-ui text-[0.8125rem] text-[rgba(27,35,29,0.58)]'>
            {course.instructor.name}
          </span>
          {course.instructor.verified && (
            <span
              className='font-ui text-[0.6rem] font-bold px-1.5 py-0.5 rounded'
              style={{
                background: 'rgba(82,221,160,0.15)',
                color: '#1a7a52',
                border: '1px solid rgba(82,221,160,0.25)',
              }}
            >
              ✓ Verified
            </span>
          )}
        </div>

        {/* Progress bar — enrolled courses */}
        {course.enrolled && typeof course.progress === 'number' && (
          <div className='mb-4'>
            <div className='flex items-center justify-between mb-1.5'>
              <span className='font-ui text-[0.75rem] font-semibold text-[#008c4c]'>
                {course.progress}% complete
              </span>
              <span className='font-ui text-[0.7rem] text-[rgba(27,35,29,0.4)]'>
                {Math.round((course.progress / 100) * course.lessons)}/
                {course.lessons} lessons
              </span>
            </div>
            <div
              className='h-[5px] rounded-full overflow-hidden'
              style={{ background: 'rgba(27,35,29,0.08)' }}
            >
              <div
                className='h-full rounded-full transition-all duration-1000'
                style={{
                  width: `${course.progress}%`,
                  background: 'linear-gradient(90deg, #008c4c, #52dda0)',
                }}
              />
            </div>
          </div>
        )}

        {/* Spacer pushes footer to bottom */}
        <div className='flex-1' />

        {/* ── Footer ──────────────────────────────────────────── */}
        <div
          className='pt-3.5 mt-3.5 flex items-center justify-between'
          style={{ borderTop: '1px solid rgba(27,35,29,0.08)' }}
        >
          {/* Left: difficulty pill on white background */}
          <span
            className='font-ui text-[0.6rem] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full'
            style={{
              background: diffLight.bg,
              color: diffLight.color,
              border: diffLight.border,
            }}
          >
            {course.difficulty}
          </span>

          {/* Right: CTA */}
          {course.enrolled ? (
            <span
              className='font-ui text-[0.8125rem] font-semibold px-4 py-1.5 rounded-lg transition-all duration-200
                group-hover:bg-[rgba(0,140,76,0.18)]'
              style={{
                background: 'rgba(0,140,76,0.1)',
                color: '#008c4c',
                border: '1px solid rgba(0,140,76,0.2)',
              }}
            >
              Continue →
            </span>
          ) : (
            <span
              className='font-ui text-[0.8125rem] font-semibold px-4 py-1.5 rounded-lg text-[#f7eacb] transition-all duration-200
                group-hover:brightness-110'
              style={{
                background: '#008c4c',
                boxShadow: '0 2px 12px rgba(0,140,76,0.35)',
              }}
            >
              Enroll Free
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default CourseCard
