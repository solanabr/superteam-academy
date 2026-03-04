"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Play,
  RotateCcw,
  Lightbulb,
  Eye,
  Loader2,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CodeEditor } from "@/components/editor/code-editor";
import { courseService, learningProgressService, gamificationService } from "@/services";
import { formatXP } from "@/lib/utils";
import type { Lesson, Challenge, Module } from "@/types";

interface LessonViewProps {
  courseSlug: string;
  lessonId: string;
}

export function LessonView({ courseSlug, lessonId }: LessonViewProps) {
  const t = useTranslations("lesson");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { connected } = useWallet();

  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [code, setCode] = useState("");
  const [testResults, setTestResults] = useState<{
    passed: boolean;
    results: { name: string; passed: boolean; output?: string; expected?: string }[];
  } | null>(null);

  // Fetch course data
  const { data: courseData } = useQuery({
    queryKey: ["course", courseSlug],
    queryFn: () => courseService.getCourseBySlug(courseSlug),
  });

  const course = courseData;

  // Find current lesson and navigation
  const lessonInfo = findLessonInfo(course, lessonId);
  const lesson = lessonInfo?.lesson;
  const prevLesson = lessonInfo?.prev;
  const nextLesson = lessonInfo?.next;
  const moduleIndex = lessonInfo?.moduleIndex ?? 0;
  const lessonIndex = lessonInfo?.lessonIndex ?? 0;

  // Fetch progress
  const { data: progressData } = useQuery({
    queryKey: ["progress", courseSlug],
    queryFn: () => learningProgressService.getCourseProgress(courseSlug, "user-wallet"),
    enabled: connected,
  });

  const isCompleted = progressData?.data?.completedLessons.includes(lessonId) ?? false;

  // Complete lesson mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!lesson?.xpReward) return;
      await learningProgressService.completeLesson("user-wallet", course?.id ?? "", lessonIndex);
      await gamificationService.awardXP(lesson.xpReward, "lesson_complete", lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress", courseSlug] });
      queryClient.invalidateQueries({ queryKey: ["gamification"] });
    },
  });

  // Initialize code when lesson loads
  useState(() => {
    if (lesson?.challenge?.starterCode) {
      setCode(lesson.challenge.starterCode);
    }
  });

  const handleRunCode = useCallback(async () => {
    if (!lesson?.challenge) return;

    // Simulate running tests (in production, this would call a code execution service)
    setTestResults({
      passed: false,
      results: lesson.challenge.testCases.map((tc) => ({
        name: tc.description,
        passed: false,
        output: "Running...",
      })),
    });

    // Simulate test execution
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock results - in production, execute code against test cases
    const results = lesson.challenge.testCases.map((tc, index) => ({
      name: tc.description,
      passed: Math.random() > 0.3, // Mock: 70% pass rate
      output: tc.expectedOutput,
      expected: tc.expectedOutput,
    }));

    const allPassed = results.every((r) => r.passed);
    setTestResults({ passed: allPassed, results });
  }, [lesson]);

  const handleSubmit = useCallback(async () => {
    if (!testResults?.passed) {
      await handleRunCode();
      return;
    }

    await completeMutation.mutateAsync();

    // Navigate to next lesson if available
    if (nextLesson) {
      router.push(`/courses/${courseSlug}/lessons/${nextLesson.id}`);
    }
  }, [testResults, handleRunCode, completeMutation, nextLesson, courseSlug, router]);

  const handleMarkComplete = useCallback(async () => {
    await completeMutation.mutateAsync();
  }, [completeMutation]);

  const handleReset = useCallback(() => {
    if (lesson?.challenge?.starterCode) {
      setCode(lesson.challenge.starterCode);
      setTestResults(null);
    }
  }, [lesson]);

  if (!course || !lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((acc: number, m: Module) => acc + m.lessons.length, 0);
  const currentLessonNumber =
    course.modules.slice(0, moduleIndex).reduce((acc: number, m: Module) => acc + m.lessons.length, 0) +
    lessonIndex +
    1;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/courses/${courseSlug}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("navigation.backToCourse")}
              </Link>
            </Button>
            <div className="hidden md:block">
              <span className="text-sm text-muted-foreground">
                {course.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentLessonNumber} / {totalLessons}
              </span>
              <Progress
                value={(currentLessonNumber / totalLessons) * 100}
                className="w-24 h-2"
              />
            </div>

            {/* XP */}
            {lesson.xpReward && (
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3 text-xp" />
                {formatXP(lesson.xpReward)} XP
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {lesson.type === "challenge" && lesson.challenge ? (
          <ChallengeView
            lesson={lesson}
            code={code}
            setCode={setCode}
            testResults={testResults}
            showHint={showHint}
            setShowHint={setShowHint}
            showSolution={showSolution}
            setShowSolution={setShowSolution}
            onRun={handleRunCode}
            onSubmit={handleSubmit}
            onReset={handleReset}
            isCompleted={isCompleted}
            isSubmitting={completeMutation.isPending}
          />
        ) : (
          <ContentView
            lesson={lesson}
            isCompleted={isCompleted}
            onMarkComplete={handleMarkComplete}
            isSubmitting={completeMutation.isPending}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <footer className="sticky bottom-0 border-t bg-background py-4">
        <div className="container flex items-center justify-between px-4">
          <Button
            variant="outline"
            disabled={!prevLesson}
            asChild={!!prevLesson}
          >
            {prevLesson ? (
              <Link href={`/courses/${courseSlug}/lessons/${prevLesson.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("navigation.previous")}
              </Link>
            ) : (
              <>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("navigation.previous")}
              </>
            )}
          </Button>

          <Button disabled={!nextLesson} asChild={!!nextLesson}>
            {nextLesson ? (
              <Link href={`/courses/${courseSlug}/lessons/${nextLesson.id}`}>
                {t("navigation.next")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <>
                {t("navigation.next")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function ChallengeView({
  lesson,
  code,
  setCode,
  testResults,
  showHint,
  setShowHint,
  showSolution,
  setShowSolution,
  onRun,
  onSubmit,
  onReset,
  isCompleted,
  isSubmitting,
}: {
  lesson: Lesson;
  code: string;
  setCode: (code: string) => void;
  testResults: { passed: boolean; results: { name: string; passed: boolean; output?: string; expected?: string }[] } | null;
  showHint: boolean;
  setShowHint: (show: boolean) => void;
  showSolution: boolean;
  setShowSolution: (show: boolean) => void;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  isCompleted: boolean;
  isSubmitting: boolean;
}) {
  const t = useTranslations("lesson");
  const challenge = lesson.challenge!;

  return (
    <div className="grid h-[calc(100vh-8rem)] lg:grid-cols-2">
      {/* Left Panel - Instructions */}
      <div className="flex flex-col border-r overflow-hidden">
        <Tabs defaultValue="instructions" className="flex flex-col h-full">
          <div className="border-b px-4">
            <TabsList className="h-12">
              <TabsTrigger value="instructions">{t("challenge.title")}</TabsTrigger>
              <TabsTrigger value="tests">{t("challenge.tests")}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="instructions" className="flex-1 overflow-auto p-6 m-0">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
                {isCompleted && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {t("content.completed")}
                  </Badge>
                )}
              </div>

              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>{challenge.description}</p>
                {challenge.instructions && (
                  <div dangerouslySetInnerHTML={{ __html: challenge.instructions }} />
                )}
              </div>

              {/* Hint */}
              {challenge.hint && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHint(!showHint)}
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    {t("content.hint")}
                  </Button>
                  {showHint && (
                    <Card className="mt-2">
                      <CardContent className="p-4">
                        <p className="text-sm">{challenge.hint}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Solution */}
              {challenge.solution && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSolution(!showSolution)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {t("content.solution")}
                  </Button>
                  {showSolution && (
                    <Card className="mt-2">
                      <CardContent className="p-4">
                        <pre className="text-sm overflow-x-auto">
                          <code>{challenge.solution}</code>
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tests" className="flex-1 overflow-auto p-6 m-0">
            <div className="space-y-4">
              <h2 className="font-semibold">{t("challenge.tests")}</h2>
              {testResults ? (
                <div className="space-y-3">
                  {testResults.results.map((result, i) => (
                    <Card
                      key={i}
                      className={result.passed ? "border-success" : "border-destructive"}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {result.passed ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <span className="h-4 w-4 rounded-full bg-destructive" />
                          )}
                          <span className="font-medium text-sm">{result.name}</span>
                          <Badge variant={result.passed ? "success" : "destructive"} className="ml-auto">
                            {result.passed ? t("challenge.passed") : t("challenge.failed")}
                          </Badge>
                        </div>
                        {!result.passed && result.expected && (
                          <div className="text-xs text-muted-foreground mt-2">
                            <p>{t("challenge.expected")}: {result.expected}</p>
                            {result.output && <p>{t("challenge.output")}: {result.output}</p>}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {challenge.testCases.map((tc, i) => (
                    <Card key={i}>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">{tc.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("challenge.expected")}: {tc.expectedOutput}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Code Editor */}
      <div className="flex flex-col overflow-hidden">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{challenge.language || "rust"}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={onReset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("challenge.reset")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="outline" size="sm" onClick={onRun}>
              <Play className="mr-2 h-4 w-4" />
              {t("challenge.run")}
            </Button>
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : testResults?.passed ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : null}
              {t("challenge.submit")}
            </Button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            value={code || challenge.starterCode}
            onChange={setCode}
            language={challenge.language || "rust"}
          />
        </div>

        {/* Output Panel */}
        {testResults && (
          <div className="border-t bg-muted/30 p-4 max-h-48 overflow-auto">
            <h3 className="font-medium text-sm mb-2">{t("challenge.output")}</h3>
            <div
              className={`text-sm ${
                testResults.passed ? "text-success" : "text-destructive"
              }`}
            >
              {testResults.passed ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  {t("challenge.success", { xp: lesson.xpReward || 0 })}
                </div>
              ) : (
                <p>
                  {testResults.results.filter((r) => r.passed).length}/
                  {testResults.results.length} tests passing
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContentView({
  lesson,
  isCompleted,
  onMarkComplete,
  isSubmitting,
}: {
  lesson: Lesson;
  isCompleted: boolean;
  onMarkComplete: () => void;
  isSubmitting: boolean;
}) {
  const t = useTranslations("lesson");

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
          <div className="flex items-center gap-3">
            <Badge variant={lesson.type === "video" ? "default" : "secondary"}>
              {lesson.type}
            </Badge>
            {isCompleted && (
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                {t("content.completed")}
              </Badge>
            )}
          </div>
        </div>

        {/* Video Player */}
        {lesson.type === "video" && lesson.videoUrl && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <video
              src={lesson.videoUrl}
              controls
              className="w-full h-full"
              poster={lesson.thumbnail}
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {lesson.content ? (
            <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
          ) : (
            <p>
              Lesson content goes here. In production, this would be rich
              markdown/MDX content with code examples, diagrams, and
              interactive elements.
            </p>
          )}
        </div>

        {/* Mark Complete */}
        {!isCompleted && (
          <div className="flex justify-center pt-8">
            <Button
              size="lg"
              onClick={onMarkComplete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {t("content.markComplete")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to find lesson info
function findLessonInfo(
  course: any,
  lessonId: string
): {
  lesson: Lesson;
  prev: Lesson | null;
  next: Lesson | null;
  moduleIndex: number;
  lessonIndex: number;
} | null {
  if (!course) return null;

  const allLessons: { lesson: Lesson; moduleIndex: number; lessonIndex: number }[] = [];

  course.modules.forEach((module: any, mi: number) => {
    module.lessons.forEach((lesson: any, li: number) => {
      allLessons.push({ lesson, moduleIndex: mi, lessonIndex: li });
    });
  });

  const currentIndex = allLessons.findIndex((l) => l.lesson.id === lessonId);
  if (currentIndex === -1) return null;

  return {
    lesson: allLessons[currentIndex].lesson,
    prev: currentIndex > 0 ? allLessons[currentIndex - 1].lesson : null,
    next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].lesson : null,
    moduleIndex: allLessons[currentIndex].moduleIndex,
    lessonIndex: allLessons[currentIndex].lessonIndex,
  };
}
