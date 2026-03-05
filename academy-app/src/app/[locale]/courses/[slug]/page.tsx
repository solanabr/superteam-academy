"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCourseData } from "~/hooks/queries/useCourseData";
import { useCourseEnrollment } from "~/hooks/queries/useCourseEnrollment";
import LoadingSplash from "~/components/LoadingSplash";
import type { SanityModule } from "~/hooks/queries/useCourseData";

// ── Static reviews (MVP) ──────────────────────────────────────────────────────
const REVIEWS = [
   { user: "0xTanaka", avatar: "🧑🏻‍💻", rating: 5, time: "2 weeks ago", text: "Best Anchor resource out there. The PDA module alone is worth the whole course." },
   { user: "devnathi", avatar: "👩🏽‍💻", rating: 5, time: "1 month ago", text: "Maya explains CPIs in a way that finally clicked for me after months of confusion." },
   { user: "sol_anon42", avatar: "🧑🏿‍💻", rating: 4, time: "1 month ago", text: "Solid course. Would love more exercises but the content is top quality." },
];

const DIFF_COLOR: Record<string, string> = {
   BEGINNER: "bg-sol-green/10  text-sol-green   border-sol-green/35",
   INTERMEDIATE: "bg-sol-yellow/20 text-sol-yellow-dk border-sol-yellow/50",
   ADVANCED: "bg-sol-forest/15 text-sol-forest  border-sol-forest/40",
};

// ── Sub-components ────────────────────────────────────────────────────────────
function StatChip({ icon, label }: { icon: string; label: string }) {
   return (
      <div className="flex items-center gap-1.5 text-sm text-sol-subtle">
         <span>{icon}</span><span>{label}</span>
      </div>
   );
}

