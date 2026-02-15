"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Trash2, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAIChat } from "@/lib/hooks/use-ai-chat";
import { highlight } from "@/lib/syntax-highlight";

function MarkdownContent({ content, isUser }: { content: string; isUser: boolean }) {
  const html = renderChatMarkdown(content);
  return (
    <div
      className={cn(
        "chat-md break-words text-sm",
        isUser ? "[&_code]:bg-white/20 [&_code]:text-white" : ""
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderChatMarkdown(md: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // Fenced code blocks — extract, highlight, placeholder
  const blocks: string[] = [];
  let html = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const langLabel = lang || "code";
    const idx = blocks.length;
    blocks.push(
      `<div class="chat-code-block"><div class="chat-code-lang">${langLabel}</div><pre><code>${highlight(code.trim(), langLabel)}</code></pre></div>`
    );
    return `\x00CB${idx}\x00`;
  });

  // Inline code
  html = html.replace(/`([^`\n]+)`/g, (_m, code) => `<code class="chat-inline-code">${esc(code)}</code>`);

  // Bold / italic
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");

  // Headings
  html = html.replace(/^### (.+)$/gm, '<p class="font-semibold mt-2">$1</p>');
  html = html.replace(/^## (.+)$/gm, '<p class="font-bold mt-2">$1</p>');
  html = html.replace(/^# (.+)$/gm, '<p class="font-bold text-base mt-2">$1</p>');

  // Lists
  html = html.replace(/^(\d+)\.\s+(.+)$/gm,
    '<div class="chat-list-item"><span class="chat-list-num">$1.</span><span>$2</span></div>');
  html = html.replace(/^[-*]\s+(.+)$/gm,
    '<div class="chat-list-item"><span class="chat-list-bullet"></span><span>$1</span></div>');

  // Newlines
  html = html.replace(/\n(?!<)/g, "<br>");
  html = html.replace(/(<br>){3,}/g, "<br><br>");

  // Restore code blocks
  html = html.replace(/\x00CB(\d+)\x00/g, (_m, idx) => blocks[Number(idx)]);
  return html;
}

export function AIChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage, clearChat } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105",
          "bg-gradient-to-br from-[#008c4c] to-[#2f6b3f] text-white",
          open && "rotate-90 scale-90"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-gradient-to-r from-[#008c4c]/10 to-[#2f6b3f]/10">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-solana-purple/20">
                <Bot className="h-4 w-4 text-solana-purple" />
              </div>
              <div>
                <p className="text-sm font-semibold">Academy AI</p>
                <p className="text-[10px] text-muted-foreground">Solana learning assistant</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearChat} className="h-8 w-8 p-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <Bot className="h-12 w-12 text-solana-purple/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Hi! I&apos;m your Solana learning assistant.</p>
                <p className="text-xs text-muted-foreground mt-1">Ask me about Solana, Anchor, Rust, or any lesson topic.</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {["What is a PDA?", "Explain Token-2022", "How do CPIs work?"].map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-solana-purple/10 mt-0.5">
                    <Bot className="h-3 w-3 text-solana-purple" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[300px] rounded-2xl px-3 py-2",
                    msg.role === "user"
                      ? "bg-solana-purple text-white rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  )}
                >
                  <MarkdownContent content={msg.content} isUser={msg.role === "user"} />
                </div>
                {msg.role === "user" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-solana-green/10 mt-0.5">
                    <User className="h-3 w-3 text-solana-green" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-solana-purple/10">
                  <Bot className="h-3 w-3 text-solana-purple" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2 rounded-bl-sm">
                  <Loader2 className="h-3 w-3 animate-spin text-solana-purple" />
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Solana..."
                className="flex-1 rounded-full border bg-muted/50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-solana-purple/50 placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isLoading}
                className="h-9 w-9 rounded-full p-0 bg-solana-purple hover:bg-solana-purple/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
