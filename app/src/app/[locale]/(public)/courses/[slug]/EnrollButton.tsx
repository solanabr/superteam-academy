"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useEnrollment } from "@/hooks/useEnrollment";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface EnrollButtonProps {
  courseId: string;
  courseSlug: string;
}

export function EnrollButton({ courseId, courseSlug }: EnrollButtonProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { progress, enrolling, enroll } = useEnrollment(courseId);

  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="w-full bg-[#14F195] text-black font-mono font-semibold text-sm py-2.5 rounded hover:bg-[#0D9E61] transition-colors"
      >
        Connect Wallet to Enroll
      </button>
    );
  }

  if (!progress) {
    return (
      <div className="w-full h-10 bg-[#1A1A1A] rounded animate-pulse" />
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
        className="block w-full text-center bg-[#1A1A1A] border border-[#14F195]/30 text-[#14F195] font-mono font-semibold text-sm py-2.5 rounded hover:bg-[#14F195]/10 transition-colors"
      >
        Continue Learning →
      </Link>
    );
  }

  return (
    <button
      onClick={enroll}
      disabled={enrolling}
      className={cn(
        "w-full bg-[#14F195] text-black font-mono font-semibold text-sm py-2.5 rounded transition-colors flex items-center justify-center gap-2",
        enrolling
          ? "opacity-70 cursor-not-allowed"
          : "hover:bg-[#0D9E61]"
      )}
    >
      {enrolling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {enrolling ? "Enrolling..." : "Enroll in Course"}
    </button>
  );
}
