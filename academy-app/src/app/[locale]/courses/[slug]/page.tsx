"use client";
import { useState } from "react";
import Link from "next/link";

type Instructor = {
   name: string,
   role: string,
   avatar: string,
   courses: number,
   students: number
}

type Lesson = {
   id: string, title: string, duration: string, done: boolean
}

type Module = {
   id: string,
   title: string,
   duration: string,
   lessons: Array<Lesson>
}

type Course = {
   slug: string,
   title: string,
   desc: string,
   instructor: Instructor,
   difficulty: "intermediate",
   duration: number,
   totalXP: number, earnedXP: number, progress: number,
   enrolled: number, rating: number, reviews: number, lastUpdated: string,
   modules: Array<Module>
}

const COURSE: Course = {
   slug: "anchor-framework",
   title: "Anchor Framework Deep Dive",
   desc: "Build production-grade Solana programs using the Anchor framework. You'll master accounts, instructions, constraints, CPIs, PDAs, and deploy your own DeFi primitive by the end of this course.",
   instructor: { name: "Maya Okonkwo", role: "Senior Solana Engineer", avatar: "👩🏾‍💻", courses: 4, students: 28000 },
   difficulty: "intermediate",
   duration: 6, totalXP: 1200, earnedXP: 780, progress: 65,
   enrolled: 8742, rating: 4.8, reviews: 312, lastUpdated: "Feb 2025",
   modules: [
      {
         id: "m1", title: "Getting Started with Anchor", duration: "45 min", lessons: [
            { id: "l1", title: "What is Anchor?", duration: "8 min", done: true },
            { id: "l2", title: "Setting up your environment", duration: "12 min", done: true },
            { id: "l3", title: "Your first Anchor program", duration: "15 min", done: true },
            { id: "l4", title: "Deploying to Devnet", duration: "10 min", done: true },
         ]
      },
      {
         id: "m2", title: "Accounts & Data Modeling", duration: "70 min", lessons: [
            { id: "l5", title: "Account types in Anchor", duration: "10 min", done: true },
            { id: "l6", title: "#[account] macros deep dive", duration: "18 min", done: true },
            { id: "l7", title: "PDAs and seeds", duration: "22 min", done: false },
            { id: "l8", title: "Rent and storage costs", duration: "12 min", done: false },
            { id: "l9", title: "Account validation constraints", duration: "8 min", done: false },
         ]
      },
      {
         id: "m3", title: "Instructions & CPIs", duration: "90 min", lessons: [
            { id: "l10", title: "Writing instructions", duration: "15 min", done: false },
            { id: "l11", title: "Cross-program invocations", duration: "25 min", done: false },
            { id: "l12", title: "Signed CPIs with PDAs", duration: "20 min", done: false },
            { id: "l13", title: "Error handling", duration: "18 min", done: false },
            { id: "l14", title: "Testing with Bankrun", duration: "12 min", done: false },
         ]
      },
      {
         id: "m4", title: "Build: Token Vault DeFi", duration: "115 min", lessons: [
            { id: "l15", title: "Architecture & design", duration: "20 min", done: false },
            { id: "l16", title: "Vault deposit logic", duration: "25 min", done: false },
            { id: "l17", title: "Withdrawal & fee logic", duration: "25 min", done: false },
            { id: "l18", title: "Frontend integration", duration: "30 min", done: false },
            { id: "l19", title: "Security audit checklist", duration: "15 min", done: false },
         ]
      },
   ],
};

type Review = {
   user: string,
   avatar: string,
   rating: number,
   time: string,
   text: string
}

const REVIEWS = [
   { user: "0xTanaka", avatar: "🧑🏻‍💻", rating: 5, time: "2 weeks ago", text: "Best Anchor resource out there. The PDA module alone is worth the whole course." },
   { user: "devnathi", avatar: "👩🏽‍💻", rating: 5, time: "1 month ago", text: "Maya explains CPIs in a way that finally clicked for me after months of confusion." },
   { user: "sol_anon42", avatar: "🧑🏿‍💻", rating: 4, time: "1 month ago", text: "Solid course. Would love more exercises but the content is top quality." },
];

// beginner=emerald  intermediate=yellow-amber  advanced=forest
const DIFF_CLS = {
   // beginner: "bg-sol-green/10  text-sol-green  border-sol-green/35",
   intermediate: "bg-sol-yellow/20 text-sol-yellow-dk  border-sol-yellow/50",
   // advanced: "bg-sol-forest/15 text-sol-forest border-sol-forest/40",
};

// ── SUB-COMPONENTS ─────────────────────────────────────────────────────────────
function StatChip({ icon, label }: { icon: string, label: string }) {
   return (
      <div className="flex items-center gap-1.5 text-sm text-sol-subtle">
         <span>{icon}</span><span>{label}</span>
      </div>
   );
}

