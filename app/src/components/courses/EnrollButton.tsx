"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@/components/wallet/CustomWalletModalProvider";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { buildEnrollTx } from "@/lib/solana/instructions";
import { trackCourseEnroll } from "@/lib/analytics/events";
import { useEnrollment } from "@/hooks/useEnrollment";
import logger from "@/lib/logger";
import { SOLANA_NETWORK } from "@/lib/solana/constants";

const IS_DEVNET = SOLANA_NETWORK === "devnet";
const FAUCET_URL = "https://faucet.solana.com";

interface EnrollButtonProps {
  courseId: string;
  courseSlug: string;
  prerequisiteCourseId?: string;
  onEnrolled?: () => void;
  disabled?: boolean;
}

export function EnrollButton({ courseId, courseSlug, prerequisiteCourseId, onEnrolled, disabled: disabledProp }: EnrollButtonProps) {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const { data: session } = useSession();
  const { publicKey, connected, sendTransaction } = useWallet();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [loading, setLoading] = useState(false);
  const { enrollment, loading: enrollmentLoading } = useEnrollment(courseId);

  const sessionWalletAddress = session?.user?.walletAddress ?? null;
  const isWalletAuthenticated = connected || !!sessionWalletAddress;

  const handleEnroll = async () => {
    if (!isWalletAuthenticated) {
      setVisible(true);
      return;
    }

    if (!connected || !publicKey) {
      setVisible(true);
      toast.info(t("enrollment.reconnectWallet"));
      return;
    }

    if (!anchorWallet) {
      toast.error(t("enrollment.error"));
      return;
    }

    setLoading(true);
    try {
      const tx = await buildEnrollTx(anchorWallet, courseId, prerequisiteCourseId);
      tx.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      toast.success(t("enrollment.success"), {
        description: `Tx: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
      });

      trackCourseEnroll(courseId);
      onEnrolled?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";

      if (msg.includes("User rejected")) {
        toast.error(t("enrollment.error"), { description: t("enrollment.errorCancelled") });
      } else if (msg.includes("PrerequisiteNotMet")) {
        toast.error(t("enrollment.prerequisiteRequired"));
      } else if (msg.includes("insufficient funds") || msg.includes("Insufficient")) {
        if (IS_DEVNET) {
          toast.error(t("enrollment.error"), {
            description: t("enrollment.errorInsufficientFundsDevnet"),
            action: {
              label: t("enrollment.getFaucetSol"),
              onClick: () => window.open(FAUCET_URL, "_blank", "noopener,noreferrer"),
            },
            duration: 8000,
          });
        } else {
          toast.error(t("enrollment.error"), { description: t("enrollment.errorInsufficientFunds") });
        }
      } else {
        logger.error("Enrollment failed:", err);
        toast.error(t("enrollment.error"), { description: t("enrollment.errorFailed") });
      }
    } finally {
      setLoading(false);
    }
  };

  if (enrollmentLoading) {
    return <Skeleton className="h-12 w-full" />;
  }

  if (enrollment) {
    return (
      <Link href={`/courses/${courseSlug}`}>
        <Button className="w-full gap-2" size="lg" aria-label={t("enrollment.continueLearning")}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {t("enrollment.continueLearning")}
        </Button>
      </Link>
    );
  }

  if (!isWalletAuthenticated) {
    return (
      <Button onClick={() => setVisible(true)} className="w-full" size="lg" aria-label={t("enrollment.connectWalletToEnroll")}>
        {t("enrollment.walletRequired")}
      </Button>
    );
  }

  return (
    <Button onClick={handleEnroll} className="w-full" size="lg" disabled={loading || !!disabledProp} aria-label={loading ? tc("loading") : t("enrollment.enrollInCourse")}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" role="status" />}
      {t("detail.enrollNow")}
    </Button>
  );
}
