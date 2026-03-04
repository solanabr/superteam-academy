"use client";

import { Reply } from "@/lib/community";
import { motion } from "framer-motion";
import { ThumbsUp, CheckCircle2, User as UserIcon, CornerDownRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ReplyItemProps {
    reply: Reply & { children?: Reply[] };
    isThreadAuthor: boolean;
    onVote: (id: string) => void;
    onAccept?: (id: string) => void;
    isNested?: boolean;
}

export function ReplyItem({ reply, isThreadAuthor, onVote, onAccept, isNested = false }: ReplyItemProps) {
    const t = useTranslations("Community");
    const [isVoted, setIsVoted] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const handleVote = () => {
        onVote(reply._id);
        setIsVoted(!isVoted);
    };

    const hasChildren = reply.children && reply.children.length > 0;

    return (
        <div className="space-y-3">
            <motion.div
                initial={{ opacity: 0, x: isNested ? 10 : 0 }}
                animate={{ opacity: 1, x: 0 }}
                className={`relative group border border-white/[0.06] bg-[#0a0f1a]/60 p-4 space-y-3 font-sans transition-all ${reply.isAccepted ? "border-neon-green/30 bg-neon-green/[0.02]" : ""
                    }`}
            >
                {/* Thread Connector Line */}
                {isNested && (
                    <div className="absolute -left-4 top-0 bottom-0 w-px bg-white/10" />
                )}

                {/* Header: Author & Medal/Badge */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                            {reply.author.avatar ? (
                                <img src={reply.author.avatar} className="w-full h-full object-cover grayscale opacity-80" alt="" />
                            ) : (
                                <UserIcon className="w-4 h-4 text-zinc-600" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white uppercase tracking-wider">
                                    {reply.author.name || reply.author.username}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-neon-purple/20 text-neon-purple border border-neon-purple/40 font-mono font-black">
                                    Lvl {reply.author.level}
                                </span>
                            </div>
                            <span className="text-[9px] text-zinc-600 font-mono">
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                    </div>

                    {reply.isAccepted && (
                        <div className="flex items-center gap-1.5 text-neon-green bg-neon-green/10 border border-neon-green/20 px-2 py-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t("accepted")}</span>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="text-sm text-zinc-300 leading-relaxed max-w-none">
                    {reply.body}
                </div>

                {/* Footer: Actions */}
                <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                    <button
                        onClick={handleVote}
                        className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono font-bold transition-colors ${isVoted ? "text-neon-cyan bg-neon-cyan/10" : "text-zinc-500 hover:text-white bg-white/5"
                            }`}
                    >
                        <ThumbsUp className="w-3 h-3" />
                        {reply.upvotes.length + (isVoted ? 1 : 0)}
                    </button>

                    {isThreadAuthor && !reply.isAccepted && onAccept && (
                        <button
                            onClick={() => onAccept(reply._id)}
                            className="text-[10px] font-mono font-bold text-zinc-500 hover:text-neon-green transition-colors uppercase tracking-widest"
                        >
                            {t("acceptAnswer")}
                        </button>
                    )}

                    {hasChildren && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="ml-auto text-[10px] font-mono font-bold text-neon-cyan/60 hover:text-neon-cyan transition-colors uppercase tracking-widest"
                        >
                            {isExpanded ? "[ - ] Hide" : `[ + ] Show ${reply.children?.length} Replies`}
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Nested Replies */}
            {hasChildren && isExpanded && (
                <div className="pl-6 md:pl-10 space-y-3 relative">
                    {/* Vertical line mapping the thread connection */}
                    <div className="absolute left-3 md:left-5 top-0 bottom-4 w-px bg-white/5" />
                    {reply.children?.map((child) => (
                        <ReplyItem
                            key={child._id}
                            reply={child}
                            isThreadAuthor={isThreadAuthor}
                            onVote={onVote}
                            onAccept={onAccept}
                            isNested={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
