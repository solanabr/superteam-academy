import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, CircleIcon, Message01Icon, ArrowReloadHorizontalIcon } from "@hugeicons/core-free-icons";

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

interface LessonAiMentorProps {
  aiSidebarOpen: boolean;
  setAiSidebarOpen: (open: boolean) => void;
  aiSidebarWidth: number;
  setIsResizingAI: (resizing: boolean) => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (input: string) => void;
  handleChatSubmit: (e: React.FormEvent, code: string) => void;
  code: string;
  isAiLoading: boolean;
  retryLastMessage: () => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
}

export function LessonAiMentor({
  aiSidebarOpen,
  setAiSidebarOpen,
  aiSidebarWidth,
  setIsResizingAI,
  chatMessages,
  chatInput,
  setChatInput,
  handleChatSubmit,
  code,
  isAiLoading,
  retryLastMessage,
  chatEndRef,
  t,
}: LessonAiMentorProps) {
  if (!aiSidebarOpen) return null;

  return (
    <>
      <div 
        className="w-1 bg-border/50 hover:bg-primary/50 cursor-col-resize flex-shrink-0 transition-colors relative z-10"
        onMouseDown={() => setIsResizingAI(true)}
      />
      <div 
        className="bg-background flex flex-col flex-shrink-0 border-l border-border/50 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] overflow-hidden"
        style={{ width: aiSidebarWidth, minWidth: aiSidebarWidth, maxWidth: aiSidebarWidth }}
      >
        <div className="h-12 border-b border-border/50 flex items-center justify-between px-4 flex-shrink-0 bg-card overflow-hidden">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground min-w-0">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <HugeiconsIcon icon={SparklesIcon} size={14} />
            </div>
            <span className="truncate">{t("aiMentor")}</span>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setAiSidebarOpen(false)} className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md shrink-0">
            <HugeiconsIcon icon={CircleIcon} size={14} />
          </Button>
        </div>
        
        {/* Chat Messages */}
        <ScrollArea className="flex-1 bg-card/30 min-h-0">
          <div className="p-4 space-y-5 min-w-0 overflow-hidden">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4 mt-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-sm">
                  <HugeiconsIcon icon={SparklesIcon} size={24} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">AI Mentor</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-[200px]">
                  Ask me anything about the code or try a command below.
                </p>
                <div className="flex flex-col gap-2 w-full">
                  <button onClick={() => setChatInput("/hint ")} className="px-4 py-2 bg-background hover:bg-muted rounded-xl text-sm font-medium text-foreground transition-all border border-border/50 shadow-sm flex items-center gap-2 justify-center">
                    <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">/hint</code> Get a hint
                  </button>
                  <button onClick={() => setChatInput("/explain ")} className="px-4 py-2 bg-background hover:bg-muted rounded-xl text-sm font-medium text-foreground transition-all border border-border/50 shadow-sm flex items-center gap-2 justify-center">
                    <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">/explain</code> Explain code
                  </button>
                  <button onClick={() => setChatInput("/fix ")} className="px-4 py-2 bg-background hover:bg-muted rounded-xl text-sm font-medium text-foreground transition-all border border-border/50 shadow-sm flex items-center gap-2 justify-center">
                    <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">/fix</code> Fix errors
                  </button>
                </div>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex w-full min-w-0 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[98%] min-w-0 overflow-hidden px-4 py-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm'
                      : msg.isError
                        ? 'bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-tl-sm'
                        : 'bg-background border border-border/50 text-foreground rounded-2xl rounded-tl-sm'
                  }`}>
                    <div className="flex items-start gap-2 min-w-0 overflow-hidden">
                      {msg.isError && (
                        <HugeiconsIcon icon={CircleIcon} size={14} className="shrink-0 mt-0.5 text-red-500" />
                      )}
                      <div className="min-w-0 overflow-hidden flex-1">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              const isInline = !match && !String(children).includes('\n');
                              return isInline ? (
                                <code className="bg-muted/50 px-1.5 py-0.5 rounded text-xs font-mono break-all" {...props}>{children}</code>
                              ) : (
                                <code className={`${className || ''} block bg-muted/50 p-3 text-xs font-mono whitespace-pre`} {...props}>{children}</code>
                              );
                            },
                            pre({ children }) {
                              return <div className="overflow-x-auto my-2 border border-border/50 rounded-lg max-w-full">{children}</div>;
                            },
                            p({ children }) {
                              return <p className="mb-2 last:mb-0 break-words overflow-hidden">{children}</p>;
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {msg.isError && (
                        <button 
                          onClick={retryLastMessage}
                          className="shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
                          title="Retry"
                        >
                          <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={14} className="text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isAiLoading && (
              <div className="flex justify-start">
                <div className="bg-background border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </ScrollArea>
        
        {/* Chat Input */}
        <div className="p-3 bg-card border-t border-border/50">
          <form onSubmit={(e) => handleChatSubmit(e, code)} className="relative flex items-end gap-2 bg-background border border-border hover:border-border/80 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary rounded-xl transition-all shadow-sm">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t("askAi") + "..."}
              className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[44px] max-h-[150px] py-3 px-3.5 text-sm shadow-none"
              disabled={isAiLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleChatSubmit(e as any, code);
                }
              }}
            />
            <div className="p-1.5 shrink-0">
              <Button type="submit" size="icon" disabled={isAiLoading || !chatInput.trim()} className={`h-8 w-8 rounded-lg transition-all ${chatInput.trim() ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"}`}>
                <HugeiconsIcon icon={Message01Icon} size={14} />
              </Button>
            </div>
          </form>
          <div className="text-[10px] text-center text-muted-foreground mt-2">
            AI can make mistakes. Check the docs if stuck.
          </div>
        </div>
      </div>
    </>
  );
}
