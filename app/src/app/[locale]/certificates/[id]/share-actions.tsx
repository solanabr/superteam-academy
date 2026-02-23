"use client";

import { useTranslations } from "next-intl";
import { Download, Share2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareActionsProps {
  courseTitle: string;
  certificateId: string;
}

export function ShareActions({
  courseTitle,
  certificateId,
}: ShareActionsProps) {
  const t = useTranslations("certificate");
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = t("shareText", { course: courseTitle });

  const handleShareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
    );
  };

  const handleShareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      "_blank",
    );
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById("certificate-card");
    if (!element) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(element, {
      backgroundColor: "#000000",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `superteam-certificate-${certificateId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <Button
        variant="outline"
        className="gap-2"
        onClick={handleDownloadImage}
        aria-label="Download certificate as image"
      >
        <Download className="h-4 w-4" /> {t("download")}
      </Button>
      <Button
        variant="outline"
        className="gap-2"
        onClick={handleShareTwitter}
        aria-label="Share certificate on Twitter"
      >
        <Share2 className="h-4 w-4" /> {t("shareTwitter")}
      </Button>
      <Button
        variant="outline"
        className="gap-2"
        onClick={handleShareLinkedIn}
        aria-label="Share certificate on LinkedIn"
      >
        <Share2 className="h-4 w-4" /> {t("shareLinkedIn")}
      </Button>
      <Button
        variant="outline"
        className="gap-2"
        onClick={handleCopyUrl}
        aria-label="Copy certificate URL to clipboard"
      >
        <LinkIcon className="h-4 w-4" /> {t("copyUrl")}
      </Button>
    </div>
  );
}
