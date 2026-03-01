'use client';

import { useI18n } from '@/i18n';
import { useCourses } from '@/hooks/useProgram';
import CourseCard from '@/components/course/CourseCard';
import Link from 'next/link';

export default function HomePage() {
  const { t } = useI18n();
  const { courses, loading } = useCourses();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-surface-800">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-transparent to-accent-500/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              <span className="gradient-text">{t('home.hero')}</span>
            </h1>
            <p className="mt-6 text-lg text-surface-200 sm:text-xl">
              {t('home.heroSub')}
            </p>
            <div className="mt-10 flex gap-4">
              <Link href="#courses" className="btn-primary text-base">
                {t('home.browseCourses')}
              </Link>
              <Link href="/leaderboard" className="btn-secondary text-base">
                {t('nav.leaderboard')}
              </Link>
            </div>
          </div>

          {/* Floating stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: courses.length.toString(), label: t('home.stats.courses') },
              { value: courses.reduce((s, c) => s + c.account.totalEnrollments, 0).toString(), label: t('home.stats.learners') },
              { value: `${Math.round(courses.reduce((s, c) => s + c.account.totalCompletions * c.account.xpPerLesson * c.account.lessonCount, 0) / 1000)}K`, label: t('home.stats.xpMinted') },
              { value: courses.reduce((s, c) => s + c.account.totalCompletions, 0).toString(), label: t('home.stats.credentials') },
            ].map((stat, i) => (
              <div key={i} className="glass p-4 text-center">
                <div className="text-2xl font-bold text-surface-50 sm:text-3xl">{stat.value}</div>
                <div className="text-sm text-surface-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Catalog */}
      <section id="courses" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10">
          <h2 className="text-3xl font-bold">{t('courses.title')}</h2>
          <p className="mt-2 text-surface-200">{t('courses.subtitle')}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 w-20 rounded bg-surface-800 mb-4" />
                <div className="h-6 w-3/4 rounded bg-surface-800 mb-2" />
                <div className="h-4 w-1/2 rounded bg-surface-800 mb-4" />
                <div className="h-px bg-surface-800 my-4" />
                <div className="h-4 w-full rounded bg-surface-800" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-800 p-16 text-center">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-lg text-surface-200">No courses available yet</p>
            <p className="text-sm text-surface-200/60 mt-2">Courses will appear here once created on-chain</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.publicKey.toBase58()} course={course} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
