'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Plus, BookOpen, BarChart2, Clock, Users, Pencil, Eye, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { localePath } from '@/lib/paths';

const L = (obj: Record<string, string>, locale: string) => obj[locale] ?? obj['pt-BR'];

// Demo courses the "creator" has authored — in production these come from Sanity
const MY_COURSES = [
  {
    slug: 'solana-101-custom',
    title: { 'pt-BR': 'Meu Curso: Solana 101', en: 'My Course: Solana 101', es: 'Mi Curso: Solana 101' },
    status: 'published' as const,
    lessons: 8,
    students: 42,
    xp: 1000,
    updatedAt: '2026-02-20',
    color: 'from-purple-600 to-indigo-600',
  },
  {
    slug: 'anchor-deep-dive',
    title: { 'pt-BR': 'Anchor Deep Dive', en: 'Anchor Deep Dive', es: 'Anchor Deep Dive' },
    status: 'draft' as const,
    lessons: 3,
    students: 0,
    xp: 1500,
    updatedAt: '2026-02-24',
    color: 'from-green-600 to-teal-600',
  },
];

const STATUS_STYLES = {
  published: 'bg-green-900/60 text-green-300 border-green-700/50',
  draft: 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50',
};

export default function TeachDashboard() {
  const locale = useLocale();
  const t = useTranslations('teach');

  const totalStudents = MY_COURSES.reduce((a, c) => a + c.students, 0);
  const publishedCount = MY_COURSES.filter((c) => c.status === 'published').length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 py-10 px-4">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">{t('title')}</h1>
            <p className="text-gray-400 mt-1">{t('subtitle')}</p>
          </div>
          <Link
            href={localePath(locale, '/teach/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('new_course')}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BookOpen, label: t('stat_courses'), value: MY_COURSES.length },
            { icon: Eye, label: t('stat_published'), value: publishedCount },
            { icon: Users, label: t('stat_students'), value: totalStudents },
            { icon: BarChart2, label: t('stat_total_xp'), value: MY_COURSES.reduce((a, c) => a + c.xp, 0).toLocaleString() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Icon className="h-4 w-4" />
                <span className="text-xs">{label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Course list */}
        <h2 className="text-lg font-semibold text-white mb-4">{t('my_courses')}</h2>

        {MY_COURSES.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
            <BookOpen className="mx-auto h-10 w-10 text-gray-700 mb-3" />
            <p className="text-gray-400">{t('no_courses')}</p>
            <Link
              href={localePath(locale, '/teach/new')}
              className="mt-4 inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
            >
              <Plus className="h-4 w-4" /> {t('create_first')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {MY_COURSES.map((course) => (
              <div
                key={course.slug}
                className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4 hover:border-gray-700 transition-colors"
              >
                {/* Color bar */}
                <div className={cn('h-2 sm:h-14 sm:w-2 w-full rounded-full bg-gradient-to-br flex-shrink-0', course.color)} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {L(course.title, locale)}
                    </h3>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium border', STATUS_STYLES[course.status])}>
                      {t(`status_${course.status}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.lessons} {t('lessons')}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.students}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.updatedAt}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    title={t('edit')}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    title={t('preview')}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-lg p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                    title={t('delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick tips */}
        <div className="mt-10 rounded-xl border border-gray-800 bg-gray-900/30 p-6">
          <h3 className="text-sm font-semibold text-white mb-3">{t('tips_title')}</h3>
          <ul className="space-y-2 text-xs text-gray-400">
            <li>{t('tip_1')}</li>
            <li>{t('tip_2')}</li>
            <li>{t('tip_3')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
