'use client'

import Link from 'next/link'
import { useState } from 'react'
import { COURSES, getTotalLessons } from '@/lib/courses-data'
import { Navbar } from '@/components/navbar'
import { useI18n } from '@/lib/i18n/context'

const DIFFICULTIES: Record<string, { label: string; color: string }> = {
  BEGINNER: { label: 'Iniciante', color: 'bg-green-900/50 text-green-400' },
  INTERMEDIATE: { label: 'Intermediário', color: 'bg-yellow-900/50 text-yellow-400' },
  ADVANCED: { label: 'Avançado', color: 'bg-red-900/50 text-red-400' },
}

export default function CoursesPage() {
  const { t } = useI18n()
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = COURSES.filter(c => {
    if (filter !== 'all' && c.difficulty !== filter) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.titleEn.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">{t('courses.title')}</h1>
        <p className="text-gray-400 mb-8">Explore nosso catálogo de cursos sobre Solana e Web3.</p>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <input
            type="text"
            placeholder={t('courses.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm w-64 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            {[
              { key: 'all', label: t('courses.filter_all') },
              { key: 'BEGINNER', label: t('courses.filter_beginner') },
              { key: 'INTERMEDIATE', label: t('courses.filter_intermediate') },
              { key: 'ADVANCED', label: t('courses.filter_advanced') },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  filter === f.key ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(course => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="group rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-purple-500/50 transition"
            >
              <div className="text-4xl mb-4">{course.icon}</div>
              <h3 className="font-semibold text-lg group-hover:text-purple-400 transition">{course.title}</h3>
              <p className="text-sm text-gray-400 mt-2 line-clamp-2">{course.description}</p>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTIES[course.difficulty].color}`}>
                  {DIFFICULTIES[course.difficulty].label}
                </span>
                <span className="text-xs text-gray-500">{course.modules.length} {t('courses.modules')}</span>
                <span className="text-xs text-gray-500">{getTotalLessons(course)} {t('courses.lessons')}</span>
                {course.tokenGated && <span className="text-xs text-yellow-400">🔒 Token-gated</span>}
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            Nenhum curso encontrado. Tente alterar os filtros.
          </div>
        )}
      </main>
    </div>
  )
}
