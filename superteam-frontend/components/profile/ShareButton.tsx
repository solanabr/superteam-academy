"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ walletAddress }: { walletAddress?: string }) {
  const t = useTranslations("profile");

  const handleShare = useCallback(() => {
    const shareUrl = walletAddress
      ? `${window.location.origin}/profile/${walletAddress}`
      : window.location.href;
    if (navigator.share) {
      navigator
        .share({ title: "Superteam Academy Profile", url: shareUrl })
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => toast.success(t("copiedToClipboard")))
        .catch(() => {});
    }
  }, [walletAddress, t]);

  return (
    <Button
      variant="outline"
      className="border-border text-foreground"
      onClick={handleShare}
    >
      {t("shareProfile")}
    </Button>
  );
}
