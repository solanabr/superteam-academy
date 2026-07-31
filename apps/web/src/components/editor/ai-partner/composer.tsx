"use client";

import { useCallback, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { PaperPlaneRight, GitDiff } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ComposerProps {
  /** Send a free-text question. The caller routes it through the attempt gate
   *  (#865) and the assist ladder (#864) — this component only collects text. */
  onSend: (message: string) => void;
  /** Ask for a concrete change ("Show me a change", #947). Omit to hide the
   *  action entirely — the pane hides it until the learner has seen a failing
   *  run, and again at ladder exhaustion. The current draft rides along as the
   *  optional message and is deliberately NOT cleared: the learner asked for a
   *  diff, not for their question to be consumed. */
  onPropose?: (message?: string) => void;
  /** Lesson complete, or a request in flight — the whole composer is inert. */
  disabled: boolean;
  /** A request is in flight (drives aria-busy on the propose action). */
  pending?: boolean;
  /** The ladder is spent (#864). The pane's community-handoff block carries the
   *  copy, so this only disables — never a wall-shaped message of its own. */
  budgetExhausted: boolean;
  className?: string;
}

/**
 * Free-text ask (#944) plus the secondary "Show me a change" action (#947).
 *
 * #770 removed the composer ("hints only"); that stance is superseded by the
 * assist ladder (#864 — tiered budget, Socratic contract, tier-exact billing)
 * plus the attempt-gate nudge (#865), which stop answer-dumping at the source
 * instead of removing the question box. Every turn — ask or propose — spends
 * from the same ladder as a hint, so neither is a free bypass, and a proposed
 * diff is still gated behind the earned-Accept comprehension check before it can
 * touch the buffer.
 *
 * Send is the primary affordance; propose is a quiet ghost action beside it,
 * labelled with its cost so spending a turn is never a surprise.
 */
export function Composer({
  onSend,
  onPropose,
  disabled,
  pending = false,
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
      <div className="flex flex-wrap items-center gap-2">
        {onPropose && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onPropose(value.trim() || undefined)}
            disabled={inert}
            aria-busy={pending}
            className="gap-1.5 text-xs"
          >
            <GitDiff size={14} weight="duotone" aria-hidden="true" />
            {t("actions.propose")}
            <span className="font-normal text-text-3">
              {t("actions.proposeCost")}
            </span>
          </Button>
        )}
        <div className="ml-auto flex items-center gap-3">
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
      </div>
    </form>
  );
}
