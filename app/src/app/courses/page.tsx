"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CourseCard } from "@/components/course/CourseCard";
import { STATIC_COURSES } from "@/lib/courses";
import { Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";

const TRACKS = ["All", "anchor", "defi", "nft", "core"] as const;
const LEVELS = ["All", "beginner", "intermediate", "advanced"] as const;

export default function CoursesPage() {
    const [search, setSearch] = useState("");
    const [track, setTrack] = useState<string>("All");
    const [level, setLevel] = useState<string>("All");

    const filtered = useMemo(() => {
        return STATIC_COURSES.filter((c) => {
            const matchSearch =
                search === "" ||
                c.title.toLowerCase().includes(search.toLowerCase()) ||
                c.description.toLowerCase().includes(search.toLowerCase());
            const matchTrack = track === "All" || c.track === track;
            const matchLevel = level === "All" || c.level === level;
            return matchSearch && matchTrack && matchLevel;
        });
    }, [search, track, level]);

    return (
        <div className="min-h-screen">
            <Header />

            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "itemListElement": STATIC_COURSES.map((course, index) => ({
                            "@type": "ListItem",
                            "position": index + 1,
                            "url": `https://superteam-academy.vercel.app/courses/${course.id}`,
                            "name": course.title,
                            "description": course.description
                        }))
                    })
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                {/* Page header */}
                <div className="mb-10">
                    <h1 className="font-heading text-4xl font-bold mb-2">Course Catalog</h1>
                    <p className="text-[hsl(var(--muted-foreground))]">
                        {STATIC_COURSES.filter((c) => c.isActive).length} courses available — earn verifiable XP on Solana
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:border-[hsl(var(--primary)/0.5)] transition-colors"
                        />
                    </div>

                    {/* Track filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        <div className="flex gap-1 flex-wrap">
                            {TRACKS.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTrack(t)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${track === t
                                        ? "bg-[hsl(var(--primary))] text-white"
                                        : "bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                                        }`}
                                >
                                    {t === "All" ? "All Tracks" : t.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Level filter */}
                    <div className="flex gap-1 flex-wrap">
                        {LEVELS.map((l) => (
                            <button
                                key={l}
                                onClick={() => setLevel(l)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${level === l
                                    ? "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]"
                                    : "bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                                    }`}
                            >
                                {l === "All" ? "All Levels" : l.charAt(0).toUpperCase() + l.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-[hsl(var(--muted-foreground))]">
                        <p className="text-lg font-semibold mb-2">No courses found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
