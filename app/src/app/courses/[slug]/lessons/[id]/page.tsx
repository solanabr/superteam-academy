"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Code2,
  Play,
  Zap,
  BookOpen,
  Menu,
  X,
  Keyboard,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CodeEditor } from "@/components/editor/code-editor";
import { MOCK_COURSES, MOCK_MODULES } from "@/lib/mock-data";
import { learningProgressService } from "@/lib/services/learning-progress";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

export default function LessonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.id as string;
  const { publicKey } = useWallet();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const course = MOCK_COURSES.find((c) => c.slug === slug);
  const modules = MOCK_MODULES[slug] ?? [];
  const allLessons = modules.flatMap((m) => m.lessons);
  const lesson = allLessons.find((l) => l.id === lessonId);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const completedCount = 1;
  const progressPercent = Math.floor((completedCount / allLessons.length) * 100);
  const isChallenge = lesson?.type === "challenge";

  const handleComplete = useCallback(async () => {
    if (!lesson) return;
    setCompleting(true);
    try {
      const userId = publicKey?.toBase58() ?? "demo";
      await learningProgressService.completeLesson(userId, course!.id, lesson.index);
      setCompleted(true);
      toast.success(`+${lesson.xpReward} XP earned! 🎉`, {
        description: `"${lesson.title}" completed. Keep going!`,
      });
    } catch {
      toast.error("Failed to save progress. Try again.");
    } finally {
      setCompleting(false);
    }
  }, [lesson, publicKey, course]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        setShowShortcuts((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!course || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Lesson not found</h1>
          <Button asChild variant="glass" className="mt-4">
            <Link href={`/courses/${slug}`}>Back to Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* ─── Sidebar ─── */}
      <AnimatePresence>
        {(sidebarOpen || true) && (
          <motion.div
            initial={false}
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-64 bg-[#0d0d14] border-r border-white/[0.07] flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {/* Sidebar header */}
            <div className="p-4 border-b border-white/[0.07]">
              <Link
                href={`/courses/${slug}`}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors group"
              >
                <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span className="truncate font-medium">{course.title}</span>
              </Link>

              {/* Progress */}
              <div className="lesson-progress-track mb-1.5">
                <motion.div
                  className="lesson-progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                <span className="text-foreground font-semibold">{completedCount}</span>/{allLessons.length} completed
              </p>
            </div>

            {/* Lesson list */}
            <div className="flex-1 overflow-y-auto py-2 scrollbar-none">
              {modules.map((module) => (
                <div key={module.id}>
                  <p className="px-4 py-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.12em]">
                    {module.title}
                  </p>
                  {module.lessons.map((l) => {
                    const isActive = l.id === lessonId;
                    const isDone = l.index < lesson.index;
                    return (
                      <Link
                        key={l.id}
                        href={`/courses/${slug}/lessons/${l.id}`}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2.5 mx-1.5 rounded-lg text-xs transition-all duration-150",
                          isActive
                            ? "bg-[#9945FF]/12 text-[#9945FF] border border-[#9945FF]/20"
                            : isDone
                            ? "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                            : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/[0.04]"
                        )}
                      >
                        <div className="shrink-0 w-4 h-4 flex items-center justify-center">
                          {isDone ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#14F195]" />
                          ) : isActive ? (
                            <div className="w-2 h-2 rounded-full bg-[#9945FF] shadow-[0_0_6px_#9945FF]" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 opacity-25" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("truncate font-medium leading-tight", isActive && "text-[#9945FF]")}>{l.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 opacity-60">
                            {l.type === "challenge" ? (
                              <Code2 className="h-2.5 w-2.5 text-[#9945FF]" />
                            ) : (
                              <Play className="h-2.5 w-2.5 text-[#14F195]" />
                            )}
                            <span className="text-[10px]">{l.duration}m</span>
                            <span className="text-[10px] text-[#14F195]">+{l.xpReward}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Shortcuts hint */}
            <div className="p-3 border-t border-white/[0.07]">
              <button
                onClick={() => setShowShortcuts((v) => !v)}
                className="w-full flex items-center gap-2 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <Keyboard className="h-3 w-3" />
                Keyboard shortcuts
                <span className="kbd ml-auto">?</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Main area ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-white/[0.07] bg-[#0d0d14]/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-7 w-7"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-2">
              {isChallenge ? (
                <Code2 className="h-3.5 w-3.5 text-[#9945FF]" />
              ) : (
                <BookOpen className="h-3.5 w-3.5 text-[#14F195]" />
              )}
              <span className="font-semibold text-sm truncate max-w-[200px] sm:max-w-none">{lesson.title}</span>
              <Badge
                className={cn(
                  "text-[10px] h-4 px-1.5 hidden sm:inline-flex",
                  isChallenge
                    ? "bg-[#9945FF]/15 text-[#9945FF] border-[#9945FF]/25"
                    : "bg-[#14F195]/15 text-[#14F195] border-[#14F195]/25"
                )}
              >
                {lesson.type}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-[#14F195]" />
              <span className="text-sm font-bold text-[#14F195]">+{lesson.xpReward} XP</span>
            </div>
            <div className="w-px h-4 bg-white/10 hidden sm:block" />
            {prevLesson && (
              <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0" title="Previous lesson">
                <Link href={`/courses/${slug}/lessons/${prevLesson.id}`}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
            {nextLesson && (
              <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0" title="Next lesson">
                <Link href={`/courses/${slug}/lessons/${nextLesson.id}`}>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Content area */}
        {isChallenge && lesson.challenge ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Challenge panel */}
            <div className="w-full lg:w-[42%] xl:w-2/5 flex flex-col border-r border-white/[0.07] overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-[#9945FF]/15 text-[#9945FF] border-[#9945FF]/25 text-[10px]">
                    Challenge
                  </Badge>
                  <span className="text-xs text-muted-foreground">{lesson.duration}min</span>
                </div>
                <h1 className="text-lg font-bold mb-3 leading-snug">{lesson.title}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {lesson.challenge.prompt}
                </p>

                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Test Cases
                </h3>
                <div className="space-y-2">
                  {lesson.challenge.testCases
                    .filter((tc) => !tc.isHidden)
                    .map((tc, i) => (
                      <div
                        key={tc.id}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-4 h-4 rounded-full border border-white/15 flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                            {i + 1}
                          </div>
                          <p className="font-medium text-foreground/80">{tc.description}</p>
                        </div>
                        <p className="text-muted-foreground pl-6">
                          Expected:{" "}
                          <code className="text-[#14F195] font-mono">{tc.expectedOutput}</code>
                        </p>
                      </div>
                    ))}
                </div>

                {/* Resources hint */}
                <div className="mt-5 p-3 rounded-xl bg-[#9945FF]/[0.06] border border-[#9945FF]/15">
                  <p className="text-xs text-muted-foreground">
                    💡 <strong className="text-foreground">Hint:</strong> Check the{" "}
                    <a
                      href="https://docs.rs/anchor-lang"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9945FF] hover:underline"
                    >
                      Anchor docs
                    </a>{" "}
                    for PDA derivation patterns.
                  </p>
                </div>
              </div>

              {/* Complete button */}
              <div className="p-4 border-t border-white/[0.07] shrink-0">
                <AnimatePresence mode="wait">
                  {completed ? (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-between bg-[#14F195]/10 border border-[#14F195]/25 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-2 text-[#14F195]">
                        <Award className="h-4 w-4" />
                        <span className="text-sm font-semibold">Completed!</span>
                      </div>
                      {nextLesson && (
                        <Button asChild variant="gradient" size="sm" className="h-7 text-xs">
                          <Link href={`/courses/${slug}/lessons/${nextLesson.id}`}>
                            Next <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="action" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Button
                        variant="gradient"
                        className="w-full"
                        onClick={handleComplete}
                        disabled={completing}
                        size="sm"
                      >
                        {completing ? (
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving…
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark Complete (+{lesson.xpReward} XP)
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Code editor */}
            <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
              <CodeEditor challenge={lesson.challenge} onComplete={handleComplete} />
            </div>
          </div>
        ) : (
          /* Reading lesson */
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-[#14F195]/15 text-[#14F195] border-[#14F195]/25 text-[10px]">
                  Lesson
                </Badge>
                <span className="text-xs text-muted-foreground">{lesson.duration} min read</span>
                <span className="text-xs text-[#14F195] ml-auto font-semibold">+{lesson.xpReward} XP</span>
              </div>

              <h1 className="text-2xl font-bold mb-5 leading-tight">{lesson.title}</h1>

              <div className="prose max-w-none">
                <p className="text-muted-foreground text-base leading-relaxed mb-6">
                  This lesson covers the foundational concepts of{" "}
                  <strong className="text-foreground">{lesson.title}</strong>.
                  Follow along with the interactive examples below.
                </p>

                {/* Key concepts card */}
                <div className="bento-card p-5 mb-6">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#9945FF] to-[#14F195]" />
                    Key Concepts
                  </h3>
                  <ul className="space-y-2">
                    {[
                      "Understanding the core primitives",
                      "Practical implementation patterns",
                      "Security considerations",
                      "Testing strategies",
                    ].map((point) => (
                      <li key={point} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#14F195] shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Code sample */}
                <div className="terminal-card mb-6">
                  <div className="terminal-header">
                    <div className="terminal-dot bg-red-500" />
                    <div className="terminal-dot bg-yellow-500" />
                    <div className="terminal-dot bg-green-500" />
                    <span className="ml-2 text-xs text-white/40">example.rs</span>
                  </div>
                  <pre className="p-5 text-sm font-mono text-[#14F195] overflow-x-auto leading-relaxed">
{`use anchor_lang::prelude::*;

#[program]
pub mod academy {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, Solana Academy!");
        Ok(())
    }
}`}
                  </pre>
                </div>

                <p className="text-muted-foreground text-base leading-relaxed">
                  In production Solana programs, you&apos;ll build on these concepts to create complex state machines,
                  CPIs, and protocol logic. The Anchor framework abstracts much of the boilerplate so you can focus
                  on business logic.
                </p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/[0.07]">
                {prevLesson ? (
                  <Button asChild variant="glass" size="sm">
                    <Link href={`/courses/${slug}/lessons/${prevLesson.id}`}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Prev</span>
                    </Link>
                  </Button>
                ) : <div />}

                {completed ? (
                  nextLesson ? (
                    <Button asChild variant="gradient" size="sm">
                      <Link href={`/courses/${slug}/lessons/${nextLesson.id}`}>
                        Next Lesson <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="gradient" size="sm" disabled>🎉 Course Complete!</Button>
                  )
                ) : (
                  <Button variant="gradient" size="sm" onClick={handleComplete} disabled={completing}>
                    {completing ? "Saving…" : `Complete (+${lesson.xpReward} XP)`}
                    <Zap className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bento-card p-6 w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-[#9945FF]" />
                Keyboard Shortcuts
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  { key: "?", desc: "Toggle shortcuts" },
                  { key: "Esc", desc: "Close this panel" },
                ].map((s) => (
                  <div key={s.key} className="flex items-center justify-between text-muted-foreground">
                    <span>{s.desc}</span>
                    <span className="kbd">{s.key}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="glass"
                size="sm"
                className="w-full mt-5"
                onClick={() => setShowShortcuts(false)}
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
