"use client";

import { useParams } from "next/navigation";
import { Link } from "@/src/i18n/routing";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/auth-context";
import { coursesApi } from "@/lib/courses";
import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    Lock,
    Play,
    Shield,
    Star,
    Trophy,
    Users,
    Zap,
    List,
    Sparkles,
    AlertCircle,
    Loader2,
    Video,
    Phone,
} from "lucide-react";
import VideoCallModal from "@/components/courses/VideoCallModal";

/* ── stub data ───────────────────────────────────────────── */
const courseData: Record<string, typeof defaultCourse> = {};

const defaultCourse = {
    slug: "intro-to-solana",
    title: "Intro to Solana",
    description:
        "Learn the fundamentals of Solana blockchain — accounts, transactions, and the runtime model. This course takes you from zero knowledge to confidently reading and reasoning about on-chain data.",
    instructor: { name: "Alex Rivera", avatar: "", role: "Solana Core Contributor" },
    difficulty: "Beginner" as const,
    duration: "2 hours",
    students: "12.4K",
    xp: 200,
    rating: 4.8,
    ratingCount: 342,
    reviews: [],
    enrolled: false,
    progress: 35,
    milestones: [
        {
            id: "m1",
            title: "Blockchain Basics",
            description: "Understand what makes Solana unique",
            completed: true,
            xp: 30,
            lessons: [
                { id: "l1", title: "What is Solana?", type: "video", duration: "8 min", completed: true },
                { id: "l2", title: "Accounts Model", type: "doc", duration: "12 min", completed: true },
                { id: "l3", title: "Knowledge Check", type: "test", duration: "5 min", completed: true },
            ],
        },
        {
            id: "m2",
            title: "Transactions Deep Dive",
            description: "Master transaction anatomy and lifecycle",
            completed: false,
            xp: 50,
            lessons: [
                { id: "l4", title: "Transaction Structure", type: "video", duration: "15 min", completed: true },
                { id: "l5", title: "Instructions & Programs", type: "doc", duration: "10 min", completed: false },
                { id: "l6", title: "Build a Transaction", type: "test", duration: "20 min", completed: false },
            ],
        },
        {
            id: "m3",
            title: "Programs & Runtime",
            description: "How programs execute on Solana",
            completed: false,
            xp: 50,
            lessons: [
                { id: "l7", title: "Program Lifecycle", type: "video", duration: "12 min", completed: false },
                { id: "l8", title: "Cross-Program Invocations", type: "doc", duration: "14 min", completed: false },
                { id: "l9", title: "Runtime Challenge", type: "test", duration: "25 min", completed: false },
            ],
        },
        {
            id: "m4",
            title: "Final Project",
            description: "Apply everything you have learned",
            completed: false,
            xp: 70,
            lessons: [
                { id: "l10", title: "Project Brief", type: "doc", duration: "5 min", completed: false },
                { id: "l11", title: "Build & Deploy", type: "test", duration: "40 min", completed: false },
            ],
        },
    ],
};

