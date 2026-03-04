"use client";

import Image from "next/image";
import Link from "next/link";
import { ChartNoAxesColumnIncreasing, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface Course {
    slug: string;
    title: string;
    description: string;
    level: string;
    lessons: number;
    xp: number;
    image: string;
    accent: string;
}

const COURSES: Course[] = [
    {
        slug: "intro-to-solana",
        title: "Intro to Solana",
        description:
            "Learn the Solana mental model: accounts, transactions, programs, and building with confidence.",
        level: "Beginner",
        lessons: 5,
        xp: 500,
        image: "/courses/sol-fundamentals.png",
        accent: "from-emerald-600/20 to-emerald-600/5",
    },
    {
        slug: "anchor-development",
        title: "Anchor Development",
        description:
            "Build programs with the Anchor framework — PDAs, CPIs, and testing.",
        level: "Intermediate",
        lessons: 8,
        xp: 800,
        image: "/courses/anchor-dev.png",
        accent: "from-blue-600/20 to-blue-600/5",
    },
    {
        slug: "token-extensions",
        title: "Token Extensions",
        description:
            "Master SPL Token Extensions: transfer hooks, confidential transfers, and more.",
        level: "Intermediate",
        lessons: 6,
        xp: 600,
        image: "/courses/token-extensions.png",
        accent: "from-purple-600/20 to-purple-600/5",
    },
];

function CourseCard({
    course,
    index,
    isInView,
}: {
    course: Course;
    index: number;
    isInView: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
                duration: 0.5,
                delay: 0.1 + index * 0.12,
                ease: "easeOut",
            }}
        >
            <Link
                href={`/courses/${course.slug}`}
                className={`block h-full rounded-2xl border border-white/10 overflow-hidden
                    bg-gradient-to-b ${course.accent}
                    hover:border-yellow-400/30`}
            >
                {/* Image */}
                <div className="relative h-40 sm:h-48 w-full overflow-hidden">
                    <Image
                        src={course.image}
                        alt={course.title}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {/* Level badge */}
                    <div className="absolute top-3 left-3">
                        <span className="bg-black/60 backdrop-blur-sm font-game text-xs text-white/90 px-2.5 py-1 rounded-full border border-white/10 inline-flex items-center gap-1">
                            <ChartNoAxesColumnIncreasing className="h-3 w-3" />
                            {course.level}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6">
                    <h3 className="font-game text-xl sm:text-2xl text-foreground">
                        {course.title}
                    </h3>
                    <p className="font-game text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {course.description}
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                        <span className="font-game text-sm text-muted-foreground inline-flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" /> {course.lessons} lessons
                        </span>
                        <span className="font-game text-sm text-yellow-400 inline-flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" /> {course.xp} XP
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export function CoursesSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });

    return (
        <section className="w-full py-16 sm:py-24 bg-background">
            <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
                {/* Header — left-aligned like the reference */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="mb-10 sm:mb-12 max-w-2xl"
                >
                    <p className="mb-2 font-game text-base sm:text-lg tracking-widest text-yellow-400 uppercase">
                        Learning Tracks
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-game leading-tight">
                        Structured courses to take you
                        from <span className="text-yellow-400">zero</span> to <span className="text-yellow-400">on-chain</span>.
                    </h2>
                </motion.div>

                {/* Course cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {COURSES.map((course, i) => (
                        <CourseCard
                            key={course.slug}
                            course={course}
                            index={i}
                            isInView={isInView}
                        />
                    ))}
                </div>

                {/* View All CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-8 sm:mt-10 text-center"
                >
                    <Link href="/courses">
                        <Button
                            variant="pixel"
                            size="lg"
                            className="font-game text-lg sm:text-xl"
                        >
                            View All Courses
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
