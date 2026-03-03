"use client";

import { useParams } from "next/navigation";
import { getCourseBySlug } from "@/lib/courses";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Zap, Check, Play, Bot, Send, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { useChat } from "@ai-sdk/react";
import { useTranslations } from "next-intl";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function LessonPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const lessonId = parseInt(params?.id as string ?? "0");
    const course = getCourseBySlug(slug);
    const lesson = course?.lessons[lessonId];
    const t = useTranslations("lesson");

    const [code, setCode] = useState(lesson?.challenge?.starterCode ?? "");
    const [completing, setCompleting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [showXP, setShowXP] = useState(false);

    // AI Chat state
    const { messages, sendMessage, status } = useChat();
    const isLoading = status === "submitted" || status === "streaming";
    const [input, setInput] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        sendMessage({ role: "user", parts: [{ type: "text", text: input }] });
        setInput("");
    };

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (isChatOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isChatOpen]);

    useEffect(() => {
        setCode(lesson?.challenge?.starterCode ?? "");
        setCompleted(false);
        setShowXP(false);
    }, [lesson]);

    if (!course || !lesson) {
        return (
            <div className="min-h-screen">
                <div className="flex items-center justify-center mt-32 text-[hsl(var(--muted-foreground))]">
                    {t("lesson_not_found")}
                </div>
            </div>
        );
    }

    async function handleComplete() {
        setCompleting(true);
        try {
            // In production: POST /api/complete-lesson
            await new Promise((r) => setTimeout(r, 1000));
            setCompleted(true);
            setShowXP(true);
            setTimeout(() => setShowXP(false), 3000);
            toast.success(`+${course!.xpPerLesson} XP earned! Lesson complete! 🎉`);
        } catch {
            toast.error("Could not mark lesson complete. Try again.");
        } finally {
            setCompleting(false);
        }
    }

    const prevLesson = lessonId > 0 ? lessonId - 1 : null;
    const nextLesson = lessonId < course.lessons.length - 1 ? lessonId + 1 : null;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Lesson header bar */}
            <div className="border-b border-[hsl(var(--border))] px-4 py-3 flex items-center gap-4 bg-[hsl(var(--card))]">
                <Link href={`/courses/${slug}`} className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> {course.title}
                </Link>
                <span className="text-[hsl(var(--border))]">|</span>
                <span className="text-sm font-medium">{lesson.title}</span>

                {/* Progress dots */}
                <div className="flex gap-1 ml-auto">
                    {course.lessons.map((_, i) => (
                        <Link key={i} href={`/courses/${slug}/lessons/${i}`}>
                            <div className={`w-2 h-2 rounded-full transition-colors ${i === lessonId ? "bg-[hsl(var(--primary))]" :
                                i < lessonId ? "bg-green-500" : "bg-[hsl(var(--muted))]"
                                }`} />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Main split layout */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left: Markdown content */}
                <div className="lg:w-1/2 overflow-y-auto p-6 border-r border-[hsl(var(--border))]">
                    <div className="prose prose-invert prose-sm max-w-none
            prose-headings:font-heading prose-headings:text-[hsl(var(--foreground))]
            prose-code:bg-[hsl(var(--muted))] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-green-300 prose-code:text-xs prose-code:font-mono
            prose-pre:bg-[hsl(var(--muted))] prose-pre:border prose-pre:border-[hsl(var(--border))]
            prose-a:text-[hsl(var(--primary))] prose-strong:text-[hsl(var(--foreground))]">
                        <div dangerouslySetInnerHTML={{ __html: markdownToHtml(lesson.content) }} />
                    </div>

                    {/* XP flash */}
                    {showXP && (
                        <div className="fixed top-24 right-8 z-50 bg-green-500 text-white font-bold px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
                            <Zap className="w-5 h-5" />
                            +{course.xpPerLesson} XP!
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-10 pt-6 border-t border-[hsl(var(--border))]">
                        {prevLesson !== null ? (
                            <Link href={`/courses/${slug}/lessons/${prevLesson}`} className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                                <ChevronLeft className="w-4 h-4" /> {t("prev_lesson")}
                            </Link>
                        ) : <div />}

                        <button
                            onClick={handleComplete}
                            disabled={completing || completed}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${completed
                                ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                                : "bg-[hsl(var(--primary))] text-white hover:opacity-90 disabled:opacity-50 hover:shadow-[var(--glow-purple)]"
                                }`}
                        >
                            {completed ? (
                                <><Check className="w-4 h-4" /> {t("completed")} (+{course.xpPerLesson} XP)</>
                            ) : completing ? (
                                t("marking")
                            ) : (
                                <><Play className="w-4 h-4" /> {t("mark_complete")}</>
                            )}
                        </button>

                        {nextLesson !== null ? (
                            <Link href={`/courses/${slug}/lessons/${nextLesson}`} className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                                {t("next_lesson")} <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : <div />}
                    </div>
                </div>

                {/* Right: Code editor & AI Chat */}
                <div className="lg:w-1/2 flex flex-col bg-[hsl(225_20%_7%)] relative">
                    <div className="border-b border-[hsl(var(--border))] px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
                                {lesson.hasCodeChallenge ? "challenge.ts" : "playground.ts"}
                            </span>
                            {lesson.hasCodeChallenge && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 font-semibold">
                                    {t("code_challenge")}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isChatOpen ? "bg-[hsl(var(--primary))] text-white" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-white"
                                }`}
                        >
                            <Bot className="w-3.5 h-3.5" />
                            {isChatOpen ? t("close_ai") : t("ask_ai")}
                        </button>
                    </div>

                    <div className="flex-1 min-h-[300px]">
                        <MonacoEditor
                            height="100%"
                            defaultLanguage="typescript"
                            theme="vs-dark"
                            value={code}
                            onChange={(v) => setCode(v ?? "")}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                fontFamily: "JetBrains Mono, monospace",
                                padding: { top: 16 },
                                scrollBeyondLastLine: false,
                                lineNumbers: "on",
                                wordWrap: "on",
                            }}
                        />
                    </div>

                    {/* Test cases (conditionally hidden when chat is open to save space) */}
                    {lesson.hasCodeChallenge && lesson.challenge && !isChatOpen && (
                        <div className="border-t border-[hsl(var(--border))] p-4 space-y-2 max-h-48 overflow-y-auto">
                            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">{t("test_cases")}</p>
                            {lesson.challenge.testCases.map((tc, i) => (
                                <div key={i} className="glass rounded-lg p-3 text-xs">
                                    <p className="text-[hsl(var(--muted-foreground))] mb-1">{tc.description}</p>
                                    <p className="font-mono text-green-300">Expected: {tc.expected}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* AI Chat Drawer */}
                    {isChatOpen && (
                        <div className="absolute bottom-0 left-0 right-0 h-[350px] bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] flex flex-col shadow-2xl z-10 transition-transform">
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-[hsl(var(--muted-foreground))]">
                                        <Bot className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="text-sm">{t("ai_welcome")} <br />{t("ai_prompt")}</p>
                                    </div>
                                ) : (
                                    messages.map((m) => (
                                        <div key={m.id} className={`flex gap-3 text-sm ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-[hsl(var(--primary))]" : "bg-green-500/20 text-green-400"}`}>
                                                {m.role === "user" ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                                            </div>
                                            <div className={`max-w-[85%] rounded-xl p-3 ${m.role === "user" ? "bg-[hsl(var(--primary))] text-white rounded-tr-sm" : "bg-[hsl(var(--muted))] rounded-tl-sm"}`}>
                                                {m.parts.map((p, i) => p.type === 'text' ? <span key={i}>{p.text}</span> : null)}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isLoading && (
                                    <div className="flex gap-3 text-sm">
                                        <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                                            <Bot className="w-3.5 h-3.5 animate-pulse" />
                                        </div>
                                        <div className="bg-[hsl(var(--muted))] rounded-xl p-3 rounded-tl-sm flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce delay-75" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce delay-150" />
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleSubmit} className="p-3 border-t border-[hsl(var(--border))] flex gap-2">
                                <input
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder={t("ask_hint")}
                                    className="flex-1 bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary)/0.5)] transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="bg-[hsl(var(--primary))] text-white p-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Simple markdown to HTML (for demo — use react-markdown in production)
function markdownToHtml(md: string): string {
    return md
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/```[\w]*\n?([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
        .replace(/^- (.*$)/gim, "<li>$1</li>")
        .replace(/\n\n/g, "<br/><br/>");
}