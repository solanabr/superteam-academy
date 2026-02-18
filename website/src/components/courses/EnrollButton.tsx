"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { Button } from "@/components/ui/button";
import { useEnrollmentStore } from "@/store/enrollment-store";

type EnrollButtonProps = {
  courseId: string;
  courseTitle: string;
  className?: string;
};

export function EnrollButton({ courseId, courseTitle, className }: EnrollButtonProps) {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  
  const linkedAddress =
    user?.wallet?.address ?? user?.linkedAccounts?.find((a) => a.type === "wallet")?.address;
  const walletAddress = linkedAddress ?? wallets?.[0]?.address;

  // Get state from Zustand store
  const enrollment = useEnrollmentStore((state) => state.enrollments[courseId]);
  const loading = useEnrollmentStore((state) => state.loading[courseId] ?? false);
  const error = useEnrollmentStore((state) => state.errors[courseId]);
  const enroll = useEnrollmentStore((state) => state.enroll);

  const handleEnroll = async () => {
    if (!authenticated || !walletAddress) return;
    
    try {
      await enroll(walletAddress, courseId);
    } catch (e) {
      // Error is handled by store
      console.error("Enrollment error:", e);
    }
  };

  if (!authenticated) {
    return (
      <p className="text-text-secondary text-sm">
        Log in and connect your wallet to enroll in {courseTitle}.
      </p>
    );
  }

  const enrolled = enrollment !== undefined;

  if (enrolled) {
    return (
      <Button disabled className={className}>
        Enrolled
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleEnroll}
        disabled={loading}
        className={className}
      >
        {loading ? "Enrolling…" : "Enroll in this course"}
      </Button>
      {error && <p className="text-rust text-sm">{error}</p>}
    </div>
  );
}
