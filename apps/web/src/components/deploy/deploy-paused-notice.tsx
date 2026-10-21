"use client";

import { useTranslations } from "next-intl";
import { PaperPlaneTilt, RocketLaunch, Wallet } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const ICONS = {
  funding: Wallet,
  deploy: RocketLaunch,
  explorer: PaperPlaneTilt,
} as const;

interface DeployPausedNoticeProps {
  /** Which lesson block it stands in for. */
  variant: keyof typeof ICONS;
  className?: string;
}

/**
 * Stands in for the wallet-funding card, the deploy panel and the program
 * explorer while the in-lesson deploy is off (`lib/deploy/learner-deploy.ts`).
 * None of them is required to complete a lesson, so the copy says so. It names
 * no cluster: the same notice shows on mainnet and on a devnet with the flag
 * off.
 */
export function DeployPausedNotice({
  variant,
  className,
}: DeployPausedNoticeProps) {
  const t = useTranslations("deploy.paused");
  const Icon = ICONS[variant];

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
