"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/auth-context";
import { coursesApi } from "@/lib/courses";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Copy,
    List,
    Play,
    Shield,
    X,
} from "lucide-react";
import AIAssistant from "@/components/ai/ai-assistant";

const typeIcons: Record<string, { icon: any; color: string }> = {
    video: { icon: Play, color: "text-neon-cyan" },
    doc: { icon: BookOpen, color: "text-neon-purple" },
    test: { icon: Shield, color: "text-amber-400" },
    quiz: { icon: List, color: "text-amber-400" },
};

function getYoutubeEmbedUrl(url: string) {
    if (!url) return null;
    let videoId = "";
    if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else if (url.includes("youtube.com/watch?v=")) {
        videoId = url.split("v=")[1]?.split("&")[0];
    } else if (url.includes("youtube.com/embed/")) {
        videoId = url.split("embed/")[1]?.split("?")[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1` : null;
}

function renderContent(md: string) {
    const lines = md.trim().split("\n");
    const elements: React.ReactNode[] = [];
    let codeBlock: string[] | null = null;
    let codeLanguage = "";

    lines.forEach((line, i) => {
        if (line.trim().startsWith("```")) {
            if (codeBlock !== null) {
                elements.push(
                    <div key={`code-${i}`} className="my-6 border border-white/[0.08] bg-[#0a0f1a] overflow-hidden relative group">
                        <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-green/30" />
                        <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-green/30" />
                        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08] bg-white/[0.02]">
                            <span className="text-[10px] text-zinc-500 font-black font-mono uppercase tracking-widest">
                                <span className="text-neon-green/40">$ </span>
                                {codeLanguage || "code"}
                            </span>
                            <button className="text-zinc-500 hover:text-neon-green transition-colors">
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <pre className="p-4 text-[13px] text-zinc-300 overflow-x-auto font-mono leading-relaxed bg-[#050810]">
                            <code>{codeBlock.join("\n")}</code>
                        </pre>
                    </div>
                );
                codeBlock = null;
            } else {
                codeLanguage = line.trim().replace("```", "");
                codeBlock = [];
            }
            return;
        }
        if (codeBlock !== null) { codeBlock.push(line); return; }

        if (line.startsWith("# ")) {
            elements.push(
                <div key={i} className="mt-12 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-neon-green font-mono text-sm">{">"}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">core_module</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                    <h1 className="text-3xl font-black text-white font-mono tracking-tight">{line.slice(2)}</h1>
                </div>
            );
            return;
        }
        if (line.startsWith("## ")) {
            elements.push(
                <h2 key={i} className="text-xl font-black text-white mt-10 mb-4 font-mono flex items-center gap-2">
                    <span className="text-neon-cyan/40">#</span> {line.slice(3)}
                </h2>
            );
            return;
        }
        if (line.startsWith("> ")) {
            elements.push(
                <div key={i} className="my-6 p-4 border border-neon-green/20 bg-neon-green/5 font-mono relative">
                    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-green/40" />
                    <div className="text-sm text-zinc-300 leading-relaxed italic">
                        <span className="text-neon-green/60 font-black not-italic mr-2">TIP //</span>
                        {line.slice(2).replace("**💡 Tip:**", "").trim()}
                    </div>
                </div>
            );
            return;
        }
        if (line.trim() === "") { elements.push(<div key={i} className="h-4" />); return; }

        const parts = line.split(/(`[^`]+`)/g);
        elements.push(
            <p key={i} className="text-sm text-zinc-400 leading-relaxed mb-4 font-mono">
                {parts.map((part, j) =>
                    part.startsWith("`") && part.endsWith("`")
                        ? <code key={j} className="px-1.5 py-0.5 border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan text-[11px] font-mono mx-0.5">{part.slice(1, -1)}</code>
                        : <span key={j}>{part}</span>
                )}
            </p>
        );
    });
    return elements;
}

export default function LessonPage() {
    const { slug, id } = useParams<{ slug: string; id: string }>();
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [lesson, setLesson] = useState<any>(null);
    const [milestone, setMilestone] = useState<any>(null);
    const [sidebarLessons, setSidebarLessons] = useState<any[]>([]);
    const [nextLesson, setNextLesson] = useState<any>(null);
    const [prevLesson, setPrevLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth");
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            coursesApi.getCourseBySlug(slug as string).then(res => {
                const { course: c, milestoneProgress } = res.data;
                let currentResource: any = null;
                let allItems: any[] = [];

                c.milestones.forEach((m: any) => {
                    const lessons = m.lessons || [];
                    const tests = m.tests || [];
                    const items = [...lessons, ...tests].map(i => ({
                        ...i,
                        milestoneId: m._id,
                        mTitle: m.title,
                        mXp: m.xpReward,
                        isTest: (i as any).questions?.length > 0 || !!(i as any).codeChallenge || i.type === 'test' || i.type === 'quiz'
                    }));
                    allItems = [...allItems, ...items];
                });

                const currentIndex = allItems.findIndex(i => i._id === id);
                if (currentIndex !== -1) {
                    currentResource = allItems[currentIndex];
                    const prev = allItems[currentIndex - 1] || null;
                    const next = allItems[currentIndex + 1] || null;
                    const currentMilestone = c.milestones.find((m: any) => m._id === currentResource.milestoneId);
                    const progress = milestoneProgress?.find((p: any) => p.milestoneId === currentResource.milestoneId);

                    const checkCompleted = (item: any) => {
                        if (item.isTest) {
                            return progress?.testAttempts?.find((a: any) => a.testId === item._id)?.passed || false;
                        }
                        return progress?.completedLessons?.includes(item._id) || false;
                    };

                    if (!currentMilestone) {
                        setLoading(false);
                        return;
                    }

                    const mItems = [
                        ...(currentMilestone.lessons || []).map((l: any) => ({ ...l, type: l.type || 'video', completed: checkCompleted(l), isTest: false })),
                        ...(currentMilestone.tests || []).map((t: any) => ({ ...t, type: t.type || 'test', completed: checkCompleted(t), isTest: true }))
                    ];

                    setSidebarLessons(mItems);

                    const mappedLesson = {
                        id: currentResource._id,
                        title: currentResource.title,
                        type: currentResource.type || "doc",
                        content: currentResource.content || "# Content\nContent goes here.",
                        course: { title: c.title },
                        milestone: { _id: currentMilestone._id, title: currentMilestone?.title, order: currentMilestone?.order },
                        xpReward: currentMilestone?.xpReward || 0,
                        videoUrl: currentResource.url || null,
                        completed: checkCompleted(currentResource)
                    };

                    setLesson(mappedLesson);
                    setMilestone(currentMilestone);
                    setPrevLesson(prev ? { id: prev._id, title: prev.title, isTest: prev.isTest } : null);
                    setNextLesson(next ? { id: next._id, title: next.title, isTest: next.isTest } : null);

                    // Auto-complete lesson if not already completed
                    if (!mappedLesson.completed && !currentResource.isTest) {
                        coursesApi.completeLesson(slug as string, currentMilestone._id, currentResource._id)
                            .catch(err => console.error("Auto-complete failed", err));
                    }
                }
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [slug, id, authLoading, isAuthenticated]);

    const handleNext = async () => {
        if (!nextLesson) return;
        const prefix = nextLesson.isTest ? 'tests' : 'lessons';
        router.push(`/courses/${slug}/${prefix}/${nextLesson.id}`);
    };

    const handlePrev = () => {
        if (!prevLesson) return;
        const prefix = prevLesson.isTest ? 'tests' : 'lessons';
        router.push(`/courses/${slug}/${prefix}/${prevLesson.id}`);
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#020408]">
                <div className="w-6 h-6 border-2 border-neon-green/30 border-t-neon-green animate-spin" />
            </div>
        );
    }

    if (!lesson) return <div className="h-screen bg-[#020408] text-white p-10 font-mono">Lesson not found.</div>;

    return (
        <div className="h-screen flex flex-col bg-[#020408] overflow-hidden">
            {/* Header */}
            <header className="shrink-0 z-20 border-b border-white/[0.06] bg-[#020408]">
                <div className="px-4 h-12 flex items-center justify-between gap-4 font-mono">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link href={`/courses/${slug}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-neon-cyan transition-colors group">
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            EXIT
                        </Link>
                        <div className="h-4 w-px bg-white/10" />
                        <span className="text-[10px] text-zinc-600 truncate uppercase tracking-wider">{lesson.course.title}</span>
                        <ChevronRight className="w-3 h-3 text-zinc-700" />
                        <span className="text-xs text-white font-black truncate uppercase tracking-widest">{lesson.title}</span>
                    </div>
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="p-2 hover:bg-white/5 transition-colors text-zinc-500 hover:text-white"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Sidebar */}
                <AnimatePresence>
                    {showSidebar && (
                        <motion.aside
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            className="absolute left-0 top-0 bottom-0 w-72 border-r border-white/[0.06] bg-[#020408] z-30 shadow-2xl flex flex-col"
                        >
                            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-black/50">
                                <span className="text-[10px] font-black font-mono text-zinc-500 uppercase tracking-widest">MODULE CONTENT</span>
                                <button onClick={() => setShowSidebar(false)} className="text-zinc-600 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {sidebarLessons.map((item: any) => {
                                    const ti = typeIcons[item.type] || typeIcons.doc;
                                    const Icon = ti.icon;
                                    const isCurrent = item._id === id;
                                    const prefix = item.isTest ? 'tests' : 'lessons';

                                    return (
                                        <Link
                                            key={item._id}
                                            href={`/courses/${slug}/${prefix}/${item._id}`}
                                            className={`flex items-center gap-3 px-3 py-2.5 transition-colors group/item font-mono ${isCurrent ? "bg-white/[0.05] border border-white/10" : "hover:bg-white/[0.02] border border-transparent"}`}
                                        >
                                            <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-neon-cyan" : "text-zinc-600"}`} />
                                            <span className={`text-[11px] flex-1 truncate ${isCurrent ? "text-white font-bold" : "text-zinc-500 group-hover/item:text-zinc-300"}`}>
                                                {item.title}
                                            </span>
                                            {item.completed && <CheckCircle2 className="w-3 h-3 text-neon-green" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-[#020408] relative">
                    <div className="absolute inset-0 pointer-events-none opacity-[0.01]" style={{
                        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,163,0.08) 2px, rgba(0,255,163,0.08) 4px)",
                    }} />

                    <div className="max-w-4xl mx-auto px-10 py-12 relative z-10">
                        {/* Milestone header */}
                        <div className="mb-10 flex items-center gap-4 text-[10px] font-mono">
                            <span className="text-neon-cyan/60 uppercase"># {milestone?.title}</span>
                            <span className="text-zinc-700">/</span>
                            <span className="text-zinc-600">Part {(milestone?.order || 0) + 1}</span>
                        </div>

                        {/* Video */}
                        {lesson.type === "video" && lesson.videoUrl && (
                            <div className="mb-12 relative group shadow-2xl">
                                <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 blur-xl opacity-20" />
                                <div className="relative border border-white/[0.08] bg-black aspect-video overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08] bg-black/40 font-mono">
                                        <div className="flex items-center gap-2">
                                            <Play className="w-3.5 h-3.5 text-neon-cyan" />
                                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">node_playback_raw</span>
                                        </div>
                                    </div>
                                    {getYoutubeEmbedUrl(lesson.videoUrl) ? (
                                        <iframe
                                            src={getYoutubeEmbedUrl(lesson.videoUrl)!}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-600 italic">Invalid Video Stream</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {lesson.type === "video" && milestone?.description && (
                            <div className="mb-10 p-6 border border-white/[0.08] bg-white/[0.02] font-mono relative group">
                                <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-cyan/30" />
                                <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-cyan/30" />
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                                        <span className="text-neon-cyan/40">$ </span>briefing
                                    </span>
                                    <div className="flex-1 h-px bg-white/[0.04]" />
                                </div>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    {milestone.description}
                                </p>
                            </div>
                        )}

                        {renderContent(lesson.content)}

                        {/* Pagination */}
                        <div className="mt-20 pt-10 border-t border-white/[0.06] flex items-center justify-between font-mono pb-20">
                            <button
                                onClick={handlePrev}
                                disabled={!prevLesson}
                                className={`flex flex-col items-start gap-1.5 group ${!prevLesson ? "opacity-20 cursor-not-allowed" : ""}`}
                            >
                                <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Back</span>
                                <div className="flex items-center gap-2 text-xs text-white group-hover:text-neon-cyan transition-colors">
                                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                                    {prevLesson?.title || "BEGINNING"}
                                </div>
                            </button>

                            <button
                                onClick={handleNext}
                                disabled={!nextLesson}
                                className={`flex flex-col items-end gap-1.5 group text-right ${!nextLesson ? "opacity-20 cursor-not-allowed" : ""}`}
                            >
                                <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-black">Proceed</span>
                                <div className="flex items-center gap-2 text-white group-hover:text-neon-cyan transition-colors text-xs">
                                    {nextLesson?.title || "END OF QUEST"}
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {lesson && (
                <AIAssistant
                    lessonContent={lesson.content}
                    lessonTitle={lesson.title}
                />
            )}
        </div>
    );
}
