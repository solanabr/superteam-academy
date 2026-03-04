"use client";

import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useLocale } from "@/contexts/locale-context";
import { useLearning } from "@/contexts/learning-context";
import { getCourseBySlug, getCourseById } from "@/services/course-data";
import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Clock,
  Zap,
  Users,
  CheckCircle,
  Circle,
  ArrowRight,
  Lock,
  PlayCircle,
  Code2,
} from "lucide-react";

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const course = getCourseBySlug(slug);
  const { t } = useLocale();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { getProgress, enrollInCourse } = useLearning();

  if (!course) {
    notFound();
  }

  const progress = getProgress(course.id);
  const isEnrolled = !!progress;
  const isCompleted =
    progress?.completedAt !== null && progress?.completedAt !== undefined;
  const totalXp = course.xpPerLesson * course.lessonCount;
  const bonusXp = Math.floor(totalXp / 2);
  const prerequisiteCourse = course.prerequisite
    ? getCourseById(course.prerequisite)
    : null;

  const handleEnroll = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    await enrollInCourse(course.id);
  };

  const firstLessonId = course.modules[0]?.lessons[0]?.id ?? 0;

  return (
    <div className="animate-fade-in">
      {/* Course Header */}
      <div className="border-b border-border/40 bg-gradient-to-b from-violet-500/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <DifficultyBadge difficulty={course.difficulty} />
                <Badge variant="secondary">Track {course.trackId}</Badge>
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">{course.title}</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                {course.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {course.lessonCount} {t("courses.lessons")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {course.estimatedHours} {t("courses.hours")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-violet-500" />
                  {totalXp + bonusXp} XP {t("courses.xpReward", { amount: "" })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {course.totalCompletions} {t("courses.students")}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {course.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Enrollment Card */}
            <div>
              <Card className="border-border/40">
                <CardContent className="p-6">
                  {isEnrolled && !isCompleted && progress && (
                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span>
                          {t("courses.progress", {
                            percent: Math.round(progress.percentComplete),
                          })}
                        </span>
                        <span className="text-muted-foreground">
                          {progress.completedLessons.length}/{progress.totalLessons}
                        </span>
                      </div>
                      <Progress value={progress.percentComplete} className="h-2" />
                    </div>
                  )}

                  {isCompleted ? (
                    <Button className="w-full" asChild>
                      <Link href={`/certificates/${course.id}`}>
                        {t("courses.viewCertificate")}
                      </Link>
                    </Button>
                  ) : isEnrolled ? (
                    <Button
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                      asChild
                    >
                      <Link
                        href={`/courses/${course.slug}/lessons/${firstLessonId}`}
                      >
                        {t("courses.resumeCourse")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                      onClick={handleEnroll}
                    >
                      {t("courses.startCourse")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}

                  <Separator className="my-4" />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t("courses.prerequisites")}
                      </span>
                      <span>
                        {prerequisiteCourse ? (
                          <Link
                            href={`/courses/${prerequisiteCourse.slug}`}
                            className="text-violet-500 hover:underline"
                          >
                            {prerequisiteCourse.title}
                          </Link>
                        ) : (
                          t("courses.noPrerequisites")
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        XP / {t("courses.lessons").replace(/s$/, "")}
                      </span>
                      <span>{course.xpPerLesson} XP</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Completion Bonus</span>
                      <span>{bonusXp} XP</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t("courses.modules")}
                      </span>
                      <span>{course.modules.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modules & Lessons */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold">{t("courses.modules")}</h2>

        <div className="space-y-4">
          {course.modules.map((mod) => (
            <Card key={mod.id} className="border-border/40">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{mod.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {mod.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {mod.lessons.length} {t("courses.lessons")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <ul className="space-y-2">
                  {mod.lessons.map((lesson) => {
                    const isLessonComplete =
                      progress?.completedLessons.includes(lesson.id) ?? false;
                    const isCodeChallenge = lesson.type === "code-challenge";

                    return (
                      <li key={lesson.id}>
                        {isEnrolled ? (
                          <Link
                            href={`/courses/${course.slug}/lessons/${lesson.id}`}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                          >
                            {isLessonComplete ? (
                              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className={isLessonComplete ? "text-muted-foreground" : ""}>
                              {lesson.title}
                            </span>
                            {isCodeChallenge && (
                              <Code2 className="ml-auto h-4 w-4 text-violet-500" />
                            )}
                            {!isCodeChallenge && (
                              <PlayCircle className="ml-auto h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {lesson.estimatedMinutes}m
                            </span>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground">
                            <Lock className="h-4 w-4 shrink-0" />
                            <span>{lesson.title}</span>
                            {isCodeChallenge && (
                              <Code2 className="ml-auto h-4 w-4" />
                            )}
                            <span className="text-xs">{lesson.estimatedMinutes}m</span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
