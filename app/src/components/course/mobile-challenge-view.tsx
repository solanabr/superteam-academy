"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Check,
  X,
  Loader2,
  Sparkles,
  List,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { EditorPanel, OutputDisplay, ChallengePrompt } from "@/components/editor";
import type { Lesson, TestCase, LessonNavItem, Challenge } from "@/types";

export interface MobileChallengeViewProps {
  lesson: Lesson;
  challenge: Challenge;
  courseSlug: string;
  code: string;
  setCode: (v: string) => void;
  testResults: TestCase[];
  isRunning: boolean;
  showHints: boolean;
  currentHintIndex: number;
  showSolution: boolean;
  completed: boolean;
  allTestsPassed: boolean;
  xpAnimating: boolean;
  activeTab: "tests" | "output" | "discussion";
  setActiveTab: (v: "tests" | "output" | "discussion") => void;
  runOutput: string;
  editorLanguage: string;
  onRunCode: () => void;
  onMarkComplete: () => void;
  onResetCode: () => void;
  onShowSolution: () => void;
  onToggleHints: () => void;
  onNextHint: () => void;
  showSidebar: boolean;
  setShowSidebar: (v: boolean) => void;
  prevLesson: LessonNavItem | null;
  nextLesson: LessonNavItem | null;
}

export function MobileChallengeView({
  lesson,
  challenge,
  courseSlug,
  code,
  setCode,
  testResults,
  isRunning,
  showHints,
  currentHintIndex,
  showSolution,
  completed,
  allTestsPassed,
  xpAnimating,
  activeTab,
  setActiveTab,
  runOutput,
  editorLanguage,
  onRunCode,
  onMarkComplete,
  onResetCode,
  onShowSolution,
  onToggleHints,
  onNextHint,
  showSidebar,
  setShowSidebar,
  prevLesson,
  nextLesson,
}: MobileChallengeViewProps) {
  const t = useTranslations("lesson");
  const [mobileTab, setMobileTab] = useState<"prompt" | "editor">("prompt");

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex border-b border-border bg-card">
        <button
          onClick={() => setMobileTab("prompt")}
          className={cn(
            "flex-1 px-4 py-2.5 text-center text-sm font-medium transition-colors",
            mobileTab === "prompt"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground"
          )}
        >
          {t("challenge.title")}
        </button>
        <button
          onClick={() => setMobileTab("editor")}
          className={cn(
            "flex-1 px-4 py-2.5 text-center text-sm font-medium transition-colors",
            mobileTab === "editor"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground"
          )}
        >
          {t("editor.title")}
        </button>
      </div>

      {mobileTab === "prompt" ? (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <ChallengePrompt
            title={lesson.title}
            description={lesson.description}
            challenge={challenge}
            testResults={testResults}
            showHints={showHints}
            onToggleHints={onToggleHints}
            currentHintIndex={currentHintIndex}
            onNextHint={onNextHint}
            showSolution={showSolution}
            onShowSolution={onShowSolution}
            compact
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden bg-[#1e1e1e]">
          <EditorPanel
            code={code}
            language={challenge.language}
            editorLanguage={editorLanguage}
            isRunning={isRunning}
            onCodeChange={setCode}
            onRun={onRunCode}
            onReset={onResetCode}
            compact
          />
          <div className="border-t border-[#333]">
            <div className="flex bg-[#252526]">
              <button onClick={() => setActiveTab("tests")} className={cn("px-3 py-1.5 text-xs", activeTab === "tests" ? "bg-[#1e1e1e] text-[#ccc]" : "text-[#888]")}>
                {t("challenge.tests")}
              </button>
              <button onClick={() => setActiveTab("output")} className={cn("px-3 py-1.5 text-xs", activeTab === "output" ? "bg-[#1e1e1e] text-[#ccc]" : "text-[#888]")}>
                {t("editor.output")}
              </button>
            </div>
            <div className="h-24 overflow-y-auto bg-[#1e1e1e] p-2">
              {activeTab === "tests" ? (
                <div className="space-y-1">
                  {testResults.map((tc) => (
                    <div key={tc.id} className="flex items-center gap-1.5 text-xs">
                      {tc.passed === true ? <Check className="h-3 w-3 text-brazil-green" /> : tc.passed === false ? <X className="h-3 w-3 text-destructive" /> : <div className="h-3 w-3 rounded-full border border-[#555]" />}
                      <span className={cn(tc.passed === true ? "text-brazil-green" : tc.passed === false ? "text-destructive" : "text-[#888]")}>{tc.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <OutputDisplay output={runOutput} placeholder={t("challenge.mobileOutputPlaceholder")} />
              )}
            </div>
          </div>
        </div>
      )}

      <MobileBottomBar
        lesson={lesson}
        courseSlug={courseSlug}
        completed={completed}
        allTestsPassed={allTestsPassed}
        xpAnimating={xpAnimating}
        isRunning={isRunning}
        prevLesson={prevLesson}
        nextLesson={nextLesson}
        onMarkComplete={onMarkComplete}
        onRunCode={() => { setMobileTab("editor"); onRunCode(); }}
      />
    </div>
  );
}

function MobileBottomBar({
  lesson,
  courseSlug,
  completed,
  allTestsPassed,
  xpAnimating,
  isRunning,
  prevLesson,
  nextLesson,
  onMarkComplete,
  onRunCode,
}: {
  lesson: Lesson;
  courseSlug: string;
  completed: boolean;
  allTestsPassed: boolean;
  xpAnimating: boolean;
  isRunning: boolean;
  prevLesson: LessonNavItem | null;
  nextLesson: LessonNavItem | null;
  onMarkComplete: () => void;
  onRunCode: () => void;
}) {
  const t = useTranslations("lesson");
  return (
    <div className="relative border-t border-border bg-card px-3 py-2.5">
      {xpAnimating && (
        <span className="animate-xp-gain absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full text-sm font-bold text-xp">
          +{lesson.xpReward} XP
        </span>
      )}
      <div className="flex items-center justify-between">
        <div>
          {prevLesson && (
            <Link href={`/courses/${courseSlug}/lessons/${prevLesson.lesson.id}`} className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronLeft className="h-3.5 w-3.5" />
              {t("challenge.prev")}
            </Link>
          )}
        </div>
        {completed ? (
          nextLesson ? (
            <Link href={`/courses/${courseSlug}/lessons/${nextLesson.lesson.id}`} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              {t("next")} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link href={`/courses/${courseSlug}`} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
              {t("challenge.done")}
            </Link>
          )
        ) : allTestsPassed ? (
          <button onClick={onMarkComplete} className="flex items-center gap-1 rounded-md bg-gradient-to-r from-brazil-gold to-brazil-gold-light px-3 py-1.5 text-xs font-semibold text-black">
            <Sparkles className="h-3.5 w-3.5" />
            {t("challenge.completeXP", { xp: lesson.xpReward })}
          </button>
        ) : (
          <button
            onClick={onRunCode}
            disabled={isRunning}
            className={cn("flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium", isRunning ? "bg-muted text-muted-foreground" : "bg-brazil-green text-white")}
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {t("runCode")}
          </button>
        )}
        <div>
          {nextLesson && !completed && (
            <Link href={`/courses/${courseSlug}/lessons/${nextLesson.lesson.id}`} className="flex items-center gap-1 text-xs text-muted-foreground">
              {t("challenge.skip")} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
