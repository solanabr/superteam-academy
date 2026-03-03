"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { EnrollButton } from "./EnrollButton";
import { useCourseStore } from "@/store/course-store";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle } from "lucide-react";

type CourseEnrollmentBlockProps = {
  courseId: string;
  courseTitle: string;
};

export function CourseEnrollmentBlock({ courseId, courseTitle }: CourseEnrollmentBlockProps) {
  const t = useTranslations("course_detail");
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const linkedAddress =
    user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
  const walletAddress = linkedAddress ?? wallets?.[0]?.address;

  // Use the new consolidated courseStore
  const progress = useCourseStore((s) => s.progress);
  const loading = useCourseStore((s) => s.isLoading || s.isEnrolling);
  const fetchProgress = useCourseStore((s) => s.fetchProgress);
  const reset = useCourseStore((s) => s.reset);

  // Reset stale progress from a previously viewed course IMMEDIATELY on courseId change.
  // Without this, the old course's completion state flashes for 1-2 sec until fetchProgress returns.
  useEffect(() => {
    reset();
  }, [courseId, reset]);

  useEffect(() => {
    if (!authenticated || !walletAddress) return;
    fetchProgress(walletAddress, courseId);
  }, [authenticated, walletAddress, courseId, fetchProgress]);

  if (!authenticated) {
    return <EnrollButton courseId={courseId} courseTitle={courseTitle} />;
  }

  const enrolled = !!progress;
  const completedCount = progress?.completedCount ?? 0;
  const totalLessons = progress?.totalLessons ?? 0;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isComplete = progress?.completedAt != null || (totalLessons > 0 && completedCount >= totalLessons);

  return (
    <div className="flex flex-col gap-3 items-start">
      {isComplete ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-solana text-xs font-bold bg-solana/10 px-3 py-1.5 rounded-full border border-solana/20 w-fit">
            <CheckCircle className="h-3.5 w-3.5" />
            {t("course_completed", { fallback: "Course Completed" })}
          </div>
          <EnrollButton courseId={courseId} courseTitle={courseTitle} />
        </div>
      ) : enrolled ? (
        <div className="flex flex-col gap-3">
          <p className="text-text-secondary text-sm">
            {t("your_progress", { current: completedCount, total: totalLessons, pct })}
          </p>
          <EnrollButton courseId={courseId} courseTitle={courseTitle} />
        </div>
      ) : (
        <EnrollButton courseId={courseId} courseTitle={courseTitle} />
      )}
    </div>
  );
}
