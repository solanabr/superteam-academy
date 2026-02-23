"use client";

import { CodeEditor } from "@/components/editor/code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { XP_PER_LESSON } from "@/lib/solana/constants";
import { learningProgressService } from "@/lib/services/learning-progress";
import { useUserStore } from "@/lib/store/user-store";
import { mockCourses } from "@/lib/data/mock-courses";
import { ArrowLeft, ArrowRight, CheckCircle2, Code2 } from "lucide-react";
import Link from "next/link";
import { use, useMemo, useState } from "react";

export default function LessonPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const profile = useUserStore((state) => state.profile);
  const completeLesson = useUserStore((state) => state.completeLesson);
  const addXp = useUserStore((state) => state.addXp);
  const completedLessons = useUserStore((state) => state.completedLessons);

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

  const [code, setCode] = useState<string>(lesson.starterCode ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleComplete = async () => {
    if (isCompleted || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await learningProgressService.completeLesson(profile.id, course.id, lesson.id);
      completeLesson(course.id, lesson.id);
      addXp(XP_PER_LESSON);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{course.title}</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">{lesson.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{lesson.objective}</p>
          </div>
          <Badge className="border-border bg-st-dark text-foreground/90">
            {lesson.kind === "challenge" ? "Challenge lesson" : "Content lesson"}
          </Badge>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Lesson {lessonIndex + 1} of {lessons.length}
            </span>
            <span>{completion}%</span>
          </div>
          <Progress value={completion} className="h-2 bg-secondary" />
        </div>
      </header>

      <section className={lesson.kind === "challenge" ? "grid gap-4 xl:grid-cols-2" : "space-y-4"}>
        <article className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lesson content</h2>
          <MarkdownBlocks markdown={lesson.markdown} />
        </article>

        {lesson.kind === "challenge" ? (
          <article className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Code2 className="size-4 text-[#ffd23f]" />
                Coding challenge
              </h2>
              <p className="text-xs text-muted-foreground/70">Runtime: TypeScript / Rust-ready</p>
            </div>
            <div className="h-[420px] overflow-hidden rounded-xl border border-border bg-st-dark/80">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={code.includes("pub fn") ? "rust" : "typescript"}
              />
            </div>
          </article>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
            className="border-border bg-transparent text-foreground"
            disabled={!prevLesson}
          >
            <Link href={prevLesson ? `/courses/${course.slug}/lessons/${prevLesson.id}` : "#"}>
              <ArrowLeft className="size-4" />
              Previous
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-border bg-transparent text-foreground"
            disabled={!nextLesson}
          >
            <Link href={nextLesson ? `/courses/${course.slug}/lessons/${nextLesson.id}` : "#"}>
              Next
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <Button
          onClick={() => {
            void handleComplete();
          }}
          disabled={isCompleted || submitting}
          className="bg-gradient-to-r from-[#2f6b3f] to-[#ffd23f] text-st-dark"
        >
          <CheckCircle2 className="size-4" />
          {isCompleted ? "Completed" : `Mark as complete (+${XP_PER_LESSON} XP)`}
        </Button>
      </section>
    </div>
  );
}

function MarkdownBlocks({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      {markdown.split("\n").map((line, index) => {
        if (line.startsWith("### ")) {
          return (
            <h3 key={`${line}-${index}`} className="text-base font-semibold text-foreground">
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (line.includes("`")) {
          return (
            <p key={`${line}-${index}`}>
              {line.split("`").map((chunk, chunkIndex) =>
                chunkIndex % 2 === 1 ? (
                  <code key={`${chunk}-${chunkIndex}`} className="rounded bg-st-dark px-1 py-0.5 text-[#ffd23f]">
                    {chunk}
                  </code>
                ) : (
                  <span key={`${chunk}-${chunkIndex}`}>{chunk}</span>
                ),
              )}
            </p>
          );
        }
        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </div>
  );
}
