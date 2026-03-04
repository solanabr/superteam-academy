"use client";

import Image from "next/image";
import { ChartNoAxesColumnIncreasing, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";

interface Course {
    slug: string;
    title: string;
    description: string;
    level: string;
    lessons: number;
    xp: number;
    image: string;
}

const COURSES: Course[] = [
    {
        slug: "intro-to-solana",
        title: "Intro to Solana",
        description: "Learn the core Solana mental model: accounts, transactions, programs, and how to build with confidence.",
        level: "Beginner",
        lessons: 5,
        xp: 500,
        image: "/courses/sol-fundamentals.png",
    },
];

function CourseCard({ course }: { course: Course }) {
    return (
        <Link
            href={`/courses/${course.slug}`}
            className="block border-4 rounded-xl hover:bg-accent cursor-pointer transition-colors"
        >
            <Image
                src={course.image}
                alt={course.title}
                width={400}
                height={400}
                className="w-full h-[200px] object-cover rounded-t-lg"
            />
            <div className="p-4">
                <h2 className="font-game text-2xl">{course.title}</h2>
                <p className="font-game text-xl text-muted-foreground line-clamp-2">
                    {course.description}
                </p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="bg-muted gap-2 font-game p-1 px-4 rounded-2xl items-center inline-flex">
                        <ChartNoAxesColumnIncreasing className="h-4 w-4" /> {course.level}
                    </span>
                    <span className="font-game text-muted-foreground inline-flex items-center gap-1">
                        <BookOpen className="h-4 w-4" /> {course.lessons} lessons
                    </span>
                    <span className="font-game text-yellow-400 inline-flex items-center gap-1">
                        <Sparkles className="h-4 w-4" /> {course.xp} XP
                    </span>
                </div>
            </div>
        </Link>
    );
}

export function CoursesSection() {
    return (
        <section className="w-full py-16 bg-background">
            <div className="mx-auto max-w-7xl px-6">
                <h2 className="text-4xl mb-4 font-game">Browse Courses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {COURSES.map((course) => (
                        <CourseCard key={course.title} course={course} />
                    ))}
                </div>
            </div>
        </section>
    );
}
