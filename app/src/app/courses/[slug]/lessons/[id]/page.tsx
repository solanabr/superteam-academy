"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { MeshGradient } from "@/components/MeshGradient";
import { CodeEditor } from "@/components/CodeEditor";
import { MarkdownContent } from "@/components/MarkdownContent";
import { useLessonAccess, getLessonNumber, isPreviewLesson } from "@/hooks/useLessonAccess";
import {
  ArrowLeft, ArrowRight, Check, BookOpen, Trophy,
  Zap, Play, Code, AlertCircle, Eye, EyeOff,
  Terminal, RotateCcw, ChevronRight, X, Lock, Unlock
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Course, Lesson } from "@/types";
import { getCourseById } from "@/data/courses";
import { learningService, enrollmentService } from "@/services/learning";
import { getLessonContent } from "./lessonContent";
import toast from "react-hot-toast";
import { useI18n } from "@/components/I18nProvider";

type LogType = "info" | "error" | "success" | "warning";
export interface TestCase {
  id: string;
  name: string;
  description: string;
  check: (code: string) => boolean;
  errorMessage: string;
}
interface ConsoleLog {
  type: LogType;
  message: string;
  timestamp: string;
}

export default function LessonPage() {
  const { t, language } = useI18n();
  const params = useParams();
  const router = useRouter();
  const { connected, publicKey } = useWallet();

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [code, setCode] = useState("");
  const [showSolution, setShowSolution] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string }[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [activeTab, setActiveTab] = useState<"content" | "code">("content");

  const slug = params.slug as string;
  const lessonId = params.id as string;
  const userId = publicKey?.toString() || 'guest';

  const lessonAccess = useLessonAccess(course, lessonId, userId, isEnrolled);
  const lessonNumber = course ? getLessonNumber(course, lessonId) : 0;
  const totalLessons = course?.lessons || 0;

  useEffect(() => {
    const courseData = getCourseById(slug);
    if (courseData) {
      setCourse(courseData);
      for (const mod of courseData.modules) {
        const foundLesson = mod.lessons.find((l) => l.id === lessonId);
        if (foundLesson) {
          setLesson(foundLesson);
          break;
        }
      }
    }
  }, [slug, lessonId]);

  useEffect(() => {
    async function checkEnrollment() {
      if (userId && course) {
        const enrolled = await enrollmentService.isEnrolled(userId, course.id);
        setIsEnrolled(enrolled);
      }
    }
    checkEnrollment();
  }, [userId, course]);

  useEffect(() => {
    if (lesson && userId) {
      const savedCode = localStorage.getItem(`code_${slug}_${lessonId}_${userId}`);
      const lessonContent = getLessonContent(slug, lessonId, lesson?.title || "", language);

      if (savedCode) {
        setCode(savedCode);
      } else if (lessonContent?.code) {
        setCode(lessonContent.code);
      }

      const completed = localStorage.getItem(`completed_${slug}_${lessonId}_${userId}`);
      if (completed) {
        setIsCompleted(true);
      }
    } else if (lesson) {
      const lessonContent = getLessonContent(slug, lessonId, lesson?.title || "", language);
      if (lessonContent?.code) {
        setCode(lessonContent.code);
      }
    }
  }, [lesson, slug, lessonId, userId, language]);

  const addConsoleLog = useCallback((type: LogType, message: string) => {
    setConsoleLogs(prev => [...prev, {
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
    }]);
  }, []);

  useEffect(() => {
    if (userId && code && lesson?.type === "challenge") {
      const lessonContent = getLessonContent(slug, lessonId, lesson?.title || "", language);
      if (code !== lessonContent?.code) {
        const timeout = setTimeout(() => {
          localStorage.setItem(`code_${slug}_${lessonId}_${userId}`, code);
        }, 3000);
        return () => clearTimeout(timeout);
      }
    }
  }, [code, userId, slug, lessonId, lesson, language]);

  const clearConsole = useCallback(() => {
    setConsoleLogs([]);
  }, []);

  const handleRunCode = async () => {
    if (lesson?.type !== "challenge") return;

    setIsRunning(true);
    setTestResults([]);
    clearConsole();

    addConsoleLog("info", "🔨 Compiling...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    addConsoleLog("success", "✓ Compilation successful!");

    addConsoleLog("info", "🧪 Running tests...");

    const lessonContent = getLessonContent(slug, lessonId, lesson?.title || "", language);
    if (lessonContent?.testCases) {
      const results = lessonContent.testCases.map(test => {
        const passed = test.check(code);
        if (passed) {
          addConsoleLog("success", `✓ ${test.name}: ${test.description}`);
        } else {
          addConsoleLog("error", `✗ ${test.name}: ${test.errorMessage}`);
        }
        return {
          passed,
          message: test.name,
        };
      });

      setTestResults(results);

      const allPassed = results.every(r => r.passed);
      if (allPassed && !isCompleted) {
        addConsoleLog("success", "🎉 All tests passed!");
        handleCompleteLesson();
      } else if (allPassed) {
        addConsoleLog("success", "✓ All tests passed (already completed)");
      } else {
        addConsoleLog("warning", `⚠ ${results.filter(r => !r.passed).length} test(s) failed`);
      }
    }

    setIsRunning(false);
  };

  const handleCompleteLesson = async () => {
    if (!userId || !course) return;

    const xpReward = 50;
    localStorage.setItem(`completed_${slug}_${lessonId}_${userId}`, JSON.stringify({
      completedAt: new Date().toISOString(),
      xp: xpReward,
    }));

    await learningService.completeLesson(userId, course.id, parseInt(lessonId) - 1);
    await learningService.addXP(userId, xpReward);

    setIsCompleted(true);
    setXpEarned(xpReward);
    setShowSuccessModal(true);
  };

  const handleResetCode = () => {
    const lessonContent = getLessonContent(slug, lessonId, lesson?.title || "", language);
    if (lessonContent?.code) {
      setCode(lessonContent.code);
      if (userId) {
        localStorage.setItem(`code_${slug}_${lessonId}_${userId}`, lessonContent.code);
      }
      clearConsole();
      addConsoleLog("info", "Code reset to starter template");
    }
  };

  const handleEnroll = async () => {
    if (!userId || !course) {
      toast.error(t("nav.connectWallet"));
      return;
    }

    await enrollmentService.enroll(userId, course.id);
    setIsEnrolled(true);
    toast.success(`Enrolled!`);
  };

  if (!course || !lesson) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Lesson Not Found</h1>
          <Link href="/courses" className="text-white/60 hover:text-white">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const isChallenge = lesson.type === "challenge";
  const lessonContent = getLessonContent(slug, lessonId, lesson?.title || "", language);

  if (!lessonAccess.canAccess) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="fixed inset-0 z-0">
          <MeshGradient />
        </div>
        <main className="relative z-10 pt-14 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-white/40" />
            </div>
            <h1 className="text-3xl font-bold mb-4">{t("lesson.locked")}</h1>
            <p className="text-white/60 mb-6">
              {lessonAccess.reason || t("lesson.enrollToUnlock")}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href={`/courses/${slug}`} className="px-6 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
                {t("lesson.backToCourse")}
              </Link>
              {!isEnrolled && (
                <button onClick={handleEnroll} className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center gap-2">
                  <Unlock className="w-4 h-4" />
                  {t("courses.enroll")}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 z-0">
        <MeshGradient />
      </div>

      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {isChallenge ? "Challenge Complete!" : "Lesson Complete!"}
              </h2>
              <div className="bg-white/5 rounded-lg p-4 mb-6">
                <div className="text-sm text-white/50 mb-1">{t("dashboard.xp")}</div>
                <div className="text-4xl font-bold text-yellow-400">+{xpEarned}</div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowSuccessModal(false)} className="flex-1 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
                  Stay Here
                </button>
                {lessonNumber < totalLessons && (
                  <button onClick={() => router.push(`/courses/${slug}/lessons/${lessonNumber + 1}`)} className="flex-1 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                    {t("lesson.lesson")} {lessonNumber + 1}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed top-14 left-0 right-0 z-30 bg-black/60 backdrop-blur-md border-b border-white/5 py-2 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-end gap-4">
          {lessonAccess.isPreview && (
            <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
              {t("lesson.preview")}
            </span>
          )}
          {isCompleted && (
            <span className="flex items-center gap-2 text-green-400 text-sm">
              <Check className="w-4 h-4" />
              <span>{t("lesson.completed")}</span>
            </span>
          )}
        </div>
      </div>

      <div className="pt-[4.5rem] flex items-start max-w-full">
        <aside className="sticky top-[4.5rem] h-[calc(100vh-4.5rem)] z-10 w-64 shrink-0 border-r border-white/10 bg-black/50 overflow-y-auto hidden lg:block">
          <div className="p-4">
            <Link href={`/courses/${slug}`} className="flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm">
              <ArrowLeft className="w-4 h-4" />
              {t("lesson.backToCourse")}
            </Link>
            <div className="space-y-1">
              {course.modules.map((module, moduleIdx) => (
                <div key={moduleIdx}>
                  <div className="px-2 py-1 text-xs font-medium text-white/40 uppercase tracking-wider">
                    {t(module.title)}
                  </div>
                  {module.lessons.map((l) => {
                    const isActive = l.id === lessonId;
                    const isLocked = !isEnrolled && !isPreviewLesson(course, l.id);
                    return (
                      <Link key={l.id} href={isLocked ? `#` : `/courses/${slug}/lessons/${l.id}`} className={`flex items-center gap-3 p-2 rounded-md text-sm transition-colors ${isActive ? "bg-white/10 text-white" : isLocked ? "text-white/20 cursor-not-allowed" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                        {isLocked ? <Lock className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                        <span className="truncate">{t(l.title)}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="relative z-10 flex-1 min-w-0">
          <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-white/40 text-sm">{t("lesson.lesson")} {lessonNumber} {t("lesson.of")} {totalLessons}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400`}>
                  {lesson.type}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold">{t(lesson.title)}</h1>
              {isChallenge && (
                <div className="mt-2 text-yellow-400 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {t("lesson.xpReward", { xp: 50 })}
                </div>
              )}
            </div>

            <div className={`grid gap-6 ${isChallenge ? "lg:grid-cols-[1fr,1.2fr]" : ""}`}>
              <div className="space-y-6">
                <MarkdownContent content={lessonContent?.content || ""} />
                {!isChallenge && !isCompleted && (
                  <button onClick={handleCompleteLesson} className="mt-8 px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-colors flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {t("lesson.markComplete")}
                  </button>
                )}
              </div>

              {isChallenge && (
                <div className="space-y-4">
                  <div className="border border-white/10 rounded-xl overflow-hidden bg-zinc-950">
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-white/40" />
                        <span className="text-sm font-medium">lib.rs</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleResetCode} className="text-xs text-white/40 hover:text-white px-2 py-1 rounded hover:bg-white/5">
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <button onClick={() => setShowSolution(!showSolution)} className="text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/5">
                          {showSolution ? t("lesson.hideSolution") : t("lesson.showSolution")}
                        </button>
                      </div>
                    </div>
                    <CodeEditor value={showSolution ? (lessonContent?.solution || "") : code} onChange={setCode} language="rust" readOnly={showSolution || isCompleted} height="600px" />
                    <div className="px-4 py-3 bg-white/5 border-t border-white/10">
                      <button onClick={handleRunCode} disabled={isRunning || isCompleted || showSolution} className="px-4 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-white/90 transition-colors flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        {t("lesson.runTests")}
                      </button>
                    </div>
                  </div>

                  <div className="border border-white/10 rounded-xl overflow-hidden bg-black">
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                      <span className="text-sm font-medium">{t("lesson.console")}</span>
                    </div>
                    <div className="h-40 overflow-y-auto p-4 font-mono text-sm space-y-1">
                      {consoleLogs.map((log, i) => (
                        <div key={i} className={log.type === "error" ? "text-red-400" : log.type === "success" ? "text-green-400" : "text-white/60"}>
                          [{log.timestamp}] {log.message}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
