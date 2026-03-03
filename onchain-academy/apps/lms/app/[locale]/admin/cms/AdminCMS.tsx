'use client'

import {
  CMS_COURSES,
  LESSON_TYPE_META,
  LOCALE_TABS,
  type AdminLesson,
  type LocaleKey,
} from '@/libs/constants/admin.constants'
import { motion } from 'framer-motion'
import { ChevronDown, Eye, EyeOff, Plus, Save } from 'lucide-react'
import { useState } from 'react'

// ─── Left Tree ────────────────────────────────────────────────────────────────

function CourseTree({
  selectedLesson,
  onSelectLesson,
}: {
  selectedLesson: AdminLesson | null
  onSelectLesson: (lesson: AdminLesson) => void
}) {
  const [openModules, setOpenModules] = useState<string[]>(['m1'])

  const toggleModule = (id: string) => {
    setOpenModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )
  }

  return (
    <aside
      className='w-72 shrink-0 border-r h-full flex flex-col overflow-hidden'
      style={{
        borderColor: 'hsl(var(--border-warm))',
        background: 'hsl(var(--card-warm))',
      }}
    >
      <div
        className='px-4 py-4 border-b shrink-0'
        style={{ borderColor: 'hsl(var(--border-warm))' }}
      >
        <h2 className='font-display text-sm font-bold text-charcoal'>
          Course Tree
        </h2>
        <p className='font-ui text-[0.6rem] text-text-tertiary'>
          {CMS_COURSES.length} courses
        </p>
      </div>

      <div className='flex-1 overflow-y-auto p-3'>
        {CMS_COURSES.map((course) => (
          <div key={course.id} className='mb-4'>
            <div className='font-display text-xs font-bold text-charcoal px-2 py-1.5 mb-1 flex items-center gap-2'>
              <span
                className='w-5 h-5 rounded-md flex items-center justify-center text-xs'
                style={{ background: 'hsl(var(--green-primary) / 0.15)' }}
              >
                📚
              </span>
              {course.title}
            </div>

            {course.modules.map((mod) => (
              <div key={mod.id} className='mb-1'>
                <button
                  onClick={() => toggleModule(mod.id)}
                  className='w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cream transition-colors text-left'
                >
                  <ChevronDown
                    size={12}
                    className={`text-text-tertiary transition-transform shrink-0 ${openModules.includes(mod.id) ? '' : '-rotate-90'}`}
                  />
                  <span className='font-ui text-xs font-semibold text-charcoal truncate'>
                    {mod.title.en}
                  </span>
                </button>

                {openModules.includes(mod.id) && (
                  <div className='ml-5 mt-0.5 flex flex-col gap-0.5'>
                    {mod.lessons.map((lesson) => {
                      const meta = LESSON_TYPE_META[lesson.type]
                      const isActive = selectedLesson?.id === lesson.id
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => onSelectLesson(lesson)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                            isActive
                              ? 'bg-green-primary/10 text-green-primary shadow-sm'
                              : 'hover:bg-cream text-text-secondary'
                          }`}
                        >
                          <span className='text-xs shrink-0'>{meta.icon}</span>
                          <span
                            className={`font-ui text-[0.72rem] truncate ${isActive ? 'font-semibold' : ''}`}
                          >
                            {lesson.title.en}
                          </span>
                          {!lesson.published && (
                            <EyeOff
                              size={10}
                              className='ml-auto shrink-0 text-text-tertiary'
                            />
                          )}
                        </button>
                      )
                    })}

                    <button className='flex items-center gap-1.5 px-2 py-1 text-text-tertiary hover:text-green-primary transition-colors'>
                      <Plus size={11} />
                      <span className='font-ui text-[0.65rem]'>Add lesson</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button className='ml-2 flex items-center gap-1.5 px-2 py-1 text-text-tertiary hover:text-green-primary transition-colors mt-1'>
              <Plus size={11} />
              <span className='font-ui text-[0.65rem]'>Add module</span>
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}

// ─── Lesson Editor ────────────────────────────────────────────────────────────

function LessonEditor({ lesson }: { lesson: AdminLesson }) {
  const [locale, setLocale] = useState<LocaleKey>('en')
  const meta = LESSON_TYPE_META[lesson.type]

  return (
    <div className='flex-1 flex flex-col h-full overflow-hidden'>
      {/* Editor Header */}
      <div
        className='px-6 py-4 border-b shrink-0 flex items-center justify-between gap-4'
        style={{ borderColor: 'hsl(var(--border-warm))' }}
      >
        <div className='flex items-center gap-3'>
          <span className='text-xl'>{meta.icon}</span>
          <div>
            <h2 className='font-display text-sm font-bold text-charcoal'>
              {lesson.title.en}
            </h2>
            <span
              className={`font-ui text-[0.6rem] font-bold ${lesson.published ? 'text-green-primary' : 'text-amber-dark'}`}
            >
              {lesson.published ? '● Published' : '● Draft'}
            </span>
          </div>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <button
            className='flex items-center gap-1.5 px-3 py-2 rounded-xl border font-ui text-xs font-bold text-charcoal hover:bg-card-warm transition-colors'
            style={{ borderColor: 'hsl(var(--border-warm))' }}
          >
            <Eye size={13} />
            Preview
          </button>
          <button
            className='flex items-center gap-1.5 px-4 py-2 rounded-xl font-ui text-xs font-bold text-cream transition-all hover:opacity-90'
            style={{ background: 'hsl(var(--green-primary))' }}
          >
            <Save size={13} />
            Save
          </button>
        </div>
      </div>

      {/* Language Tabs */}
      <div className='px-6 pt-5 shrink-0'>
        <div className='flex gap-1 p-1 rounded-xl bg-cream-dark w-fit mb-5'>
          {LOCALE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLocale(tab.id as LocaleKey)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-ui text-xs font-semibold transition-all ${
                locale === tab.id
                  ? 'bg-cream shadow-sm text-charcoal'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable editor area */}
      <div className='flex-1 overflow-y-auto px-6 pb-6'>
        <motion.div
          key={locale}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex flex-col gap-5'
        >
          {/* Lesson Title */}
          <div>
            <label className='font-ui text-[0.65rem] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5'>
              Lesson Title
            </label>
            <input
              className='w-full px-4 py-3 rounded-xl border font-display font-bold text-lg text-charcoal bg-cream focus:outline-none focus:border-green-primary transition-colors'
              style={{ borderColor: 'hsl(var(--border-warm))' }}
              defaultValue={lesson.title[locale as LocaleKey]}
            />
          </div>

          {/* Type + XP row */}
          <div className='grid grid-cols-3 gap-3'>
            <div>
              <label className='font-ui text-[0.65rem] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5'>
                Lesson Type
              </label>
              <select
                className='w-full px-3 py-2.5 rounded-xl border font-ui text-sm bg-cream text-charcoal focus:outline-none focus:border-green-primary'
                style={{ borderColor: 'hsl(var(--border-warm))' }}
                defaultValue={lesson.type}
              >
                <option value='reading'>📖 Reading</option>
                <option value='video'>🎥 Video</option>
                <option value='challenge'>💻 Code Challenge</option>
                <option value='quiz'>❓ Quiz</option>
              </select>
            </div>
            <div>
              <label className='font-ui text-[0.65rem] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5'>
                XP Reward
              </label>
              <input
                type='number'
                defaultValue={lesson.xpReward}
                className='w-full px-3 py-2.5 rounded-xl border font-ui text-sm bg-cream text-charcoal focus:outline-none focus:border-green-primary'
                style={{ borderColor: 'hsl(var(--border-warm))' }}
              />
            </div>
            <div>
              <label className='font-ui text-[0.65rem] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5'>
                Order
              </label>
              <input
                type='number'
                defaultValue={lesson.order}
                className='w-full px-3 py-2.5 rounded-xl border font-ui text-sm bg-cream text-charcoal focus:outline-none focus:border-green-primary'
                style={{ borderColor: 'hsl(var(--border-warm))' }}
              />
            </div>
          </div>

          {/* Video URL (if video) */}
          {lesson.type === 'video' && (
            <div>
              <label className='font-ui text-[0.65rem] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5'>
                Video URL
              </label>
              <input
                className='w-full px-4 py-3 rounded-xl border font-ui text-sm text-charcoal bg-cream focus:outline-none focus:border-green-primary transition-colors'
                style={{ borderColor: 'hsl(var(--border-warm))' }}
                defaultValue={lesson.videoUrl ?? ''}
                placeholder='https://youtube.com/watch?v=...'
              />
            </div>
          )}

          {/* Content/Markdown */}
          <div>
            <div className='flex items-center justify-between mb-1.5'>
              <label className='font-ui text-[0.65rem] font-bold text-text-tertiary uppercase tracking-wider'>
                Content (Markdown)
              </label>
              <span className='font-ui text-[0.6rem] text-text-tertiary bg-cream-dark px-2 py-0.5 rounded'>
                {locale.toUpperCase()} version
              </span>
            </div>
            <textarea
              rows={14}
              defaultValue={lesson.content[locale as LocaleKey]}
              className='w-full px-4 py-3 rounded-xl border font-mono text-sm text-charcoal bg-cream focus:outline-none focus:border-green-primary transition-colors resize-none leading-relaxed'
              style={{ borderColor: 'hsl(var(--border-warm))' }}
              placeholder='Write markdown content here...'
            />
          </div>

          {/* Challenge section (if challenge or quiz) */}
          {(lesson.type === 'challenge' || lesson.type === 'quiz') && (
            <div
              className='p-4 rounded-2xl border'
              style={{
                background: 'hsl(var(--card-warm))',
                borderColor: 'hsl(var(--border-warm))',
              }}
            >
              <h3 className='font-display text-sm font-bold text-charcoal mb-4'>
                {lesson.type === 'quiz'
                  ? '❓ Quiz Questions'
                  : '💻 Code Challenge'}
              </h3>
              {lesson.type === 'quiz' ? (
                <div className='flex flex-col gap-3'>
                  <input
                    placeholder='Question text...'
                    className='w-full px-3 py-2.5 rounded-xl border font-ui text-sm bg-cream text-charcoal focus:outline-none focus:border-green-primary'
                    style={{ borderColor: 'hsl(var(--border-warm))' }}
                  />
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <div key={opt} className='flex items-center gap-2'>
                      <span
                        className='w-6 h-6 rounded-lg flex items-center justify-center font-ui text-xs font-bold shrink-0'
                        style={{
                          background: 'hsl(var(--green-primary) / 0.1)',
                          color: 'hsl(var(--green-primary))',
                        }}
                      >
                        {opt}
                      </span>
                      <input
                        placeholder={`Option ${opt}...`}
                        className='flex-1 px-3 py-2 rounded-xl border font-ui text-sm bg-cream text-charcoal focus:outline-none focus:border-green-primary'
                        style={{ borderColor: 'hsl(var(--border-warm))' }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col gap-3'>
                  <textarea
                    rows={5}
                    placeholder='// Starter code...'
                    className='w-full px-3 py-2.5 rounded-xl border font-mono text-sm bg-cream text-charcoal focus:outline-none focus:border-green-primary resize-none'
                    style={{ borderColor: 'hsl(var(--border-warm))' }}
                  />
                  <textarea
                    rows={5}
                    placeholder='// Solution code...'
                    className='w-full px-3 py-2.5 rounded-xl border font-mono text-sm bg-cream text-charcoal focus:outline-none focus:border-green-primary resize-none'
                    style={{ borderColor: 'hsl(var(--border-warm))' }}
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyEditorState() {
  return (
    <div className='flex-1 flex flex-col items-center justify-center gap-3 text-center p-12'>
      <div className='text-5xl mb-2'>📝</div>
      <h2 className='font-display text-lg font-bold text-charcoal'>
        Select a lesson to edit
      </h2>
      <p className='font-ui text-sm text-text-tertiary max-w-xs'>
        Choose a lesson from the course tree on the left to start editing its
        content in EN, ES, or PT.
      </p>
    </div>
  )
}

// ─── CMS Main ────────────────────────────────────────────────────────────────

export function AdminCMS() {
  const [selectedLesson, setSelectedLesson] = useState<AdminLesson | null>(null)

  return (
    <>
      {/* Top header bar (full width) */}
      <div
        className='absolute top-0 left-60 right-0 px-6 py-4 border-b z-10 flex items-center justify-between'
        style={{
          borderColor: 'hsl(var(--border-warm))',
          background: 'hsl(var(--card-warm))',
        }}
      >
        <div>
          <h1 className='font-display text-xl font-black text-charcoal'>
            CMS Creator
          </h1>
          <p className='font-ui text-xs text-text-tertiary'>
            Edit lesson content in 3 languages
          </p>
        </div>
      </div>

      {/* Body below header */}
      <div className='mt-[65px] flex flex-1 h-[calc(100%-65px)] overflow-hidden'>
        <CourseTree
          selectedLesson={selectedLesson}
          onSelectLesson={setSelectedLesson}
        />
        {selectedLesson ? (
          <LessonEditor lesson={selectedLesson} />
        ) : (
          <EmptyEditorState />
        )}
      </div>
    </>
  )
}
