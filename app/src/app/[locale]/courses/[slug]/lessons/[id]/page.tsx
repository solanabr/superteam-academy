"use client";

import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ContentRenderer } from "@/components/lesson/content-renderer";
import { CodeEditor } from "@/components/lesson/code-editor";
import { TestRunner } from "@/components/lesson/test-runner";
import { LessonNav } from "@/components/lesson/lesson-nav";
import { CompletionButton } from "@/components/lesson/completion-button";

// Mock lesson content for development
const MOCK_CONTENT = [
  {
    _type: "block",
    style: "h2",
    children: [{ _type: "span", text: "Introduction" }],
  },
  {
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: "In this lesson, you will learn the fundamentals of building on Solana. We will cover accounts, programs, and transactions.",
      },
    ],
  },
  {
    _type: "block",
    style: "h3",
    children: [{ _type: "span", text: "Key Concepts" }],
  },
  {
    _type: "block",
    style: "normal",
    children: [
      {
        _type: "span",
        text: "Solana programs are stateless — all state is stored in accounts. Programs read and write to accounts that are passed as instruction inputs.",
      },
    ],
  },
];

const MOCK_TEST_CASES = [
  {
    input: 'derivePda("config")',
    expectedOutput: "PublicKey",
    description: "Should derive config PDA correctly",
  },
  {
    input: 'derivePda("course", "solana-101")',
    expectedOutput: "PublicKey",
    description: "Should derive course PDA with seed",
  },
  {
    input: 'isLessonComplete(flags, 0)',
    expectedOutput: "true",
    description: "Should check lesson 0 completion in bitmap",
  },
];

export default function LessonPage() {
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = Number(params.id);
  const locale = useLocale();
  const t = useTranslations("lessons");

  const totalLessons = 10;
  const isCodeChallenge = lessonId % 3 === 2;
  const courseName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const lessons = Array.from({ length: totalLessons }, (_, i) => ({
    index: i,
    title: `Lesson ${i + 1}`,
  }));

  const completedIndices = Array.from(
    { length: Math.min(lessonId, totalLessons) },
    (_, i) => i
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden lg:block w-72 border-r border-border p-4 shrink-0 overflow-y-auto">
        <LessonNav
          courseId={slug}
          courseTitle={courseName}
          lessons={lessons}
          currentIndex={lessonId}
          completedIndices={completedIndices}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/courses/${slug}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="text-sm font-medium">
              {t("lessonOf", { current: lessonId + 1, total: totalLessons })}
            </span>
          </div>
          <div className="flex gap-2">
            {lessonId > 0 && (
              <Link href={`/${locale}/courses/${slug}/lessons/${lessonId - 1}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {t("prev")}
                </Button>
              </Link>
            )}
            {lessonId < totalLessons - 1 && (
              <Link href={`/${locale}/courses/${slug}/lessons/${lessonId + 1}`}>
                <Button variant="ghost" size="sm">
                  {t("next")}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Content Area */}
        {isCodeChallenge ? (
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Instructions */}
            <div className="lg:w-1/2 p-4 md:p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-border">
              <h1 className="text-2xl font-bold mb-4">
                {t("challenge")}: Lesson {lessonId + 1}
              </h1>
              <ContentRenderer content={MOCK_CONTENT} />
              <Separator className="my-6" />
              <TestRunner testCases={MOCK_TEST_CASES} userCode="" />
            </div>

            {/* Editor */}
            <div className="lg:w-1/2 flex flex-col">
              <div className="flex-1 min-h-[400px]">
                <CodeEditor
                  defaultValue={`// Write your solution here\nimport { PublicKey } from "@solana/web3.js";\n\nexport function derivePda(seed: string, extra?: string) {\n  // TODO: implement\n}\n`}
                  language="typescript"
                  className="h-full border-0 rounded-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full overflow-y-auto">
            <h1 className="text-2xl font-bold mb-6">Lesson {lessonId + 1}</h1>
            <ContentRenderer content={MOCK_CONTENT} />
          </div>
        )}

        {/* Bottom Bar */}
        <div className="border-t border-border p-4 bg-card/50">
          <div className="max-w-md mx-auto">
            <CompletionButton
              courseId={slug}
              lessonIndex={lessonId}
              isCompleted={completedIndices.includes(lessonId)}
              xpReward={100}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
