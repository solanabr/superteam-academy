"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Play,
  FileText,
  Code2,
  Lightbulb,
  Eye,
  EyeOff,
  Zap,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CodeEditor } from "./code-editor";
import type { Course, Lesson } from "@/lib/course-catalog";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import { ACADEMY_CLUSTER } from "@/lib/generated/academy-program";
import { useOptimisticMutation } from "@/lib/hooks/use-optimistic-mutation";

const lessonIcons = {
  video: Play,
  reading: FileText,
  challenge: Code2,
};

interface LessonViewProps {
  course: Course;
  lesson: Lesson;
  moduleIndex: number;
  lessonIndex: number;
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
  enrolledOnChain?: boolean;
}

export function LessonView({
  course,
  lesson,
  prevLesson,
  nextLesson,
  enrolledOnChain = false,
}: LessonViewProps) {
  const { loginWithWallet } = useWalletAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const allLessons = course.modules.flatMap((m) => m.lessons);
  const baseCompleted = allLessons.filter((l) => l.completed).length;
  const isChallenge = lesson.type === "challenge";
  const xpAmount = isChallenge ? 120 : 50;

  const completeToastId = "complete-toast";
  const {
    state: lessonCompleted,
    mutate: markComplete,
    isPending: isCompleting,
  } = useOptimisticMutation<boolean, { completeTxSignature?: string }>({
    initialState: lesson.completed,
    onMutate: () => true,
    mutationFn: async () => {
      if (!enrolledOnChain)
        throw new Error("You must enroll on-chain before completing lessons.");
      toast.loading("Recording progress...", { id: completeToastId });

      const response = await fetch("/api/academy/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug: course.slug, lessonId: lesson.id }),
      });
      if (response.status === 401) {
        setNeedsSignIn(true);
        throw new Error("Sign in once to record your progress.");
      }
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        completeTxSignature?: string;
        finalizeTxSignature?: string | null;
      } | null;
      if (!response.ok) {
        throw new Error(
          payload?.error ?? "Failed to complete lesson on-chain.",
        );
      }
      return { completeTxSignature: payload?.completeTxSignature };
    },
    onSuccess: (result) => {
      const nextPath = nextLesson
        ? `/courses/${course.slug}/lessons/${nextLesson.id}`
        : `/courses/${course.slug}`;
      const nextLabel = nextLesson ? "Next Lesson" : "Back to Course";

      if (result.completeTxSignature) {
        const explorerUrl = `https://explorer.solana.com/tx/${result.completeTxSignature}${ACADEMY_CLUSTER === "devnet" ? "?cluster=devnet" : ""}`;
        toast.success(`Lesson completed! +${xpAmount} XP`, {
          id: completeToastId,
          action: {
            label: "View on Explorer",
            onClick: () => window.open(explorerUrl, "_blank"),
          },
        });
      } else {
        toast.success(`Lesson completed! +${xpAmount} XP`, {
          id: completeToastId,
          action: { label: nextLabel, onClick: () => router.push(nextPath) },
        });
      }

      setTimeout(() => router.push(nextPath), 1500);
    },
    onError: (error) => {
      if (needsSignIn) {
        toast.error(error.message, { id: completeToastId });
      } else {
        toast.error(error.message || "Failed to record progress.", {
          id: completeToastId,
          action: { label: "Retry", onClick: () => markComplete() },
        });
      }
    },
  });

  const optimisticCompleted =
    lessonCompleted && !lesson.completed ? baseCompleted + 1 : baseCompleted;
  const progressPct = Math.round(
    (optimisticCompleted / allLessons.length) * 100,
  );

  function isLessonCompleted(l: Lesson) {
    if (l.id === lesson.id) return lessonCompleted;
    return l.completed;
  }

  const bottomBar = (
    <div className="shrink-0 flex items-center justify-between gap-4 border-t border-border bg-card px-4 py-3">
      {prevLesson ? (
        <Link href={`/courses/${course.slug}/lessons/${prevLesson.id}`}>
          <Button
            variant="outline"
            className="gap-2 border-border text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
        </Link>
      ) : (
        <div />
      )}
      {lessonCompleted ? (
        <Badge
          variant="outline"
          className="border-primary text-primary gap-1.5 py-1.5 px-3"
        >
          <CheckCircle2 className="h-4 w-4" />
          Completed
        </Badge>
      ) : (
        <Button
          onClick={() => markComplete()}
          disabled={isCompleting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isCompleting ? "Submitting..." : "Mark Complete"}
        </Button>
      )}
      {nextLesson ? (
        <Link href={`/courses/${course.slug}/lessons/${nextLesson.id}`}>
          <Button
            variant="outline"
            className="gap-2 border-border text-muted-foreground"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );

  const signInBar =
    needsSignIn && !lessonCompleted ? (
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 pb-3">
        <p className="text-sm text-destructive">
          Sign in once to record your progress.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
          onClick={() =>
            void loginWithWallet().then(() => setNeedsSignIn(false))
          }
        >
          Sign in
        </Button>
      </div>
    ) : null;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
          <Link
            href={`/courses/${course.slug}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{course.title}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Progress
              value={progressPct}
              className="h-1.5 w-24 bg-secondary [&>div]:bg-primary"
            />
            <span className="text-xs text-muted-foreground">
              {progressPct}%
            </span>
          </div>
          <Separator orientation="vertical" className="h-5 mx-1" />
          <div className="flex items-center gap-1">
            {prevLesson ? (
              <Link href={`/courses/${course.slug}/lessons/${prevLesson.id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                disabled
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {nextLesson ? (
              <Link href={`/courses/${course.slug}/lessons/${nextLesson.id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                disabled
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Module overview */}
        <aside
          className={`${
            sidebarOpen ? "flex" : "hidden"
          } lg:flex w-72 shrink-0 flex-col border-r border-border bg-card overflow-y-auto`}
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Course Modules
            </h3>
            <div className="space-y-4">
              {course.modules.map((mod, mi) => (
                <div key={mod.title}>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    Module {mi + 1}: {mod.title}
                  </p>
                  <div className="space-y-0.5">
                    {mod.lessons.map((l) => {
                      const Icon = lessonIcons[l.type];
                      const isCurrent = l.id === lesson.id;
                      const completed = isLessonCompleted(l);
                      return (
                        <Link
                          key={l.id}
                          href={`/courses/${course.slug}/lessons/${l.id}`}
                          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                            isCurrent
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          {completed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0 opacity-40" />
                          )}
                          <Icon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{l.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content area */}
        {isChallenge ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <ResizablePanelGroup
              direction="horizontal"
              className="flex-1 min-h-0"
            >
              <ResizablePanel defaultSize={45} minSize={30}>
                <div className="h-full overflow-y-auto p-6 lg:p-8">
                  <LessonContent
                    lesson={lesson}
                    showHint={showHint}
                    setShowHint={setShowHint}
                    showSolution={showSolution}
                    setShowSolution={setShowSolution}
                    isChallenge
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-border" />
              <ResizablePanel defaultSize={55} minSize={30}>
                <CodeEditor
                  courseSlug={course.slug}
                  nextLessonId={nextLesson?.id || null}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
            {bottomBar}
            {signInBar}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl p-6 lg:p-10">
              <LessonContent
                lesson={lesson}
                showHint={showHint}
                setShowHint={setShowHint}
                showSolution={showSolution}
                setShowSolution={setShowSolution}
                isChallenge={false}
              />

              {/* Nav buttons */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
                {prevLesson ? (
                  <Link
                    href={`/courses/${course.slug}/lessons/${prevLesson.id}`}
                  >
                    <Button
                      variant="outline"
                      className="gap-2 border-border text-muted-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  </Link>
                ) : (
                  <div />
                )}
                {lessonCompleted ? (
                  <Badge
                    variant="outline"
                    className="border-primary text-primary gap-1.5 py-1.5 px-3"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Completed
                  </Badge>
                ) : (
                  <Button
                    onClick={() => markComplete()}
                    disabled={isCompleting}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isCompleting ? "Submitting..." : "Mark Complete"}
                  </Button>
                )}
                {nextLesson ? (
                  <Link
                    href={`/courses/${course.slug}/lessons/${nextLesson.id}`}
                  >
                    <Button
                      variant="outline"
                      className="gap-2 border-border text-muted-foreground"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
              {signInBar}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────── Lesson Content ────────────────
function LessonContent({
  lesson,
  showHint,
  setShowHint,
  showSolution,
  setShowSolution,
  isChallenge,
}: {
  lesson: Lesson;
  showHint: boolean;
  setShowHint: (v: boolean) => void;
  showSolution: boolean;
  setShowSolution: (v: boolean) => void;
  isChallenge: boolean;
}) {
  const LessonIcon = lessonIcons[lesson.type];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Badge
          variant="outline"
          className="border-border text-muted-foreground text-xs gap-1"
        >
          <LessonIcon className="h-3 w-3" />
          {lesson.type === "challenge"
            ? "Challenge"
            : lesson.type === "video"
              ? "Video"
              : "Reading"}
        </Badge>
        <span className="text-xs text-muted-foreground">{lesson.duration}</span>
        <span className="ml-auto flex items-center gap-1 text-xs">
          <Zap className="h-3 w-3 text-primary" />
          <span className="text-primary font-medium">
            {lesson.type === "challenge" ? "120" : "50"} XP
          </span>
        </span>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-4">
        {lesson.title}
      </h1>

      {/* Mock content based on type */}
      {lesson.type === "video" && (
        <div className="rounded-xl border border-border bg-secondary aspect-video flex items-center justify-center mb-6">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
              <Play className="h-6 w-6 text-primary ml-0.5" />
            </div>
            <span className="text-sm">Video Lesson - {lesson.duration}</span>
          </div>
        </div>
      )}

      <div className="prose prose-sm max-w-none">
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            In this {lesson.type === "challenge" ? "challenge" : "lesson"}, you
            will learn about{" "}
            <span className="text-foreground font-medium">
              {lesson.title.toLowerCase()}
            </span>{" "}
            and how it applies to building on Solana. This is a core concept
            that forms the foundation of blockchain development.
          </p>

          {isChallenge && (
            <>
              <div className="rounded-lg border border-border bg-secondary/50 p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Objectives
                </h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">1.</span>
                    Implement the function according to the specification
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">2.</span>
                    Handle edge cases and error conditions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">3.</span>
                    Pass all test cases to complete the challenge
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-border bg-secondary/50 p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Expected Output
                </h3>
                <code className="text-xs text-primary font-mono bg-background px-2 py-1 rounded">
                  {"Transaction confirmed: Success"}
                </code>
              </div>
            </>
          )}

          <p>
            Understanding this concept is crucial for writing secure and
            efficient smart contracts. Take your time to work through the
            material and experiment with the code examples.
          </p>
        </div>
      </div>

      {/* Hint & Solution toggles */}
      {isChallenge && (
        <div className="mt-6 space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border text-muted-foreground"
            onClick={() => setShowHint(!showHint)}
          >
            <Lightbulb className="h-3.5 w-3.5 text-[hsl(var(--gold))]" />
            {showHint ? "Hide Hint" : "Show Hint"}
          </Button>
          {showHint && (
            <div className="rounded-lg border border-[hsl(var(--gold))]/20 bg-[hsl(var(--gold))]/5 p-4 text-sm text-muted-foreground">
              Think about how Solana accounts store data and how the runtime
              validates account ownership. Consider using the system program for
              account creation.
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border text-muted-foreground"
            onClick={() => setShowSolution(!showSolution)}
          >
            {showSolution ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {showSolution ? "Hide Solution" : "Show Solution"}
          </Button>
          {showSolution && (
            <div className="rounded-lg border border-border bg-card p-4 font-mono text-xs text-muted-foreground leading-relaxed">
              <pre>{`use anchor_lang::prelude::*;

#[program]
pub mod solution {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        counter.authority = ctx.accounts.authority.key();
        Ok(())
    }
}`}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
