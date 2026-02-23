import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ActiveCourseProps {
    courseTitle: string;
    courseSlug: string;
    progress: number; // 0-100
    lastLessonTitle: string;
    lastLessonSlug: string;
    lastLessonId: string;
    className?: string;
}

export function ActiveCourse({
    courseTitle,
    courseSlug,
    progress,
    lastLessonTitle,
    lastLessonId,
    className
}: ActiveCourseProps) {
    return (
        <section className={cn(className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold text-white">Active Course</h3>
                <Link className="text-xs font-mono text-solana hover:underline" href="/courses">View All Courses -&gt;</Link>
            </div>
            <div className="glass-panel rounded-2xl p-1 border border-white/5 group hover:border-solana/30 glass-card-hover transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.04]">
                <div className="relative flex flex-col md:flex-row h-full rounded-xl overflow-hidden bg-void/40">
                    {/* Visual representation */}
                    <div className="w-full md:w-1/3 min-h-[160px] relative overflow-hidden bg-gradient-to-br from-void to-gray-900 border-r border-white/5">
                        <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 left-4 z-10">
                            <div className="flex gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-rust/20 text-rust border border-rust/30 font-mono">INTERMEDIATE</span>
                                <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-white border border-white/10 font-mono">RUST</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-2xl font-display font-bold text-white leading-tight mb-1">{courseTitle}</h4>
                            <span className="font-mono text-solana text-lg font-bold">{Math.round(progress)}%</span>
                        </div>
                        <p className="text-text-muted text-sm mb-6 max-w-md">Continue your journey in Web3 through our structured curriculum.</p>
                        <div className="flex flex-col gap-4">
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-solana shadow-[0_0_10px_rgba(20,241,149,0.5)] rounded-full relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <span className="text-xs text-text-muted font-mono">Last lesson: {lastLessonTitle}</span>
                                <Link href={`/courses/${courseSlug}/lessons/${lastLessonId}`}>
                                    <Button className="px-5 font-bold shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
                                        Continue
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
