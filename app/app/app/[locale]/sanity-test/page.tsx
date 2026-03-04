import { client } from "@/lib/sanity/client";
import { allCoursesQuery } from "@/lib/sanity/queries";
import { SanityCourseCard } from "@/components/courses/sanity-course-card";
import { PortableText } from "@/components/ui/portable-text";
import { ArrowLeft, Rocket, Database, Layout } from "lucide-react";
import Link from "next/link";

export default async function SanityTestPage() {
    let courses = [];
    let error = null;

    try {
        courses = await client.fetch(allCoursesQuery);
    } catch (e: any) {
        error = e.message;
    }

    const firstCourse = courses[0];
    const firstLesson = firstCourse?.milestones?.[0]?.lessons?.[0];

    return (
        <div className="min-h-screen bg-[#020408] text-white font-mono p-6 md:p-12">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-neon-green transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        back_to_main
                    </Link>
                    <div className="flex items-center gap-2 px-3 py-1 bg-neon-green/10 border border-neon-green/20 text-neon-green text-[10px] font-black uppercase tracking-widest">
                        <Database className="w-3 h-3" /> Live CMS Preview
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <span className="text-neon-green">{">"}</span>
                    <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">sanity_integration_lab</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                <h1 className="text-4xl md:text-5xl font-black mb-4">
                    CMS <span className="text-neon-cyan">Preview</span> Mode
                </h1>
                <p className="text-zinc-400 max-w-2xl text-sm leading-relaxed">
                    <span className="text-neon-green/40">// </span>
                    Testing the bridge between Sanity's content lake and our RPG-inspired frontend. 
                    This page renders live data using our new <code className="text-neon-purple">SanityCourseCard</code> and <code className="text-neon-purple">PortableText</code> components.
                </p>
            </div>

            <div className="max-w-7xl mx-auto grid lg:grid-cols-[450px_1fr] gap-12">
                {/* Left Column: Course Cards */}
                <div className="space-y-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Layout className="w-4 h-4 text-neon-cyan" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Available Quests</h2>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                            <span className="font-bold">FETCH_ERROR:</span> {error}
                        </div>
                    )}

                    {courses.length === 0 && !error ? (
                        <div className="p-8 border border-white/[0.06] bg-white/[0.02] text-center text-zinc-500 text-sm">
                            No courses found. Launch Sanity Studio to create one.
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {courses.map((course: any, idx: number) => (
                                <SanityCourseCard key={course._id} course={course} index={idx} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Content Preview */}
                <div className="space-y-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Rocket className="w-4 h-4 text-neon-green" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Rich Content Renderer</h2>
                    </div>

                    <div className="border border-white/[0.06] bg-white/[0.01] p-8 relative overflow-hidden">
                        {/* Grid Pattern Background */}
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
                            backgroundImage: "radial-gradient(circle, #00ffa3 1px, transparent 1px)",
                            backgroundSize: "24px 24px"
                         }} />
                        
                        {!firstLesson ? (
                            <div className="relative z-10 text-center py-20 text-zinc-600 italic text-sm">
                                Select a course with milestones and lessons to preview rich content.
                            </div>
                        ) : (
                            <div className="relative z-10 max-w-2xl mx-auto">
                                <div className="mb-8 pb-4 border-b border-white/[0.06]">
                                    <div className="text-[10px] text-neon-cyan font-black uppercase tracking-widest mb-1">Previewing Lesson Content</div>
                                    <h3 className="text-2xl font-black text-white">{firstLesson.title}</h3>
                                </div>
                                
                                <div className="prose prose-invert max-w-none">
                                    <PortableText value={firstLesson.content} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Technical Detail */}
            <div className="max-w-7xl mx-auto mt-20 p-6 bg-white/[0.02] border border-white/[0.06] text-[10px] text-zinc-600 flex justify-between items-center">
                <div className="flex gap-6">
                    <span>PROJECT_ID: {process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}</span>
                    <span>DATASET: {process.env.NEXT_PUBLIC_SANITY_DATASET}</span>
                </div>
                <div className="text-neon-green/40 font-black">SYSTEM_STABLE_V1_CMS</div>
            </div>
        </div>
    );
}
