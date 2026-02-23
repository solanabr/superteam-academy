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
      <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-8 text-center text-zinc-300">
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
      <header className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/65 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">{course.title}</p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-100">{lesson.title}</h1>
            <p className="mt-2 text-sm text-zinc-300">{lesson.objective}</p>
          </div>
          <Badge className="border-white/15 bg-zinc-950 text-zinc-200">
            {lesson.kind === "challenge" ? "Challenge lesson" : "Content lesson"}
          </Badge>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
            <span>
              Lesson {lessonIndex + 1} of {lessons.length}
            </span>
            <span>{completion}%</span>
          </div>
          <Progress value={completion} className="h-2 bg-zinc-800" />
        </div>
      </header>

      <section className={lesson.kind === "challenge" ? "grid gap-4 xl:grid-cols-2" : "space-y-4"}>
        <article className="rounded-xl border border-white/10 bg-zinc-900/70 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">Lesson content</h2>
          <MarkdownBlocks markdown={lesson.markdown} />
        </article>

        {lesson.kind === "challenge" ? (
          <article className="rounded-xl border border-white/10 bg-zinc-900/70 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Code2 className="size-4 text-[#14F195]" />
                Coding challenge
              </h2>
              <p className="text-xs text-zinc-500">Runtime: TypeScript / Rust-ready</p>
            </div>
            <div className="h-[420px] overflow-hidden rounded-xl border border-white/10 bg-zinc-950/80">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={code.includes("pub fn") ? "rust" : "typescript"}
              />
            </div>
          </article>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-white/10 bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
            className="border-white/20 bg-transparent text-zinc-100"
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
            className="border-white/20 bg-transparent text-zinc-100"
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
          className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black"
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
    <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
      {markdown.split("\n").map((line, index) => {
        if (line.startsWith("### ")) {
          return (
            <h3 key={`${line}-${index}`} className="text-base font-semibold text-zinc-100">
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (line.includes("`")) {
          return (
            <p key={`${line}-${index}`}>
              {line.split("`").map((chunk, chunkIndex) =>
                chunkIndex % 2 === 1 ? (
                  <code key={`${chunk}-${chunkIndex}`} className="rounded bg-zinc-950 px-1 py-0.5 text-[#14F195]">
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
