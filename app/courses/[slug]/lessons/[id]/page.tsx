'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { getCourseServiceInstance } from '@/lib/services/course.service'
import { submitLesson } from '@/lib/hooks/useLessonSubmission'
import { useGamification } from '@/lib/hooks/useGamification'
import { Card, Button } from '@/components/ui'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ReactMarkdown from 'react-markdown'
import { useWallet } from '@/lib/hooks/useWallet'
import { SolanaCodeLesson, type SolanaLanguage } from '@/components/editor/SolanaCodeLesson'
import { enrichAnchorLesson, type Lesson } from '@/lib/data/anchor-lessons'
import { useI18n } from '@/lib/hooks/useI18n'

interface Module { id: string; title: string; lessons: Lesson[]; order: number }
interface CourseData { id: string; title: string; slug: string; modules: Module[] }


export default function LessonPage() {
  const { t } = useI18n()
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { walletAddress } = useWallet()
  const [course, setCourse] = useState<CourseData | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { refetch } = useGamification(refreshTrigger)
  const contentRef = useRef<HTMLDivElement>(null)

  const courseSlug = params.slug as string
  const lessonId = params.id as string

  useEffect(() => {
    async function loadCourse() {
      const service = getCourseServiceInstance()
      const courseData = await service.getCourse(courseSlug)
      if (courseData) {
        setCourse(courseData as CourseData)
        for (const module of (courseData as CourseData).modules) {
          const found = module.lessons.find((l: Lesson) => l.id === lessonId)
          if (found) {
            setLesson(enrichAnchorLesson(found, courseSlug))
            break
          }
        }
      }
      setLoading(false)
    }
    loadCourse()
  }, [courseSlug, lessonId])

  // Fetch which lessons are already completed
  useEffect(() => {
    const userId = session?.user?.id || session?.user?.email || walletAddress
    if (!userId || !course) return

    let cancelled = false

    async function fetchCompletedLessons() {
      try {
        const response = await fetch(
          `/api/users/${encodeURIComponent(userId!)}/completed-lessons?courseId=${encodeURIComponent(course!.id)}`,
          { cache: 'no-store' }
        )
        if (!response.ok || cancelled) return
        const ids: string[] = await response.json()
        if (cancelled) return
        const idSet = new Set(ids)
        setCompletedLessonIds(idSet)
        if (idSet.has(lessonId)) {
          setCompleted(true)
          setAlreadyCompleted(true)
        }
      } catch {
        // Non-critical — UI will still work, just won't show checkmarks
      }
    }

    void fetchCompletedLessons()
    return () => { cancelled = true }
  }, [course, session, walletAddress, lessonId])

  /* mark content-type lessons complete */
  const handleMarkComplete = useCallback(async () => {
    const userId = session?.user?.id || session?.user?.email || walletAddress
    if (!userId || !course || !lesson) return
    if (alreadyCompleted) return // Already completed, do nothing
    setSubmitting(true)
    const result = await submitLesson(userId, course.id, lesson.id, lesson.xpReward)
    setSubmitting(false)
    if (result.success) {
      setCompleted(true)
      if ((result as { alreadyCompleted?: boolean }).alreadyCompleted) {
        setAlreadyCompleted(true)
      }
      setCompletedLessonIds((prev) => new Set([...prev, lesson.id]))
      setRefreshTrigger((p) => p + 1)
      if (refetch) refetch(userId)
    }
  }, [session, walletAddress, course, lesson, refetch, alreadyCompleted])

  /* called by SolanaCodeLesson when all tests pass */
  const handleChallengeComplete = useCallback(() => {
    setCompleted(true)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#08080f]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('lesson.loadingLesson')}</p>
        </div>
      </div>
    )
  }

  if (!course || !lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('lesson.notFound')}</h1>
          <Link href="/courses"><Button>{t('lesson.backToCourses')}</Button></Link>
        </Card>
      </div>
    )
  }

  const currentModuleIndex = course.modules.findIndex((m) => m.lessons.some((l) => l.id === lessonId))
  const currentModule = course.modules[currentModuleIndex]
  const lessonIndex = currentModule.lessons.findIndex((l) => l.id === lessonId)
  const prevLesson = lessonIndex > 0 ? currentModule.lessons[lessonIndex - 1] : null
  const nextLesson = lessonIndex < currentModule.lessons.length - 1 ? currentModule.lessons[lessonIndex + 1] : null

  const isChallenge = lesson.type === 'challenge' && !!lesson.challenge
  const editorLang: SolanaLanguage = lesson.challenge?.language || lesson.language || 'rust'

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#08080f]">
      {/* ── Top Nav ─────────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2 bg-white dark:bg-[#0e0e1a] border-b border-gray-200 dark:border-slate-700/50 shadow-sm">
        {/* breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 flex-1 min-w-0">
          <Link href="/courses" className="hover:text-cyan-500 shrink-0">{t('lesson.breadcrumbCourses')}</Link>
          <span>/</span>
          <Link href={`/courses/${courseSlug}`} className="hover:text-cyan-500 truncate max-w-[200px]">{course.title}</Link>
          <span>/</span>
          <span className="text-cyan-500 truncate">{lesson.title}</span>
        </div>

        {/* XP badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400">+{lesson.xpReward} XP</span>
          {isChallenge && (
            <span className="text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded px-2 py-0.5">
              {editorLang === 'typescript' ? '🔷 TS' : '🦀 Rust'} {t('lesson.challenge')}
            </span>
          )}
        </div>

        {/* sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="text-xs text-gray-500 hover:text-gray-300 shrink-0"
          title="Toggle sidebar"
        >
          {sidebarOpen ? '⊣' : '⊢'}
        </button>
      </div>

      {/* ── Body ──────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-60 shrink-0 border-r border-gray-200 dark:border-slate-700/50 bg-white dark:bg-[#0e0e1a] overflow-y-auto hidden lg:flex flex-col">
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {currentModule.title}
              </p>
              <div className="space-y-1">
                {currentModule.lessons.map((l, idx) => (
                  <Link
                    key={l.id}
                    href={`/courses/${courseSlug}/lessons/${l.id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${l.id === lessonId
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800/60'
                      }`}
                  >
                    <span className="text-xs w-5 text-center">
                      {completedLessonIds.has(l.id) ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="opacity-50">{idx + 1}</span>
                      )}
                    </span>
                    <span className="flex-1 truncate">{l.title}</span>
                    {l.type === 'challenge' && <span className="text-[10px] opacity-60">⚡</span>}
                  </Link>
                ))}
              </div>
            </div>

            {/* Module nav */}
            {course.modules.length > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-slate-700/50 mt-auto">
                <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">{t('lesson.modules')}</p>
                {course.modules.map((m, idx) => (
                  <div
                    key={m.id}
                    className={`text-xs py-1 px-2 rounded ${currentModuleIndex === idx ? 'text-cyan-400' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    {idx + 1}. {m.title}
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {isChallenge ? (
            /* ── Split layout: content (top/left) + editor (right) ── */
            <div className="flex flex-col xl:flex-row xl:h-[calc(100vh-48px)] gap-0">
              {/* Content panel */}
              <div ref={contentRef} className="xl:w-2/5 xl:overflow-y-auto xl:border-r border-gray-200 dark:border-slate-700/50">
                <div className="p-6 space-y-6">
                  {/* Lesson header */}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{lesson.title}</h1>
                    {lesson.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{lesson.description}</p>
                    )}
                  </div>

                  {/* Lesson content (theory) */}
                  {lesson.content && (
                    <div className="prose dark:prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({ ...p }) => <h1 className="text-xl font-bold mb-3 text-gray-900 dark:text-white" {...p} />,
                          h2: ({ ...p }) => <h2 className="text-lg font-bold mb-2 mt-5 text-gray-900 dark:text-white" {...p} />,
                          h3: ({ ...p }) => <h3 className="text-base font-bold mb-1 mt-4 text-gray-900 dark:text-white" {...p} />,
                          p: ({ ...p }) => <p className="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed text-sm" {...p} />,
                          ul: ({ ...p }) => <ul className="list-disc list-inside mb-3 text-gray-700 dark:text-gray-300 text-sm" {...p} />,
                          li: ({ ...p }) => <li className="mb-1" {...p} />,
                          code: (props: React.HTMLAttributes<HTMLElement> & { node?: unknown; inline?: boolean }) => {
                            const { node, inline, ...p } = props
                            return inline ? (
                              <code className="bg-gray-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-cyan-600 dark:text-cyan-300" {...p} />
                            ) : (
                              <code className="block bg-[#0a0a0f] text-gray-100 p-3 rounded-lg overflow-x-auto mb-3 font-mono text-xs border border-slate-700/50" {...p} />
                            )
                          },
                          pre: ({ ...p }) => <pre className="mb-3" {...p} />,
                        }}
                      >
                        {lesson.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Challenge prompt */}
                  {lesson.challenge?.prompt && (
                    <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-4">
                      <p className="text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wider">⚡ {t('lesson.yourChallenge')}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{lesson.challenge.prompt}</p>
                    </div>
                  )}

                  {/* Nav buttons */}
                  <div className="flex gap-3 pt-2">
                    {prevLesson ? (
                      <Link href={`/courses/${courseSlug}/lessons/${prevLesson.id}`} className="flex-1">
                        <Button variant="secondary" className="w-full text-sm">← {t('lesson.prev')}</Button>
                      </Link>
                    ) : <div className="flex-1" />}
                    {nextLesson ? (
                      <Link href={`/courses/${courseSlug}/lessons/${nextLesson.id}`} className="flex-1">
                        <Button className="w-full text-sm">{t('lesson.next')} →</Button>
                      </Link>
                    ) : (
                      <Link href={`/courses/${courseSlug}`} className="flex-1">
                        <Button className="w-full text-sm">{t('lesson.backToCourse')}</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Editor panel */}
              <div className="xl:w-3/5 xl:overflow-y-auto flex flex-col">
                <div className="flex-1 p-4">
                  <SolanaCodeLesson
                    prompt={lesson.challenge?.prompt}
                    starterCode={lesson.challenge?.starterCode || ''}
                    solutionCode={lesson.challenge?.solutionCode}
                    language={editorLang}
                    testCases={lesson.challenge?.testCases || []}
                    hints={lesson.challenge?.hints || []}
                    courseId={course.id}
                    lessonId={lesson.id}
                    xpReward={lesson.xpReward}
                    height="calc(100vh - 200px)"
                    showTemplates={true}
                    onComplete={handleChallengeComplete}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ── Content-only lesson ── */
            <div className="max-w-3xl mx-auto px-6 py-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{lesson.title}</h1>
                {lesson.description && (
                  <p className="text-gray-600 dark:text-gray-400">{lesson.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <span>📚 {currentModule.title}</span>
                  <span>⭐ {lesson.xpReward} XP</span>
                  <span>📄 {t('lesson.reading')}</span>
                </div>
              </div>

              {/* Prose content */}
              <Card className="p-8 mb-8">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ ...p }) => <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white" {...p} />,
                      h2: ({ ...p }) => <h2 className="text-2xl font-bold mb-3 mt-6 text-gray-900 dark:text-white" {...p} />,
                      h3: ({ ...p }) => <h3 className="text-xl font-bold mb-2 mt-4 text-gray-900 dark:text-white" {...p} />,
                      p: ({ ...p }) => <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed" {...p} />,
                      ul: ({ ...p }) => <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300" {...p} />,
                      ol: ({ ...p }) => <ol className="list-decimal list-inside mb-4 text-gray-700 dark:text-gray-300" {...p} />,
                      li: ({ ...p }) => <li className="mb-2" {...p} />,
                      code: (props: React.HTMLAttributes<HTMLElement> & { node?: unknown; inline?: boolean }) => {
                        const { node, inline, ...p } = props
                        return inline ? (
                          <code className="bg-gray-200 dark:bg-slate-800 px-2 py-0.5 rounded text-sm font-mono" {...p} />
                        ) : (
                          <code className="block bg-[#0a0a0f] text-gray-100 p-4 rounded-lg overflow-x-auto mb-4 font-mono text-sm border border-slate-700/50" {...p} />
                        )
                      },
                      pre: ({ ...p }) => <pre className="mb-4" {...p} />,
                      blockquote: ({ ...p }) => (
                        <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4" {...p} />
                      ),
                    }}
                  >
                    {lesson.content}
                  </ReactMarkdown>
                </div>
              </Card>

              {/* Mark complete */}
              {!completed ? (
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('lesson.readyToContinue')}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {t('lesson.markCompleteDesc')}
                  </p>
                  <Button onClick={handleMarkComplete} disabled={submitting} className="w-full">
                    {submitting ? t('lesson.saving') : t('lesson.markCompleteEarn').replace('{xp}', String(lesson.xpReward))}
                  </Button>
                </Card>
              ) : alreadyCompleted ? (
                <div className="bg-gray-800/50 border border-gray-600/30 rounded-xl p-6 text-center">
                  <p className="text-2xl mb-2">✅</p>
                  <p className="font-bold text-gray-300">{t('lesson.alreadyCompleted')}</p>
                  <p className="text-sm text-gray-500 mt-1">{t('lesson.alreadyEarned').replace('{xp}', String(lesson.xpReward))}</p>
                </div>
              ) : (
                <div className="bg-green-900/10 border border-green-500/30 rounded-xl p-6 text-center">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="font-bold text-green-400">{t('lesson.lessonComplete')}</p>
                  <p className="text-sm text-gray-400 mt-1">{t('lesson.xpAdded').replace('{xp}', String(lesson.xpReward))}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-4 mt-6">
                {prevLesson ? (
                  <Link href={`/courses/${courseSlug}/lessons/${prevLesson.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full">← {prevLesson.title}</Button>
                  </Link>
                ) : <div className="flex-1" />}
                {nextLesson ? (
                  <Link href={`/courses/${courseSlug}/lessons/${nextLesson.id}`} className="flex-1">
                    <Button className="w-full">{nextLesson.title} →</Button>
                  </Link>
                ) : (
                  <Link href={`/courses/${courseSlug}`} className="flex-1">
                    <Button className="w-full">{t('lesson.backToCourse')}</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
