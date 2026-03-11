"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import {
  X,
  Sparkle,
  PaperPlaneRight,
  CircleNotch,
  Robot,
  User,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_MESSAGES_PER_LESSON = 5;

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface AiChatSidebarProps {
  open: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
  lessonContent: string;
}

export function AiChatSidebar({
  open,
  onClose,
  lessonId,
  lessonTitle,
  lessonContent,
}: AiChatSidebarProps) {
  const t = useTranslations("lesson");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset chat when lesson changes
  useEffect(() => {
    setMessages([]);
    setInput("");
    setError(null);
    setMessageCount(0);
  }, [lessonId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const remaining = MAX_MESSAGES_PER_LESSON - messageCount;
  const limitReached = remaining <= 0;

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || limitReached) return;

    setError(null);
    const userMessage: ChatMessage = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setMessageCount((prev) => prev + 1);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
          lessonContent,
          lessonTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data = await response.json();
      const reply: string = data.reply ?? "";

      if (reply) {
        setMessages((prev) => [...prev, { role: "model", text: reply }]);
      }
    } catch {
      setError(t("aiChatError"));
      // Refund the message on error
      setMessageCount((prev) => Math.max(0, prev - 1));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, limitReached, messages, lessonContent, lessonTitle, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <>
      {/* Chat widget */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex w-[340px] flex-col overflow-hidden rounded-2xl border-[2.5px] border-border bg-card shadow-2xl transition-all duration-300",
          open
            ? "h-[480px] scale-100 opacity-100"
            : "pointer-events-none h-0 scale-95 opacity-0"
        )}
        role="dialog"
        aria-label={t("aiChat")}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg [background:var(--primary-dim)]">
              <Sparkle size={16} weight="duotone" className="text-primary" />
            </div>
            <span className="font-display text-sm font-bold">
              {t("aiChat")}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-text-3 transition-colors hover:bg-border hover:text-text"
            aria-label="Close"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 pt-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full [background:var(--primary-dim)]">
                <Robot size={24} weight="duotone" className="text-primary" />
              </div>
              <p className="text-sm text-text-3">{t("aiChatPlaceholder")}</p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={`msg-${i}`}
                className={cn(
                  "flex gap-2.5",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "model" && (
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full [background:var(--primary-dim)]">
                    <Sparkle
                      size={12}
                      weight="duotone"
                      className="text-primary"
                    />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "rounded-br-sm bg-primary text-white"
                      : "rounded-bl-sm text-text [background:var(--input)]"
                  )}
                >
                  {msg.role === "model" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&_code]:text-xs [&_p]:m-0 [&_pre]:my-2">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="m-0">{msg.text}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="bg-primary/20 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    <User size={12} weight="bold" className="text-primary" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full [background:var(--primary-dim)]">
                  <Sparkle
                    size={12}
                    weight="duotone"
                    className="text-primary"
                  />
                </div>
                <div className="rounded-xl rounded-bl-sm px-3.5 py-2.5 text-sm text-text-3 [background:var(--input)]">
                  <div className="flex items-center gap-2">
                    <CircleNotch size={14} className="animate-spin" />
                    {t("aiChatThinking")}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="shrink-0 px-4 pb-2">
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}

        {/* Message counter */}
        <div className="shrink-0 px-4 pb-2">
          <p
            className={cn(
              "text-center text-xs",
              limitReached ? "font-semibold text-danger" : "text-text-3"
            )}
          >
            {limitReached
              ? t("aiChatLimitReached", { total: MAX_MESSAGES_PER_LESSON })
              : t("aiChatLimit", {
                  remaining,
                  total: MAX_MESSAGES_PER_LESSON,
                })}
          </p>
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("aiChatPlaceholder")}
              disabled={limitReached || isLoading}
              rows={1}
              className="max-h-24 min-h-[40px] flex-1 resize-none rounded-lg border border-border bg-[var(--input)] px-3 py-2.5 text-sm text-text placeholder:text-text-3 focus:border-primary focus:outline-none disabled:opacity-50"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || limitReached}
              className="h-10 w-10 shrink-0 p-0"
              aria-label={t("aiChatSend")}
            >
              {isLoading ? (
                <CircleNotch size={16} className="animate-spin" />
              ) : (
                <PaperPlaneRight size={16} weight="fill" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
