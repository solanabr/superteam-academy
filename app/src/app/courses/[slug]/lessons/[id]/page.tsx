"use client";

import { ChallengeWorkspace } from "@/components/editor/challenge-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { XP_PER_LESSON } from "@/lib/solana/constants";
import { useUserStore } from "@/lib/store/user-store";
import { mockCourses } from "@/lib/data/mock-courses";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { toast } from "sonner";

export default function LessonPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const completeLesson = useUserStore((state) => state.completeLesson);
  const addXp = useUserStore((state) => state.addXp);
  const recordActivity = useUserStore((state) => state.recordActivity);
  const completedLessons = useUserStore((state) => state.completedLessons);
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  const course = mockCourses.find((item) => item.slug === slug);
  const lessons = useMemo(() => course?.modules.flatMap((module) => module.lessons) ?? [], [course]);
  const lessonIndex = lessons.findIndex((item) => item.id === id);
  const lesson = lessonIndex >= 0 ? lessons[lessonIndex] : null;

  if (!course || !lesson) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Lesson not found.
      </div>
    );
  }

  const prevLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

  const isCompleted = completedLessons[course.id]?.includes(lesson.id) ?? false;
  const completion = Math.round(((lessonIndex + 1) / lessons.length) * 100);

  const [submitting, setSubmitting] = useState(false);
  const [challengePassed, setChallengePassed] = useState(false);

  const handleComplete = async () => {
    if (isCompleted || submitting) return;
    setSubmitting(true);
    try {
      if (publicKey) {
        const res = await fetch("/api/lessons/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: course.id,
            lessonIndex,
            learner: publicKey.toBase58(),
          }),
        });
        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: ["onchain-xp"] });
          queryClient.invalidateQueries({ queryKey: ["onchain-enrollment"] });
        } else {
          const data = await res.json();
          toast.error(data.error || "On-chain completion failed");
        }
      }
      completeLesson(course.id, lesson.id);
      addXp(XP_PER_LESSON);
      recordActivity();
      toast.success(`Lesson completed! +${XP_PER_LESSON} XP`);
    } finally {
      setSubmitting(false);
    }
  };

  const canComplete = lesson.kind === "content" || challengePassed || isCompleted;

  return (
    <div className="space-y-5">
      <header className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{course.title}</p>
            <h1 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">{lesson.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{lesson.objective}</p>
          </div>
          <Badge className="shrink-0 border-border bg-surface text-foreground/90">
            {lesson.kind === "challenge" ? "Challenge" : "Content"}
          </Badge>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Lesson {lessonIndex + 1} of {lessons.length}</span>
            <span>{completion}%</span>
          </div>
          <Progress value={completion} className="h-2 bg-secondary" />
        </div>
      </header>

      <section className={lesson.kind === "challenge" ? "grid gap-4 xl:grid-cols-2" : "space-y-4"}>
        <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lesson content</h2>
          <MarkdownBlocks markdown={lesson.markdown} />
        </article>

        {lesson.kind === "challenge" && lesson.starterCode && (
          <ChallengeWorkspace
            starterCode={lesson.starterCode}
            expectedOutput={lesson.expectedOutput}
            language={lesson.starterCode.includes("pub fn") ? "rust" : "typescript"}
            onAllPassed={() => setChallengePassed(true)}
          />
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {prevLesson && (
            <Button asChild variant="outline" size="sm" className="border-border bg-transparent text-foreground">
              <Link href={`/courses/${course.slug}/lessons/${prevLesson.id}`}>
                <ArrowLeft className="size-4" />
                Previous
              </Link>
            </Button>
          )}
          {nextLesson && (
            <Button asChild variant="outline" size="sm" className="border-border bg-transparent text-foreground">
              <Link href={`/courses/${course.slug}/lessons/${nextLesson.id}`}>
                Next
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>

        <Button
          onClick={() => void handleComplete()}
          disabled={isCompleted || submitting || !canComplete}
          className="bg-gradient-cta text-cta-foreground"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          {isCompleted
            ? "Completed"
            : !canComplete
              ? "Pass the challenge first"
              : `Mark as complete (+${XP_PER_LESSON} XP)`}
        </Button>
      </section>
    </div>
  );
}

function MarkdownBlocks({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="overflow-x-auto rounded-lg bg-surface p-3 text-xs leading-relaxed">
            <code className="text-highlight/90">{codeLines.join("\n")}</code>
          </pre>,
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        codeLang = trimmed.slice(3);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-semibold text-foreground">{trimmed.slice(4)}</h3>,
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-semibold text-foreground">{trimmed.slice(3)}</h2>,
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <p key={`ol-${i}`} className="text-sm text-muted-foreground">{trimmed}</p>,
      );
    } else if (trimmed.startsWith("- ")) {
      elements.push(
        <p key={`ul-${i}`} className="text-sm text-muted-foreground">• {trimmed.slice(2)}</p>,
      );
    } else if (trimmed === "") {
      continue;
    } else if (trimmed.includes("`")) {
      elements.push(
        <p key={`p-${i}`} className="text-sm leading-relaxed text-muted-foreground">
          {trimmed.split("`").map((chunk, ci) =>
            ci % 2 === 1 ? (
              <code key={ci} className="rounded bg-surface px-1 py-0.5 text-xs text-highlight">{chunk}</code>
            ) : (
              <span key={ci}>{chunk}</span>
            ),
          )}
        </p>,
      );
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      elements.push(
        <p key={`b-${i}`} className="text-sm font-semibold text-foreground">{trimmed.slice(2, -2)}</p>,
      );
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-sm leading-relaxed text-muted-foreground">{trimmed}</p>,
      );
    }
  }

  return <div className="space-y-3">{elements}</div>;
}
