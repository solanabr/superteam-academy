'use client'

import {
  ADMIN_COURSES,
  STATUS_META,
  type AdminCourse,
  type CourseStatus,
} from '@/libs/constants/admin.constants'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  Edit2,
  ExternalLink,
  Globe,
  Plus,
  Search,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type LocaleKey = 'en' | 'es' | 'pt'
const LOCALE_TABS = [
  { id: 'en' as LocaleKey, flag: '🇺🇸', label: 'EN' },
  { id: 'es' as LocaleKey, flag: '🇪🇸', label: 'ES' },
  { id: 'pt' as LocaleKey, flag: '🇧🇷', label: 'PT' },
]

const DIFFICULTY_COLORS = {
  Beginner: 'text-green-primary bg-green-primary/10 border-green-primary/20',
  Intermediate: 'text-amber-dark bg-amber/10 border-amber/20',
  Advanced: 'text-red-600 bg-red-50 border-red-200',
}

// ─── Slide Panel ─────────────────────────────────────────────────────────────

function CourseSlidePanel({
  course,
  onClose,
}: {
  course: AdminCourse
  onClose: () => void
}) {
  const [locale, setLocale] = useState<LocaleKey>('en')

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className='fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col shadow-2xl'
      style={{
        background: 'hsl(var(--cream))',
        borderLeft: '1px solid hsl(var(--border-warm))',
      }}
    >
      {/* Header */}
      <div
        className='px-6 py-5 border-b flex items-center justify-between shrink-0'
        style={{ borderColor: 'hsl(var(--border-warm))' }}
      >
        <div className='flex items-center gap-3'>
          <span className='text-2xl'>{course.thumbnail}</span>
          <div>
            <h2 className='font-display text-base font-bold text-charcoal'>
              {course.title.en}
            </h2>
            <span
              className={`font-ui text-[0.6rem] font-bold px-2 py-0.5 rounded border ${STATUS_META[course.status].bg} ${STATUS_META[course.status].color}`}
            >
              {STATUS_META[course.status].label}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className='p-2 rounded-lg hover:bg-charcoal/8 transition-colors'
        >
          <X size={16} className='text-text-tertiary' />
        </button>
      </div>

      {/* Language Tabs */}
      <div className='px-6 pt-4 shrink-0'>
        <div className='flex gap-1 p-1 rounded-xl bg-cream-dark mb-4'>
          {LOCALE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLocale(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-ui text-xs font-semibold transition-all ${
                locale === tab.id
                  ? 'bg-cream shadow-sm text-charcoal'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {tab.flag} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto px-6 pb-6'>
        <div className='flex flex-col gap-4'>
          {/* Title field */}
          <div>
            <label className='font-ui text-[0.65rem] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5'>
              Title ({locale.toUpperCase()})
            </label>
            <input
              className='w-full px-3 py-2.5 rounded-xl border font-ui text-sm text-charcoal bg-cream focus:outline-none focus:border-green-primary transition-colors'
              style={{ borderColor: 'hsl(var(--border-warm))' }}
              defaultValue={course.title[locale]}
            />
          </div>

          {/* Description */}
          <div>
            <label className='font-ui text-[0.65rem] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5'>
              Description ({locale.toUpperCase()})
            </label>
            <textarea
              rows={4}
              className='w-full px-3 py-2.5 rounded-xl border font-ui text-sm text-charcoal bg-cream focus:outline-none focus:border-green-primary transition-colors resize-none'
              style={{ borderColor: 'hsl(var(--border-warm))' }}
              defaultValue={course.description[locale]}
            />
          </div>

          {/* Metadata */}
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='font-ui text-[0.65rem] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5'>
                Track
              </label>
              <input
                className='w-full px-3 py-2 rounded-xl border font-ui text-sm bg-cream text-charcoal'
                style={{ borderColor: 'hsl(var(--border-warm))' }}
                defaultValue={course.track}
                readOnly
              />
            </div>
            <div>
              <label className='font-ui text-[0.65rem] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5'>
                Difficulty
              </label>
              <input
                className='w-full px-3 py-2 rounded-xl border font-ui text-sm bg-cream text-charcoal'
                style={{ borderColor: 'hsl(var(--border-warm))' }}
                defaultValue={course.difficulty}
                readOnly
              />
            </div>
            <div>
              <label className='font-ui text-[0.65rem] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5'>
                XP Reward
              </label>
              <input
                className='w-full px-3 py-2 rounded-xl border font-ui text-sm bg-cream text-charcoal'
                style={{ borderColor: 'hsl(var(--border-warm))' }}
                defaultValue={course.xpReward}
              />
            </div>
            <div>
              <label className='font-ui text-[0.65rem] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5'>
                Status
              </label>
              <select
                className='w-full px-3 py-2 rounded-xl border font-ui text-sm bg-cream text-charcoal'
                style={{ borderColor: 'hsl(var(--border-warm))' }}
                defaultValue={course.status}
              >
                <option value='published'>Published</option>
                <option value='draft'>Draft</option>
                <option value='archived'>Archived</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div
            className='p-4 rounded-xl border grid grid-cols-3 gap-3 text-center'
            style={{
              background: 'hsl(var(--card-warm))',
              borderColor: 'hsl(var(--border-warm))',
            }}
          >
            <div>
              <div className='font-display text-lg font-black text-charcoal'>
                {course.modulesCount}
              </div>
              <div className='font-ui text-[0.6rem] text-text-tertiary'>
                Modules
              </div>
            </div>
            <div>
              <div className='font-display text-lg font-black text-charcoal'>
                {course.lessonsCount}
              </div>
              <div className='font-ui text-[0.6rem] text-text-tertiary'>
                Lessons
              </div>
            </div>
            <div>
              <div className='font-display text-lg font-black text-green-primary'>
                {course.completionRate}%
              </div>
              <div className='font-ui text-[0.6rem] text-text-tertiary'>
                Completion
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className='px-6 py-4 border-t flex gap-2 shrink-0'
        style={{ borderColor: 'hsl(var(--border-warm))' }}
      >
        <button
          className='flex-1 py-2.5 rounded-xl font-ui font-bold text-sm text-cream transition-all hover:opacity-90'
          style={{ background: 'hsl(var(--green-primary))' }}
        >
          Save Changes
        </button>
        <Link
          href={`/en/courses/${course.slug}`}
          target='_blank'
          className='flex items-center gap-2 px-4 py-2.5 rounded-xl border font-ui font-bold text-sm text-charcoal hover:bg-card-warm transition-colors'
          style={{ borderColor: 'hsl(var(--border-warm))' }}
        >
          <ExternalLink size={14} />
          View
        </Link>
      </div>
    </motion.div>
  )
}

// ─── Course Management Page ───────────────────────────────────────────────────

export function AdminCourses() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all')
  const [selected, setSelected] = useState<AdminCourse | null>(null)

  const filtered = ADMIN_COURSES.filter((c) => {
    const matchQuery =
      c.title.en.toLowerCase().includes(query.toLowerCase()) ||
      c.track.toLowerCase().includes(query.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchQuery && matchStatus
  })

  return (
    <div className='relative h-full flex flex-col'>
      {/* Header bar */}
      <div
        className='px-6 lg:px-8 py-5 border-b shrink-0 flex items-center justify-between gap-4'
        style={{
          borderColor: 'hsl(var(--border-warm))',
          background: 'hsl(var(--card-warm))',
        }}
      >
        <div>
          <h1 className='font-display text-xl font-black text-charcoal'>
            Course Management
          </h1>
          <p className='font-ui text-xs text-text-tertiary'>
            {ADMIN_COURSES.length} courses total
          </p>
        </div>
        <button
          className='flex items-center gap-2 px-4 py-2.5 rounded-xl font-ui text-sm font-bold text-cream transition-all hover:opacity-90 shrink-0'
          style={{ background: 'hsl(var(--green-primary))' }}
        >
          <Plus size={16} />
          New Course
        </button>
      </div>

      {/* Filters */}
      <div
        className='px-6 lg:px-8 py-4 border-b shrink-0 flex items-center gap-3'
        style={{ borderColor: 'hsl(var(--border-warm))' }}
      >
        <div className='relative flex-1 max-w-sm'>
          <Search
            size={14}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary'
          />
          <input
            className='w-full pl-8 pr-3 py-2 rounded-xl border font-ui text-sm bg-cream text-charcoal focus:outline-none focus:border-green-primary transition-colors'
            style={{ borderColor: 'hsl(var(--border-warm))' }}
            placeholder='Search courses...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {(['all', 'published', 'draft', 'archived'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg font-ui text-xs font-semibold border transition-all capitalize ${
              statusFilter === s
                ? 'bg-charcoal text-cream border-charcoal'
                : 'bg-cream text-text-secondary border-border-warm hover:bg-card-warm'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className='flex-1 overflow-auto px-6 lg:px-8 py-4'>
        <table className='w-full min-w-[700px]'>
          <thead>
            <tr
              className='border-b'
              style={{ borderColor: 'hsl(var(--border-warm))' }}
            >
              {[
                'Course',
                'Track',
                'Difficulty',
                'Lessons',
                'Enrolled',
                'Status',
                '',
              ].map((h) => (
                <th
                  key={h}
                  className='text-left pb-3 font-ui text-[0.65rem] font-bold text-text-tertiary uppercase tracking-wider pr-4'
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((course, i) => (
              <motion.tr
                key={course.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className='border-b hover:bg-card-warm transition-colors cursor-pointer'
                style={{ borderColor: 'hsl(var(--border-warm))' }}
                onClick={() => setSelected(course)}
              >
                <td className='py-3.5 pr-4'>
                  <div className='flex items-center gap-3'>
                    <span className='text-xl'>{course.thumbnail}</span>
                    <div>
                      <div className='font-ui text-sm font-semibold text-charcoal'>
                        {course.title.en}
                      </div>
                      <div className='font-ui text-[0.6rem] text-text-tertiary flex items-center gap-1'>
                        <Globe size={10} /> {course.title.es.slice(0, 18)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className='py-3.5 pr-4'>
                  <span className='font-ui text-xs text-text-secondary'>
                    {course.track}
                  </span>
                </td>
                <td className='py-3.5 pr-4'>
                  <span
                    className={`font-ui text-[0.6rem] font-bold px-2 py-0.5 rounded-lg border ${DIFFICULTY_COLORS[course.difficulty]}`}
                  >
                    {course.difficulty}
                  </span>
                </td>
                <td className='py-3.5 pr-4'>
                  <div className='flex items-center gap-1'>
                    <BookOpen size={12} className='text-text-tertiary' />
                    <span className='font-ui text-xs text-charcoal'>
                      {course.lessonsCount}
                    </span>
                  </div>
                </td>
                <td className='py-3.5 pr-4'>
                  <span className='font-display text-sm font-black text-charcoal'>
                    {course.enrollments.toLocaleString()}
                  </span>
                </td>
                <td className='py-3.5 pr-4'>
                  <span
                    className={`font-ui text-[0.6rem] font-bold px-2 py-0.5 rounded border ${STATUS_META[course.status].bg} ${STATUS_META[course.status].color}`}
                  >
                    {STATUS_META[course.status].label}
                  </span>
                </td>
                <td className='py-3.5'>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelected(course)
                    }}
                    className='p-1.5 rounded-lg hover:bg-charcoal/8 transition-colors'
                  >
                    <Edit2 size={14} className='text-text-tertiary' />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className='py-16 text-center'>
            <BookOpen
              size={32}
              className='text-text-tertiary mx-auto mb-3'
              strokeWidth={1}
            />
            <p className='font-ui text-sm text-text-tertiary'>
              No courses match your filters.
            </p>
          </div>
        )}
      </div>

      {/* Slide Panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-charcoal/30 z-40'
              onClick={() => setSelected(null)}
            />
            <CourseSlidePanel
              course={selected}
              onClose={() => setSelected(null)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
