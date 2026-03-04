"use client";

import { motion } from "framer-motion";
import { BookOpen, Clock, Zap, Trophy, Target, Swords, Lock, Users, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DifficultyStars, ProgressRing } from "@/components/landing/learning-paths";
import { urlFor } from "@/lib/sanity/client";

export function SanityCourseCard({
    course,
    index,
    onBeginQuest
}: {
    course: any;
    index: number;
    onBeginQuest?: (slug: string) => void
}) {
    const isLocked = false; // Sanity courses are usually unlocked if published
    const difficultyMap: Record<string, number> = {
        beginner: 1,
        intermediate: 2,
        advanced: 3,
        expert: 4
    };

    const difficulty = difficultyMap[course.difficulty?.toLowerCase()] || 1;

    // Aesthetic fallbacks matching the existing theme
    const theme = {
        ringColor: course.track?.color || "#00ffa3",
        glowColor: `rgba(0, 255, 163, 0.15)`, // default to neon green glow
        textColor: "text-neon-green",
        bgAccent: "bg-neon-green",
        borderColor: "border-neon-green/30",
        tagColor: "bg-neon-green/10 text-neon-green border-neon-green/20"
    };

    if (course.track?.color) {
        // Simple heuristic to adjust colors based on track color if provided
        // In a real app, we might use a color utility to generate these
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative"
        >
            <div
                className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                style={{ background: `radial-gradient(ellipse, ${theme.glowColor}, transparent 70%)` }}
            />

            <div className="relative border border-white/[0.08] hover:border-white/[0.15] bg-[#080c14] overflow-hidden transition-all duration-500">
                <div className={`h-[2px] ${theme.bgAccent}`} />

                <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

                <div className="p-6 pb-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            <motion.div
                                whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.1 }}
                                className={`w-16 h-16 border ${theme.borderColor} bg-white/[0.02] flex-shrink-0 relative flex items-center justify-center text-2xl overflow-hidden`}
                            >
                                {course.mainImage ? (
                                    <img src={urlFor(course.mainImage).width(200).url()} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl">{course.track?.icon || "📜"}</span>
                                )}
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className={`absolute inset-0 border ${theme.borderColor}`}
                                />
                            </motion.div>

                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[9px] font-black font-mono uppercase tracking-widest px-2 py-0.5 border ${theme.tagColor}`}>
                                        {course.track?.title || "Course"}
                                    </span>
                                    <span className="text-[9px] font-black font-mono uppercase tracking-widest text-zinc-600">
                                        CMS Content
                                    </span>
                                </div>

                                <h3 className="text-xl md:text-2xl font-black font-mono text-white">
                                    {course.title}
                                </h3>

                                <div className="flex items-center gap-3">
                                    <DifficultyStars count={difficulty} color={theme.textColor} />
                                    <span className={`text-xs font-bold font-mono ${theme.textColor}`}>{course.difficulty}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 ${theme.bgAccent} relative overflow-hidden`}
                            >
                                <Zap className="w-4 h-4 text-black" />
                                <span className="text-sm font-black font-mono text-black">{(course.xp || 0).toLocaleString()} XP</span>
                            </motion.div>
                            <ProgressRing percent={0} color={theme.ringColor} />
                        </div>
                    </div>
                </div>

                <div className="px-6 pt-3 pb-4">
                    <p className="text-sm text-zinc-400 leading-relaxed font-mono line-clamp-2">{course.description}</p>
                </div>

                <div className="px-6 pb-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4 text-[11px] font-mono">
                            <span className="text-zinc-500 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span className="font-bold text-zinc-300">{course.milestones?.length || 0}</span> Milestones
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-500 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="font-bold text-zinc-300">{course.duration || "N/A"}</span>
                            </span>
                        </div>

                        {course.author && (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-tighter">by</span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/[0.02] border border-white/[0.05]">
                                    {course.author.image && (
                                        <img src={urlFor(course.author.image).width(40).url()} alt={course.author.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                                    )}
                                    <span className="text-[10px] font-bold text-zinc-400 font-mono">{course.author.name}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between font-mono">
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-neon-cyan/50" /> 0 enrolled</span>
                        <span className="text-zinc-700">•</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-400/50" /> 0% comp.</span>
                    </div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                        <Button
                            onClick={() => onBeginQuest?.(course.slug.current)}
                            size="lg"
                            className={`btn-hacker ${theme.bgAccent} text-black font-black font-mono uppercase tracking-wider transition-all duration-300 relative overflow-hidden group/btn`}
                        >
                            ⚔️ Begin Quest
                            <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
