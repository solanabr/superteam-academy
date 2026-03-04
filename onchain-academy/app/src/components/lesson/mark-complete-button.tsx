"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { localLearningProgressService } from "@/services/local-learning-progress-service";
import { trackEvent } from "@/lib/analytics";
import { useWalletStore } from "@/stores/wallet-store";
import { getLearnerId } from "@/lib/learner";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-client";
import { onChallengeResult } from "@/lib/challenge-sync";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

type Props = {
  courseId: string;
  lessonId: string;
  lessonType?: "content" | "challenge";
  assessmentRequired?: boolean;
};

export function MarkCompleteButton({
  courseId,
  lessonId,
  lessonType = "content",
  assessmentRequired = true,
}: Props) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assessmentPassed, setAssessmentPassed] = useState(!assessmentRequired);
  const [authUser, setAuthUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const walletAddress = useWalletStore((state) => state.walletAddress);
  const connected = useWalletStore((state) => state.connected);
  const submitEnrollmentTx = useWalletStore((state) => state.submitDevnetEnrollmentTransaction);
  const { setVisible: setWalletModalVisible } = useWalletModal();

  useEffect(() => {
    if (!supabase) {
      setAuthResolved(true);
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const user = data.session?.user;
        setAuthUser(user ? { id: user.id, email: user.email } : null);
      })
      .finally(() => setAuthResolved(true));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAuthUser(user ? { id: user.id, email: user.email } : null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    setAssessmentPassed(!assessmentRequired);
  }, [assessmentRequired, lessonId]);

  useEffect(() => {
    if (lessonType !== "challenge") return;
    return onChallengeResult((detail) => {
      if (detail.lessonId === lessonId) {
        setAssessmentPassed(detail.passed);
      }
    });
  }, [lessonId, lessonType]);

  useEffect(() => {
    const hydrate = async () => {
      if (!authResolved) return;
      const learnerId = getLearnerId(walletAddress, authUser ?? undefined);
      const progress = await localLearningProgressService.getProgress(learnerId, courseId);
      setCompleted(Boolean(progress?.completedLessonIds.includes(lessonId)));
    };
    hydrate();
  }, [authResolved, authUser, courseId, lessonId, walletAddress]);

  return (
    <Button
      variant={completed ? "outline" : "brand"}
      className={completed ? "text-brand border-brand" : "text-black"}
      onClick={async () => {
        if (assessmentRequired && !assessmentPassed) {
          alert("Pass the lesson exam first, then mark complete.");
          return;
        }
        const learnerId = getLearnerId(walletAddress, authUser ?? undefined);
        setLoading(true);
        try {
          if (!connected || !walletAddress) {
            setWalletModalVisible(true);
            alert("Connect a wallet first, then click Mark as complete again.");
            return;
          }
          const latestWallet = useWalletStore.getState().walletAddress;
          if (!latestWallet) {
            alert("Connect wallet to mint your completion NFT on Devnet.");
            return;
          }
          const completionSignature = await submitEnrollmentTx(`lesson:${courseId}:${lessonId}`);
          const completionNftId = `devnet-lesson-nft:${completionSignature}`;
          await localLearningProgressService.completeLesson(learnerId, courseId, lessonId, {
            completionSignature,
            completionNftId,
          });
          trackEvent("lesson_completed", { courseId, lessonId, completionSignature });
          setCompleted(true);
        } finally {
          setLoading(false);
        }
      }}
      disabled={completed || loading || !authResolved || (assessmentRequired && !assessmentPassed)}
    >
      {completed
        ? "✓ Completed"
        : loading
          ? "Minting + saving..."
          : assessmentRequired && !assessmentPassed
            ? "Pass exam to complete"
            : "Mark as complete"}
    </Button>
  );
}
