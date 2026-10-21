"use client";

import { useTranslations } from "next-intl";
import { RocketLaunch, Wallet } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface DeployPausedNoticeProps {
  /** Which lesson block it stands in for. */
  variant: "funding" | "deploy";
  className?: string;
}

/**
 * Stands in for the wallet-funding card and the deploy panel while the
 * in-lesson deploy is off (`lib/deploy/learner-deploy.ts`). The lesson stays
 * completable without either, so the copy says so.
 */
export function DeployPausedNotice({
  variant,
  className,
}: DeployPausedNoticeProps) {
  const t = useTranslations("deploy.paused");
  const Icon = variant === "funding" ? Wallet : RocketLaunch;

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-md border-[2px] border-border bg-[var(--card-alt)] px-4 py-3 text-sm",
        className
      )}
    >
      <Icon
        size={20}
        weight="duotone"
        className="mt-0.5 shrink-0 text-primary"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="font-semibold text-text">{t(`${variant}Title`)}</p>
        <p className="text-text-2">{t(`${variant}Body`)}</p>
      </div>
    </div>
  );
}
