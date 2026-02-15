"use client";

import { use, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Clock, BookOpen, Zap, Users, CheckCircle2, Circle, Code, Trophy, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useCourse, useProgress, useEnroll, useDisplayName, useSetDisplayName } from "@/lib/hooks/use-service";
import { DIFFICULTY_CONFIG, TRACKS } from "@/types/course";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useTranslations("courses");
  const tl = useTranslations("lesson");
  const tc = useTranslations("common");
  const { data: course, isLoading } = useCourse(slug);
  const courseId = course?.id ?? slug;
  const { data: progress } = useProgress(courseId);
  const { connected } = useWallet();
  const enrollMutation = useEnroll();
  const { data: displayName } = useDisplayName();
  const setDisplayNameMutation = useSetDisplayName();
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{t("courseNotFound")}</h1>
        <Button asChild className="mt-4"><Link href="/courses">{t("backToCourses")}</Link></Button>
      </div>
    );
  }

  const difficulty = DIFFICULTY_CONFIG[course.difficulty];
  const track = TRACKS[course.trackId];
  const isEnrolled = !!progress;
  const completedLessons = progress?.lessonsCompleted.length ?? 0;

  const handleEnrollClick = () => {
    if (!connected) {
      toast.error(t("connectWalletFirst"));
      return;
    }
    if (!displayName) {
      setNameInput("");
      setEnrollDialogOpen(true);
      return;
    }
    doEnroll();
  };

  const doEnroll = () => {
    enrollMutation.mutate(course.id, {
      onSuccess: (data) => {
        if (data.txSignature) {
          toast.success(t("enrolledOnChain"), {
            description: `Tx: ${data.txSignature.slice(0, 8)}...${data.txSignature.slice(-8)}`,
            action: {
              label: tc("view"),
              onClick: () => window.open(`https://explorer.solana.com/tx/${data.txSignature}?cluster=devnet`, "_blank"),
            },
          });
        } else {
          toast.success(t("enrolledSuccess"));
        }
      },
      onError: () => toast.error(t("enrollFailed")),
    });
  };

  const handleEnrollWithName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      toast.error(t("enterName"));
      return;
    }
    setDisplayNameMutation.mutate(trimmed, {
      onSuccess: () => {
        setEnrollDialogOpen(false);
        doEnroll();
      },
    });
  };

  let lessonGlobalIndex = 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/courses" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("backToCourses")}
      </Link>

      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={course.difficulty as "beginner" | "intermediate" | "advanced"}>{difficulty.label}</Badge>
          {track && track.name !== "standalone" && <Badge variant="outline">{track.display}</Badge>}
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">{course.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{course.description}</p>

        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{course.duration}</span>
          <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" />{course.lessonCount} {tc("lessons", { count: course.lessonCount })}</span>
          <span className="flex items-center gap-1.5"><Code className="h-4 w-4" />{course.challengeCount} {t("challengeCount")}</span>
          <span className="flex items-center gap-1.5 text-xp-gold"><Zap className="h-4 w-4" />{course.xpTotal} XP</span>
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{course.totalEnrollments.toLocaleString()} {t("enrolled")}</span>
          <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4" />{course.totalCompletions.toLocaleString()} {tc("completed")}</span>
        </div>
      </div>

      {isEnrolled && progress && (
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t("yourProgress")}</span>
              <span className="text-sm font-medium">{completedLessons}/{course.lessonCount} {tc("lessons", { count: course.lessonCount })}</span>
            </div>
            <Progress value={progress.percentComplete} indicatorClassName="bg-solana-green" />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">{t("curriculum")}</h2>
          <Accordion type="multiple" defaultValue={course.modules.map((m) => m.id)}>
            {course.modules.map((module) => (
              <AccordionItem key={module.id} value={module.id}>
                <AccordionTrigger className="text-left">
                  <div>
                    <p className="font-medium">{module.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{module.lessons.length} {tc("lessons", { count: module.lessons.length })}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {module.lessons.map((lesson) => {
                      const currentIndex = lessonGlobalIndex++;
                      const completed = progress?.lessonsCompleted.includes(currentIndex);
                      return (
                        <Link
                          key={lesson.id}
                          href={isEnrolled ? `/courses/${slug}/lessons/${lesson.id}` : "#"}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                            isEnrolled ? "hover:bg-muted cursor-pointer" : "opacity-60 cursor-not-allowed"
                          }`}
                          onClick={(e) => !isEnrolled && e.preventDefault()}
                        >
                          {completed ? (
                            <CheckCircle2 className="h-4 w-4 text-solana-green shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className={completed ? "line-through text-muted-foreground" : ""}>
                            {lesson.title}
                          </span>
                          {lesson.type === "challenge" && (
                            <Badge variant="outline" className="ml-auto text-[10px]">{t("challenge")}</Badge>
                          )}
                          <span className="ml-auto text-xs text-muted-foreground">{lesson.duration}</span>
                        </Link>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">{t("courseInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("creator")}</span>
                <span className="font-medium">{course.creator}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("difficulty")}</span>
                <Badge variant={course.difficulty as "beginner" | "intermediate" | "advanced"} className="text-xs">{difficulty.label}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("totalXP")}</span>
                <span className="font-medium text-xp-gold">{course.xpTotal} XP</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("lessonCount")}</span>
                <span className="font-medium">{course.lessonCount}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("challengeCount")}</span>
                <span className="font-medium">{course.challengeCount}</span>
              </div>
              {!isEnrolled ? (
                <Button onClick={handleEnrollClick} className="w-full mt-4" variant="solana" disabled={enrollMutation.isPending}>
                  {enrollMutation.isPending ? t("enrolling") : t("enrollNow")}
                </Button>
              ) : progress?.completedAt ? (
                <div className="space-y-2 mt-4">
                  <Badge className="w-full justify-center py-2 bg-solana-green text-black">{tc("completed")}</Badge>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/certificates/${course.trackId}`}>{t("viewCertificate")}</Link>
                  </Button>
                </div>
              ) : (
                <Button asChild className="w-full mt-4">
                  <Link href={`/courses/${slug}/lessons/${course.modules[0]?.lessons[0]?.id}`}>
                    {t("continueLearning")}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> {t("whatsYourName")}
            </DialogTitle>
            <DialogDescription>
              {t("nameOnCertificates")}
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder={t("enterYourName")}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEnrollWithName()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button
              variant="solana"
              onClick={handleEnrollWithName}
              disabled={setDisplayNameMutation.isPending || enrollMutation.isPending}
            >
              {setDisplayNameMutation.isPending ? tc("saving") : tc("enroll")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
