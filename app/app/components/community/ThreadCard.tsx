"use client";

import { Thread } from "@/lib/community";
import { motion } from "framer-motion";
import { MessageSquare, ThumbsUp, Eye, Pin, Lock, CheckCircle2, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

interface ThreadCardProps {
    thread: Thread;
}

export function ThreadCard({ thread }: ThreadCardProps) {
    const t = useTranslations("Community");

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group border border-white/[0.06] bg-[#0a0f1a]/90 hover:bg-[#0d1423] hover:border-white/10 transition-all overflow-hidden font-sans"
        >
            <Link href={`/community/${thread._id}`} className="block p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                        {/* Meta: Pins, Locks, Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                            {thread.isPinned && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20">
                                    <Pin className="w-3 h-3" /> {t("pinned")}
                                </span>
                            )}
                            {thread.isLocked && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-zinc-400/10 text-zinc-400 border border-zinc-400/20">
                                    <Lock className="w-3 h-3" /> {t("locked")}
                                </span>
                            )}
                            {thread.type === "question" && (
                                <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border ${thread.isSolved
                                        ? "bg-neon-green/10 text-neon-green border-neon-green/20"
                                        : "bg-red-400/10 text-red-400 border-red-400/20"
                                    }`}>
                                    <CheckCircle2 className="w-3 h-3" /> {thread.isSolved ? t("solved") : t("unsolved")}
                                </span>
                            )}
                            {thread.tags.map(tag => (
                                <span key={tag} className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-1.5 py-0.5 bg-white/[0.04] border border-white/5 rounded-full">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors line-clamp-2 leading-tight">
                            {thread.title}
                        </h3>

                        {/* Author & Time */}
                        <div className="flex items-center gap-3 font-mono">
                            <div className="w-6 h-6 border border-white/10 bg-white/5 flex items-center justify-center text-[10px] overflow-hidden">
                                {thread.author.avatar ? (
                                    <img src={thread.author.avatar} className="w-full h-full object-cover grayscale opacity-80" alt="" />
                                ) : (
                                    <UserIcon className="w-3 h-3 text-zinc-500" />
                                )}
                            </div>
                            <span className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors">
                                {thread.author.name || thread.author.username}
                            </span>
                            <span className="text-[10px] text-zinc-600">
                                {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col items-end gap-3 font-mono min-w-[80px]">
                        <div className="flex items-center gap-1.5 text-zinc-500 group-hover:text-white transition-colors">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{thread.upvotes.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500 group-hover:text-white transition-colors">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{thread.replyCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500 group-hover:text-white transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{thread.views}</span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
