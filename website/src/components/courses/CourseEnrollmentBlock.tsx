"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { EnrollButton } from "./EnrollButton";
import { useEnrollmentStore } from "@/store/enrollment-store";

type CourseEnrollmentBlockProps = {
  courseId: string;
  courseTitle: string;
};

export function CourseEnrollmentBlock({ courseId, courseTitle }: CourseEnrollmentBlockProps) {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  
  const linkedAddress =
    user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
  const walletAddress = linkedAddress ?? wallets?.[0]?.address;

  // Get enrollment state from Zustand store
  const enrollment = useEnrollmentStore((state) => state.enrollments[courseId]);
  const loading = useEnrollmentStore((state) => state.loading[courseId] ?? false);
  const fetchEnrollment = useEnrollmentStore((state) => state.fetchEnrollment);

  // Fetch enrollment on mount and when wallet changes
  useEffect(() => {
    if (!authenticated || !walletAddress) return;
    fetchEnrollment(walletAddress, courseId);
    // Note: Zustand store handles cleanup internally, no need for AbortController here
  }, [authenticated, walletAddress, courseId, fetchEnrollment]);

  if (!authenticated) {
    return <EnrollButton courseId={courseId} courseTitle={courseTitle} />;
  }

  if (loading && !enrollment) {
    return <span className="text-text-secondary text-sm">Loading…</span>;
  }

  const enrolled = enrollment !== undefined;
  const completedCount = enrollment?.completedCount ?? 0;
  const totalLessons = enrollment?.totalLessons ?? 0;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      {enrolled && (
        <p className="text-text-secondary text-sm">
          Your progress: {completedCount}/{totalLessons} lessons ({pct}%)
        </p>
      )}
      <EnrollButton courseId={courseId} courseTitle={courseTitle} />
    </div>
  );
}