function ModuleRow({
   mod, slug, lessonsDone, defaultOpen, globalStart
}: {
   mod: SanityModule; slug: string; lessonsDone: Set<number>; defaultOpen: boolean; globalStart: number;
}) {
   const [open, setOpen] = useState(defaultOpen);

   // Build a flat index offset so lessonsDone (global indices) maps correctly
   // We receive the pre-computed globalIndexStart from the parent
   return (
      <div className="border border-sol-border rounded-xl overflow-hidden">
         <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-4 px-5 py-4 bg-sol-card hover:bg-sol-surface/60 transition-colors duration-150 text-left"
         >
            <div className="flex-1 min-w-0">
               <h3 className="font-semibold text-sol-text text-sm">{mod.title}</h3>
               <p className="text-xs text-sol-muted mt-0.5">{mod.lessons?.length || 0} lessons</p>
            </div>
            <svg
               className={`w-4 h-4 text-sol-muted transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
               viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
            >
               <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
         </button>

         {open && (
            <div className="border-t border-sol-border divide-y divide-sol-border/40">
               {mod.lessons?.map((l, localIdx) => {
                  const done = lessonsDone.has(localIdx);
                  return (
                     <Link
                        key={localIdx}
                        href={`/courses/${slug}/lessons/${globalStart + localIdx}`}
                        className={`flex items-center gap-3 px-5 py-3 hover:bg-sol-surface/40 transition-colors group ${done ? "opacity-60" : ""}`}
                     >
                        <div className={[
                           "w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0",
                           done
                              ? "bg-sol-green/20 border-sol-green/50 text-sol-green"
                              : "border-sol-muted text-sol-muted group-hover:border-sol-green/40",
                        ].join(" ")}>
                           {done ? "✓" : "▶"}
                        </div>
                        <span className={`text-sm flex-1 transition-colors ${done ? "text-sol-muted line-through" : "text-sol-text group-hover:text-sol-green"}`}>
                           {l.title}
                        </span>
                        <span className="text-xs text-sol-muted">{l.duration}</span>
                     </Link>
                  );
               })}
            </div>
         )}
      </div>
   );
}

function ReviewCard({ review }: { review: typeof REVIEWS[0] }) {
   return (
      <div className="card-base p-5">
         <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{review.avatar}</span>
            <div>
               <div className="text-sm font-semibold text-sol-text">{review.user}</div>
               <div className="text-xs text-sol-muted">{review.time}</div>
            </div>
            <div className="ml-auto flex gap-0.5">
               {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xs ${i < review.rating ? "text-sol-yellow" : "text-sol-muted"}`}>★</span>
               ))}
            </div>
         </div>
         <p className="text-sm text-sol-subtle leading-relaxed">{review.text}</p>
      </div>
   );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Page() {
   const { slug } = useParams<{ slug: string }>();

   const { data: course, isLoading: courseLoading } = useCourseData(slug);
   const { data: enrollment, isLoading: enrollLoading, enroll } = useCourseEnrollment(
      course?.courseId ?? "",
      course?.lessonCount ?? 0,
   );

   const isLoading = courseLoading || enrollLoading;

   if (isLoading) {
      return <LoadingSplash message="Loading course..." fullScreen={false} />;
   }

   if (!course) {
      return (
         <div className="min-h-screen bg-sol-bg flex items-center justify-center">
            <p className="text-sol-muted">Course not found.</p>
         </div>
      );
   }

   const { enrolled = false, lessonsDone = new Set<number>(), completedCount = 0, progress = 0 } = enrollment ?? {};
   const totalXP = (course.lessonCount ?? 0) * (course.xpPerLesson ?? 0);
   const earnedXP = completedCount * (course.xpPerLesson ?? 0);

   // Find next unfinished lesson (global index order)
   let nextLessonIndex = 0;
   let globalIdx = 0;
   outer: for (const mod of course.modules || []) {
      for (const lesson of mod.lessons || []) {
         if (!lessonsDone.has(globalIdx)) { nextLessonIndex = globalIdx; break outer; }
         globalIdx++;
      }
   }

   const handleEnroll = async () => {
      try {
         await enroll.mutateAsync([]);
      } catch (e) {
         console.error("Enroll failed", e);
      }
   };

   // Assign global indices to lessons for done-checking
   let lessonGlobalStart = 0;
   const modulesWithGlobalStart = (course.modules || []).map(mod => {
      const start = lessonGlobalStart;
      lessonGlobalStart += mod.lessons?.length || 0;
      return { mod, start };
   });

   return (
      <div className="min-h-screen bg-sol-bg font-display">

         {/* Breadcrumb */}
         <div className="border-b border-sol-border bg-sol-surface/60">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-xs text-sol-muted">
               <Link href="/courses" className="hover:text-sol-green transition-colors">← Courses</Link>
               <span className="text-sol-border">/</span>
               <span className="text-sol-subtle">{course.title}</span>
            </div>
         </div>

         {/* Hero */}
         <div className="bg-linear-to-b from-sol-surface to-sol-bg border-b border-sol-border">
            <div className="max-w-7xl mx-auto px-6 py-12">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                  {/* Left info */}
                  <div className="lg:col-span-2 animate-fade-up">
                     <div className="flex items-center gap-2 mb-4">
                        <span className={`sol-badge ${DIFF_COLOR[course.difficulty] ?? ""}`}>
                           {course.difficulty.toLowerCase()}
                        </span>
                        <span className="sol-badge bg-sol-surface text-sol-muted border-sol-border">
                           {course.track?.name ?? "programs"}
                        </span>
                     </div>

                     <h1 className="text-3xl font-extrabold text-sol-text leading-tight mb-4">{course.title}</h1>
                     <p className="text-sol-subtle leading-relaxed mb-6 max-w-2xl">{course.description}</p>

                     <div className="flex flex-wrap gap-5 mb-6">
                        <StatChip icon="📚" label={`${course.lessonCount} lessons`} />
                        <StatChip icon="⚡" label={`${totalXP} XP to earn`} />
                        <StatChip icon="🎯" label={`${course.xpPerLesson} XP per lesson`} />
                     </div>

                     {/* Instructor */}
                     <div className="inline-flex items-center gap-3 p-4 bg-sol-card border border-sol-border rounded-xl">
                        <span className="text-3xl">👩🏾‍💻</span>
                        <div>
                           <div className="text-sm font-bold text-sol-text">{course.creator?.creatorName}</div>
                           <div className="text-xs text-sol-muted">Course Creator</div>
                        </div>
                     </div>
                  </div>

                  {/* Enrollment card */}
                  <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
                     <div className="card-base p-6 sticky top-6">
                        {/* Icon */}
                        <div className="w-full h-32 rounded-xl bg-linear-to-br from-sol-surface to-sol-bg flex items-center justify-center text-5xl mb-5 border border-sol-border text-sol-text/30">
                           ⚓
                        </div>

                        {/* Progress bar (enrolled only) */}
                        {enrolled && (
                           <div className="mb-5">
                              <div className="flex justify-between text-xs font-semibold text-sol-subtle mb-1.5">
                                 <span>Your Progress</span>
                                 <span className="text-sol-green font-bold">{progress}%</span>
                              </div>
                              <div className="h-2.5 bg-sol-border rounded-full overflow-hidden mb-1.5">
                                 <div
                                    className="h-full bg-linear-to-r from-sol-green to-sol-forest rounded-full transition-all duration-700"
                                    style={{ width: `${progress}%` }}
                                 />
                              </div>
                              <div className="flex justify-between text-[11px] text-sol-muted">
                                 <span>{completedCount}/{course.lessonCount} lessons</span>
                                 <span className="text-sol-yellow font-semibold">⚡ {earnedXP}/{totalXP} XP</span>
                              </div>
                           </div>
                        )}

                        {/* CTA */}
                        {enrolled ? (
                           <Link
                              href={`/courses/${slug}/lessons/${nextLessonIndex}`}
                              className="sol-btn-primary w-full justify-center py-3 text-sm block text-center"
                           >
                              Continue →
                           </Link>
                        ) : (
                           <button
                              onClick={handleEnroll}
                              disabled={enroll.isPending}
                              className="sol-btn-primary w-full justify-center py-3 text-sm disabled:opacity-60"
                           >
                              {enroll.isPending ? "Enrolling…" : "Enroll for Free"}
                           </button>
                        )}

                        {/* Meta grid */}
                        <div className="mt-4 grid grid-cols-2 gap-y-2.5 gap-x-3 text-xs text-sol-subtle">
                           {[
                              ["📋", `${course.lessonCount} lessons`],
                              ["💻", "Code exercises"],
                              ["🏆", "Certificate"],
                              ["⚡", `${totalXP} XP reward`],
                              ["♾", "Lifetime access"],
                           ].map(([icon, txt]) => (
                              <div key={txt} className="flex items-center gap-1.5">
                                 <span>{icon}</span><span>{txt}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Body */}
         <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               <div className="lg:col-span-2 space-y-10">

                  {/* Modules */}
                  <section>
                     <h2 className="text-lg font-bold text-sol-text mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 bg-sol-green rounded-full" />
                        Course Content
                        <span className="text-sm font-normal text-sol-muted ml-1">
                           {course.modules.length} modules · {course.lessonCount} lessons
                        </span>
                     </h2>
                     <div className="space-y-2">
                        {modulesWithGlobalStart.map(({ mod, start }, i) => (
                           <ModuleRow
                              key={i}
                              mod={mod}
                              slug={slug}
                              lessonsDone={new Set(
                                 [...lessonsDone].map(gi => gi - start).filter(li => li >= 0 && li < (mod.lessons?.length || 0))
                              )}
                              defaultOpen={i < 2}
                              globalStart={start}
                           />
                        ))}
                     </div>
                  </section>

                  {/* Reviews (static MVP) */}
                  <section>
                     <h2 className="text-lg font-bold text-sol-text mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 bg-sol-yellow rounded-full" />Reviews
                     </h2>
                     <div className="space-y-3">
                        {REVIEWS.map((r, i) => <ReviewCard key={i} review={r} />)}
                     </div>
                  </section>
               </div>

               {/* Quick stats sidebar (static MVP) */}
               <div className="hidden lg:block">
                  <div className="card-base p-5 sticky top-6">
                     <h3 className="text-[11px] font-bold text-sol-muted uppercase tracking-widest mb-4">Quick Stats</h3>
                     <div className="space-y-4">
                        {[
                           { label: "Completion rate", val: "72%", pct: 72, color: "bg-sol-green" },
                           { label: "Avg. XP earned", val: "910", pct: 76, color: "bg-sol-yellow" },
                           { label: "Rating", val: "4.8★", pct: 96, color: "bg-sol-forest" },
                        ].map(s => (
                           <div key={s.label}>
                              <div className="flex justify-between text-xs mb-1.5">
                                 <span className="text-sol-subtle">{s.label}</span>
                                 <span className="text-sol-text font-bold">{s.val}</span>
                              </div>
                              <div className="h-1.5 bg-sol-border rounded-full overflow-hidden">
                                 <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}