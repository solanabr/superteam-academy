'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getLesson, getCourse, getAllLessonsFlat } from '@/lib/courses-data'
import { Navbar } from '@/components/navbar'
import { CodeEditor } from '@/components/code-editor'
import { useI18n } from '@/lib/i18n/context'
import { useProgress } from '@/lib/hooks/use-progress'
import type { QuizQuestion } from '@/lib/courses-data'

function QuizComponent({ questions }: { questions: QuizQuestion[] }) {
  const { t } = useI18n()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0)
  const pct = Math.round((score / questions.length) * 100)
  const passed = pct >= 70

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => (
        <div key={qi} className="rounded-xl border border-gray-700 p-6 bg-gray-900">
          <p className="font-semibold mb-4 text-white">
            {qi + 1}. {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi
              const isCorrect = submitted && oi === q.answer
              const isWrong = submitted && selected && oi !== q.answer

              return (
                <button
                  key={oi}
                  onClick={() => !submitted && setAnswers(prev => ({ ...prev, [qi]: oi }))}
                  disabled={submitted}
                  className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition ${
                    isCorrect
                      ? 'border-green-500 bg-green-900/30 text-green-300'
                      : isWrong
                      ? 'border-red-500 bg-red-900/30 text-red-300'
                      : selected
                      ? 'border-purple-500 bg-purple-900/30 text-purple-300'
                      : 'border-gray-700 hover:border-purple-500 hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full rounded-xl bg-purple-600 text-white py-3 font-semibold hover:bg-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('quiz.submit')}
        </button>
      ) : (
        <div className={`rounded-xl p-6 text-center ${passed ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'} border`}>
          <div className="text-4xl mb-2">{passed ? '🎉' : '📖'}</div>
          <p className="text-xl font-bold text-white">
            {score}/{questions.length} ({pct}%)
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {passed ? t('quiz.pass') : t('quiz.fail')}
          </p>
          {!passed && (
            <button onClick={() => { setSubmitted(false); setAnswers({}) }} className="mt-3 px-4 py-2 bg-purple-600 rounded-lg text-sm">
              {t('quiz.retry')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  const html = content
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-2 text-white">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-white">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-white">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/`{3}(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-800 text-gray-100 rounded-lg p-4 overflow-x-auto my-4 text-sm border border-gray-700"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-purple-400 px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-purple-500 pl-4 py-1 my-4 text-gray-300 bg-purple-900/20 rounded-r">$1</blockquote>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal text-gray-300">$1</li>')
    .replace(/\n{2,}/g, '<br/><br/>')

  return (
    <div
      className="prose prose-invert max-w-none text-gray-300"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function LessonPage() {
  const { t } = useI18n()
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>()
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const { completeLesson: markComplete, isCompleted: checkCompleted } = useProgress(slug)
  const data = getLesson(slug, lessonId)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (checkCompleted(lessonId)) setCompleted(true)
  }, [lessonId, checkCompleted])

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Lesson not found.</p>
      </div>
    )
  }

  const { course, lesson, module: mod } = data
  const allLessons = getAllLessonsFlat(course)
  const currentIdx = allLessons.findIndex(l => l.id === lessonId)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  // Detect if lesson has code content (challenge type)
  const hasCodeEditor = lesson.content.includes('```rust') || lesson.content.includes('```typescript')
  const codeMatch = lesson.content.match(/```(?:rust|typescript)\n([\s\S]*?)```/)
  const starterCode = codeMatch ? codeMatch[1].trim() : ''

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Breadcrumb */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-3 text-sm text-gray-400 flex items-center gap-2">
          <Link href="/courses" className="hover:text-purple-400">{t('nav.courses')}</Link>
          <span>/</span>
          <Link href={`/courses/${slug}`} className="hover:text-purple-400">{course.title}</Link>
          <span>/</span>
          <span className="text-white">{lesson.titlePt || lesson.title}</span>
          <span className="ml-auto text-xs text-gray-500">
            {currentIdx + 1} / {allLessons.length}
          </span>
        </div>
      </div>

      {/* Split layout: content left, code editor right */}
      <div className={`flex ${hasCodeEditor ? 'flex-row' : 'flex-col'} min-h-[calc(100vh-8rem)]`}>
        {/* Content panel */}
        <div className={`${hasCodeEditor ? 'w-1/2 border-r border-gray-800' : 'max-w-4xl mx-auto w-full'} overflow-y-auto p-6`}>
          <div className="mb-6">
            <div className="text-sm text-purple-400 font-medium mb-1">{mod.titlePt || mod.title}</div>
            <h1 className="text-2xl font-bold">{lesson.titlePt || lesson.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>{lesson.type === 'QUIZ' ? '📝 Quiz' : lesson.type === 'VIDEO' ? '🎬 Video' : '📖 Reading'}</span>
              {/* XP display reserved for future use */}
            </div>
          </div>

          {lesson.type === 'QUIZ' && lesson.quiz ? (
            <QuizComponent questions={lesson.quiz} />
          ) : (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-8">
              <MarkdownContent content={lesson.content} />
            </div>
          )}

          {/* Hints & Solution toggles */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowHint(!showHint)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400 transition-colors"
            >
              💡 {t('lesson.hint')}
            </button>
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400 transition-colors"
            >
              👁️ {t('lesson.solution')}
            </button>
          </div>

          {showHint && (
            <div className="mt-3 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-sm text-yellow-300">
              💡 Revise os conceitos da aula anterior. Pense em como os tipos se relacionam com as structs.
            </div>
          )}
          {showSolution && (
            <div className="mt-3 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-300">
              <pre className="font-mono text-xs overflow-x-auto">{starterCode || '// Solution will be available after attempting the challenge'}</pre>
            </div>
          )}
        </div>

        {/* Code editor panel (only for code lessons) */}
        {hasCodeEditor && (
          <div className="w-1/2 flex flex-col">
            <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 text-sm flex items-center justify-between">
              <span className="text-gray-400">
                {starterCode.includes('fn ') ? 'main.rs' : 'index.ts'}
              </span>
              <span className="text-xs text-gray-500">{t('lesson.challenge')}</span>
            </div>
            <div className="flex-1">
              <CodeEditor
                language={starterCode.includes('fn ') ? 'rust' : 'typescript'}
                defaultValue={starterCode}
                height="100%"
                testCases={[
                  { input: '', expectedOutput: '', description: 'Compiles without errors' },
                  { input: '', expectedOutput: '', description: 'Passes basic validation' },
                ]}
                onComplete={() => setCompleted(true)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {prevLesson ? (
            <Link href={`/courses/${slug}/lessons/${prevLesson.id}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition">
              ← {t('lesson.prev')}
            </Link>
          ) : <div />}

          <button
            onClick={() => { setCompleted(true); markComplete(lessonId) }}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              completed
                ? 'bg-green-600 text-white cursor-default'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {completed ? t('lesson.completed') : t('lesson.complete')}
          </button>

          {nextLesson ? (
            <Link href={`/courses/${slug}/lessons/${nextLesson.id}`} className="flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition">
              {t('lesson.next')} →
            </Link>
          ) : (
            <Link href={`/courses/${slug}`} className="flex items-center gap-2 text-sm font-medium text-green-400 hover:text-green-300 transition">
              ✅ {t('courses.completed')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
