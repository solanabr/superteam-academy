"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTranslations } from "next-intl";
import { useEnrollment } from "@/hooks/useEnrollment";
import { getConnectionEndpoint } from "@/lib/solana";
import { cn } from "@/lib/utils";
import { events } from "@/lib/analytics";
import { Loader2, CheckCircle, AlertCircle, WifiOff } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface EnrollButtonProps {
  courseId: string;
  courseSlug: string;
  firstLessonId?: string;
  totalLessons?: number;
  difficulty?: string;
}

export function EnrollButton({
  courseId,
  courseSlug,
  firstLessonId,
  totalLessons = 0,
  difficulty = "",
}: EnrollButtonProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const t = useTranslations("enroll");
  const { progress, enrolling, enroll } = useEnrollment(courseId);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [locallyCompleted, setLocallyCompleted] = useState(false);

  // Check if user completed all lessons locally
  useEffect(() => {
    if (typeof window === "undefined" || totalLessons === 0) return;
    try {
      const ids: string[] = JSON.parse(
        localStorage.getItem(`completed_${courseSlug}`) ?? "[]",
      );
      setLocallyCompleted(ids.length >= totalLessons);
    } catch {}
  }, [courseSlug, totalLessons]);

  // Detect if the app's RPC connection targets the wrong network
  useEffect(() => {
    if (!connected) return;
    const endpoint = getConnectionEndpoint();
    const isDevnet =
      endpoint.includes("devnet") ||
      endpoint.includes("127.0.0.1") ||
      endpoint.includes("localhost");
    setWrongNetwork(!isDevnet);
  }, [connected]);

  const handleEnroll = async () => {
    setTxError(null);
    setTxSuccess(null);
    const result = await enroll();
    if (result.success && result.signature) {
      setTxSuccess(result.signature);
      events.courseEnroll(courseSlug, difficulty);
    } else if (!result.success) {
      const raw = result.error ?? "Unknown error";
      const isBlockhash =
        raw.includes("Blockhash") || raw.includes("blockhash");
      const isIdlError = raw.includes("idl.types") || raw.includes("IDL");
      const isAccountNotFound =
        raw.includes("AccountNotFound") ||
        raw.includes("0x1770") ||
        raw.includes("account does not exist");
      const isCourseNotActive =
        raw.includes("CourseNotActive") || raw.includes("6000");
      const isAlreadyEnrolled =
        raw.includes("AlreadyEnrolled") || raw.includes("already in use");
      const isUserRejected =
        raw.includes("User rejected") || raw.includes("rejected");
      setTxError(
        isUserRejected
          ? null
          : isAlreadyEnrolled
            ? t("alreadyEnrolled")
            : isCourseNotActive
              ? t("courseNotActive")
              : isBlockhash
                ? t("switchDevnetRetry")
                : isAccountNotFound || isIdlError
                  ? t("courseNotRegistered")
                  : raw.length > 120
                    ? raw.slice(0, 120) + "…"
                    : raw,
      );
    }
  };

  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="w-full bg-accent text-black font-mono font-semibold text-sm py-2.5 rounded-full hover:bg-accent-dim transition-colors"
      >
        {t("connectToEnroll")}
      </button>
    );
  }

  if (!progress) {
    return <div className="w-full h-10 bg-elevated rounded animate-pulse" />;
  }

  if (progress.isFinalized) {
    return (
      <Link
        href={{
          pathname: "/courses/[slug]/lessons/[id]",
          params: { slug: courseSlug, id: firstLessonId ?? `${courseId}-l1` },
        }}
        className="block w-full text-center bg-accent/10 text-accent border border-accent/30 font-mono font-semibold text-sm py-2.5 rounded-full hover:bg-accent/20 transition-colors"
      >
        {t("completed")}
      </Link>
    );
  }

  if (progress.enrolled) {
    if (locallyCompleted) {
      return (
        <div className="space-y-2">
          <Link
            href={{ pathname: "/courses/[slug]", params: { slug: courseSlug } }}
            className="block w-full text-center bg-accent/10 text-accent border border-accent/30 font-mono font-semibold text-sm py-2.5 rounded-full hover:bg-accent/20 transition-colors"
          >
            {t("courseComplete")}
          </Link>
        </div>
      );
    }
    return (
      <Link
        href={{
          pathname: "/courses/[slug]/lessons/[id]",
          params: { slug: courseSlug, id: firstLessonId ?? `${courseId}-l1` },
        }}
        className="block w-full text-center bg-elevated border border-accent/30 text-accent font-mono font-semibold text-sm py-2.5 rounded-full hover:bg-accent/10 transition-colors"
      >
        {t("continueLearning")}
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      {wrongNetwork && (
        <div className="flex items-start gap-2 text-[11px] font-mono text-[#F5A623] bg-[#F5A623]/5 border border-[#F5A623]/20 rounded px-3 py-2">
          <WifiOff className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span dangerouslySetInnerHTML={{ __html: t("switchToDevnet") }} />
        </div>
      )}
      <button
        onClick={handleEnroll}
        disabled={enrolling}
        className={cn(
          "w-full bg-accent text-black font-mono font-semibold text-sm py-2.5 rounded-full transition-colors flex items-center justify-center gap-2",
          enrolling ? "opacity-70 cursor-not-allowed" : "hover:bg-accent-dim",
        )}
      >
        {enrolling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {enrolling ? t("enrolling") : t("enroll")}
      </button>

      {txSuccess && (
        <div className="flex items-start gap-2 text-[11px] font-mono text-accent bg-accent/5 border border-accent/20 rounded px-3 py-2">
          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>{t("enrolledTx", { tx: txSuccess.slice(0, 16) })}</span>
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
