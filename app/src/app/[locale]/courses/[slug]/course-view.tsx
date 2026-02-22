"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useEnrollment } from "@/hooks/use-enrollment";
import { useWalletLink } from "@/hooks/use-wallet-link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { SignInModal } from "@/components/auth/sign-in-modal";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { useEffect, useState } from "react";
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
import type { Course } from "@/types/course";
import {
  BookOpen,
  Clock,
  Star,
  CheckCircle2,
  Play,
  Code,
  ArrowLeft,
  Users,
  Wallet,
  LogIn,
  X,
} from "lucide-react";
import Image from "next/image";

export default function CourseView({ course, slug }: { course: Course; slug: string }) {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const { publicKey } = useWallet();
  const { data: session } = useSession();
  const { linkWallet, linking: linkingWallet } = useWalletLink();
  const [signInOpen, setSignInOpen] = useState(false);
  const {
    enroll,
    closeEnrollment,
    refreshEnrollment,
    loading: enrolling,
    closing,
    error: enrollError,
    enrolled,
    checking,
    progress,
    isLessonComplete,
  } = useEnrollment(course.courseId, course.totalLessons, course.prerequisiteCourseId);

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.COURSE_VIEW, { slug });
  }, [slug]);

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
          <div className="overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-gold/10">
            {course.thumbnail && (
              <div className="relative aspect-video w-full">
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
              </div>
            )}
            <div className="p-8">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  style={{ borderColor: course.track.color, color: course.track.color }}
                >
                  {course.track.name}
                </Badge>
                <Badge variant="secondary">{tc(course.difficulty)}</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-bold">{course.title}</h1>
              <p className="mt-3 text-muted-foreground">{course.longDescription}</p>
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
                  {course.totalXP + course.bonusXP} {tc("xp")}
                  <span className="text-xs text-muted-foreground/70">
                    ({course.xpPerLesson}/lesson
                    {course.bonusXP > 0 && ` · +${course.bonusXP} bonus`})
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {t("instructor")}: {course.instructor.name}
                </span>
              </div>
            </div>
          </div>

          {/* Modules */}
          <div className="mt-8">
            <h2 className="text-xl font-bold">{t("modules")}</h2>
            <Accordion type="multiple" defaultValue={["m-0"]} className="mt-4">
              {(() => {
                let globalIdx = 0;
                return course.modules.map((mod, modIdx) => (
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
                      <p className="mb-4 text-sm text-muted-foreground">{mod.description}</p>
                      <div className="space-y-2">
                        {mod.lessons.map((lesson) => {
                          const lessonIdx = globalIdx++;
                          const done = enrolled && !checking && isLessonComplete(lessonIdx);
                          return (
                            <Link key={lesson.id} href={`/courses/${slug}/lessons/${lesson.id}`}>
                              <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                  {lesson.type === "challenge" ? (
                                    <Code className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Play className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{lesson.title}</p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span>
                                      {lesson.duration} {tc("minutes")}
                                    </span>
                                    <span>
                                      {course.xpPerLesson ?? 0} {tc("xp")}
                                    </span>
                                    {lesson.type === "challenge" && (
                                      <Badge variant="outline" className="text-[10px]">
                                        {tc("challenge") || "Challenge"}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <CheckCircle2
                                  className={`h-4 w-4 shrink-0 transition-colors ${
                                    done
                                      ? "text-green-500"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ));
              })()}
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
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="mt-2" />
              </div>

              {checking ? (
                <Button className="w-full gap-2" size="lg" variant="secondary" disabled>
                  Checking...
                </Button>
              ) : enrolled ? (
                <div className="space-y-2">
                  <Button className="w-full gap-2" size="lg" variant="secondary" disabled>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("enrolled") || "Enrolled"}
                  </Button>
                  <Button
                    className="w-full gap-2"
                    size="sm"
                    variant="ghost"
                    disabled={closing || !course.courseId}
                    onClick={() => {
                      if (course.courseId) closeEnrollment(course.courseId);
                    }}
                  >
                    <X className="h-3 w-3" />
                    {closing ? "Closing..." : "Close Enrollment"}
                  </Button>
                </div>
              ) : !session?.user ? (
                // Guest: sign in first
                <>
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => setSignInOpen(true)}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In to Enroll
                  </Button>
                  <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
                </>
              ) : !publicKey ? (
                // Logged in but no wallet → full link+persist flow
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={linkWallet}
                  disabled={linkingWallet}
                >
                  <Wallet className="h-4 w-4" />
                  {linkingWallet ? "Linking wallet..." : "Link Wallet to Enroll"}
                </Button>
              ) : (
                <Button
                  className="w-full gap-2"
                  size="lg"
                  disabled={enrolling || !course.courseId}
                  onClick={() => {
                    if (course.courseId) enroll(course.courseId);
                  }}
                >
                  <Play className="h-4 w-4" />
                  {enrolling ? "Enrolling..." : t("enrollNow")}
                </Button>
              )}
              {enrollError && (
                <p className="mt-2 text-xs text-red-500">{enrollError}</p>
              )}

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("totalXP")}</span>
                  <div className="text-right">
                    <span className="font-medium">{course.totalXP + course.bonusXP} XP</span>
                    {course.bonusXP > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {course.xpPerLesson}/lesson · +{course.bonusXP} bonus
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("totalDuration")}</span>
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

              {course.prerequisite && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-medium">{t("prerequisites")}</h3>
                  <div className="mt-2">
                    <Link
                      href={`/courses/${course.prerequisite.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {course.prerequisite.title || course.prerequisite.id}
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-medium">{t("instructor")}</h3>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-bold text-primary">
                      {course.instructor.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{course.instructor.name}</p>
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
