"use client";

import { useCallback, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ComposerProps {
  /** Send a free-text question. The caller routes it through the attempt gate
   *  (#865) and the assist ladder (#864) — this component only collects text. */
  onSend: (message: string) => void;
  /** Lesson complete, or a request in flight — the whole composer is inert. */
  disabled: boolean;
  /** The ladder is spent (#864). The pane's community-handoff block carries the
   *  copy, so this only disables — never a wall-shaped message of its own. */
  budgetExhausted: boolean;
  className?: string;
}

/**
 * Free-text ask (#944). Restores the composer removed in #770 ("hints only"):
 * that stance is superseded by the assist ladder (#864 — tiered budget, Socratic
 * contract, tier-exact billing) plus the attempt-gate nudge (#865), which stop
 * answer-dumping at the source instead of removing the question box. Every turn
 * spends from the same ladder as a hint, so asking is never a free bypass.
 */
export function Composer({
  onSend,
  disabled,
  budgetExhausted,
  className,
}: ComposerProps) {
  const t = useTranslations("aiPartner");
  const [value, setValue] = useState("");
  const inputId = useId();
  const inert = disabled || budgetExhausted;
  const canSend = !inert && value.trim().length > 0;

  const submit = useCallback(() => {
    const message = value.trim();
    if (!message || inert) return;
    setValue("");
    onSend(message);
  }, [value, inert, onSend]);

  return (
    <form
      className={cn("flex flex-col gap-2", className)}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label className="sr-only" htmlFor={inputId}>
        {t("actions.askLabel")}
      </label>
      <textarea
        id={inputId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends, Shift+Enter keeps the newline — the chat convention.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={2}
        disabled={inert}
        placeholder={t("actions.askPlaceholder")}
        className="w-full resize-none rounded-md border border-border p-2 text-sm [background:var(--input)] placeholder:text-text-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="push"
          size="sm"
          disabled={!canSend}
          className="gap-1.5"
        >
          <PaperPlaneRight size={14} weight="duotone" aria-hidden="true" />
          {t("actions.askSend")}
        </Button>
      </div>
    </form>
  );
}
