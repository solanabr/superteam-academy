'use client'

import { CourseCatalog } from '@/components/courses'
import { useI18n } from '@/lib/hooks/useI18n'
import { getCourseService } from '@/lib/services'
import { useState, useEffect } from 'react'
import { Course } from '@/lib/types'

export default function CoursesPage() {
  const { t } = useI18n()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCourses() {
      const service = getCourseService()
      const data = await service.getCourses()
      setCourses(data)
      setLoading(false)
    }
    fetchCourses()
  }, [])

  return (
    <main className="min-h-screen py-12 bg-gray-50 dark:bg-inherit">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-display font-bold text-blue-600 dark:text-neon-cyan mb-2">
            {t('courses.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Learn Solana development with interactive courses, challenges, and credentials
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        ) : (
          <CourseCatalog courses={courses} />
        )}
      </div>
    </main>
  )
}
