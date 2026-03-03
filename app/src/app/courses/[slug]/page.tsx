"use client";

import { useParams } from "next/navigation";
import { getCourseBySlug } from "@/lib/courses";
import { useWallet } from "@solana/wallet-adapter-react";
import { getEnrollmentPda } from "@/lib/pda";
import { BookOpen, Zap, Clock, ChevronRight, Lock, Check, Play } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";

export default function CourseDetailPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const course = getCourseBySlug(slug);
    const { publicKey, connected } = useWallet();
    const { connection } = useConnection();
    const [enrolling, setEnrolling] = useState(false);
    const [enrolled, setEnrolled] = useState(false);

    if (!course) {
        return (
            <div className="min-h-screen">
                <div className="flex items-center justify-center mt-32 text-[hsl(var(--muted-foreground))]">
                    Course not found
                </div>
            </div>
        );
    }

    const totalXP = course.xpPerLesson * course.lessonCount + course.completionBonus;

    async function handleEnroll() {
        if (!publicKey) {
            toast.error("Connect your wallet first");
            return;
        }
        setEnrolling(true);
        try {
            // In production: call enroll instruction on-chain
            // const enrollmentPda = getEnrollmentPda(course!.id, publicKey);
            // await program.methods.enroll(course!.id).accounts({...}).rpc();
            await new Promise((r) => setTimeout(r, 1200)); // Simulate tx
            setEnrolled(true);
            toast.success("Enrolled! Start your first lesson below.");
        } catch (err) {
            toast.error("Enrollment failed. Please try again.");
        } finally {
            setEnrolling(false);
        }
    }

    return (
        <div className="min-h-screen">
            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Course",
                        "name": course.title,
                        "description": course.description,
                        "provider": {
                            "@type": "Organization",
                            "name": "Superteam Brazil",
                            "sameAs": "https://br.superteam.fun"
                        }
                    })
                }}
            />

            {/* Hero banner */}
            <div className="relative h-56 sm:h-72 overflow-hidden">
                <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[hsl(var(--background))]" />
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-20 relative pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main content */}
                    <div className="lg:col-span-2">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] mb-4">
                            <Link href="/courses" className="hover:text-[hsl(var(--foreground))]">Courses</Link>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-[hsl(var(--foreground))]">{course.title}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400">
                                {course.track.toUpperCase()}
                            </span>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                            </span>
                        </div>

                        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-4">{course.title}</h1>
                        <p className="text-[hsl(var(--muted-foreground))] text-lg mb-8">{course.description}</p>

                        {/* Course stats */}
                        <div className="grid grid-cols-3 gap-4 mb-10">
                            {[
                                { label: "Lessons", value: course.lessonCount, icon: BookOpen },
                                { label: "Duration", value: course.duration, icon: Clock },
                                { label: "XP Reward", value: `${totalXP.toLocaleString()} XP`, icon: Zap },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="glass rounded-xl p-4 text-center">
                                    <Icon className="w-5 h-5 mx-auto mb-2 text-[hsl(var(--primary))]" />
                                    <p className="font-heading font-bold text-lg">{value}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Syllabus */}
                        <div>
                            <h2 className="font-heading text-xl font-bold mb-4">Course Syllabus</h2>
                            <div className="space-y-2">
                                {course.lessons.length > 0
                                    ? course.lessons.map((lesson) => (
                                        <Link
                                            key={lesson.id}
                                            href={enrolled ? `/courses/${slug}/lessons/${lesson.index}` : "#"}
                                            onClick={!enrolled ? (e) => { e.preventDefault(); toast.info("Enroll first to access lessons"); } : undefined}
                                            className="flex items-center gap-4 glass rounded-xl p-4 hover:border-[hsl(var(--primary)/0.4)] transition-colors group"
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${enrolled ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] group-hover:bg-[hsl(var(--primary))] group-hover:text-white" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                                                } transition-colors`}>
                                                {enrolled ? <Play className="w-3.5 h-3.5" /> : lesson.index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{lesson.title}</p>
                                                {lesson.hasCodeChallenge && (
                                                    <p className="text-xs text-green-400 mt-0.5">Includes code challenge</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-green-400 font-semibold">+{course.xpPerLesson} XP</span>
                                                {!enrolled && <Lock className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />}
                                            </div>
                                        </Link>
                                    ))
                                    : // Placeholder for courses without full lesson data
                                    Array.from({ length: course.lessonCount }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 glass rounded-xl p-4">
                                            <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-sm font-bold text-[hsl(var(--muted-foreground))]">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-4 shimmer rounded w-48" />
                                            </div>
                                            <span className="text-xs text-green-400 font-semibold">+{course.xpPerLesson} XP</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Enrollment card */}
                    <div className="lg:col-span-1">
                        <div className="glass rounded-xl p-6 sticky top-24">
                            <div className="text-center mb-6">
                                <p className="text-3xl font-heading font-bold gradient-text">
                                    {totalXP.toLocaleString()} XP
                                </p>
                                <p className="text-sm text-[hsl(var(--muted-foreground))]">Total reward on completion</p>
                            </div>

                            <ul className="space-y-3 mb-6 text-sm">
                                {[
                                    `${course.lessonCount} video lessons`,
                                    `${course.xpPerLesson} XP per lesson`,
                                    `${course.completionBonus} XP completion bonus`,
                                    "Metaplex Core credential NFT",
                                    "Soulbound — verified onchain",
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                                        <Check className="w-4 h-4 text-green-400 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            {enrolled ? (
                                <Link
                                    href={`/courses/${slug}/lessons/0`}
                                    className="block w-full text-center bg-green-500 text-white font-semibold py-3 rounded-xl hover:bg-green-400 transition-colors"
                                >
                                    Continue Learning →
                                </Link>
                            ) : (
                                <button
                                    onClick={handleEnroll}
                                    disabled={enrolling || !connected}
                                    className="w-full bg-[hsl(var(--primary))] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[var(--glow-purple)]"
                                >
                                    {enrolling ? "Enrolling..." : !connected ? "Connect Wallet to Enroll" : "Enroll Now — Free"}
                                </button>
                            )}

                            {course.prerequisiteId && (
                                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mt-3 flex items-center justify-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Requires: {course.prerequisiteId}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
