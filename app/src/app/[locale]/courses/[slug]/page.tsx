"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getCourseBySlug } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Clock,
  Star,
  CheckCircle2,
  Play,
  Code,
  ArrowLeft,
  Users,
} from "lucide-react";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const course = getCourseBySlug(slug);

  if (!course) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <Link href="/courses">
          <Button className="mt-4">{tc("back")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/courses">
        <Button variant="ghost" size="sm" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          {tc("back")}
        </Button>
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Hero */}
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-gold/10 p-8">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                style={{
                  borderColor: course.track.color,
                  color: course.track.color,
                }}
              >
                {course.track.name}
              </Badge>
              <Badge variant="secondary">{tc(course.difficulty)}</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-bold">{course.title}</h1>
            <p className="mt-3 text-muted-foreground">
              {course.longDescription}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {course.totalLessons} {tc("lessons")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {Math.round(course.totalDuration / 60)}h{" "}
                {t("totalDuration").toLowerCase()}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4" />
                {course.totalXP} {tc("xp")}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {t("instructor")}: {course.instructor.name}
              </span>
            </div>
          </div>

          {/* Modules */}
          <div className="mt-8">
            <h2 className="text-xl font-bold">{t("modules")}</h2>
            <Accordion type="multiple" defaultValue={["m-0"]} className="mt-4">
              {course.modules.map((mod, modIdx) => (
                <AccordionItem key={mod.id} value={`m-${modIdx}`}>
                  <AccordionTrigger className="text-left">
                    <div className="flex flex-1 items-center justify-between pr-4">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Module {modIdx + 1}
                        </span>
                        <p className="font-semibold">{mod.title}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {mod.lessons.length} {tc("lessons")}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {mod.description}
                    </p>
                    <div className="space-y-2">
                      {mod.lessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          href={`/courses/${slug}/lessons/${lesson.id}`}
                        >
                          <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              {lesson.type === "challenge" ? (
                                <Code className="h-4 w-4 text-primary" />
                              ) : (
                                <Play className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {lesson.title}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>
                                  {lesson.duration} {tc("minutes")}
                                </span>
                                <span>
                                  {lesson.xpReward} {tc("xp")}
                                </span>
                                {lesson.type === "challenge" && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {tc("challenge") || "Challenge"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span>{t("progress")}</span>
                  <span className="font-medium">0%</span>
                </div>
                <Progress value={0} className="mt-2" />
              </div>

              <Button className="w-full gap-2" size="lg">
                <Play className="h-4 w-4" />
                {t("enrollNow")}
              </Button>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("totalXP")}</span>
                  <span className="font-medium">{course.totalXP} XP</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("totalDuration")}
                  </span>
                  <span className="font-medium">
                    {Math.round(course.totalDuration / 60)}h
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{tc("lessons")}</span>
                  <span className="font-medium">{course.totalLessons}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{tc("level")}</span>
                  <Badge variant="secondary">{tc(course.difficulty)}</Badge>
                </div>
              </div>

              {course.prerequisites.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-medium">{t("prerequisites")}</h3>
                  <ul className="mt-2 space-y-1">
                    {course.prerequisites.map((prereq) => (
                      <li
                        key={prereq}
                        className="text-sm text-muted-foreground"
                      >
                        {prereq}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Instructor */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-medium">{t("instructor")}</h3>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-bold text-primary">
                      {course.instructor.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {course.instructor.name}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {course.instructor.bio}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