function ModuleRow({ mod, defaultOpen }: { mod: Module, defaultOpen: boolean }) {
   const [open, setOpen] = useState(defaultOpen);
   const done = mod.lessons.filter(l => l.done).length;
   const allDone = done === mod.lessons.length;
   const pct = Math.round((done / mod.lessons.length) * 100);

   return (
      <div className="border border-sol-border rounded-xl overflow-hidden">
         {/* Header */}
         <button onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-4 px-5 py-4 bg-sol-card hover:bg-sol-surface/60
                   transition-colors duration-150 text-left">
            {/* Completion circle */}
            <div className={[
               "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0",
               allDone
                  ? "bg-sol-green border-sol-green text-sol-bg"
                  : "border-sol-muted text-sol-muted",
            ].join(" ")}>
               {allDone ? "✓" : ""}
            </div>

            <div className="flex-1 min-w-0">
               <h3 className="font-semibold text-sol-text text-sm">{mod.title}</h3>
               <p className="text-xs text-sol-muted mt-0.5">
                  {mod.lessons.length} lessons · {mod.duration} · {done}/{mod.lessons.length} done
               </p>
            </div>

            {/* Mini bar */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
               <div className="w-24 h-1.5 rounded-full bg-sol-border overflow-hidden">
                  <div className="h-full bg-sol-green rounded-full transition-all duration-500"
                     style={{ width: `${pct}%` }} />
               </div>
               <span className="text-xs text-sol-muted w-8 text-right">{pct}%</span>
            </div>

            <svg className={`w-4 h-4 text-sol-muted transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
               viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
         </button>

         {/* Lesson rows */}
         {open && (
            <div className="border-t border-sol-border divide-y divide-sol-border/40">
               {mod.lessons.map(l => (
                  <Link key={l.id} href={`/courses/${COURSE.slug}/lessons/${l.id}`}
                     className={`flex items-center gap-3 px-5 py-3 hover:bg-sol-surface/40
                          transition-colors group ${l.done ? "opacity-60" : ""}`}>
                     <div className={[
                        "w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0",
                        l.done
                           ? "bg-sol-green/20 border-sol-green/50 text-sol-green"
                           : "border-sol-muted text-sol-muted group-hover:border-sol-green/40",
                     ].join(" ")}>
                        {l.done ? "✓" : "▶"}
                     </div>
                     <span className={`text-sm flex-1 transition-colors ${l.done ? "text-sol-muted line-through" : "text-sol-text group-hover:text-sol-green"
                        }`}>
                        {l.title}
                     </span>
                     <span className="text-xs text-sol-muted">{l.duration}</span>
                  </Link>
               ))}
            </div>
         )}
      </div>
   );
}

function ReviewCard({ review }: { review: Review }) {
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

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function CourseDetail() {
   const [enrolled, setEnrolled] = useState(COURSE.progress > 0);

   const completedLessons = COURSE.modules.reduce((a, m) => a + m.lessons.filter(l => l.done).length, 0);
   const totalLessons = COURSE.modules.reduce((a, m) => a + m.lessons.length, 0);
   const nextLesson = COURSE.modules.flatMap(m => m.lessons).find(l => !l.done);

   return (
      <div className="min-h-screen bg-sol-bg font-display">

         {/* Breadcrumb */}
         <div className="border-b border-sol-border bg-sol-surface/60">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-sol-muted">
                  <Link href="/courses" className="hover:text-sol-green transition-colors">← Courses</Link>
                  <span className="text-sol-border">/</span>
                  <span className="text-sol-subtle">{COURSE.title}</span>
               </div>
            </div>
         </div>

         {/* Hero */}
         <div className="bg-linear-to-b from-sol-surface to-sol-bg border-b border-sol-border">
            <div className="max-w-7xl mx-auto px-6 py-12">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                  {/* ── Left info ── */}
                  <div className="lg:col-span-2 animate-fade-up">
                     <div className="flex items-center gap-2 mb-4">
                        <span className={`sol-badge ${DIFF_CLS[COURSE.difficulty]}`}>{COURSE.difficulty}</span>
                        <span className="sol-badge bg-sol-surface text-sol-muted border-sol-border">programs</span>
                     </div>

                     <h1 className="text-3xl font-extrabold text-sol-text leading-tight mb-4">{COURSE.title}</h1>
                     <p className="text-sol-subtle leading-relaxed mb-6 max-w-2xl">{COURSE.desc}</p>

                     <div className="flex flex-wrap gap-5 mb-6">
                        <StatChip icon="⭐" label={`${COURSE.rating} (${COURSE.reviews} reviews)`} />
                        <StatChip icon="👥" label={`${COURSE.enrolled.toLocaleString()} students`} />
                        <StatChip icon="⏱" label={`${COURSE.duration}h total`} />
                        <StatChip icon="⚡" label={`${COURSE.totalXP} XP to earn`} />
                        <StatChip icon="🔄" label={`Updated ${COURSE.lastUpdated}`} />
                     </div>

                     {/* Instructor */}
                     <div className="inline-flex items-center gap-3 p-4 bg-sol-card border border-sol-border rounded-xl">
                        <span className="text-3xl">{COURSE.instructor.avatar}</span>
                        <div>
                           <div className="text-sm font-bold text-sol-text">{COURSE.instructor.name}</div>
                           <div className="text-xs text-sol-muted">{COURSE.instructor.role}</div>
                           <div className="text-xs text-sol-muted mt-0.5">
                              {COURSE.instructor.courses} courses · {(COURSE.instructor.students / 1000).toFixed(0)}k students
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* ── Enrollment card ── */}
                  <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
                     <div className="card-base p-6 sticky top-6">
                        {/* Course icon thumbnail */}
                        <div className="w-full h-32 rounded-xl bg-lineaar-to-br from-sol-surface to-sol-bg
                                flex items-center justify-center text-5xl mb-5 border border-sol-border
                                text-sol-text/30">
                           ⚓
                        </div>

                        {/* Progress bar */}
                        {enrolled && (
                           <div className="mb-5">
                              <div className="flex justify-between text-xs font-semibold text-sol-subtle mb-1.5">
                                 <span>Your Progress</span>
                                 <span className="text-sol-green font-bold">{COURSE.progress}%</span>
                              </div>
                              <div className="h-2.5 bg-sol-border rounded-full overflow-hidden mb-1.5">
                                 <div className="h-full bg-linear-to-r from-sol-green to-sol-forest rounded-full transition-all duration-700"
                                    style={{ width: `${COURSE.progress}%` }} />
                              </div>
                              <div className="flex justify-between text-[11px] text-sol-muted">
                                 <span>{completedLessons}/{totalLessons} lessons</span>
                                 <span className="text-sol-yellow font-semibold">⚡ {COURSE.earnedXP}/{COURSE.totalXP} XP</span>
                              </div>
                           </div>
                        )}

                        {/* CTA */}
                        {enrolled ? (
                           <Link href={`/courses/${COURSE.slug}/lessons/${nextLesson?.id ?? "l1"}`}
                              className="sol-btn-primary w-full justify-center py-3 text-sm block text-center">
                              Continue → {nextLesson?.title}
                           </Link>
                        ) : (
                           <button onClick={() => setEnrolled(true)}
                              className="sol-btn-primary w-full justify-center py-3 text-sm">
                              Enroll for Free
                           </button>
                        )}

                        {/* Course meta grid */}
                        <div className="mt-4 grid grid-cols-2 gap-y-2.5 gap-x-3 text-xs text-sol-subtle">
                           {[
                              ["📋", `${totalLessons} lessons`],
                              ["⏱", `${COURSE.duration}h content`],
                              ["💻", "Code exercises"],
                              ["🏆", "Certificate"],
                              ["⚡", `${COURSE.totalXP} XP reward`],
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
                           {COURSE.modules.length} modules · {totalLessons} lessons
                        </span>
                     </h2>
                     <div className="space-y-2">
                        {COURSE.modules.map((m, i) => (
                           <ModuleRow key={m.id} mod={m} defaultOpen={i < 2} />
                        ))}
                     </div>
                  </section>

                  {/* Reviews */}
                  <section>
                     <h2 className="text-lg font-bold text-sol-text mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 bg-sol-yellow rounded-full" />
                        Reviews
                     </h2>
                     <div className="flex items-center gap-4 mb-5 p-4 card-base">
                        <span className="text-5xl font-extrabold text-sol-text">{COURSE.rating}</span>
                        <div>
                           <div className="flex gap-0.5 mb-1">
                              {[...Array(5)].map((_, i) => (
                                 <span key={i} className={`text-lg ${i < Math.round(COURSE.rating) ? "text-sol-yellow" : "text-sol-border"}`}>★</span>
                              ))}
                           </div>
                           <div className="text-xs text-sol-muted">{COURSE.reviews} ratings</div>
                        </div>
                     </div>
                     <div className="space-y-3">
                        {REVIEWS.map((r, i) => <ReviewCard key={i} review={r} />)}
                     </div>
                  </section>
               </div>

               {/* Quick stats sidebar */}
               <div className="hidden lg:block">
                  <div className="card-base p-5 sticky top-6">
                     <h3 className="text-[11px] font-bold text-sol-muted uppercase tracking-widest mb-4">
                        Quick Stats
                     </h3>
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