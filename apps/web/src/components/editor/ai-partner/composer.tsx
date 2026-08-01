"use client";

import { useCallback, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { PaperPlaneRight, GitDiff } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Mirrors MAX_MESSAGE_CHARS in /api/ai/partner: the route 413s past this, so
 *  the box stops accepting text at exactly the same boundary rather than letting
 *  the learner write a message that can only come back as a generic error. */
const MAX_MESSAGE_CHARS = 4000;

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
 * from the same assist ladder, so neither is a free bypass, and a proposed
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
  const counterId = useId();
  const inert = disabled || budgetExhausted;
  const canSend = !inert && value.trim().length > 0;
  const nearLimit = value.length / MAX_MESSAGE_CHARS > 0.9;

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
        onChange={(e) => setValue(e.target.value.slice(0, MAX_MESSAGE_CHARS))}
        onKeyDown={(e) => {
          // Enter sends, Shift+Enter keeps the newline — the chat convention.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        maxLength={MAX_MESSAGE_CHARS}
        aria-describedby={counterId}
        disabled={inert}
        placeholder={t("actions.askPlaceholder")}
        className="min-h-[44px] w-full resize-y rounded-md border border-border p-2 text-sm [background:var(--input)] placeholder:text-text-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="flex flex-wrap items-center gap-2">
        {onPropose && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPropose(value.trim() || undefined)}
            disabled={inert}
            aria-busy={pending}
            className="gap-1.5 text-xs"
          >
            <GitDiff size={14} weight="duotone" aria-hidden="true" />
            <span className="text-primary">{t("actions.propose")}</span>
            <span className="font-normal text-text-3">
              {t("actions.proposeCost")}
            </span>
          </Button>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span
            id={counterId}
            className={cn(
              "text-[11px]",
              nearLimit ? "text-danger" : "text-text-3"
            )}
          >
            {value.length}/{MAX_MESSAGE_CHARS}
          </span>
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
