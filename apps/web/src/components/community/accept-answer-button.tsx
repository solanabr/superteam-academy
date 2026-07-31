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

  const label = isAccepted ? t("acceptedAnswer") : t("acceptThisAnswer");

  return (
    <button
      type="button"
      onClick={onAccept}
      aria-pressed={isAccepted}
      // The label is VISIBLE, not just an aria-label: as a bare checkmark this
      // read as an orphan glyph floating in the card with no way to know what
      // it did without hovering.
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors",
        isAccepted
          ? "bg-[var(--primary-dim)] text-[var(--primary)]"
          : "text-[var(--text-2)] hover:bg-[var(--primary-dim)] hover:text-[var(--primary)]"
      )}
      title={label}
    >
      <Check
        size={13}
        weight={isAccepted ? "fill" : "bold"}
        aria-hidden="true"
      />
      {label}
    </button>
  );
}
