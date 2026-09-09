"use client";

import { useTranslations } from "next-intl";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  deriveDeploySteps,
  type DeployFlowState,
  type DeployStepKey,
} from "@/lib/deploy/steps";
import { revealDeployStep } from "@/lib/deploy/scroll";

interface DeployStepperProps {
  state: DeployFlowState;
  /**
   * `panel` sits above the deploy card; `strip` is the slim mirror in the
   * editor toolbar, so a learner who just pressed Build can see that the next
   * step is somewhere else on the page.
   */
  variant?: "panel" | "strip";
  /** Defaults to scrolling the step's card into view. */
  onSelect?: (step: DeployStepKey) => void;
  className?: string;
}

export function DeployStepper({
  state,
  variant = "panel",
  onSelect,
  className,
}: DeployStepperProps) {
  const t = useTranslations("deploy.steps");
  const steps = deriveDeploySteps(state);
  const strip = variant === "strip";

  return (
    <nav
      aria-label={t("label")}
      className={cn(
        "flex items-center",
        strip ? "gap-1" : "gap-1.5 sm:gap-2",
        className
      )}
    >
      <ol
        className={cn(
          "flex items-center",
          strip ? "gap-1" : "gap-1.5 sm:gap-2"
        )}
      >
        {steps.map(({ key, status }, idx) => (
          <li key={key} className="flex items-center">
            <button
              type="button"
              onClick={() => (onSelect ?? revealDeployStep)(key)}
              aria-current={status === "active" ? "step" : undefined}
              aria-label={`${t(key)} — ${
                status === "done"
                  ? t("done")
                  : status === "active"
                    ? t("current")
                    : t("goTo", { step: t(key) })
              }`}
              className={cn(
                "inline-flex items-center gap-1 rounded-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                strip
                  ? "px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
                  : "px-2.5 py-1 font-display text-xs font-extrabold sm:text-sm",
                status === "done" &&
                  "border-2 border-[color:var(--ink-line)] bg-[color:var(--primary)] text-[color:var(--primary-fg)]",
                status === "active" &&
                  cn(
                    "border-2 border-[color:var(--ink-line)] bg-card text-text",
                    strip
                      ? "shadow-[0_2px_0_0_var(--ink-line)]"
                      : "shadow-[0_3px_0_0_var(--ink-line)]"
                  ),
                status === "todo" &&
                  "border-2 border-dashed border-border text-text-3 hover:text-text-2"
              )}
            >
              {status === "done" && (
                <Check
                  size={strip ? 10 : 12}
                  weight="bold"
                  aria-hidden="true"
                />
              )}
              {t(key)}
            </button>
            {idx < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "mx-1 h-0.5 rounded-full",
                  strip ? "w-2" : "w-3 sm:w-4",
                  status === "done" ? "bg-[color:var(--primary)]" : "bg-border"
                )}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
