"use client";

import { ModuleList } from "@/components/course/module-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockCourses } from "@/lib/data/mock-courses";
import { useUserStore } from "@/lib/store/user-store";
import { ArrowLeft, BookOpen, Clock3, Layers, Signal, Users } from "lucide-react";
import Link from "next/link";
import { use, type ComponentType } from "react";

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const enrollments = useUserStore((state) => state.enrollments);
  const completedLessons = useUserStore((state) => state.completedLessons);
  const course = mockCourses.find((item) => item.slug === slug);

  if (!course) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-8 text-center text-zinc-300">
        Course not found.
      </div>
    );
  }

  const isEnrolled = enrollments.includes(course.id);
  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const completed = completedLessons[course.id]?.length ?? 0;
  const progress = totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" className="border-white/20 bg-transparent text-zinc-100">
        <Link href="/courses">
          <ArrowLeft className="size-4" />
          Back to catalog
        </Link>
      </Button>

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/75 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(153,69,255,0.35),transparent_45%),radial-gradient(circle_at_85%_30%,rgba(20,241,149,0.22),transparent_40%)]" />
        <div className="relative space-y-4">
          <Badge className="w-fit bg-zinc-950/80 text-zinc-200">{course.difficulty}</Badge>
          <h1 className="text-3xl font-semibold text-zinc-100">{course.title}</h1>
          <p className="max-w-3xl text-zinc-300">{course.description}</p>

          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
            <div className="rounded-full border border-white/15 bg-zinc-950/70 px-3 py-1">Instructor: {course.instructor}</div>
            {course.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-white/20 text-zinc-300">
                {tag}
              </Badge>
            ))}
          </div>

          <Button className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black">
            {isEnrolled ? "Continue course" : "Enroll now"}
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatItem icon={Clock3} label="Duration" value={`${course.durationHours} hours`} />
        <StatItem icon={Users} label="Enrolled" value={course.enrolledCount.toLocaleString()} />
        <StatItem icon={Signal} label="Difficulty" value={course.difficulty} />
        <StatItem icon={Layers} label="Modules" value={course.modules.length.toString()} />
      </section>

      {isEnrolled ? (
        <section className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
            <span>Course progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-zinc-800" />
        </section>
      ) : null}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto flex-wrap gap-2 rounded-xl border border-white/10 bg-zinc-900/70 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <h2 className="text-lg font-semibold text-zinc-100">Course overview</h2>
          <p className="mt-2 text-sm text-zinc-300">{course.subtitle}</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {course.outcomes.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <ModuleList slug={course.slug} modules={course.modules} />
          <section className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Module estimates</h3>
            <div className="space-y-2">
              {course.modules.map((module, index) => {
                const timeEstimate = module.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
                return (
                  <div key={module.id} className="flex items-center justify-between rounded-md border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm">
                    <span className="text-zinc-200">
                      {index + 1}. {module.title}
                    </span>
                    <span className="text-zinc-400">
                      {module.lessons.length} lessons • {timeEstimate} min
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="prerequisites" className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <h2 className="text-lg font-semibold text-zinc-100">Prerequisites</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {course.prerequisites.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="reviews" className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <h2 className="text-lg font-semibold text-zinc-100">Builder reviews</h2>
          <div className="mt-3 space-y-2 text-sm text-zinc-300">
            <p className="rounded-md border border-white/10 bg-zinc-950/60 p-3">
              "Exactly what I needed to understand how to ship secure Solana modules in production."
            </p>
            <p className="rounded-md border border-white/10 bg-zinc-950/60 p-3">
              "Challenge lessons are practical and close to real protocol engineering workflows."
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <Button asChild variant="outline" className="border-white/20 bg-transparent text-zinc-100">
        <Link href={`/courses/${course.slug}/lessons/${course.modules[0]?.lessons[0]?.id ?? ""}`}>
          <BookOpen className="size-4" />
          Start first lesson
        </Link>
      </Button>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
        <Icon className="size-4" />
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-zinc-100">{value}</p>
    </article>
  );
}
