"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useEnrollment } from "@/hooks/useEnrollment";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, AlertCircle, WifiOff } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface EnrollButtonProps {
  courseId: string;
  courseSlug: string;
  firstLessonId?: string;
  totalLessons?: number;
}

export function EnrollButton({ courseId, courseSlug, firstLessonId, totalLessons = 0 }: EnrollButtonProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const { progress, enrolling, enroll } = useEnrollment(courseId);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [locallyCompleted, setLocallyCompleted] = useState(false);

  // Check if user completed all lessons locally
  useEffect(() => {
    if (typeof window === "undefined" || totalLessons === 0) return;
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(`completed_${courseSlug}`) ?? "[]");
      setLocallyCompleted(ids.length >= totalLessons);
    } catch {}
  }, [courseSlug, totalLessons]);

  // Detect if wallet/connection is on the wrong network
  useEffect(() => {
    if (!connected) return;
    const endpoint = (connection as unknown as { _rpcEndpoint?: string })._rpcEndpoint ?? "";
    const isDevnet = endpoint.includes("devnet") || endpoint.includes("127.0.0.1") || endpoint.includes("localhost");
    setWrongNetwork(!isDevnet);
  }, [connected, connection]);

  const handleEnroll = async () => {
    setTxError(null);
    setTxSuccess(null);
    const result = await enroll();
    if (result.success && result.signature) {
      setTxSuccess(result.signature);
    } else if (!result.success) {
      const raw = result.error ?? "Unknown error";
      const isBlockhash = raw.includes("Blockhash") || raw.includes("blockhash");
      const isIdlError = raw.includes("idl.types") || raw.includes("IDL");
      const isAccountNotFound = raw.includes("AccountNotFound") || raw.includes("0x1770") || raw.includes("account does not exist");
      const isCourseNotActive = raw.includes("CourseNotActive") || raw.includes("6000");
      const isAlreadyEnrolled = raw.includes("AlreadyEnrolled") || raw.includes("already in use");
      const isUserRejected = raw.includes("User rejected") || raw.includes("rejected");
      setTxError(
        isUserRejected
          ? null  // don't show error if user cancelled
          : isAlreadyEnrolled
          ? "You are already enrolled in this course."
          : isCourseNotActive
          ? "This course is not yet active on-chain."
          : isBlockhash
          ? "Switch your wallet to Devnet and try again."
          : isAccountNotFound || isIdlError
          ? "Course not yet registered on devnet."
          : raw.length > 120 ? raw.slice(0, 120) + "…" : raw
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
        href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug: courseSlug, id: firstLessonId ?? `${courseId}-l1` } }}
        className="block w-full text-center bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 font-mono font-semibold text-sm py-2.5 rounded hover:bg-[#14F195]/20 transition-colors"
      >
        ✓ Completed
      </Link>
    );
  }

  if (progress.enrolled) {
    if (locallyCompleted) {
      return (
        <div className="space-y-2">
          <Link
            href={{ pathname: "/courses/[slug]", params: { slug: courseSlug } }}
            className="block w-full text-center bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/30 font-mono font-semibold text-sm py-2.5 rounded hover:bg-[#14F195]/20 transition-colors"
          >
            ✓ Course Complete
          </Link>
        </div>
      );
    }
    return (
      <Link
        href={{ pathname: "/courses/[slug]/lessons/[id]", params: { slug: courseSlug, id: firstLessonId ?? `${courseId}-l1` } }}
        className="block w-full text-center bg-elevated border border-[#14F195]/30 text-[#14F195] font-mono font-semibold text-sm py-2.5 rounded hover:bg-[#14F195]/10 transition-colors"
      >
        Continue Learning →
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      {wrongNetwork && (
        <div className="flex items-start gap-2 text-[11px] font-mono text-[#F5A623] bg-[#F5A623]/5 border border-[#F5A623]/20 rounded px-3 py-2">
          <WifiOff className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>Switch your wallet to <strong>Devnet</strong> to enroll on-chain.</span>
        </div>
      )}
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
