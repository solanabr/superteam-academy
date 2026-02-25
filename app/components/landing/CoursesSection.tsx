"use client";

import Image from "next/image";
import { ChartNoAxesColumnIncreasing, BookOpen, Sparkles } from "lucide-react";

interface Course {
    title: string;
    description: string;
    level: string;
    lessons: number;
    xp: number;
    image: string;
}

const COURSES: Course[] = [
    {
        title: "Solana Fundamentals",
        description: "Learn the core concepts of Solana: accounts, transactions, programs, and the runtime model.",
        level: "Beginner",
        lessons: 5,
        xp: 500,
        image: "/courses/sol-fundamentals.png",
    },
    {
        title: "Anchor Program Development",
        description: "Build Solana programs with the Anchor framework. Learn IDL generation, account validation, and testing.",
        level: "Intermediate",
        lessons: 8,
        xp: 1200,
        image: "/courses/anchor-dev.png",
    },
    {
        title: "Token Extensions (Token-2022)",
        description: "Master Solana Token Extensions: transfer fees, non-transferable tokens, confidential transfers.",
        level: "Advanced",
        lessons: 6,
        xp: 1200,
        image: "/courses/token-extensions.png",
    },
    {
        title: "Metaplex Core NFTs",
        description: "Learn Metaplex Core: create collections, mint NFTs with plugins, and build token-gated experiences.",
        level: "Advanced",
        lessons: 6,
        xp: 1200,
        image: "/courses/metaplex-nfts.png",
    },
];

function CourseCard({ course }: { course: Course }) {
    return (
        <div className="border-4 rounded-xl hover:bg-zinc-800 cursor-pointer transition-colors">
            <Image
                src={course.image}
                alt={course.title}
                width={400}
                height={400}
                className="w-full h-[200px] object-cover rounded-t-lg"
            />
            <div className="p-4">
                <h2 className="font-game text-2xl">{course.title}</h2>
                <p className="font-game text-xl text-gray-400 line-clamp-2">
                    {course.description}
                </p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="bg-zinc-800 gap-2 font-game p-1 px-4 rounded-2xl items-center inline-flex">
                        <ChartNoAxesColumnIncreasing className="h-4 w-4" /> {course.level}
                    </span>
                    <span className="font-game text-gray-500 inline-flex items-center gap-1">
                        <BookOpen className="h-4 w-4" /> {course.lessons} lessons
                    </span>
                    <span className="font-game text-yellow-400 inline-flex items-center gap-1">
                        <Sparkles className="h-4 w-4" /> {course.xp} XP
                    </span>
                </div>
            </div>
        </div>
    );
}

export function CoursesSection() {
    return (
        <section className="w-full py-16 bg-zinc-900">
            <div className="mx-auto max-w-7xl px-6">
                <h2 className="text-4xl mb-4 font-game">Browse Courses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {COURSES.map((course) => (
                        <CourseCard key={course.title} course={course} />
                    ))}
                </div>
            </div>
        </section>
    );
}
