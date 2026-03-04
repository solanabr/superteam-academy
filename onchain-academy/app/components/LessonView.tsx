/**
 * components/lesson/LessonView.tsx  —  ESLint FIX
 * ──────────────────────────────────────────────────────────────
 * BUILD ERROR (line 164):
 *   react/no-unescaped-entities
 *   "`'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`"
 *
 * ROOT CAUSE:
 *   A raw apostrophe character ' appears directly inside JSX text.
 *   React's linter treats this as a potential HTML entity issue.
 *
 * HOW TO FIX IN YOUR FILE:
 *   Open components/lesson/LessonView.tsx, go to line 164,
 *   and replace the raw apostrophe with &apos; or &#39;
 *
 * EXAMPLES:
 *
 *   ❌  <p>You're almost done!</p>
 *   ✅  <p>You&apos;re almost done!</p>
 *
 *   ❌  <p>Let's go!</p>
 *   ✅  <p>Let&apos;s go!</p>
 *
 *   ❌  <p>It's a great day</p>
 *   ✅  <p>It&apos;s a great day</p>
 *
 *   ❌  <p>Don't stop learning</p>
 *   ✅  <p>Don&apos;t stop learning</p>
 *
 * ALTERNATIVE — use a JS string in curly braces (also valid):
 *   ✅  <p>{"You're almost done!"}</p>
 *   ✅  <p>{"Let's go!"}</p>
 *
 * ──────────────────────────────────────────────────────────────
 * Below is a complete, corrected LessonView component example.
 * Replace the relevant section of your existing file.
 * ──────────────────────────────────────────────────────────────
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ChevronRight, Star } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  content: string;
  xpReward: number;
  order: number;
}

interface LessonViewProps {
  lesson: Lesson;
  totalLessons: number;
  currentIndex: number;
  onComplete: (lessonId: string) => Promise<void>;
  onNext: () => void;
}

export function LessonView({
  lesson,
  totalLessons,
  currentIndex,
  onComplete,
  onNext,
}: LessonViewProps) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const progressPercent = Math.round(((currentIndex + 1) / totalLessons) * 100);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(lesson.id);
      setCompleted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Lesson {currentIndex + 1} of {totalLessons}</span>
          <span>{progressPercent}% complete</span>
        </div>
        <Progress value={progressPercent} />
      </div>

      {/* Lesson title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <Badge variant="secondary" className="gap-1">
          <Star className="h-3 w-3" />
          {lesson.xpReward} XP
        </Badge>
      </div>

      {/* Lesson content */}
      <div className="prose prose-invert max-w-none">
        {lesson.content}
      </div>

      {/* ✅ FIXED: All apostrophes below use &apos; instead of raw ' */}
      {!completed ? (
        <div className="rounded-lg border border-border p-4 bg-card space-y-3">
          <p className="text-sm text-muted-foreground">
            {/* ✅ FIX APPLIED: &apos; instead of raw apostrophe */}
            When you&apos;re ready, mark this lesson as complete to earn your XP.
          </p>
          <p className="text-sm text-muted-foreground">
            {/* ✅ Another example of the fix */}
            Don&apos;t rush — make sure you understand the concepts before moving on.
          </p>
          <Button
            onClick={handleComplete}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Saving..." : "Mark as Complete"}
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-5 w-5" />
            {/* ✅ FIXED */}
            <span className="font-medium">You&apos;ve completed this lesson!</span>
          </div>
          <p className="text-sm text-muted-foreground">
            +{lesson.xpReward} XP earned. Keep up the great work!
          </p>
          <Button onClick={onNext} className="w-full gap-2">
            Next Lesson
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default LessonView;
