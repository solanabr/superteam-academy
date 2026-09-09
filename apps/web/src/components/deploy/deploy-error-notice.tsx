"use client";

import { useTranslations } from "next-intl";
import { Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FriendlyError } from "@/lib/deploy/friendly-error";

interface DeployErrorNoticeProps {
  error: FriendlyError;
  /** What the error's single action does. Omit for `wait`, which has none. */
  onAction?: () => void;
  className?: string;
}

/**
 * The only place a deploy failure is allowed to reach a learner.
 *
 * The sentence comes from the friendly-error map, the button is that map's one
 * action, and an unmapped message is available only behind the disclosure —
 * a 403 JSON body never lands in the lesson again.
 */
export function DeployErrorNotice({
  error,
  onAction,
  className,
}: DeployErrorNoticeProps) {
  const t = useTranslations("deploy");

  return (
    <div
      role="alert"
      className={cn(
        "space-y-2 rounded-md border-2 border-[color:var(--ink-line)] bg-accent-bg p-3",
        className
      )}
    >
      <p className="flex items-start gap-2 text-sm text-text">
        <Warning
          size={16}
          weight="duotone"
          className="mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <span>{t(`errors.${error.key}`, error.params)}</span>
      </p>

      {error.raw && (
        <details className="text-xs text-text-3">
          <summary className="cursor-pointer font-mono focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            {t("errors.showDetails")}
          </summary>
          <p className="mt-1 break-all font-mono">{error.raw}</p>
        </details>
      )}

      {error.action !== "wait" && error.action !== "none" && onAction && (
        <Button size="sm" variant="secondary" onClick={onAction}>
          {t(`errorActions.${error.action}`)}
        </Button>
      )}
    </div>
  );
}
