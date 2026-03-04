"use client";

import { Thread, ThreadType } from "@/lib/community";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Send, MessageSquare, HelpCircle, Tag } from "lucide-react";
import { useTranslations } from "next-intl";

interface ThreadFormProps {
    initialData?: Partial<Thread>;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export function ThreadForm({ initialData, onSubmit, onCancel, isSubmitting }: ThreadFormProps) {
    const t = useTranslations("Community");
    const [title, setTitle] = useState(initialData?.title || "");
    const [body, setBody] = useState(initialData?.body || "");
    const [type, setType] = useState<ThreadType>(initialData?.type || "discussion");
    const [tags, setTags] = useState(initialData?.tags?.join(", ") || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            title,
            body,
            type,
            tags: tags.split(",").map(t => t.trim()).filter(t => t !== ""),
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-white/10 bg-[#0a0f1a] p-6 space-y-6 font-sans shadow-2xl relative"
        >
            <button
                onClick={onCancel}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    {initialData?._id ? t("editThread") : t("createThread")}
                </h2>
                <div className="h-0.5 w-12 bg-neon-cyan" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Type Selection */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setType("discussion")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 border font-mono text-[10px] font-black uppercase tracking-widest transition-all ${type === "discussion"
                                ? "bg-neon-cyan/10 border-neon-cyan text-neon-cyan"
                                : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/10"
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        {t("discussions")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setType("question")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 border font-mono text-[10px] font-black uppercase tracking-widest transition-all ${type === "question"
                                ? "bg-amber-400/10 border-amber-400 text-amber-400"
                                : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/10"
                            }`}
                    >
                        <HelpCircle className="w-4 h-4" />
                        {t("questions")}
                    </button>
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                        {t("threadTitle")}
                    </label>
                    <input
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-neon-cyan focus:outline-none transition-colors"
                    />
                </div>

                {/* Body */}
                <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                        {t("threadBody")}
                    </label>
                    <textarea
                        required
                        rows={8}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Detailed description (Markdown supported)..."
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-neon-cyan focus:outline-none transition-colors resize-none font-mono text-sm"
                    />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Tag className="w-3 h-3" /> {t("threadTags")}
                    </label>
                    <input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="solana, anchor, help"
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-neon-cyan focus:outline-none transition-colors font-mono text-sm"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 text-[10px] font-mono font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                    >
                        {t("cancel")}
                    </button>
                    <button
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-2 bg-neon-cyan text-black text-[10px] font-mono font-black uppercase tracking-widest hover:bg-neon-cyan/80 transition-all disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                        {t("submit")}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
