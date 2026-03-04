"use client";

import { useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAPIQuery, useAPIMutation } from "@/lib/api/useAPI";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/editor-store";
import { useAuthStore } from "@/store/auth-store";
import { EditorSkeleton } from "@/components/editor/editor-skeleton";
import { LessonViewSkeleton } from "@/components/lessons/lesson-view-skeleton";

const LessonCodeEditor = dynamic(() => import("@/components/editor/code-editor").then(m => m.CodeEditor), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

type Course_for_lesson = {
  slug: string;
  title: string;
  modules: Array<{
    slug: string;
    title: string;
    order: number;
    lessons: Array<{
      slug: string;
      title: string;
      order: number;
      content: string | null;
      challenge_id: string | null;
    }>;
  }>;
};

type LessonViewProps = { course_slug: string; lesson_id: string };

function render_markdown(content: string): ReactNode {
  const lines = content.split("\n");
  const elements: ReactNode[] = [];

  let current_paragraph: string[] = [];

  const flush_paragraph = () => {
    if (current_paragraph.length === 0) return;
    const text = current_paragraph.join(" ").trim();
    if (text.length === 0) {
      current_paragraph = [];
      return;
    }
    elements.push(
      <p key={`p-${elements.length}`} className="mb-2">
        {text}
      </p>,
    );
    current_paragraph = [];
  };

  lines.forEach((line_raw) => {
    const line = line_raw.trimEnd();
    if (line.startsWith("### ")) {
      flush_paragraph();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="mt-4 text-base font-semibold">
          {line.slice(4)}
        </h3>,
      );
      return;
    }
    if (line.startsWith("## ")) {
      flush_paragraph();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="mt-6 text-lg font-semibold">
          {line.slice(3)}
        </h2>,
      );
      return;
    }
    if (line.startsWith("# ")) {
      flush_paragraph();
      elements.push(
        <h1 key={`h1-${elements.length}`} className="mt-6 text-xl font-semibold">
          {line.slice(2)}
        </h1>,
      );
      return;
    }
    if (line.trim().length === 0) {
      flush_paragraph();
      return;
    }
    current_paragraph.push(line);
  });

  flush_paragraph();

  return <>{elements}</>;
}

export function LessonView({ course_slug, lesson_id }: LessonViewProps) {
  const t = useTranslations("lesson");
  const t_courses = useTranslations("courses");
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  const is_editor_open = useEditorStore((s) => s.is_open);
  const toggle_editor = useEditorStore((s) => s.toggle);

  const [complete_error, set_complete_error] = useState<string | null>(null);
  const [complete_success, set_complete_success] = useState(false);

  const { data: course, isPending: is_course_pending, error: course_error } = useAPIQuery<Course_for_lesson>({
    queryKey: ["course", course_slug],
    path: `/api/courses/${course_slug}`,
  });

  const lesson = useMemo(() => {
    if (!course) return null;
    for (const module_item of course.modules) {
      const found_lesson = module_item.lessons.find((lesson_item) => lesson_item.slug === lesson_id);
      if (found_lesson) {
        return found_lesson;
      }
    }
    return null;
  }, [course, lesson_id]);

  const complete_mutation = useAPIMutation(
    "post",
    "/api/lesson/complete",
  );

  const handle_complete = async () => {
    if (!session) return;
    set_complete_error(null);
    try {
      await complete_mutation.mutateAsync({
        course_slug,
        lesson_slug: lesson_id,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] }),
        queryClient.invalidateQueries({ queryKey: ["achievements"] }),
        queryClient.invalidateQueries({ queryKey: ["enrollments"] }),
      ]);
      set_complete_success(true);
    } catch (err) {
      set_complete_error(err instanceof Error ? err.message : "Failed");
    }
  };

  if (is_course_pending) {
    return <LessonViewSkeleton />;
  }

  if (course_error || !course || !lesson) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-destructive">
          {course_error instanceof Error ? course_error.message : "Lesson not found"}
        </p>
        <div className="mt-4">
          <Link href={`/courses/${course_slug}`}>
            <Button variant="outline" className="rounded-none">
              {t_courses("title")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <nav className="mb-4 text-sm text-muted-foreground">
            <Link href={`/courses/${course_slug}`}>{t_courses("title")}</Link>
            <span className="mx-2">/</span>
            <span>{lesson.title}</span>
          </nav>
          <h1 className="text-xl font-semibold">
            {t("title")}: {lesson.title}
          </h1>
          <div className="mt-4 prose prose-neutral dark:prose-invert max-w-none">
            {lesson.content ? (
              render_markdown(lesson.content)
            ) : (
              <p className="text-muted-foreground">Lesson content (CMS).</p>
            )}
          </div>
          {complete_success && (
            <p className="mt-4 text-sm text-primary">{t("completed")}</p>
          )}
          {complete_error && (
            <p className="mt-4 text-sm text-destructive">{complete_error}</p>
          )}
          <div className="mt-4 flex gap-2">
            <Button
              onClick={handle_complete}
              disabled={complete_success || complete_mutation.isPending}
              className="rounded-none"
            >
              {t("complete")}
            </Button>
            <Button
              variant="outline"
              onClick={toggle_editor}
              className="rounded-none"
            >
              {is_editor_open ? "Hide editor" : "Show editor"}
            </Button>
          </div>
        </section>
        <section className="min-w-0">
          {is_editor_open && (
            <LessonCodeEditor
              storageKey={`lesson:${course_slug}:${lesson_id}`}
              language="typescript"
            />
          )}
        </section>
      </div>
    </div>
  );
}
