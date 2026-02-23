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
  const enroll = useUserStore((state) => state.enroll);
  const course = mockCourses.find((item) => item.slug === slug);

  if (!course) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
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
      <Button asChild variant="outline" className="border-border bg-transparent text-foreground">
        <Link href="/courses">
          <ArrowLeft className="size-4" />
          Back to catalog
        </Link>
      </Button>

      <section className="relative overflow-hidden rounded-2xl border border-border bg-card/75 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(47,107,63,0.35),transparent_45%),radial-gradient(circle_at_85%_30%,rgba(255,210,63,0.22),transparent_40%)]" />
        <div className="relative space-y-4">
          <Badge className="w-fit bg-st-dark/80 text-foreground/90">{course.difficulty}</Badge>
          <h1 className="text-3xl font-semibold text-foreground">{course.title}</h1>
          <p className="max-w-3xl text-muted-foreground">{course.description}</p>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <div className="rounded-full border border-border bg-st-dark/70 px-3 py-1">Instructor: {course.instructor}</div>
            {course.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-border text-muted-foreground">
                {tag}
              </Badge>
            ))}
          </div>

          {isEnrolled ? (
            <Button asChild className="bg-gradient-to-r from-[#2f6b3f] to-[#ffd23f] text-st-dark">
              <Link href={`/courses/${course.slug}/lessons/${course.modules[0]?.lessons[0]?.id ?? ""}`}>
                Continue course
              </Link>
            </Button>
          ) : (
            <Button
              className="bg-gradient-to-r from-[#2f6b3f] to-[#ffd23f] text-st-dark"
              onClick={() => enroll(course.id)}
            >
              Enroll now
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatItem icon={Clock3} label="Duration" value={`${course.durationHours} hours`} />
        <StatItem icon={Users} label="Enrolled" value={course.enrolledCount.toLocaleString()} />
        <StatItem icon={Signal} label="Difficulty" value={course.difficulty} />
        <StatItem icon={Layers} label="Modules" value={course.modules.length.toString()} />
      </section>

      {isEnrolled ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>Course progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-secondary" />
        </section>
      ) : null}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto flex-wrap gap-2 rounded-xl border border-border bg-card p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold text-foreground">Course overview</h2>
          <p className="mt-2 text-sm text-muted-foreground">{course.subtitle}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {course.outcomes.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <ModuleList slug={course.slug} modules={course.modules} />
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Module estimates</h3>
            <div className="space-y-2">
              {course.modules.map((module, index) => {
                const timeEstimate = module.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
                return (
                  <div key={module.id} className="flex items-center justify-between rounded-md border border-border bg-st-dark/60 px-3 py-2 text-sm">
                    <span className="text-foreground/90">
                      {index + 1}. {module.title}
                    </span>
                    <span className="text-muted-foreground">
                      {module.lessons.length} lessons • {timeEstimate} min
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="prerequisites" className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold text-foreground">Prerequisites</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {course.prerequisites.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="reviews" className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold text-foreground">Builder reviews</h2>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p className="rounded-md border border-border bg-st-dark/60 p-3">
              "Exactly what I needed to understand how to ship secure Solana modules in production."
            </p>
            <p className="rounded-md border border-border bg-st-dark/60 p-3">
              "Challenge lessons are practical and close to real protocol engineering workflows."
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <Button asChild variant="outline" className="border-border bg-transparent text-foreground">
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
    <article className="rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground/70">
        <Icon className="size-4" />
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </article>
  );
}
