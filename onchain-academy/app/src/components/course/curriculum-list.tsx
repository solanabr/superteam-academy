"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { Lesson } from "@/domain/models";
import { localLearningProgressService } from "@/services/local-learning-progress-service";
import { useWalletStore } from "@/stores/wallet-store";
import { getLearnerId } from "@/lib/learner";
import { backendClient } from "@/lib/backend/client";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-client";
import { onEnrollmentUpdated } from "@/lib/enrollment-sync";

type Props = {
  courseId: string;
  courseSlug: string;
  courseXpReward: number;
  lessons: Lesson[];
  variant?: "default" | "sidebar";
};

export function CurriculumList({ courseId, courseSlug, lessons, variant = "default" }: Props) {
  const pathname = usePathname();
  const walletAddress = useWalletStore((state) => state.walletAddress);
  const supabase = getSupabaseBrowserClient();
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [authUser, setAuthUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [authResolved, setAuthResolved] = useState(() => !supabase);
  const [enrollmentSyncTick, setEnrollmentSyncTick] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const user = data.session?.user;
        setAuthUser(user ? { id: user.id, email: user.email } : null);
      })
      .finally(() => setAuthResolved(true));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAuthUser(user ? { id: user.id, email: user.email } : null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    return onEnrollmentUpdated(() => setEnrollmentSyncTick((value) => value + 1));
  }, []);

  useEffect(() => {
    const loadProgress = async () => {
      if (!authResolved) return;
      const learnerId = getLearnerId(walletAddress, authUser ?? undefined);
      const progress = await localLearningProgressService.getProgress(learnerId, courseId);
      setCompletedLessonIds(progress?.completedLessonIds ?? []);
      try {
        const remote = await backendClient.getEnrollment(learnerId, courseId);
        setIsEnrolled(Boolean(remote?.enrolled));
      } catch {
        setIsEnrolled(false);
      }
    };
    loadProgress();
  }, [authResolved, courseId, walletAddress, authUser, enrollmentSyncTick]);

  const completedSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);
  
  const modules = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const lesson of lessons) {
      const mod = lesson.moduleTitle || "General Curriculum";
      if (!map.has(mod)) map.set(mod, []);
      map.get(mod)!.push(lesson);
    }
    return Array.from(map.entries()).map(([title, moduleLessons]) => ({
      title,
      lessons: moduleLessons,
      duration: moduleLessons.reduce((acc, l) => acc + (l.durationMinutes || 0), 0),
    }));
  }, [lessons]);

  const toggleModule = (title: string) => {
    setCollapsedModules((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isSidebar = variant === "sidebar";

  return (
    <div className={`space-y-${isSidebar ? '4' : '6'}`}>
      {modules.map((mod, index) => {
        const isExpanded = !collapsedModules[mod.title];
        const completedInModule = mod.lessons.filter(l => completedSet.has(l.id)).length;
        
        return (
          <div key={mod.title} className={`relative ${isSidebar ? 'pl-4' : 'pl-6'}`}>
            <div className="absolute left-[11px] top-8 bottom-0 w-px bg-white/10" />

            <button 
              onClick={() => toggleModule(mod.title)}
              className="flex items-center gap-3 w-full group py-2"
            >
              <div className={`absolute left-0 rounded-full bg-surface border border-white/20 flex items-center justify-center text-white/50 group-hover:text-white transition-colors z-10 ${isSidebar ? 'w-5 h-5' : 'w-6 h-6'}`}>
                <svg 
                  className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""} ${isSidebar ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} 
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className={`font-semibold tracking-tight text-white group-hover:text-white/80 transition-colors truncate ${isSidebar ? 'text-[14px]' : 'text-[20px]'}`}>
                  {mod.title}
                </h3>
              </div>
              {!isSidebar && (
                <div className="text-[13px] text-white/50 flex items-center gap-4 shrink-0">
                  <span className="hidden sm:inline-block">{Math.floor(mod.duration / 60)}h {mod.duration % 60}m</span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 11-10 10-10-10 10-10 10 10z"/></svg>
                    {completedInModule}/{mod.lessons.length}
                  </span>
                </div>
              )}
            </button>

            {isExpanded && (
              <div className={`mt-2 space-y-1 relative z-10 ${isSidebar ? 'pl-2' : 'pl-2'}`}>
                {mod.lessons.map((lesson) => {
                  const isCompleted = completedSet.has(lesson.id);
                  const isInteractive = lesson.type === "challenge";
                  const isActive = pathname.includes(`/lessons/${lesson.id}`);

                  const InnerContent = (
                    <div className={`flex items-center gap-3 transition-all ${isSidebar ? 'py-2 px-3 rounded-lg' : 'py-3 px-4 rounded-xl'} ${
                      isActive ? "bg-white/10 shadow-sm" : 
                      isEnrolled ? "hover:bg-white/5 cursor-pointer" : "opacity-60 cursor-not-allowed"
                    }`}>
                      <div className={`shrink-0 flex items-center justify-center ${isSidebar ? 'w-5 h-5' : 'w-8 h-8'}`}>
                        {isCompleted ? (
                          <div className={`rounded-full bg-[#4caf50]/20 flex items-center justify-center ${isSidebar ? 'w-4 h-4' : 'w-6 h-6'}`}>
                            <svg className={`text-[#4caf50] ${isSidebar ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          </div>
                        ) : isInteractive ? (
                          <svg className={`text-white/40 ${isSidebar ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                        ) : (
                          <svg className={`text-white/40 ${isSidebar ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <p className={`truncate font-medium ${isSidebar ? 'text-[13px]' : 'text-[15px]'} ${isCompleted ? "text-white/50" : isActive ? "text-white" : "text-white/80"}`}>
                          {lesson.title}
                        </p>
                        {!isEnrolled && index === 0 && !isSidebar && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0071e3] text-white uppercase tracking-wider">
                            Preview
                          </span>
                        )}
                      </div>
                      {!isSidebar && (
                        <div className="text-[13px] font-medium text-white/40 flex items-center gap-4 shrink-0">
                          {lesson.durationMinutes && <span>{lesson.durationMinutes} min</span>}
                          {isEnrolled && !isCompleted && (
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-white/70">
                              Play
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );

                  return (
                    <div key={lesson.id} className="group">
                      {isEnrolled || index === 0 ? (
                        <Link href={`/courses/${courseSlug}/lessons/${lesson.id}`}>
                          {InnerContent}
                        </Link>
                      ) : (
                        <div onClick={() => alert("Please enroll to access this module.")}>
                          {InnerContent}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
