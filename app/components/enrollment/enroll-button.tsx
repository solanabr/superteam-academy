"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/hooks/use-program";
import { useTransaction } from "@/hooks/use-transaction";
import { useEnrollment } from "@/hooks/use-enrollment";
import { getCoursePda, getEnrollmentPda } from "@/lib/pda";
import { getTypedAccounts } from "@/anchor/idl";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";

interface EnrollButtonProps {
  courseId: string;
  prerequisite: string | null;
}

export function EnrollButton({ courseId, prerequisite }: EnrollButtonProps) {
  const { publicKey } = useWallet();
  const program = useProgram();
  const { execute, state } = useTransaction();
  const enrollment = useEnrollment(courseId);
  const queryClient = useQueryClient();
  const t = useTranslations("enrollment");

  const isEnrolled = !!enrollment.data;
  const isLoading = state === "signing" || state === "confirming";

  const handleEnroll = async () => {
    if (!program || !publicKey) return;

    const coursePda = getCoursePda(courseId);
    const enrollmentPda = getEnrollmentPda(courseId, publicKey);

    const sig = await execute(async () => {
      let tx = program.methods
        .enroll(courseId)
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: publicKey,
          systemProgram: SystemProgram.programId,
        });

      if (prerequisite) {
        const prereqCoursePda = new PublicKey(prerequisite);
        const accounts = getTypedAccounts(program);
        const prereqCourse = await accounts.course.fetch(prereqCoursePda);
        const prereqEnrollmentPda = getEnrollmentPda(prereqCourse.courseId, publicKey);
        tx = tx.remainingAccounts([
          { pubkey: prereqCoursePda, isWritable: false, isSigner: false },
          { pubkey: prereqEnrollmentPda, isWritable: false, isSigner: false },
        ]);
      }

      return await tx.rpc();
    });

    if (sig) {
      queryClient.invalidateQueries({ queryKey: ["enrollment", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      trackEvent("course_enrolled", { courseId });
    }
  };

  if (!publicKey) {
    return (
      <button disabled className="w-full rounded-lg bg-card py-3 text-sm text-content-muted cursor-not-allowed">
        {t("enroll")}
      </button>
    );
  }

  if (isEnrolled) {
    return (
      <button disabled className="w-full rounded-lg bg-solana-green/10 py-3 text-sm text-solana-green border border-solana-green/30">
        {t("enrolled")}
      </button>
    );
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={isLoading}
      className="w-full rounded-lg bg-solana-gradient py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? t("enrolling") : t("enroll")}
    </button>
  );
}
