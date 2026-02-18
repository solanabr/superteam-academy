"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Clock,
  Users,
  Star,
  Zap,
  BookOpen,
  Play,
  FileText,
  Code2,
  CheckCircle2,
  Circle,
  ChevronDown,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Course } from "@/lib/course-catalog";
import { sendEnrollCourse } from "@/lib/solana/enroll-course";
import { ACADEMY_CLUSTER } from "@/lib/generated/academy-program";
import { useOptimisticMutation } from "@/lib/hooks/use-optimistic-mutation";

const lessonIcons = {
  video: Play,
  reading: FileText,
  challenge: Code2,
};

const difficultyColor = {
  Beginner: "border-primary bg-primary/10 text-primary",
  Intermediate:
    "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]",
  Advanced: "border-destructive bg-destructive/10 text-destructive",
};

const reviews = [
  {
    name: "Gabriel Tanaka",
    avatar: "GT",
    rating: 5,
    text: "Absolutely brilliant course. The interactive challenges really solidify the concepts.",
    date: "2 weeks ago",
  },
  {
    name: "Laura Andrade",
    avatar: "LA",
    rating: 5,
    text: "Best Solana course I've taken. The instructor explains complex topics with clarity.",
    date: "1 month ago",
  },
  {
    name: "Bruno Sato",
    avatar: "BS",
    rating: 4,
    text: "Great content and structure. Would love to see more advanced security topics covered.",
    date: "2 months ago",
  },
];

export function CourseDetail({
  course,
  enrolledOnChain = false,
}: {
  course: Course;
  enrolledOnChain?: boolean;
}) {
  const t = useTranslations("courseDetail");
  const tCatalog = useTranslations("catalog");
  const { publicKey, sendTransaction } = useWallet();
  const router = useRouter();

  const toastId = "enroll-toast";
  const {
    state: enrolled,
    mutate: enroll,
    isPending: isEnrolling,
  } = useOptimisticMutation<boolean, string>({
    initialState: enrolledOnChain || course.progress > 0,
    onMutate: () => true,
    mutationFn: async () => {
      if (!publicKey || !sendTransaction)
        throw new Error("Connect a wallet to enroll.");
      toast.loading(`Enrolling in ${course.title}...`, { id: toastId });

      const ensureResponse = await fetch("/api/academy/courses/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug: course.slug }),
      });
      if (!ensureResponse.ok) {
        const payload = (await ensureResponse.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Failed to ensure course on-chain.");
      }

      return sendEnrollCourse(
        sendTransaction,
        publicKey.toBase58(),
        course.slug,
      );
    },
    onSuccess: (sig) => {
      const explorerUrl = `https://explorer.solana.com/tx/${sig}${ACADEMY_CLUSTER === "devnet" ? "?cluster=devnet" : ""}`;
      toast.success("Enrolled!", {
        id: toastId,
        description: "You're now enrolled in this course.",
        action: {
          label: "View on Explorer",
          onClick: () => window.open(explorerUrl, "_blank"),
        },
      });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Enrollment failed.", {
        id: toastId,
        action: { label: "Retry", onClick: () => enroll() },
      });
    },
  });

  const totalLessons = course.modules.reduce(
    (acc, m) => acc + m.lessons.length,
    0,
  );
  const completedLessons = course.modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.completed).length,
    0,
  );

  let nextLessonId: string | null = null;
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (!lesson.completed) {
        nextLessonId = lesson.id;
        break;
      }
    }
    if (nextLessonId) break;
  }

  return (
    <div>
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge
                  variant="outline"
                  className={difficultyColor[course.difficulty]}
                >
                  {course.difficulty}
                </Badge>
                {course.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-secondary text-muted-foreground text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              <h1 className="text-3xl font-bold text-foreground lg:text-4xl text-balance">
                {course.title}
              </h1>
              <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">
                {course.description}
              </p>

              {/* Instructor */}
              <div className="flex items-center gap-3 mt-6">
                <Avatar className="h-10 w-10 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-sm text-primary">
                    {course.instructorAvatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {course.instructor}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("courseInstructor")}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {course.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> {course.lessons}{" "}
                  {tCatalog("lessons")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />{" "}
                  {course.enrolled.toLocaleString()} {tCatalog("enrolled")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-[hsl(var(--gold))]" />{" "}
                  {course.rating}
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-primary" /> {course.xp} XP
                </span>
              </div>
            </div>

            {/* Enrollment card */}
            <div className="lg:row-start-1 lg:col-start-3">
              <div className="rounded-xl border border-border bg-card p-6 glow-green">
                {enrolled && !isEnrolling ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        {t("yourProgress")}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {course.progress}%
                      </span>
                    </div>
                    <Progress
                      value={course.progress}
                      className="h-2 mb-4 bg-secondary [&>div]:bg-primary"
                    />
                    <p className="text-xs text-muted-foreground mb-4">
                      {t("lessonsCompleted", {
                        completed: completedLessons,
                        total: totalLessons,
                      })}
                    </p>
                    <Link
                      href={`/courses/${course.slug}/lessons/${nextLessonId || "1-1"}`}
                    >
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                        {t("continueLearning")}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <p className="text-2xl font-bold text-foreground">
                        {t("free")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("earnXp", { xp: course.xp })}
                      </p>
                    </div>
                    <Button
                      onClick={() => enroll()}
                      disabled={isEnrolling}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                    >
                      {isEnrolling ? t("enrolling") : t("enroll")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Separator className="my-4" />
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />{" "}
                    {course.modules.length} {t("modules").toLowerCase()}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />{" "}
                    {t("interactiveChallenges")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />{" "}
                    {t("nftCertificate")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />{" "}
                    {t("lifetimeAccess")}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              {t("courseContent")}
            </h2>
            <div className="space-y-3">
              {course.modules.map((mod, mi) => {
                const modCompleted = mod.lessons.filter(
                  (l) => l.completed,
                ).length;
                return (
                  <Collapsible key={mod.title} defaultOpen={mi === 0}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {mi + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {mod.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t("moduleLessons", { count: mod.lessons.length })}{" "}
                            ·{" "}
                            {t("moduleCompleted", {
                              completed: modCompleted,
                              total: mod.lessons.length,
                            })}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>svg]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-4 border-l border-border pl-6 pt-2 pb-1 space-y-1">
                        {mod.lessons.map((lesson) => {
                          const Icon = lessonIcons[lesson.type];
                          const canAccess = enrolled && !isEnrolling;
                          const inner = (
                            <>
                              {lesson.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                              ) : canAccess ? (
                                <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                              )}
                              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span
                                className={
                                  lesson.completed
                                    ? "text-muted-foreground line-through"
                                    : "text-foreground"
                                }
                              >
                                {lesson.title}
                              </span>
                              <span className="ml-auto text-xs text-muted-foreground shrink-0">
                                {lesson.duration}
                              </span>
                            </>
                          );
                          return canAccess ? (
                            <Link
                              key={lesson.id}
                              href={`/courses/${course.slug}/lessons/${lesson.id}`}
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary/50"
                            >
                              {inner}
                            </Link>
                          ) : (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm opacity-60"
                            >
                              {inner}
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>

            {/* Reviews */}
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                {t("reviews")}
              </h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.name}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {review.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {review.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {review.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < review.rating
                                ? "text-[hsl(var(--gold))] fill-[hsl(var(--gold))]"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
