"use client";

import { useTranslations } from "next-intl";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface AcceptAnswerButtonProps {
  isAccepted: boolean;
  onAccept: () => void;
}

export function AcceptAnswerButton({
  isAccepted,
  onAccept,
}: AcceptAnswerButtonProps) {
  const t = useTranslations("community");

  return (
    <button
      type="button"
      onClick={onAccept}
      className={cn(
        "rounded-full p-1 transition-colors",
        isAccepted
          ? "bg-[var(--primary-dim)] text-[var(--primary)]"
          : "text-[var(--text-2)] hover:bg-[var(--primary-dim)] hover:text-[var(--primary)]"
      )}
      aria-label={isAccepted ? t("acceptedAnswer") : t("acceptThisAnswer")}
      title={isAccepted ? t("acceptedAnswer") : t("acceptThisAnswer")}
    >
      <Check size={16} weight={isAccepted ? "fill" : "bold"} />
    </button>
  );
}
