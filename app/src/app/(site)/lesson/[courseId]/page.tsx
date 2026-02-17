"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useServices } from "@/contexts/ServiceContext";
import { courses } from "@/data/courses";
import { CodeEditor } from "@/components/shared/CodeEditor";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Zap,
  CheckCircle,
  Trophy,
} from "lucide-react";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { t } = useLang();
  const {
    user,
    completeLesson,
    addXP,
    completeCourse,
    addAchievement,
    recordStreak,
    isAuthenticated,
  } = useAuth();
  const { lessonCompletionService } = useServices();

  const course = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courseId]
  );
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const codeRef = useRef<string>("");

  const handleCodeChange = useCallback((code: string) => {
    codeRef.current = code;
  }, []);

  const handlePass = useCallback(async () => {
    if (!course || !user) return;
    const lesson = course.lessons[currentLessonIndex];
    if (!lesson) return;

    if (!user.completedLessons.includes(lesson.id)) {
      // Call service layer
      await lessonCompletionService.completeLesson({
        userId: user.id,
        courseId: course.id,
        lessonId: lesson.id,
        walletAddress: user.walletAddress,
        codeSubmission: codeRef.current,
        timestamp: Date.now(),
      });

      // Update client state
      completeLesson(lesson.id);
      addXP(lesson.xpReward);
      recordStreak();

      const newCompletedCount = user.completedLessons.length + 1;
      if (newCompletedCount === 1) addAchievement("first_lesson");
      if (newCompletedCount >= 5) addAchievement("five_lessons");

      const allLessonsCompleted = course.lessons.every(
        (l) => l.id === lesson.id || user.completedLessons.includes(l.id)
      );

      if (allLessonsCompleted && !user.completedCourses.includes(course.id)) {
        completeCourse(course.id);
        addAchievement("first_course");
        addAchievement("nft_minter");
        addXP(course.xpReward);
        setShowComplete(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLessonIndex, user, course]);

  if (!course || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <p className="text-slate-500 dark:text-gray-400 mb-4">
            {!course
              ? t('lesson.courseNotFound')
              : t('lesson.connectRequired')}
          </p>
          <button
            onClick={() => router.push("/courses")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-yellow-400 text-gray-950 font-semibold"
          >
            {t('lesson.browseCourses')}
          </button>
        </div>
      </div>
    );
  }

  const lesson = course.lessons[currentLessonIndex];
  const isLessonCompleted = user.completedLessons.includes(lesson.id);
  const isCourseCompleted = user.completedCourses.includes(course.id);

  // Calculate progress
  const completedInCourse = course.lessons.filter((l) =>
    user.completedLessons.includes(l.id)
  ).length;
  const progressPercent =
    course.lessons.length > 0
      ? Math.round((completedInCourse / course.lessons.length) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors">
      {/* Course Completion Modal */}
      {showComplete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl p-8 w-full max-w-md text-center shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {t("lesson.complete")}
            </h2>
            <p className="text-slate-500 dark:text-gray-400 mb-2">
              {course.title}
            </p>
            <div className="my-6 p-4 rounded-xl bg-gradient-to-br from-green-50 to-yellow-50 dark:from-green-900/40 dark:to-yellow-900/40 border border-green-200 dark:border-green-500/30">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-yellow-400 flex items-center justify-center text-3xl shadow-lg">
                  {course.icon}
                </div>
              </div>
              <p className="text-green-700 dark:text-green-300 font-semibold text-sm">
                {t("lesson.certMinted")}
              </p>
              <p className="text-slate-400 dark:text-gray-500 text-xs mt-1 font-mono">
                {t('lesson.mintedViaBubblegum')}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 mb-6 text-amber-600 dark:text-amber-400">
              <Zap size={16} />
              <span className="font-bold">+{course.xpReward} XP</span>
            </div>
            <button
              onClick={() => {
                setShowComplete(false);
                router.push("/dashboard");
              }}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-yellow-400 text-gray-950 font-semibold hover:from-green-400 hover:to-yellow-300 transition-all"
            >
              {t('lesson.viewDashboard')}
            </button>
          </div>
        </div>
      )}

      {/* Top Bar with Progress */}
      <div className="border-b border-slate-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push(`/courses/${course.slug || course.id}`)}
            className="flex items-center gap-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            {t("general.back")}
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 dark:text-gray-500">
              {course.icon}
            </span>
            <span className="text-slate-900 dark:text-white font-medium">
              {course.title}
            </span>
            <span className="text-xs text-slate-400 dark:text-gray-500 ml-2">
              {completedInCourse}/{course.lessons.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {course.lessons.map((l, i) => {
              const completed = user.completedLessons.includes(l.id);
              const isCurrent = i === currentLessonIndex;
              return (
                <button
                  key={l.id}
                  onClick={() => setCurrentLessonIndex(i)}
                  title={l.title}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    isCurrent
                      ? "bg-green-600 text-white shadow-lg shadow-green-500/30"
                      : completed
                        ? "bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30"
                        : "bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-500 hover:bg-slate-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {completed && !isCurrent ? (
                    <CheckCircle size={14} className="mx-auto" />
                  ) : (
                    i + 1
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-yellow-400 transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4.25rem)]">
        {/* Instructions Panel */}
        <div className="lg:w-[440px] border-r border-slate-200 dark:border-gray-800 overflow-y-auto bg-white dark:bg-gray-950 transition-colors">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">
                Lesson {currentLessonIndex + 1}/{course.lessons.length}
              </span>
              {isLessonCompleted && (
                <CheckCircle
                  size={14}
                  className="text-green-600 dark:text-green-400"
                />
              )}
              {isCourseCompleted && (
                <Trophy
                  size={14}
                  className="text-amber-600 dark:text-amber-400"
                />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {lesson.title}
            </h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">
              {lesson.description}
            </p>

            <div className="flex items-center gap-2 mb-6">
              <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 text-xs flex items-center gap-1">
                <BookOpen size={12} />
                {lesson.language === "rust"
                  ? "Rust"
                  : lesson.language === "typescript"
                    ? "TypeScript"
                    : "JSON"}
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-1">
                <Zap size={12} />
                {lesson.xpReward} XP
              </div>
              {lesson.estimatedMinutes && (
                <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 text-xs">
                  ~{lesson.estimatedMinutes} min
                </div>
              )}
            </div>

            {/* Markdown Instructions */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen
                  size={14}
                  className="text-green-600 dark:text-green-400"
                />
                <h4 className="text-green-700 dark:text-green-400 font-semibold text-sm">
                  {t("lesson.instructions")}
                </h4>
              </div>
              <div className="prose prose-sm prose-slate dark:prose-invert max-w-none [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:dark:bg-gray-800 [&_code]:text-green-600 [&_code]:dark:text-green-400 [&_code]:text-xs [&_code]:font-mono [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-600 [&_p]:dark:text-gray-300 [&_strong]:text-slate-900 [&_strong]:dark:text-white [&_li]:text-sm [&_li]:text-slate-600 [&_li]:dark:text-gray-300">
                <ReactMarkdown>{lesson.instructions}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="sticky bottom-0 p-4 bg-white dark:bg-gray-950 border-t border-slate-200 dark:border-gray-800 transition-colors">
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setCurrentLessonIndex(Math.max(0, currentLessonIndex - 1))
                }
                disabled={currentLessonIndex === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 text-sm font-medium disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-gray-700 transition-all"
              >
                <ArrowLeft size={14} />
                {t("lesson.prev")}
              </button>
              <button
                onClick={() =>
                  setCurrentLessonIndex(
                    Math.min(course.lessons.length - 1, currentLessonIndex + 1)
                  )
                }
                disabled={currentLessonIndex === course.lessons.length - 1}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-30 hover:bg-green-500 transition-all"
              >
                {t("lesson.next")}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Code Editor Panel */}
        <div className="flex-1 min-h-[400px] lg:min-h-0">
          <CodeEditor
            key={lesson.id}
            language={lesson.language}
            starterCode={lesson.starterCode}
            testKeyword={lesson.testKeyword}
            onPass={handlePass}
            onCodeChange={handleCodeChange}
          />
        </div>
      </div>
    </div>
  );
}
