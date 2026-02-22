"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Trash2, User, Download, Maximize2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAIChat } from "@/lib/hooks/use-ai-chat";
import type { ChatMessage } from "@/lib/hooks/use-ai-chat";
import { highlight } from "@/lib/syntax-highlight";

function MarkdownContent({
  content,
  isUser,
}: {
  content: string;
  isUser: boolean;
}) {
  const html = renderChatMarkdown(content);
  if (!html) return null;
  return (
    <div
      className={cn(
        "chat-md break-words text-sm leading-relaxed",
        isUser ? "[&_code]:bg-white/20 [&_code]:text-white" : "",
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ChatImage({
  src,
  onExpand,
}: {
  src: string;
  onExpand: (url: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleDownload = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-image-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    }
  };

  if (error) {
    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-solana-purple hover:underline break-all"
      >
        {src}
      </a>
    );
  }

  return (
    <div className="relative group mt-1.5">
      {loading && <div className="h-32 rounded-lg animate-pulse bg-muted" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="AI generated"
        className={cn(
          "rounded-lg max-w-full cursor-pointer transition-opacity",
          loading ? "h-0 opacity-0 absolute" : "opacity-100",
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        onClick={() => onExpand(src)}
      />
      {!loading && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onExpand(src)}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDownload}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Expanded"
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function MessageBubble({
  msg,
  onExpandImage,
}: {
  msg: ChatMessage;
  onExpandImage: (url: string) => void;
}) {
  const isUser = msg.role === "user";
  const hasText = msg.content.length > 0;
  const hasImages = msg.images && msg.images.length > 0;

  return (
    <div
      className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <Image
          src="/logo.png"
          alt="AI"
          width={24}
          height={24}
          className="rounded-md mt-0.5 shrink-0"
        />
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5",
          isUser
            ? "bg-solana-purple text-white rounded-br-sm"
            : "bg-muted rounded-bl-sm",
        )}
      >
        {hasText && <MarkdownContent content={msg.content} isUser={isUser} />}
        {hasImages && (
          <div className={cn("space-y-2", hasText && "mt-2")}>
            {msg.images!.map((url, i) => (
              <ChatImage key={i} src={url} onExpand={onExpandImage} />
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-solana-green/10 mt-0.5">
          <User className="h-3 w-3 text-solana-green" />
        </div>
      )}
    </div>
  );
}

function renderChatMarkdown(md: string): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const blocks: string[] = [];
  let html = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const langLabel = lang || "code";
    const idx = blocks.length;
    blocks.push(
      `<div class="chat-code-block"><div class="chat-code-lang">${langLabel}</div><pre><code>${highlight(code.trim(), langLabel)}</code></pre></div>`,
    );
    return `\x00CB${idx}\x00`;
  });

  html = html.replace(
    /`([^`\n]+)`/g,
    (_m, code) => `<code class="chat-inline-code">${esc(code)}</code>`,
  );
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  html = html.replace(/^### (.+)$/gm, '<p class="font-semibold mt-2">$1</p>');
  html = html.replace(/^## (.+)$/gm, '<p class="font-bold mt-2">$1</p>');
  html = html.replace(
    /^# (.+)$/gm,
    '<p class="font-bold text-base mt-2">$1</p>',
  );
  html = html.replace(
    /^(\d+)\.\s+(.+)$/gm,
    '<div class="chat-list-item"><span class="chat-list-num">$1.</span><span>$2</span></div>',
  );
  html = html.replace(
    /^[-*]\s+(.+)$/gm,
    '<div class="chat-list-item"><span class="chat-list-bullet"></span><span>$1</span></div>',
  );
  html = html.replace(/\n(?!<)/g, "<br>");
  html = html.replace(/(<br>){3,}/g, "<br><br>");
  html = html.replace(/\x00CB(\d+)\x00/g, (_m, idx) => blocks[Number(idx)]);
  return html;
}

export function AIChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const { messages, isLoading, sendMessage, clearChat } = useAIChat();
  const t = useTranslations("ai");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      {/* Floating trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 border border-border/50",
          "bg-background",
          open && "rotate-90 scale-90",
        )}
      >
        {open ? (
          <X className="h-6 w-6 text-foreground" />
        ) : (
          <Image
            src="/logo.png"
            alt="AI"
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[560px] w-[480px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-gradient-to-r from-solana-purple/5 to-xp-gold/5">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Superteam"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div>
                <p className="text-sm font-semibold">{t("title")}</p>
                <p className="text-[10px] text-muted-foreground">
                  {t("subtitle")}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <Image
                  src="/logo.png"
                  alt="Superteam"
                  width={48}
                  height={48}
                  className="opacity-30 mb-4"
                />
                <p className="text-sm font-medium text-muted-foreground">
                  {t("greeting")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("greetingSub")}
                </p>
                <div className="mt-5 flex flex-wrap gap-2 justify-center">
                  {[
                    "What is a PDA?",
                    "Explain Token-2022",
                    "How do CPIs work?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground hover:bg-solana-purple/10 hover:text-foreground hover:border-solana-purple/30 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onExpandImage={setLightboxSrc}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2.5">
                <Image
                  src="/logo.png"
                  alt="AI"
                  width={24}
                  height={24}
                  className="rounded-md"
                />
                <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-3.5 py-2.5 rounded-bl-sm">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-solana-purple animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-solana-purple animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-solana-purple animate-bounce [animation-delay:300ms]" />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("thinking")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("placeholder")}
                rows={1}
                className="flex-1 resize-none rounded-xl border bg-muted/50 px-4 py-2.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-solana-purple/50 placeholder:text-muted-foreground font-mono min-h-[40px] max-h-[120px]"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 shrink-0 rounded-xl p-0 bg-solana-purple hover:bg-solana-purple/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Shift+Enter for new line
            </p>
          </form>
        </div>
      )}
    </>
  );
}
