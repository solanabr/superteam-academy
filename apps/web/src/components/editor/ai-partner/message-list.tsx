"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { User, Sparkle, Lightbulb } from "@phosphor-icons/react";
import { DiffCard } from "./diff-card";
import { cn } from "@/lib/utils";
import type { PartnerMessage } from "@/lib/ai/use-ai-partner";

interface MessageListProps {
  messages: PartnerMessage[];
  onApply: (proposedCode: string) => void;
  /** Live editor code, used as the diff baseline for any `propose` message. */
  getCode: () => string;
  className?: string;
}

function MessageBubble({
  role,
  icon,
  label,
  children,
}: {
  role: "user" | "ai";
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-2.5",
        role === "user" && "flex-row-reverse text-right"
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          role === "user"
            ? "text-primary [background:var(--primary-dim)]"
            : "bg-xp-dim text-xp"
        )}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div
        className={cn(
          "min-w-0 flex-1 space-y-1",
          role === "user" && "flex flex-col items-end"
        )}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-3">
          {label}
        </span>
        {children}
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  onApply,
  getCode,
  className,
}: MessageListProps) {
  const t = useTranslations("aiPartner");
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const lastProposeIndex = messages.reduce(
    (last, message, index) =>
      message.role === "ai" &&
      "response" in message &&
      message.response.type === "propose"
        ? index
        : last,
    -1
  );

  if (messages.length === 0) {
    return (
      <div
        className={cn("flex flex-1 items-center justify-center p-6", className)}
      >
        <p className="text-center text-sm text-text-3">{t("messages.empty")}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4 overflow-y-auto p-4", className)}>
      {messages.map((message, index) => {
        if (message.role === "user") {
          return (
            <MessageBubble
              key={index}
              role="user"
              icon={<User size={14} weight="bold" aria-hidden="true" />}
              label={t("messages.you")}
            >
              <p className="inline-block rounded-lg rounded-tr-sm px-3 py-2 text-sm text-text [background:var(--primary-dim)]">
                {message.text}
              </p>
            </MessageBubble>
          );
        }

        // Free authored hint (kind: "hint") — served locally, no PartnerResponse wrapper.
        if ("kind" in message) {
          return (
            <MessageBubble
              key={index}
              role="ai"
              icon={<Lightbulb size={14} weight="fill" aria-hidden="true" />}
              label={t("messages.ai")}
            >
              <p className="rounded-lg rounded-tl-sm border-[2px] px-3 py-2 text-sm text-text [background:var(--accent-bg)] [border-color:var(--accent-border-s)]">
                {message.text}
              </p>
            </MessageBubble>
          );
        }

        const { response } = message;

        if (response.type === "propose") {
          if (dismissed.has(index)) {
            return (
              <MessageBubble
                key={index}
                role="ai"
                icon={<Sparkle size={14} weight="duotone" aria-hidden="true" />}
                label={t("messages.ai")}
              >
                <p className="text-sm italic text-text-3">
                  {t("diff.dismissed")}
                </p>
              </MessageBubble>
            );
          }

          return (
            <MessageBubble
              key={index}
              role="ai"
              icon={<Sparkle size={14} weight="duotone" aria-hidden="true" />}
              label={t("messages.ai")}
            >
              <DiffCard
                current={getCode()}
                proposed={response.proposedCode}
                rationale={response.rationale}
                check={response.check}
                onAccept={onApply}
                onReject={() =>
                  setDismissed((prev) => new Set(prev).add(index))
                }
                stale={index !== lastProposeIndex}
                className="w-full"
              />
            </MessageBubble>
          );
        }

        // hint or answer — both are plain text responses.
        return (
          <MessageBubble
            key={index}
            role="ai"
            icon={<Sparkle size={14} weight="duotone" aria-hidden="true" />}
            label={t("messages.ai")}
          >
            <p className="rounded-lg rounded-tl-sm bg-card px-3 py-2 text-sm text-text shadow-[var(--shadow-card)]">
              {response.text}
            </p>
          </MessageBubble>
        );
      })}
    </div>
  );
}
