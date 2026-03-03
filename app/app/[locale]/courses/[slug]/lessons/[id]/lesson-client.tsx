"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  ArrowLeft02Icon, 
  PlayIcon, 
  CheckmarkCircle02Icon, 
  Cancel01Icon,
  BookOpen01Icon,
  CodeIcon,
  CheckmarkSquare01Icon
} from "@hugeicons/core-free-icons";
import { CodeEditor } from "@/components/code-editor";
import type { Lesson } from "@/lib/services/types";

interface LessonWithMeta extends Lesson {
  lessonNumber: number;
}

interface LessonClientProps {
  lesson: Lesson;
  courseSlug: string;
  allLessons: LessonWithMeta[];
  prevLesson?: { id: string; title: string };
  nextLesson?: { id: string; title: string };
  locale?: 'en' | 'pt-BR' | 'es';
}

export function LessonClient({ lesson, courseSlug, allLessons, prevLesson, nextLesson, locale = 'en' }: LessonClientProps) {
  const t = useTranslations("lesson");
  const [code, setCode] = useState(lesson.starterCode || "");
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string }[]>([]);

  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);

  const runTests = useCallback(async () => {
    setIsRunning(true);
    setTestResults([]);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const results: { passed: boolean; message: string }[] = [];

    if (lesson.testCases && lesson.testCases.length > 0) {
      for (const testCase of lesson.testCases) {
        try {
          let result: string;
          
          const logs: string[] = [];
          const mockConsole = {
            log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
            error: (...args: unknown[]) => logs.push("ERROR: " + args.map(String).join(" ")),
          };
          
          try {
            const fn = new Function("console", code);
            fn(mockConsole);
            result = logs[logs.length - 1] || "";
          } catch {
            result = "ERROR";
          }

          const passed = testCase.expected === "PASS" 
            ? result.includes("PASS") || result.includes("true")
            : result.includes(testCase.expected) || result === testCase.expected;

          results.push({
            passed,
            message: testCase.description || `Test: ${testCase.expected}`,
          });
        } catch {
          results.push({
            passed: false,
            message: testCase.description || t("testFailed"),
          });
        }
      }
    } else {
      results.push({
        passed: true,
        message: t("noTests"),
      });
    }

    setTestResults(results);
    setIsRunning(false);
  }, [code, lesson.testCases, t]);

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "coding": return <HugeiconsIcon icon={CodeIcon} size={14} />;
      case "quiz": return <HugeiconsIcon icon={CheckmarkSquare01Icon} size={14} />;
      default: return <HugeiconsIcon icon={BookOpen01Icon} size={14} />;
    }
  };

  if (lesson.type === "reading") {
    return (
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-card flex-shrink-0 flex flex-col">
          <div className="p-4 border-b border-border">
            <Link 
              href={`/${locale}/courses/${courseSlug}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
              {t("backToCourse")}
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {allLessons.map((l, idx) => (
              <Link
                key={l.id}
                href={`/${locale}/courses/${courseSlug}/lessons/${l.id}`}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  l.id === lesson.id 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {getLessonIcon(l.type)}
                <span className="truncate">{idx + 1}. {l.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-8">
            <div className="flex items-center gap-3 mb-6">
              <Badge variant="outline">{t("reading")}</Badge>
              <span className="text-sm text-muted-foreground">{t("lessonOf", { current: currentIndex + 1, total: allLessons.length })}</span>
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-6">
              {lesson.title}
            </h1>
            
            <div className="prose prose-muted max-w-none">
              <p>{t("readingPlaceholder")}</p>
              <p className="mt-4">
                In a full implementation, this would contain:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Formatted markdown content</li>
                <li>Code snippets with syntax highlighting</li>
                <li>Images and diagrams</li>
                <li>Links to external resources</li>
              </ul>
            </div>

            <div className="mt-8 flex justify-between pt-6 border-t border-border">
              {prevLesson ? (
                <Link 
                  href={`/${locale}/courses/${courseSlug}/lessons/${prevLesson.id}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
                  {t("previous")}
                </Link>
              ) : <div />}
              
              {nextLesson && (
                <Link 
                  href={`/${locale}/courses/${courseSlug}/lessons/${nextLesson.id}`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  {t("next")}
                  <HugeiconsIcon icon={ArrowLeft02Icon} size={16} className="rotate-180" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar - Lesson Navigation */}
      <div className="w-64 border-r border-border bg-card flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-border">
          <Link 
            href={`/${locale}/courses/${courseSlug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
            {t("backToCourse")}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {allLessons.map((l, idx) => (
            <Link
              key={l.id}
              href={`/${locale}/courses/${courseSlug}/lessons/${l.id}`}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                l.id === lesson.id 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {getLessonIcon(l.type)}
              <span className="truncate">{idx + 1}. {l.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Area - 3:7 Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Instructions Panel - 30% */}
        <div className="w-[30%] border-r border-border overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">{lesson.xpReward} XP</Badge>
              <Badge variant="outline">{t("coding")}</Badge>
              <span className="text-sm text-muted-foreground">{t("lessonN", { n: currentIndex + 1 })}</span>
            </div>
            
            <h1 className="text-xl font-bold text-foreground mb-4">
              {lesson.title}
            </h1>

            <div className="prose prose-muted max-w-none text-sm">
              <p>{t("completeChallenge")}</p>
              
              {lesson.testCases && lesson.testCases.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-foreground mb-2">{t("testCases")}</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {lesson.testCases.map((tc, i) => (
                      <li key={i} className="text-muted-foreground">{tc.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              {prevLesson && (
                <Link 
                  href={`/${locale}/courses/${courseSlug}/lessons/${prevLesson.id}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={ArrowLeft02Icon} size={14} />
                  {t("previousLesson", { title: prevLesson.title })}
                </Link>
              )}
              {nextLesson && (
                <Link 
                  href={`/${locale}/courses/${courseSlug}/lessons/${nextLesson.id}`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  {t("nextLesson", { title: nextLesson.title })}
                  <HugeiconsIcon icon={ArrowLeft02Icon} size={14} className="rotate-180" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Code Editor Panel - 70% */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card">
          {/* Toolbar */}
          <div className="h-12 border-b border-border flex items-center px-4 flex-shrink-0">
            <span className="text-sm font-medium">{t("codeEditor")}</span>
          </div>

          {/* Editor */}
          <div className="flex-1">
            <CodeEditor
              value={code}
              onChange={setCode}
              language="typescript"
              height="calc(100vh - 200px)"
            />
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="h-40 border-t border-border overflow-y-auto flex-shrink-0">
              <div className="p-4">
                <h4 className="text-sm font-medium mb-2">{t("testResults")}</h4>
                <div className="space-y-2">
                  {testResults.map((result, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-sm ${
                        result.passed ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={result.passed ? CheckmarkCircle02Icon : Cancel01Icon}
                        size={14}
                      />
                      {result.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
