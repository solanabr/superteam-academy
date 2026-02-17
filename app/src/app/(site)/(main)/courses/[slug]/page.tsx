"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Code,
  Play,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { courses } from "@/data/courses";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { AuthModal } from "@/components/shared/AuthModal";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLang();
  const { user, isAuthenticated, enrollCourse } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const slug = params.slug as string;
  const course = courses.find((c) => c.slug === slug || c.id === slug);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {t('courseDetail.notFoundCode')}
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mb-6">
            {t('courseDetail.notFound')}
          </p>
          <Link
            href="/courses"
            className="text-green-600 dark:text-green-400 hover:underline"
          >
            &larr; {t('courseDetail.backToCourses')}
          </Link>
        </div>
      </div>
    );
  }

  const isEnrolled = user?.enrolledCourses.includes(course.id) || false;
  const isCompleted = user?.completedCourses.includes(course.id) || false;
  const completedLessons =
    user?.completedLessons.filter((id) =>
      course.lessons.some((l) => l.id === id)
    ) || [];
  const progress =
    course.lessons.length > 0
      ? Math.round((completedLessons.length / course.lessons.length) * 100)
      : 0;

  const prerequisiteCourses = (course.prerequisites || [])
    .map((preId) => courses.find((c) => c.id === preId))
    .filter(Boolean);

  const handleEnroll = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    enrollCourse(course.id);
    router.push(`/lesson/${course.id}`);
  };

  const handleContinue = () => {
    router.push(`/lesson/${course.id}`);
  };

  const levelColors: Record<string, string> = {
    beginner:
      "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    intermediate:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
    advanced:
      "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors">
      {/* Hero Section */}
      <div className={`relative bg-gradient-to-br ${course.color} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {/* Back Button */}
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            {t("courses.title")}
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl shadow-lg">
              {course.icon}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${levelColors[course.level]}`}
                >
                  {t(`courses.${course.level}`)}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                {course.title}
              </h1>
              <p className="text-white/80 text-lg max-w-2xl">
                {course.description}
              </p>

              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="flex items-center gap-1.5 text-white/90 text-sm">
                  <BookOpen size={16} />
                  <span>
                    {course.lessons.length} {t("courseDetail.lessonsCount")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-white/90 text-sm">
                  <Zap size={16} />
                  <span>{course.xpReward} XP</span>
                </div>
                {course.estimatedDuration && (
                  <div className="flex items-center gap-1.5 text-white/90 text-sm">
                    <Clock size={16} />
                    <span>{course.estimatedDuration}</span>
                  </div>
                )}
                {isCompleted && (
                  <div className="flex items-center gap-1.5 text-white text-sm font-semibold">
                    <Trophy size={16} />
                    <span>{t("courseDetail.completed")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar for enrolled users */}
          {isEnrolled && !isCompleted && (
            <div className="mt-8 bg-white/10 rounded-full h-2 backdrop-blur-sm">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            {course.overview && (
              <section>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen size={20} className="text-green-500" />
                  {t("courseDetail.overview")}
                </h2>
                <p className="text-slate-600 dark:text-gray-300 leading-relaxed">
                  {course.overview}
                </p>
              </section>
            )}

            {/* Learning Objectives */}
            {course.learningObjectives && course.learningObjectives.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target size={20} className="text-yellow-500" />
                  {t("courseDetail.objectives")}
                </h2>
                <ul className="space-y-3">
                  {course.learningObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle
                        size={18}
                        className="text-green-500 mt-0.5 shrink-0"
                      />
                      <span className="text-slate-600 dark:text-gray-300">
                        {obj}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Prerequisites */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Star size={20} className="text-amber-500" />
                {t("courseDetail.prerequisites")}
              </h2>
              {prerequisiteCourses.length > 0 ? (
                <div className="space-y-3">
                  {prerequisiteCourses.map((pre) =>
                    pre ? (
                      <Link
                        key={pre.id}
                        href={`/courses/${pre.slug || pre.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-600 transition-colors"
                      >
                        <span className="text-2xl">{pre.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {pre.title}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-gray-500">
                            {t(`courses.${pre.level}`)}
                          </p>
                        </div>
                        {user?.completedCourses.includes(pre.id) && (
                          <CheckCircle
                            size={18}
                            className="text-green-500"
                          />
                        )}
                      </Link>
                    ) : null
                  )}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-gray-400 text-sm">
                  {t("courseDetail.noPrerequisites")}
                </p>
              )}
            </section>

            {/* Syllabus */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Code size={20} className="text-indigo-500" />
                {t("courseDetail.syllabus")}
              </h2>
              <div className="space-y-3">
                {course.lessons.map((lesson, index) => {
                  const isLessonCompleted =
                    user?.completedLessons.includes(lesson.id) || false;
                  return (
                    <div
                      key={lesson.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                        isLessonCompleted
                          ? "bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20"
                          : "bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800"
                      }`}
                    >
                      {/* Lesson Number */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                          isLessonCompleted
                            ? "bg-green-500 text-white"
                            : "bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400"
                        }`}
                      >
                        {isLessonCompleted ? (
                          <CheckCircle size={18} />
                        ) : (
                          index + 1
                        )}
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {lesson.title}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-gray-500 truncate">
                          {lesson.description}
                        </p>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 font-mono uppercase">
                          {lesson.language}
                        </span>
                        {lesson.estimatedMinutes && (
                          <span className="text-xs text-slate-400 dark:text-gray-500">
                            {lesson.estimatedMinutes}{" "}
                            {t("courseDetail.minutes")}
                          </span>
                        )}
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                          +{lesson.xpReward} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* CTA Card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 shadow-sm">
                {/* Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-gray-400">
                      {t("courseDetail.lessonsCount")}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {course.lessons.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-gray-400">
                      {t("courseDetail.totalXp")}
                    </span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {course.xpReward +
                        course.lessons.reduce((s, l) => s + l.xpReward, 0)}{" "}
                      XP
                    </span>
                  </div>
                  {course.estimatedDuration && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-gray-400">
                        {t("courseDetail.duration")}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {course.estimatedDuration}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-gray-400">
                      {t('courseDetail.level')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${levelColors[course.level]}`}
                    >
                      {t(`courses.${course.level}`)}
                    </span>
                  </div>
                </div>

                {/* Progress (if enrolled) */}
                {isEnrolled && !isCompleted && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-gray-400">
                        {t("lesson.courseProgress")}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-gray-300">
                        {completedLessons.length}/{course.lessons.length}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-gray-800 rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {isCompleted ? (
                  <button
                    onClick={handleContinue}
                    className="w-full py-3 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Trophy size={16} />
                    {t("courseDetail.reviewCourse")}
                  </button>
                ) : isEnrolled ? (
                  <button
                    onClick={handleContinue}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-400 hover:to-yellow-300 text-gray-950 font-semibold text-sm transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                  >
                    <Play size={16} />
                    {t("courseDetail.continueLearning")}
                  </button>
                ) : (
                  <button
                    onClick={handleEnroll}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-yellow-400 hover:from-green-400 hover:to-yellow-300 text-gray-950 font-semibold text-sm transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                  >
                    <Zap size={16} />
                    {isAuthenticated
                      ? t("courseDetail.startLearning")
                      : t("courseDetail.enrollFirst")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
