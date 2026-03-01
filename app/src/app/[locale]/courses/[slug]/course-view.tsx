"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useEnrollment } from "@/hooks/use-enrollment";
import { useWalletLink } from "@/hooks/use-wallet-link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { SignInModal } from "@/components/auth/sign-in-modal";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useOnChainProgress } from "@/hooks/use-onchain-progress";
import { Button } from "@/components/ui/button";
import { CredentialModal, type CredentialModalData } from "@/components/credential-modal";
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
import { SUBMISSION_STATUS } from "@/types/course";
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
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function CourseView({ course, slug, preview = false }: { course: Course; slug: string; preview?: boolean }) {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const wallet = useWallet();
  const { publicKey } = wallet;
  const { data: session } = useSession();
  const { linkWallet, linking: linkingWallet } = useWalletLink();
  const walletAddress = session?.walletAddress;
  const sessionProvider = session?.provider;

  // Disconnect wallet adapter when signed in via non-wallet provider (Google/GitHub)
  // so the user must explicitly reconnect their wallet for enrollment.
  useEffect(() => {
    if (
      session?.user &&
      sessionProvider &&
      sessionProvider !== "solana-wallet" &&
      wallet.connected
    ) {
      wallet.disconnect();
    }
    // Only run when session/provider changes, not on every wallet state change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user, sessionProvider]);
  // Check if this course was already completed via credential completedCourseIds
  const { credentials, loading: credentialsLoading } = useOnChainProgress(walletAddress);
  const alreadyCompleted = useMemo(() => {
    if (!course.courseId || !course.track.trackId) return false;
    const trackCred = credentials.find((c) => c.trackId === course.track.trackId);
    return !!trackCred?.completedCourseIds?.includes(course.courseId);
  }, [credentials, course.courseId, course.track.trackId]);

  const [signInOpen, setSignInOpen] = useState(false);
  const [credentialModal, setCredentialModal] = useState<CredentialModalData | null>(null);
  const [collecting, setCollecting] = useState(false);
  const {
    enroll,
    closeEnrollment,
    refreshEnrollment,
    loading: enrolling,
    closing,
    error: enrollError,
    enrolled,
    checking,
    enrollment,
    progress,
    isLessonComplete,
  } = useEnrollment(course.courseId, course.totalLessons, course.prerequisiteCourseId);

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.COURSE_VIEW, { slug });
  }, [slug]);

  const isFinalized = !!enrollment?.completedAt;
  const hasCredential = !!enrollment?.credentialAsset &&
    enrollment.credentialAsset.toBase58() !== "11111111111111111111111111111111";

  const handleCollectCredential = useCallback(async () => {
    if (!course.courseId) return;
    setCollecting(true);
    try {
      const res = await fetch("/api/credentials/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.courseId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Credential collection failed");
      }
      const data = await res.json();
      setCredentialModal({
        credentialAsset: data.credentialAsset,
        signature: data.signature,
        trackName: data.trackName,
        level: data.level,
        coursesCompleted: data.coursesCompleted,
        totalXp: data.totalXp,
        isUpgrade: data.isUpgrade,
        imageUrl: data.imageUrl,
      });
      // Auto-trigger close enrollment while showing celebration modal
      closeEnrollment(course.courseId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to collect credential";
      toast.error(message);
    } finally {
      setCollecting(false);
    }
  }, [course.courseId, closeEnrollment]);

  const handleCredentialModalClose = useCallback(() => {
    setCredentialModal(null);
  }, []);

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
                          const done = !preview && enrolled && !checking && isLessonComplete(lessonIdx);
                          return (
                            <Link key={lesson.id} href={preview ? `/courses/preview/${slug}/lessons/${lesson.id}` : `/courses/${slug}/lessons/${lesson.id}`}>
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
                                {!preview && (
                                  <CheckCircle2
                                    className={`h-4 w-4 shrink-0 transition-colors ${done
                                      ? "text-green-500"
                                      : "text-muted-foreground/30"
                                      }`}
                                  />
                                )}
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
            <div className="mt-6">
              <Link href={`/community?new=true&course=${slug}`}>
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {tc("community")} — Ask a Question
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              {!preview && enrolled && !alreadyCompleted && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t("progress")}</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="mt-2" />
                </div>
              )}

              {preview ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                  <p className="text-sm font-medium text-primary">{t("coursePreview")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("coursePreviewDescription")}
                  </p>
                </div>
              ) : course.submissionStatus === SUBMISSION_STATUS.DEACTIVATED ? (
                <div className="rounded-lg border border-muted-foreground/30 bg-muted/30 p-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground">{t("courseDeactivated")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("courseDeactivatedDescription")}
                  </p>
                </div>
              ) : !course.published && course.submissionStatus !== SUBMISSION_STATUS.APPROVED ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-center">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {course.submissionStatus === SUBMISSION_STATUS.REJECTED
                      ? t("courseNeedsRevision")
                      : t("pendingApproval")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {course.submissionStatus === SUBMISSION_STATUS.REJECTED
                      ? t("courseNeedsRevisionDescription")
                      : t("pendingApprovalDescription")}
                  </p>
                </div>
              ) : alreadyCompleted && !enrolled ? (
                <div className="space-y-2">
                  <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 text-center">
                    <CheckCircle2 className="mx-auto h-6 w-6 text-green-500 mb-2" />
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {t("alreadyCompleted")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("alreadyCompletedDescription")}
                    </p>
                  </div>
                </div>
              ) : (checking || credentialsLoading) ? (
                <div className="flex items-center justify-center py-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : !session?.user ? (
                <>
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => setSignInOpen(true)}
                  >
                    <LogIn className="h-4 w-4" />
                    {t("signInToEnroll")}
                  </Button>
                  <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
                </>
              ) : !publicKey && walletAddress ? (
                <div className="space-y-2">
                  {enrolled && (
                    <Button className="w-full gap-2" size="lg" variant="secondary" disabled>
                      <CheckCircle2 className="h-4 w-4" />
                      {t("enrolled") || "Enrolled"}
                    </Button>
                  )}
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={linkWallet}
                    disabled={linkingWallet}
                  >
                    <Wallet className="h-4 w-4" />
                    {linkingWallet ? t("connectingWallet") : enrolled ? t("connectWalletToManage") : t("connectWalletToEnroll")}
                  </Button>
                </div>
              ) : !publicKey ? (
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={linkWallet}
                  disabled={linkingWallet}
                >
                  <Wallet className="h-4 w-4" />
                  {linkingWallet ? t("linkingWallet") : t("linkWalletToEnroll")}
                </Button>
              ) : enrolled && isFinalized ? (
                <div className="space-y-2">
                  <Button className="w-full gap-2" size="lg" variant="secondary" disabled>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("enrolledCompleted")}
                  </Button>
                  <Button
                    className="w-full gap-2 border-2 border-gold bg-gold/15 text-foreground hover:bg-gold/25"
                    size="lg"
                    disabled={collecting || !course.courseId}
                    onClick={handleCollectCredential}
                  >
                    <GraduationCap className="h-4 w-4" />
                    {collecting
                      ? t("collecting")
                      : hasCredential
                        ? t("upgradeCredentialAndClose")
                        : t("collectCredentialAndClose")}
                  </Button>
                </div>
              ) : enrolled ? (
                <div className="space-y-2">
                  <Button className="w-full gap-2" size="lg" variant="secondary" disabled>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("enrolled")}
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
                    {closing ? t("closing") : t("closeEnrollment")}
                  </Button>
                </div>
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
                  {enrolling ? t("enrolling") : t("enrollNow")}
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

      <CredentialModal
        open={!!credentialModal}
        onClose={handleCredentialModalClose}
        data={credentialModal}
      />
    </div>
  );
}
