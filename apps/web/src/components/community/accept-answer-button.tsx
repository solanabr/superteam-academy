"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AcceptAnswerButtonProps {
  isAccepted: boolean;
  onAccept: () => void;
}

export function AcceptAnswerButton({
  isAccepted,
  onAccept,
}: AcceptAnswerButtonProps) {
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
      aria-label={isAccepted ? "Accepted answer" : "Accept this answer"}
      title={isAccepted ? "Accepted answer" : "Accept this answer"}
    >
      <Check size={16} strokeWidth={isAccepted ? 3 : 2} />
    </button>
  );
}
