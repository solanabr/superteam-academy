"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useWalletCompat as useWallet } from "@/lib/hooks/use-wallet-compat";
import { Loader2, Wallet, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { formatXP } from "@/lib/utils";
import { TRACKS } from "@/lib/constants";
import { CourseIllustration } from "@/components/icons/course-illustration";
import { useEnrollOnChain } from "@/lib/hooks/use-enroll-onchain";
import { CloseEnrollmentButton } from "@/components/course/close-enrollment-button";
import type { Course } from "@/types";

export interface EnrollButtonProps {
  course: Course;
  isEnrolled: boolean;
  progressPct: number;
  firstLessonId: string | undefined;
  /** Called after a successful enrollment to sync local/DB state */
  onEnroll: () => Promise<void>;
}

const STATE_LABELS: Record<string, string> = {
  checking: "Checking enrollment…",
  building: "Building transaction…",
  signing: "Approve in wallet…",
  confirming: "Confirming on-chain…",
};

export function EnrollButton({
  course,
  isEnrolled,
  progressPct,
  firstLessonId,
  onEnroll,
}: EnrollButtonProps) {
  const t = useTranslations("courses");
  const { connected } = useWallet();
  const { enroll, state, txSignature, error, reset } = useEnrollOnChain();

  const isPending = ["checking", "building", "signing", "confirming"].includes(state);

  async function handleEnroll() {
    const ok = await enroll(course.slug);
    if (ok) {
      // Sync progress context / DB
      await onEnroll();
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Thumbnail */}
      <div className="relative mb-6 h-40 overflow-hidden rounded-xl bg-gradient-to-br from-st-green-dark to-primary/20">
        {course.thumbnail && !course.thumbnail.startsWith("/images/") ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 1024px) 100vw, 360px"
            className="object-cover"
          />
        ) : (
          <CourseIllustration
            className="absolute inset-0 h-full w-full"
            trackColor={TRACKS[course.trackId]?.color ?? "#4a8c5c"}
            variant={Number(course.id) - 1}
          />
        )}
      </div>

      {isEnrolled || state === "success" || state === "already_enrolled" ? (
        <>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("detail.progressLabel")}</span>
              <span className="font-medium">{progressPct}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPct === 100
                    ? "bg-brazil-green"
                    : "bg-gradient-to-r from-st-green to-brazil-teal progress-bar-animated"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* On-chain confirmation banner */}
          {txSignature && (
            <a
              href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 flex items-center gap-2 rounded-lg bg-brazil-green/10 px-3 py-2 text-xs text-brazil-green hover:bg-brazil-green/20"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Enrolled on-chain</span>
              <ExternalLink className="ml-auto h-3 w-3 shrink-0" />
            </a>
          )}

          <Link
            href={
              firstLessonId
                ? `/courses/${course.slug}/lessons/${firstLessonId}`
                : `/courses/${course.slug}`
            }
            className="block w-full rounded-xl bg-primary px-6 py-3 text-center text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-[0.98]"
          >
            {progressPct === 100 ? t("detail.completedMessage") : t("catalog.continueLesson")}
          </Link>

          {progressPct === 100 && (
            <div className="mt-3">
              <CloseEnrollmentButton course={course} />
            </div>
          )}
        </>
      ) : !connected ? (
        /* Wallet not connected — enrollment requires wallet signature */
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
          <Wallet className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Connect Wallet to Enroll</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Enrollment is recorded on-chain. Connect a Solana wallet to sign the transaction.
            </p>
          </div>
        </div>
      ) : state === "error" ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error ?? "Transaction failed"}</span>
          </div>
          <button
            onClick={reset}
            className="w-full rounded-xl border border-border px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Try Again
          </button>
        </div>
      ) : (
        <button
          onClick={handleEnroll}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:translate-y-0 disabled:shadow-none"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {STATE_LABELS[state] ?? "Processing…"}
            </>
          ) : (
            t("detail.enrollButton")
          )}
        </button>
      )}

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("detail.difficulty")}</span>
          <span className="font-medium capitalize">{course.difficulty}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("detail.estimatedTime")}</span>
          <span className="font-medium">{course.duration}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("detail.lessonsList")}</span>
          <span className="font-medium">{course.lessonCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("detail.challengeLabel")}</span>
          <span className="font-medium">{course.challengeCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("catalog.xpReward", { amount: "" })}</span>
          <span className="font-medium text-xp">{formatXP(course.xpTotal)} XP</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("catalog.completionsCount", { count: "" })}</span>
          <span className="font-medium">{course.totalCompletions}</span>
        </div>
      </div>
    </div>
  );
}
