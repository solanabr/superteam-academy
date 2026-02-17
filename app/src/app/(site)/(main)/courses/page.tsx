"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { courses } from '@/data/courses';
import { BookOpen, Zap, ChevronRight, Lock, CheckCircle, Clock } from 'lucide-react';
import { AuthModal } from '@/components/shared/AuthModal';

export default function CoursesPage() {
  const { t } = useLang();
  const { user, isAuthenticated, enrollCourse } = useAuth();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);

  const handleEnroll = (courseId: string) => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    enrollCourse(courseId);
    router.push(`/lesson/${courseId}`);
  };

  const handleContinue = (courseId: string) => {
    router.push(`/lesson/${courseId}`);
  };

  const levelColors: Record<string, string> = {
    beginner: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20',
    intermediate: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
    advanced: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pt-20 transition-colors">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">{t('courses.title')}</h1>
            <p className="text-slate-500 dark:text-gray-400 text-lg">{t('courses.subtitle')}</p>
          </div>

          {/* Course Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => {
              const isEnrolled = user?.enrolledCourses.includes(course.id);
              const isCompleted = user?.completedCourses.includes(course.id);
              const completedLessons = course.lessons.filter(
                l => user?.completedLessons.includes(l.id)
              ).length;
              const progress = isEnrolled ? (completedLessons / course.lessons.length) * 100 : 0;

              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug || course.id}`}
                  className="group relative rounded-2xl bg-white dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 overflow-hidden hover:border-slate-300 dark:hover:border-gray-700 transition-all shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-2xl dark:hover:shadow-green-500/5 cursor-pointer"
                >
                  {/* Top gradient accent */}
                  <div className={`h-1.5 bg-gradient-to-r ${course.color}`} />

                  <div className="p-6">
                    {/* Icon & Level */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl">{course.icon}</div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${levelColors[course.level]}`}>
                        {t(`courses.${course.level}`)}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-yellow-400 dark:group-hover:from-green-400 dark:group-hover:to-yellow-300 transition-all">
                      {course.title}
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 text-sm mb-5 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mb-5 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-gray-500">
                        <BookOpen size={14} />
                        <span>{course.lessons.length} {t('courses.lessons')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <Zap size={14} />
                        <span>{course.xpReward} XP</span>
                      </div>
                      {course.estimatedDuration && (
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-gray-500">
                          <Clock size={14} />
                          <span>{course.estimatedDuration}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar (if enrolled) */}
                    {isEnrolled && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400 dark:text-gray-500">{completedLessons}/{course.lessons.length} lessons</span>
                          <span className="text-slate-600 dark:text-gray-400">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${course.color}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Status indicator */}
                    <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all">
                      {isCompleted ? (
                        <span className="flex items-center gap-2 text-green-700 dark:text-green-400">
                          <CheckCircle size={16} />
                          {t('courses.completed')}
                        </span>
                      ) : isEnrolled ? (
                        <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          {t('courses.continue')}
                          <ChevronRight size={16} />
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-slate-500 dark:text-gray-400">
                          {!isAuthenticated && <Lock size={14} />}
                          {t('courses.viewDetails') || 'View Details'}
                          <ChevronRight size={16} />
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
