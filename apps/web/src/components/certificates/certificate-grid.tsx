"use client";

import { useTranslations } from "next-intl";
import { Trophy } from "@phosphor-icons/react";
import type { Certificate } from "@superteam-lms/types";
import { CertificateCard } from "./certificate-card";
import { CERTIFICATE_STYLES as CS, cx } from "@/lib/styles/styleClasses";

interface CertificateGridProps {
  certificates: Certificate[];
  recipientName?: string;
  className?: string;
}

/**
 * 3-column grid of compact certificate cards for the public profile page.
 * Each card is clickable — the parent (profile page) wraps them in Links.
 */
export function CertificateGrid({
  certificates,
  recipientName,
  className,
}: CertificateGridProps) {
  const t = useTranslations("certificates");

  if (certificates.length === 0) {
    return (
      <div
        className={cx(
          "flex flex-col items-center justify-center gap-4 py-12",
          className
        )}
      >
        <Trophy
          size={48}
          weight="duotone"
          className="text-accent"
          aria-hidden="true"
        />
        <p className="text-center font-body text-text-3">
          {t("noCertificates")}
        </p>
      </div>
    );
  }

  return (
    <div className={cx(CS.compact.grid, className)}>
      {certificates.map((cert) => (
        <CertificateCard
          key={cert.id}
          certificate={cert}
          recipientName={recipientName}
          variant="compact"
        />
      ))}
    </div>
  );
}
