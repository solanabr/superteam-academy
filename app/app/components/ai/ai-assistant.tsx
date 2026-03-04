"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, Terminal } from "lucide-react";

interface Message {
    role: "user" | "bot";
    content: string;
}

interface AIAssistantProps {
    lessonContent: string;
    lessonTitle: string;
}

export default function AIAssistant({ lessonContent, lessonTitle }: AIAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "bot",
            content: `Hello! I'm your AI tutor for "${lessonTitle}". How can I help you today?`
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, { role: "user", content: userMessage }],
                    context: lessonContent
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            setMessages(prev => [...prev, { role: "bot", content: data.message }]);
        } catch (error: any) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: "bot", content: "Sorry, I encountered an error. Please check if the GEMINI_API_KEY is configured." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#020408] border border-neon-cyan/50 shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center z-50 group overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-neon-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Bot className="w-6 h-6 text-neon-cyan relative z-10" />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9, x: 50 }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9, x: 50 }}
                        className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-[#020408] border border-white/[0.08] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden font-mono"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/[0.08] bg-black/40 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">ai_tutor_v1.0</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-zinc-600 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 relative"
                        >
                            <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
                                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.08) 2px, rgba(0,240,255,0.08) 4px)",
                            }} />

                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] p-3 rounded-lg text-sm relative group ${m.role === "user"
                                            ? "bg-neon-cyan/5 border border-neon-cyan/20 text-zinc-200"
                                            : "bg-white/[0.02] border border-white/10 text-zinc-300"
                                        }`}>
                                        <div className="flex items-center gap-2 mb-1 opacity-50">
                                            {m.role === "user" ? (
                                                <>
                                                    <span className="text-[9px] uppercase tracking-wider">user_node</span>
                                                    <User className="w-3 h-3 text-neon-cyan" />
                                                </>
                                            ) : (
                                                <>
                                                    <Bot className="w-3 h-3 text-neon-cyan" />
                                                    <span className="text-[9px] uppercase tracking-wider">ai_response</span>
                                                </>
                                            )}
                                        </div>
                                        <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

                                        {/* Corner Decorations */}
                                        <span className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l ${m.role === "user" ? "border-neon-cyan/30" : "border-white/20"} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                        <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r ${m.role === "user" ? "border-neon-cyan/30" : "border-white/20"} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/[0.02] border border-white/10 p-3 rounded-lg flex items-center gap-3">
                                        <Loader2 className="w-3 h-3 text-neon-cyan animate-spin" />
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest animate-pulse">processing_query...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/[0.08] bg-black/40">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Type your question..."
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-neon-cyan/30 transition-colors pr-10"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-600 hover:text-neon-cyan disabled:opacity-30 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[8px] text-zinc-700 uppercase tracking-tighter">
                                <span>secure_channel_established</span>
                                <span className="flex items-center gap-1">
                                    <Sparkles className="w-2 h-2 text-neon-cyan" />
                                    gemini_pro_integrated
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