const diffColors: Record<string, { text: string; bg: string; border: string; glow: string }> = {
    Beginner: { text: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/20", glow: "rgba(0,255,163,0.15)" },
    Intermediate: { text: "text-neon-cyan", bg: "bg-neon-cyan/10", border: "border-neon-cyan/20", glow: "rgba(0,240,255,0.15)" },
    Advanced: { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", glow: "rgba(251,191,36,0.15)" },
};

const typeIcon: Record<string, { icon: any; color: string }> = {
    video: { icon: Play, color: "text-neon-cyan" },
    doc: { icon: BookOpen, color: "text-neon-purple" },
    test: { icon: Shield, color: "text-amber-400" },
    quiz: { icon: List, color: "text-amber-400" },
};

const staticReviews = [
    { name: "Sarah K.", rating: 5, text: "Best Solana course I've taken. Clear explanations and great challenges.", date: "2 weeks ago" },
    { name: "Mike T.", rating: 5, text: "The milestone structure kept me motivated. Earned my first on-chain credential!", date: "1 month ago" },
    { name: "Priya D.", rating: 4, text: "Solid fundamentals. Wish there were more advanced topics, but great for beginners.", date: "1 month ago" },
];

export default function CourseDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const { isAuthenticated, isLoading } = useAuth();
    const [courseState, setCourseState] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

    // Rating State
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ratingError, setRatingError] = useState<string | null>(null);
    const [showRatingSuccess, setShowRatingSuccess] = useState(false);
    const [showVideoCall, setShowVideoCall] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            coursesApi.getCourseBySlug(slug as string).then(res => {
                const { course: c, enrollment, milestoneProgress } = res.data;

                const formatDuration = (d: number) => {
                    if (!d) return "Self-paced";
                    if (d < 60) return `${d} mins`;
                    const hrs = Math.floor(d / 60);
                    return `${hrs} hr${hrs > 1 ? "s" : ""}`;
                };

                const formatStudents = (count: number) => {
                    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
                    return count.toString();
                };

                // Merge data and compute progress
                const merged = {
                    ...c,
                    enrolled: !!enrollment,
                    progress: enrollment?.progress || 0,
                    instructor: c.author,
                    duration: formatDuration(c.duration),
                    students: formatStudents(c.enrollmentCount || 0),
                    xp: c.totalXP || 0,
                    reviews: res.data.reviews || [],
                    userEnrollment: enrollment,
                };

                // Update milestone and lesson progress
                if (c.milestones) {
                    merged.milestones = c.milestones.map((m: any) => {
                        const prog = milestoneProgress?.find(p => p.milestoneId === m._id);

                        const allItems = [
                            ...(m.lessons || []).map((l: any) => ({
                                ...l,
                                type: l.type || 'video',
                                completed: prog?.completedLessons?.includes(l._id) || false
                            })),
                            ...(m.tests || []).map((t: any) => ({
                                ...t,
                                type: t.type || 'test',
                                completed: prog?.testAttempts?.find((a: any) => a.testId === t._id)?.passed || false
                            }))
                        ];

                        return {
                            ...m,
                            xp: m.xpReward || m.xp || 0,
                            completed: prog?.allTestsPassed || false,
                            allItems
                        };
                    });
                }

                // Recalculate granular progress
                const totalItems = (merged.milestones || []).reduce((acc: number, m: any) => acc + (m.allItems?.length || 0), 0);
                const completedItemsCount = (merged.milestones || []).reduce((acc: number, m: any) => {
                    return acc + (m.allItems?.filter((i: any) => i.completed).length || 0);
                }, 0);
                merged.progress = totalItems > 0 ? Math.round((completedItemsCount / totalItems) * 100) : 0;

                setCourseState(merged);
                setExpandedMilestone(merged.milestones?.[0]?._id || null);
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [slug, isLoading, isAuthenticated]);

    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-[#020408] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-neon-green/30 border-t-neon-green animate-spin" />
            </div>
        );
    }

    const course = courseState || defaultCourse;

    const handleRate = async () => {
        if (userRating === 0) {
            setRatingError("Please select a rating.");
            return;
        }

        setIsSubmitting(true);
        setRatingError(null);

        try {
            const res = await coursesApi.rateCourse(slug as string, userRating, userComment);
            if (res.success) {
                setShowRatingSuccess(true);
                // Refresh course data to show new rating and review
                const updatedRes = await coursesApi.getCourseBySlug(slug as string);
                const { course: c, reviews } = updatedRes.data;
                setCourseState((prev: any) => ({
                    ...prev,
                    rating: c.rating,
                    ratingCount: c.ratingCount,
                    reviews: reviews
                }));
            }
        } catch (err: any) {
            setRatingError(err.message || "Failed to submit rating.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isCompleted = course.userEnrollment?.completedAt || course.progress === 100;
    const canRate = course.enrolled && isCompleted && !course.userEnrollment?.rating;
    const diff = diffColors[course.difficulty] || diffColors.Beginner;
    const completedItemsCount = course.milestones.flatMap((m: any) => m.allItems || []).filter((i: any) => i.completed).length;
    const totalItemsCount = course.milestones.flatMap((m: any) => m.allItems || []).length;

    return (
        <div className="min-h-screen bg-[#020408] relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-neon-green/[0.03] blur-[200px]" />
                <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-neon-purple/[0.03] blur-[150px]" />
                {/* Scanlines */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,163,0.08) 2px, rgba(0,255,163,0.08) 4px)",
                }} />
            </div>

            {/* Top Bar */}
            <header className="relative z-10 border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/courses" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-neon-green transition-colors group font-mono">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        cd ../courses
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 border border-neon-green/30 bg-[#080c14] flex items-center justify-center">
                            <Zap className="w-4 h-4 text-neon-green" />
                        </div>
                        <span className="text-sm font-black text-white tracking-tight font-mono">Osmos</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">
                {/* ── Hero header ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    {/* Terminal heading */}
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-neon-green font-mono text-sm">{">"}</span>
                        <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                            course_detail
                        </span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-3 py-1 border text-[10px] font-bold font-mono uppercase tracking-wider ${diff.bg} ${diff.border} ${diff.text}`}>
                            {course.difficulty}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold font-mono">
                            <Clock className="w-3.5 h-3.5" /> {course.duration}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold font-mono">
                            <Users className="w-3.5 h-3.5" /> {course.students} students
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold font-mono">
                            <Star className="w-3.5 h-3.5 fill-amber-400" /> {course.rating} ({course.ratingCount})
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-white font-mono mb-3">{course.title}</h1>
                    <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed font-mono">
                        <span className="text-neon-green/40">// </span>
                        {course.description}
                    </p>

                    {/* Instructor */}
                    <div className="mt-6 flex items-center gap-3">
                        <div className="w-10 h-10 border border-white/10 bg-white/[0.02] flex items-center justify-center text-xs font-black text-white font-mono">
                            {course.instructor.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div className="font-mono">
                            <div className="text-sm font-bold text-white">{course.instructor.name}</div>
                            <div className="text-[10px] text-zinc-500">{course.instructor.role}</div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-[1fr_320px] gap-8">
                    {/* ── Left: Milestones ── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                        <h2 className="text-lg font-black text-white font-mono flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-400" />
                            <span className="text-neon-green/40">// </span>milestones
                            <span className="text-[10px] text-zinc-600 font-bold ml-auto">{completedItemsCount}/{totalItemsCount} items</span>
                        </h2>

                        {course.milestones.map((milestone: any, mIdx: number) => {
                            const isOpen = expandedMilestone === milestone.id || expandedMilestone === milestone._id;
                            const milestoneItems = milestone.allItems || [];
                            const completedCount = milestoneItems.filter((i: any) => i.completed).length;
                            const milestonePct = milestoneItems.length ? Math.round((completedCount / milestoneItems.length) * 100) : 0;

                            return (
                                <div key={milestone.id || milestone._id || mIdx} className="border border-white/[0.06] bg-white/[0.02] overflow-hidden relative group">
                                    {/* Corner brackets */}
                                    <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                                    <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity z-20" />

                                    {/* Milestone header */}
                                    <button
                                        onClick={() => setExpandedMilestone(isOpen ? null : (milestone.id || milestone._id))}
                                        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors font-mono"
                                    >
                                        <div className={`w-10 h-10 flex items-center justify-center text-sm font-black shrink-0 ${milestone.completed ? "bg-neon-green/10 text-neon-green border border-neon-green/20" : "bg-white/[0.04] text-zinc-500 border border-white/[0.06]"}`}>
                                            {milestone.completed ? <CheckCircle2 className="w-5 h-5" /> : <span>{mIdx + 1}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-white truncate">{milestone.title}</h3>
                                                <span className="text-[9px] text-neon-green font-bold flex items-center gap-0.5">
                                                    <Zap className="w-3 h-3" /> +{milestone.xp} XP
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-zinc-500 mt-0.5">{milestone.description}</p>
                                            {/* mini progress */}
                                            <div className="mt-2 h-1 bg-white/[0.04] overflow-hidden">
                                                <div className="h-full bg-neon-green transition-all" style={{ width: `${milestonePct}%` }} />
                                            </div>
                                        </div>
                                        {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />}
                                    </button>

                                    {/* Lessons list */}
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-t border-white/[0.04] px-5 pb-4 pt-2 space-y-1">
                                                    {(milestone.allItems || milestone.lessons || []).map((item: any) => {
                                                        const ti = typeIcon[item.type] || typeIcon.doc;
                                                        const Icon = ti.icon;
                                                        const itemId = item._id || item.id;
                                                        return (
                                                            <Link
                                                                key={itemId}
                                                                href={`/courses/${slug}/${item.questions || item.codeChallenge || item.type === 'test' || item.type === 'quiz' ? 'tests' : 'lessons'}/${itemId}`}
                                                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.03] transition-colors group/lesson font-mono"
                                                            >
                                                                <Icon className={`w-4 h-4 ${ti.color} shrink-0`} />
                                                                <span className={`text-sm flex-1 ${item.completed ? "text-zinc-500 line-through" : "text-zinc-300 group-hover/lesson:text-white"} transition-colors`}>
                                                                    {item.title}
                                                                </span>
                                                                <span className="text-[10px] text-zinc-600 font-bold">{item.duration} {item.duration ? 'min' : ''}</span>
                                                                {item.completed && <CheckCircle2 className="w-3.5 h-3.5 text-neon-green shrink-0" />}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </motion.div>

                    {/* ── Right Sidebar ── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
                        {/* Enroll / Progress card */}
                        <div className="border border-white/[0.08] bg-white/[0.03] p-6 space-y-5 sticky top-6 relative">
                            {/* Corner brackets */}
                            <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-neon-green/20" />
                            <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-neon-green/20" />
                            <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-neon-green/20" />
                            <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-neon-green/20" />

                            {/* XP */}
                            <div className="flex items-center justify-between font-mono">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                    <span className="text-neon-green/40">$ </span>reward
                                </span>
                                <span className="flex items-center gap-1 text-neon-green font-black text-lg">
                                    <Zap className="w-5 h-5" /> {course.xp} XP
                                </span>
                            </div>

                            {/* Progress */}
                            <div className="font-mono">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                                        <span className="text-neon-green/40">// </span>progress
                                    </span>
                                    <span className="text-[10px] text-zinc-500 font-bold">{course.progress}%</span>
                                </div>
                                <div className="h-2 bg-white/[0.04] overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${course.progress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-neon-green"
                                    />
                                </div>
                            </div>

                            {/* CTA */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={async () => {
                                    try {
                                        if (!course.enrolled) {
                                            await coursesApi.enrollCourse(slug as string);
                                        }

                                        // Find first incomplete milestone or item
                                        let targetItem = null;
                                        for (const m of course.milestones) {
                                            if (!m.completed) {
                                                targetItem = m.allItems?.find((item: any) => !item.completed);
                                                if (targetItem) break;
                                            }
                                        }

                                        const item = targetItem || course.milestones[0]?.allItems?.[0];
                                        if (item) {
                                            const type = item.questions || item.codeChallenge || item.type === 'test' || item.type === 'quiz' ? 'tests' : 'lessons';
                                            window.location.href = `/courses/${slug}/${type}/${item._id || item.id}`;
                                        }
                                    } catch (err) {
                                        console.error("Failed to enrollment/navigate:", err);
                                    }
                                }}
                                className="w-full py-3 bg-neon-green text-black text-sm font-black font-mono uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-neon-green/90 hover:shadow-[0_0_30px_rgba(0,255,163,0.2)] transition-all"
                            >
                                {course.progress === 100 ? "Review Quest" : course.enrolled ? "Continue Quest" : "Enroll Quest"}
                                <ChevronRight className="w-4 h-4" />
                            </motion.button>

                            {/* Video Call Simulation CTA */}
                            {course.enrolled && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowVideoCall(true)}
                                    className="w-full py-3 bg-white/[0.04] border border-white/10 text-white text-[10px] font-black font-mono uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white/[0.08] hover:border-neon-cyan/50 transition-all group"
                                >
                                    <Video className="w-3.5 h-3.5 text-neon-cyan group-hover:animate-pulse" />
                                    JOIN_VIDEO_CALL
                                </motion.button>
                            )}

                            {/* Quick stats */}
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.05] font-mono">
                                {[
                                    { label: "Milestones", value: String(course.milestones.length), icon: Trophy, color: "text-amber-400" },
                                    { label: "Items", value: String(totalItemsCount), icon: BookOpen, color: "text-neon-cyan" },
                                    { label: "Duration", value: course.duration, icon: Clock, color: "text-neon-purple" },
                                    { label: "Students", value: course.students, icon: Users, color: "text-zinc-400" },
                                ].map((s) => (
                                    <div key={s.label} className="flex items-center gap-2">
                                        <s.icon className={`w-4 h-4 ${s.color}`} />
                                        <div>
                                            <div className="text-xs font-bold text-white">{s.value}</div>
                                            <div className="text-[9px] text-zinc-600 uppercase tracking-wider font-bold">{s.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* On-chain credential */}
                        <div className="border border-white/[0.06] bg-white/[0.02] p-5 flex items-center gap-3 relative group">
                            {/* Corner brackets */}
                            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="w-10 h-10 bg-neon-green/10 border border-neon-green/20 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-neon-green" />
                            </div>
                            <div className="font-mono">
                                <div className="text-xs font-bold text-white">On-Chain Credential</div>
                                <div className="text-[10px] text-zinc-500">Complete all milestones to mint your soulbound NFT certificate</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Reviews ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-14 space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="text-neon-green font-mono text-sm">{">"}</span>
                        <span className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
                            player_reviews
                        </span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Rating Form for completed users who haven't rated yet */}
                        {canRate && !showRatingSuccess && (
                            <div className="md:col-span-3 border border-neon-cyan/20 bg-neon-cyan/5 p-6 space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <Star className="w-20 h-20 text-neon-cyan fill-neon-cyan" />
                                </div>
                                <div className="relative z-10 space-y-4 font-mono">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-neon-cyan" />
                                        <span className="text-xs font-black uppercase tracking-widest text-white">Share Your Experience</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 uppercase">You have completed this course. Your feedback helps other academy students.</p>

                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setUserRating(star)}
                                                onMouseEnter={() => setUserRating(star)}
                                                className="transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={`w-6 h-6 ${star <= userRating ? "text-amber-400 fill-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "text-zinc-700 hover:text-zinc-500"}`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <textarea
                                            placeholder="DESCRIBE YOUR JOURNEY (OPTIONAL)..."
                                            value={userComment}
                                            onChange={(e) => setUserComment(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 p-3 text-[10px] uppercase tracking-widest text-white focus:border-neon-cyan outline-none transition-colors min-h-[80px]"
                                        />
                                    </div>

                                    {ratingError && (
                                        <div className="text-[9px] text-red-500 flex items-center gap-1.5 uppercase font-black">
                                            <AlertCircle className="w-3 h-3" /> {ratingError}
                                        </div>
                                    )}

                                    <button
                                        disabled={isSubmitting}
                                        onClick={handleRate}
                                        className="px-6 py-2 bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan text-[10px] font-black uppercase tracking-[0.2em] hover:bg-neon-cyan/30 transition-all flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Zap className="w-3 h-3" />
                                        )}
                                        SUBMIT_FEEDBACK
                                    </button>
                                </div>
                            </div>
                        )}

                        {showRatingSuccess && (
                            <div className="md:col-span-3 border border-neon-green/20 bg-neon-green/5 p-6 text-center space-y-2 relative overflow-hidden">
                                <div className="font-mono text-xs font-black text-neon-green uppercase tracking-widest">Feedback Transmitted Successfully</div>
                                <div className="font-mono text-[10px] text-zinc-500 uppercase">Your insights have been recorded in the academy archives.</div>
                            </div>
                        )}

                        {(course.reviews || []).map((review: any, i: number) => (
                            <div key={i} className="border border-white/[0.06] bg-white/[0.02] p-5 space-y-3 relative group">
                                {/* Corner brackets */}
                                <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, s) => (
                                        <Star key={s} className={`w-3.5 h-3.5 ${s < review.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"}`} />
                                    ))}
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                                    <span className="text-neon-green/40">{"> "}</span>
                                    &quot;{review.comment || review.text}&quot;
                                </p>
                                <div className="flex items-center justify-between font-mono">
                                    <div className="flex items-center gap-2">
                                        {review.avatar && (
                                            <img src={review.avatar} alt={review.user} className="w-4 h-4 rounded-full border border-white/10" />
                                        )}
                                        <span className="text-[10px] font-bold text-white">{review.user || review.name}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-600">
                                        {review.ratedAt ? new Date(review.ratedAt).toLocaleDateString() : (review.date || "recent")}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {(!course.reviews || course.reviews.length === 0) && !canRate && (
                            <div className="md:col-span-3 border border-dashed border-white/5 p-10 text-center">
                                <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest text-center block">No field reports available for this course yet.</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </main>

            {/* Video Call Simulation Modal */}
            <VideoCallModal
                isOpen={showVideoCall}
                onClose={() => setShowVideoCall(false)}
                courseTitle={course.title}
                instructorName={course.instructor.name}
            />
        </div>
    );
}
