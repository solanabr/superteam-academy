"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/hooks/use-program";
import { useTransaction } from "@/hooks/use-transaction";
import { getCoursePda, getEnrollmentPda } from "@/lib/pda";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { useState } from "react";

interface UnenrollButtonProps {
  courseId: string;
}

export function UnenrollButton({ courseId }: UnenrollButtonProps) {
  const { publicKey } = useWallet();
  const program = useProgram();
  const { execute, state } = useTransaction();
  const queryClient = useQueryClient();
  const t = useTranslations("enrollment");
  const [confirming, setConfirming] = useState(false);

  const isLoading = state === "signing" || state === "confirming";

  const handleUnenroll = async () => {
    if (!program || !publicKey) return;

    const coursePda = getCoursePda(courseId);
    const enrollmentPda = getEnrollmentPda(courseId, publicKey);

    const sig = await execute(async () => {
      return await program.methods
        .closeEnrollment()
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: publicKey,
        })
        .rpc();
    });

    if (sig) {
      queryClient.invalidateQueries({ queryKey: ["enrollment", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      trackEvent("course_unenrolled", { courseId });
    }
    setConfirming(false);
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-content-muted hover:text-red-400 transition-colors"
      >
        {t("unenroll")}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
      <p className="flex-1 text-xs text-red-400">{t("unenrollConfirm")}</p>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-md border border-edge px-3 py-1.5 text-xs text-content-secondary hover:text-content"
      >
        {t("unenrollCancel")}
      </button>
      <button
        onClick={handleUnenroll}
        disabled={isLoading}
        className="rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
      >
        {isLoading ? t("unenrolling") : t("unenrollConfirmAction")}
      </button>
    </div>
  );
}
