"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useEnrollment } from "@/hooks/useEnrollment";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface EnrollButtonProps {
  courseId: string;
  courseSlug: string;
}

export function EnrollButton({ courseId, courseSlug }: EnrollButtonProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { progress, enrolling, enroll } = useEnrollment(courseId);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);

  const handleEnroll = async () => {
    setTxError(null);
    setTxSuccess(null);
    const result = await enroll();
    if (result.success && result.signature) {
      setTxSuccess(result.signature);
    } else if (!result.success) {
      // Friendly message for course-not-registered-on-chain errors
      const raw = result.error ?? "Unknown error";
      const isAccountError = raw.includes("AccountNotFound") || raw.includes("account") || raw.includes("0x1770");
      setTxError(
        isAccountError
          ? "Course not yet registered on devnet. Enrollment will work once the course PDA is created on-chain."
          : raw
      );
    }
  };

  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="w-full bg-[#14F195] text-black font-mono font-semibold text-sm py-2.5 rounded hover:bg-accent-dim transition-colors"
      >
        Connect Wallet to Enroll
      </button>
    );
  }

  if (!progress) {
    return (
      <div className="w-full h-10 bg-elevated rounded animate-pulse" />
    );
  }

  if (progress.isFinalized) {
    return (
      <Link
        href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug: courseSlug, id: `${courseId}-l1` } }}
        className="block w-full text-center bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 font-mono font-semibold text-sm py-2.5 rounded hover:bg-[#14F195]/20 transition-colors"
      >
        ✓ Completed
      </Link>
    );
  }

  if (progress.enrolled) {
    return (
      <Link
        href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug: courseSlug, id: `${courseId}-l1` } }}
        className="block w-full text-center bg-elevated border border-[#14F195]/30 text-[#14F195] font-mono font-semibold text-sm py-2.5 rounded hover:bg-[#14F195]/10 transition-colors"
      >
        Continue Learning →
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleEnroll}
        disabled={enrolling}
        className={cn(
          "w-full bg-[#14F195] text-black font-mono font-semibold text-sm py-2.5 rounded transition-colors flex items-center justify-center gap-2",
          enrolling ? "opacity-70 cursor-not-allowed" : "hover:bg-accent-dim"
        )}
      >
        {enrolling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {enrolling ? "Enrolling..." : "Enroll in Course"}
      </button>

      {txSuccess && (
        <div className="flex items-start gap-2 text-[11px] font-mono text-[#14F195] bg-[#14F195]/5 border border-[#14F195]/20 rounded px-3 py-2">
          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>Enrolled! Tx: {txSuccess.slice(0, 16)}…</span>
        </div>
      )}

      {txError && (
        <div className="flex items-start gap-2 text-[11px] font-mono text-[#F5A623] bg-[#F5A623]/5 border border-[#F5A623]/20 rounded px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>{txError}</span>
        </div>
      )}
    </div>
  );
}
