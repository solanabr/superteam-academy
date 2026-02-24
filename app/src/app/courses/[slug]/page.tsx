"use client";

import { use, useCallback } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/layout";
import { DifficultyBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCourse, useEnrollment, useProgress } from "@/hooks/use-services";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { trackLabels, difficultyLabels, courseThumbnails } from "@/lib/constants";
import { toast } from "sonner";
import { trackEvent } from "@/components/providers/analytics-provider";
import {
  BookOpen,
  Clock,
  Zap,
  Users,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Play,
  ChevronDown,
  ChevronRight,
  Award,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useState } from "react";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const t = useTranslations("courses.detail");
  const { isAuthenticated, user } = useAuth();
  const { publicKey: walletKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { course, loading: courseLoading } = useCourse(slug);
  const { enrolled, enroll, enrolling } = useEnrollment(course?.courseId ?? "", course?.lessonCount);
  const { progress, refresh: refreshProgress } = useProgress(course?.courseId ?? "");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );
  const [finalizing, setFinalizing] = useState(false);

  const handleFinalize = useCallback(async () => {
    if (!course || !user || !walletKey || !signTransaction || !progress?.isCompleted) return;
    setFinalizing(true);
    try {
      // Step 1: Get partially-signed txs from backend (includes lesson completion if needed)
      const res = await fetch("/api/courses/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.courseId,
          learnerWallet: walletKey.toBase58(),
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (data.alreadyFinalized) {
        toast.info("Course already finalized");
        await refreshProgress();
        return;
      }
      if (!res.ok || !data.finalizeTx) throw new Error(data.error || "Failed to finalize");

      // Step 1.5: Complete pending lessons on-chain first (if any)
      if (data.lessonCompletionTxs?.length) {
        toast.info(`Completing ${data.pendingLessons} lesson(s) on-chain first…`);
        for (const txBase64 of data.lessonCompletionTxs) {
          const tx = VersionedTransaction.deserialize(
            Buffer.from(txBase64, "base64"),
          );
          const signed = await signTransaction(tx);
          const sig = await connection.sendRawTransaction(signed.serialize(), {
            skipPreflight: false,
            maxRetries: 3,
          });
          await connection.confirmTransaction(sig, "confirmed");
        }
      }

      // Step 2: Sign and send finalize tx
      const finalizeTx = VersionedTransaction.deserialize(
        Buffer.from(data.finalizeTx, "base64"),
      );
      const signedFinalize = await signTransaction(finalizeTx);
      const finalizeSig = await connection.sendRawTransaction(signedFinalize.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });
      await connection.confirmTransaction(finalizeSig, "confirmed");

      // Step 3: Try credential tx (best-effort)
      let credentialSig: string | null = null;
      // Step 3: Credential + auto-close enrollment (reclaims rent)
      if (data.credentialTx) {
        try {
          const credTx = VersionedTransaction.deserialize(
            Buffer.from(data.credentialTx, "base64"),
          );
          const signedCred = await signTransaction(credTx);
          credentialSig = await connection.sendRawTransaction(signedCred.serialize(), {
            skipPreflight: false,
            maxRetries: 3,
          });
          await connection.confirmTransaction(credentialSig, "confirmed");
        } catch (credErr) {
          console.error("Credential tx failed (finalize succeeded):", credErr);
          // Fallback: try standalone close_enrollment if credential+close failed
          if (data.closeEnrollmentTx) {
            try {
              const closeTx = VersionedTransaction.deserialize(
                Buffer.from(data.closeEnrollmentTx, "base64"),
              );
              const signedClose = await signTransaction(closeTx);
              await connection.sendRawTransaction(signedClose.serialize(), {
                skipPreflight: false,
                maxRetries: 3,
              });
            } catch (closeErr) {
              console.error("Close enrollment fallback also failed:", closeErr);
            }
          }
        }
      } else if (data.closeEnrollmentTx) {
        // No credential tx built — still close enrollment to reclaim rent
        try {
          const closeTx = VersionedTransaction.deserialize(
            Buffer.from(data.closeEnrollmentTx, "base64"),
          );
          const signedClose = await signTransaction(closeTx);
          const closeSig = await connection.sendRawTransaction(signedClose.serialize(), {
            skipPreflight: false,
            maxRetries: 3,
          });
          await connection.confirmTransaction(closeSig, "confirmed");
        } catch (closeErr) {
          console.error("Close enrollment failed:", closeErr);
        }
      }

      // Step 4: Confirm to backend (Supabase update)
      await fetch("/api/courses/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.courseId,
          learnerWallet: walletKey.toBase58(),
          userId: user.id,
          action: "confirm",
          finalizeSig,
        }),
      });

      trackEvent("course_finalized", {
        courseId: course.courseId,
        credentialMint: data.credentialAssetAddress,
      });

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-medium">Course finalized!</span>
          <a
            href={`https://explorer.solana.com/tx/${credentialSig ?? finalizeSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline inline-flex items-center gap-1 text-xs"
          >
            View on Explorer <ExternalLink className="h-3 w-3" />
          </a>
        </div>,
      );
      await refreshProgress();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("User rejected")) {
        toast.info("Transaction cancelled");
        return;
      }
      toast.error(`Finalization failed: ${msg}`);
    } finally {
      setFinalizing(false);
    }
  }, [course, user, walletKey, signTransaction, connection, progress, refreshProgress]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  if (courseLoading) {
    return (
      <PlatformLayout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-48" />
          </div>
        </div>
      </PlatformLayout>
    );
  }

  if (!course) {
    return (
      <PlatformLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <BookOpen className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Course not found</p>
          <Button asChild variant="outline">
            <Link href="/courses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Link>
          </Button>
        </div>
      </PlatformLayout>
    );
  }

  const totalXp = course.lessonCount * course.xpPerLesson;

  return (
    <PlatformLayout>
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Back */}
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>

        {/* Hero */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {trackLabels[course.trackId] ?? `Track ${course.trackId}`}
                </Badge>
                <DifficultyBadge difficulty={course.difficulty} />
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {course.title}
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {course.description}
              </p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {course.lessonCount} lessons
                </span>
                {course.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {course.duration}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4" />
                  {totalXp} {t("totalXp")}
                </span>
                {course.totalCompletions > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {course.totalCompletions} completed
                  </span>
                )}
              </div>
            </div>

            {/* Progress (if enrolled) */}
            {enrolled && progress && (
              <div className="rounded-xl border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Your Progress</span>
                  <span className="text-muted-foreground">
                    {Math.round(progress.completionPercentage)}%
                  </span>
                </div>
                <Progress value={progress.completionPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {progress.completedLessons.length}/{progress.totalLessons}{" "}
                  lessons • {progress.xpEarned} XP earned
                </p>
              </div>
            )}

            <Separator />

            {/* Modules */}
            <div>
              <h2 className="text-xl font-semibold mb-4">{t("modules")}</h2>
              <div className="space-y-3">
                {course.modules.map((mod, modIdx) => {
                  const isExpanded = expandedModules.has(mod.id);
                  return (
                    <div
                      key={mod.id}
                      className="rounded-xl border bg-card overflow-hidden"
                    >
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-medium">
                            {modIdx + 1}
                          </span>
                          <div>
                            <p className="font-medium">{mod.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {mod.lessons.length} lessons
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="border-t">
                          {mod.lessons.map((lesson, lessonIdx) => {
                            const globalIdx =
                              course.modules
                                .slice(0, modIdx)
                                .reduce(
                                  (sum, m) => sum + m.lessons.length,
                                  0,
                                ) + lessonIdx;
                            const isComplete =
                              progress?.completedLessons.includes(globalIdx);

                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                              >
                                {isComplete ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : enrolled ? (
                                  <Play className="h-4 w-4 text-muted-foreground shrink-0" />
                                ) : (
                                  <Lock className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  {enrolled ? (
                                    <Link
                                      href={`/courses/${slug}/lessons/${globalIdx}`}
                                      className="text-sm font-medium hover:text-primary transition-colors"
                                    >
                                      {lesson.title}
                                    </Link>
                                  ) : (
                                    <span className="text-sm font-medium text-muted-foreground">
                                      {lesson.title}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                    {lesson.type === "challenge" && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        Challenge
                                      </Badge>
                                    )}
                                    {lesson.duration && (
                                      <span>{lesson.duration}</span>
                                    )}
                                    <span>{lesson.xp} XP</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold">{t("reviews")}</h2>
              <div className="space-y-4">
                {[
                  { name: "Carlos M.", rating: 5, text: "Excellent course structure. The challenges really test your understanding.", date: "2026-01-15" },
                  { name: "Maria L.", rating: 5, text: "Finally a Solana course that goes beyond hello world. Highly recommended!", date: "2026-01-20" },
                  { name: "João P.", rating: 4, text: "Great content overall. Would love more advanced security topics.", date: "2026-02-01" },
                ].map((review, i) => (
                  <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{review.name}</p>
                          <p className="text-xs text-muted-foreground">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <svg key={s} className={`h-3.5 w-3.5 ${s < review.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Enroll Card */}
            <div className="rounded-xl border bg-card p-6 space-y-5 sticky top-24">
              {(course.thumbnailUrl || courseThumbnails[course.slug]) && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
                  <Image
                    src={course.thumbnailUrl || courseThumbnails[course.slug]}
                    alt={course.title}
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                </div>
              )}

              {enrolled ? (
                progress?.isCompleted ? (
                  progress.isFinalized ? (
                    <div className="space-y-2">
                      <Button className="w-full h-11" disabled>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {t("completed")}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Credential NFT issued to your wallet
                      </p>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                      onClick={handleFinalize}
                      disabled={finalizing || !walletKey}
                    >
                      {finalizing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Minting Credential...
                        </>
                      ) : (
                        <>
                          <Award className="mr-2 h-4 w-4" />
                          Claim Certificate NFT
                        </>
                      )}
                    </Button>
                  )
                ) : (
                  <Button asChild className="w-full h-11">
                    <Link
                      href={`/courses/${slug}/lessons/${
                        progress?.completedLessons.length ?? 0
                      }`}
                    >
                      {t("continue")}
                    </Link>
                  </Button>
                )
              ) : (
                <Button
                  className="w-full h-11"
                  onClick={enroll}
                  disabled={!isAuthenticated || enrolling}
                >
                  {enrolling ? "Enrolling..." : t("enroll")}
                </Button>
              )}

              <Separator />

              {/* Info list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("difficulty")}</span>
                  <span className="font-medium">
                    {difficultyLabels[course.difficulty]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("xpReward")}</span>
                  <span className="font-medium">{totalXp} XP</span>
                </div>
                {course.duration && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("duration")}
                    </span>
                    <span className="font-medium">{course.duration}</span>
                  </div>
                )}
                {course.prerequisite && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("prerequisite")}
                    </span>
                    <span className="font-medium">{course.prerequisite}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
