'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getCourse, getTotalLessons } from '@/lib/courses-data'
import { Navbar } from '@/components/navbar'
import { useI18n } from '@/lib/i18n/context'

const DIFF_COLORS: Record<string, string> = {
  BEGINNER: 'bg-green-900/50 text-green-400',
  INTERMEDIATE: 'bg-yellow-900/50 text-yellow-400',
  ADVANCED: 'bg-red-900/50 text-red-400',
}
const DIFF_LABELS: Record<string, string> = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
}

export default function CourseDetailPage() {
  const { t } = useI18n()
  const { slug } = useParams<{ slug: string }>()
  const course = getCourse(slug)

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Curso não encontrado.</p>
      </div>
    )
  }

  const totalLessons = getTotalLessons(course)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-900/50 via-blue-900/30 to-gray-950 border-b border-gray-800">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl">{course.icon}</span>
            <div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFF_COLORS[course.difficulty]}`}>
                {DIFF_LABELS[course.difficulty]}
              </span>
              <span className="ml-2 text-sm text-gray-400">{course.category}</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">{course.title}</h1>
          <p className="text-gray-400 max-w-2xl">{course.description}</p>
          <div className="flex items-center gap-6 mt-6 text-sm text-gray-400">
            <span>{course.modules.length} {t('courses.modules')}</span>
            <span>{totalLessons} {t('courses.lessons')}</span>
            <span className="text-purple-400">+500 XP</span>
            {course.tokenGated && <span className="text-yellow-400">🔒 Token-gated</span>}
          </div>
          <div className="mt-6">
            <Link href={`/courses/${slug}/lessons/${course.modules[0]?.lessons[0]?.id}`} className="inline-flex items-center rounded-xl bg-purple-600 hover:bg-purple-500 px-8 py-3 font-semibold transition">
              {t('courses.enroll')} →
            </Link>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="text-2xl font-bold mb-6">Currículo</h2>

        <div className="space-y-4">
          {course.modules.map((mod, mi) => (
            <div key={mod.id} className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
              <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-semibold">
                  <span className="text-purple-400 mr-2">Módulo {mi + 1}</span>
                  {mod.titlePt || mod.title}
                </h3>
                <span className="text-sm text-gray-500">{mod.lessons.length} {t('courses.lessons')}</span>
              </div>
              <ul className="divide-y divide-gray-800">
                {mod.lessons.map((lesson, li) => (
                  <li key={lesson.id}>
                    <Link
                      href={`/courses/${slug}/lessons/${lesson.id}`}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-800/50 transition"
                    >
                      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-900/50 text-purple-400 text-sm font-medium">
                        {lesson.type === 'QUIZ' ? '?' : li + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{lesson.titlePt || lesson.title}</div>
                        <div className="text-xs text-gray-500">
                          {lesson.type === 'QUIZ' ? 'Quiz' : lesson.type === 'VIDEO' ? 'Vídeo' : 'Leitura'}
                        </div>
                      </div>
                      {lesson.xp && <span className="text-xs text-purple-400">+{lesson.xp} XP</span>}
                      <span className="text-gray-600">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Reviews placeholder */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Avaliações</h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center text-gray-500">
            Avaliações serão exibidas após o lançamento.
          </div>
        </div>
      </main>
    </div>
  )
}
