"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Clock,
  Flame,
  BookOpen,
  Play,
  FileText,
  Code,
  Star,
  Users,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCourseBySlug, type Module } from "@/data/courses";

/* ── Lesson type icon ── */

function LessonIcon({ type }: { type: "video" | "reading" | "challenge" }) {
  if (type === "video") return <Play className="size-3.5" />;
  if (type === "challenge") return <Code className="size-3.5" />;
  return <FileText className="size-3.5" />;
}

/* ── Expandable module ── */

function ModuleSection({
  module,
  index,
  accent,
  defaultOpen,
}: {
  module: Module;
  index: number;
  accent: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const completedCount = module.lessons.filter((l) => l.completed).length;
  const totalDuration = module.lessons.reduce((acc, l) => {
    const mins = parseInt(l.duration);
    return acc + (isNaN(mins) ? 0 : mins);
  }, 0);

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/60 backdrop-blur-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-card/80 transition-colors"
      >
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
          style={{
            background: `${accent}15`,
            color: accent,
          }}
        >
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{module.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {module.lessons.length} lessons · {totalDuration} min
            {completedCount > 0 && ` · ${completedCount} completed`}
          </p>
        </div>
        {completedCount === module.lessons.length && module.lessons.length > 0 ? (
          <CheckCircle2 className="size-4 shrink-0" style={{ color: accent }} />
        ) : (
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && (
        <div className="border-t border-border/50">
          {module.lessons.map((lesson, i) => (
            <div
              key={lesson.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex size-6 shrink-0 items-center justify-center">
                {lesson.completed ? (
                  <CheckCircle2
                    className="size-4"
                    style={{ color: accent }}
                  />
                ) : (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </div>
              <LessonIcon type={lesson.type} />
              <span className="flex-1 text-sm truncate">{lesson.title}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {lesson.duration}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Star rating ── */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
        />
      ))}
    </div>
  );
}

/* ── Page ── */

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const course = getCourseBySlug(slug);

  if (!course) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="size-12 text-muted-foreground/30 mx-auto" />
          <h1 className="mt-4 text-xl font-semibold">Course not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This course doesn&apos;t exist or has been removed.
          </p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/courses">
              <ArrowLeft className="size-3.5" />
              Back to courses
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const progress =
    course.completed > 0
      ? Math.round((course.completed / course.lessons) * 100)
      : 0;

  const totalModules = course.modules.length;
  const completedModules = course.modules.filter((m) =>
    m.lessons.every((l) => l.completed)
  ).length;

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-mesh animate-drift-2" />
      <div
        className="pointer-events-none absolute top-[10%] right-[15%] h-72 w-72 rounded-full blur-[120px] opacity-20 animate-float-1"
        style={{ background: course.accent }}
      />
      <div className="pointer-events-none absolute bottom-[20%] left-[5%] h-56 w-56 rounded-full bg-amber-500/8 blur-[80px] animate-float-2" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-28 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/courses" className="hover:text-foreground transition-colors">
            Courses
          </Link>
          <span>/</span>
          <span className="text-foreground truncate">{course.title}</span>
        </div>

        {/* ── Course Header ── */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Left: Course info */}
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: course.accent }}
              >
                {course.topicLabel}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {course.difficulty}
              </Badge>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {course.title}
            </h1>

            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
              {course.longDescription}
            </p>

            {/* Meta row */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" />
                {course.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="size-4" />
                {course.lessons} lessons
              </span>
              <span className="flex items-center gap-1.5">
                <Flame className="size-4 text-xp" />
                {course.xp} XP
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-4" />
                {course.instructor.name}
              </span>
            </div>

            {/* Code preview */}
            <div className="mt-8 relative h-36 overflow-hidden rounded-xl border border-border/50 bg-[#0c0c0e] px-5 pt-4">
              <div
                className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-[60px] opacity-30"
                style={{ background: course.accent }}
              />
              <div className="font-mono text-[11px] leading-[1.7] text-[#a1a1aa66]">
                {course.codePreview.map((line, i) => (
                  <div key={i} className="truncate">
                    <span className="mr-3 inline-block w-3 text-right text-[10px] text-[#a1a1aa33]">
                      {i + 1}
                    </span>
                    {line}
                  </div>
                ))}
              </div>
              <div
                className="absolute bottom-3 left-5 flex size-10 items-center justify-center rounded-lg border font-mono text-xs font-bold"
                style={{
                  borderColor: `${course.accent}40`,
                  color: course.accent,
                  background: `${course.accent}10`,
                }}
              >
                <course.icon className="size-5" />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-[#0c0c0e] to-transparent" />
            </div>
          </div>

          {/* Right: Enrollment card */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="p-5 pb-0">
                <CardTitle className="text-lg">Course Progress</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {/* Progress bar */}
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {course.completed}/{course.lessons} lessons
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border/50">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      background: course.accent,
                    }}
                  />
                </div>

                {/* Stats */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                    <p className="text-xl font-semibold">{totalModules}</p>
                    <p className="text-[11px] text-muted-foreground">Modules</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                    <p className="text-xl font-semibold">{completedModules}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Completed
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                    <p
                      className="text-xl font-semibold"
                      style={{ color: course.accent }}
                    >
                      {course.xp}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      XP to earn
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                    <p className="text-xl font-semibold">{course.duration}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Duration
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  className="mt-5 w-full font-medium"
                  size="lg"
                  style={{
                    background: course.accent,
                    color: "#000",
                  }}
                >
                  {progress > 0 ? (
                    <>
                      Continue Learning
                      <ArrowRight className="size-4" />
                    </>
                  ) : (
                    <>
                      Start Course
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>

                {/* Instructor */}
                <div className="mt-5 flex items-center gap-3 border-t border-border/50 pt-4">
                  <div
                    className="flex size-9 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: `${course.accent}15`,
                      color: course.accent,
                    }}
                  >
                    {course.instructor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {course.instructor.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {course.instructor.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Curriculum ── */}
        <div className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight">Curriculum</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalModules} modules · {course.lessons} lessons ·{" "}
            {course.duration} total
          </p>

          <div className="mt-6 space-y-3">
            {course.modules.map((module, i) => (
              <ModuleSection
                key={module.id}
                module={module}
                index={i}
                accent={course.accent}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        </div>

        {/* ── Reviews ── */}
        {course.reviews.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-semibold tracking-tight">
              Student Reviews
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              What learners are saying about this course
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {course.reviews.map((review, i) => (
                <Card
                  key={i}
                  className="border-border/50 bg-card/60 backdrop-blur-sm"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex size-8 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            background: `${course.accent}15`,
                            color: course.accent,
                          }}
                        >
                          {review.name[0]}
                        </div>
                        <span className="text-sm font-medium">
                          {review.name}
                        </span>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      &ldquo;{review.text}&rdquo;
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom CTA ── */}
        <div className="mt-14 text-center">
          <Button
            size="lg"
            className="font-medium"
            style={{
              background: course.accent,
              color: "#000",
            }}
          >
            {progress > 0 ? "Continue Learning" : "Start Course"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
