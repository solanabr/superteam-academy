"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import Header from "~/components/Header";

type Path = {
   id: string,
   title: string,
   icon: string,
   courses: number,
   hours: number,
   color: string,
   border: string,
   tagCls: string,
   tag: string
}

type Course = {
   slug: string,
   topic: string,
   title: string,
   difficulty: "all" | "beginner" | "intermediate" | "advanced",
   duration: number,
   progress: number,
   xp: number,
   students: number,
   icon: string,
   desc: string
}


const LEARNING_PATHS: Array<Path> = [
   {
      id: "solana-fundamentals",
      title: "Solana Fundamentals",
      icon: "◎",
      courses: 6, hours: 12,
      color: "from-sol-green/15 to-sol-forest/10",
      border: "border-sol-green/40",
      tagCls: "bg-sol-green/15 text-sol-green border-sol-green/40",
      tag: "Most Popular",
   },
   {
      id: "defi-developer",
      title: "DeFi Developer",
      icon: "⟠",
      courses: 8, hours: 24,
      color: "from-sol-yellow/20 to-sol-forest/10",
      border: "border-sol-yellow/40",
      tagCls: "bg-sol-yellow/25 text-sol-yellow border-sol-yellow/50",
      tag: "Advanced",
   },
   {
      id: "nft-creator",
      title: "NFT & Digital Assets",
      icon: "◈",
      courses: 5, hours: 10,
      color: "from-sol-forest/15 to-sol-green/10",
      border: "border-sol-forest/40",
      tagCls: "bg-sol-forest/15 text-sol-forest border-sol-forest/40",
      tag: "New",
   },
];

const COURSES: Array<Course> = [
   { slug: "intro-to-solana", title: "Intro to Solana", topic: "blockchain", difficulty: "beginner", duration: 2, progress: 100, xp: 500, students: 12400, icon: "◎", desc: "Master the fundamentals of the Solana blockchain — accounts, programs, and transactions." },
   { slug: "anchor-framework", title: "Anchor Framework Deep Dive", topic: "programs", difficulty: "intermediate", duration: 6, progress: 65, xp: 1200, students: 8700, icon: "⚓", desc: "Build production-grade Solana programs using the Anchor framework and IDL system." },
   { slug: "defi-protocols", title: "Building DeFi Protocols", topic: "defi", difficulty: "advanced", duration: 10, progress: 20, xp: 2500, students: 4200, icon: "⟠", desc: "Design and deploy AMMs, lending protocols, and yield strategies on Solana." },
   { slug: "web3js-dapps", title: "Web3.js & dApp Development", topic: "frontend", difficulty: "beginner", duration: 4, progress: 0, xp: 800, students: 9100, icon: "⬡", desc: "Connect wallets, read on-chain data, and send transactions from your web app." },
   { slug: "token-programs", title: "SPL Token Programs", topic: "programs", difficulty: "intermediate", duration: 5, progress: 0, xp: 1000, students: 6300, icon: "◈", desc: "Create, mint, and manage fungible and non-fungible tokens using the SPL standard." },
   { slug: "rust-for-solana", title: "Rust for Solana Developers", topic: "rust", difficulty: "intermediate", duration: 8, progress: 0, xp: 1800, students: 5500, icon: "⚙", desc: "Learn Rust from scratch with a laser focus on patterns used in Solana program development." },
   { slug: "program-security", title: "Solana Program Security", topic: "security", difficulty: "advanced", duration: 7, progress: 0, xp: 2000, students: 3100, icon: "⬢", desc: "Identify and fix common vulnerabilities: reentrancy, signer checks, overflow, and more." },
   { slug: "nft-marketplace", title: "Build an NFT Marketplace", topic: "defi", difficulty: "advanced", duration: 12, progress: 0, xp: 3000, students: 2800, icon: "◐", desc: "End-to-end NFT marketplace — metadata, royalties, escrow listings, and a polished UI." },
   { slug: "compressed-nfts", title: "Compressed NFTs (cNFTs)", topic: "blockchain", difficulty: "intermediate", duration: 3, progress: 0, xp: 700, students: 4400, icon: "⬡", desc: "Mint millions of NFTs at near-zero cost using Bubblegum and state compression." },
];

const DIFFICULTIES = ["all", "beginner", "intermediate", "advance"];
const TOPICS = ["all", "blockchain", "programs", "defi", "frontend", "rust", "security"];
const DURATIONS = ["all", "0-4h", "4-8h", "8h+"];

// beginner=emerald  intermediate=amber/yellow  advanced=forest
const DIFF_CLS = {
   beginner: "bg-sol-green/10  text-sol-green  border-sol-green/35",
   intermediate: "bg-sol-yellow/20 text-sol-yellow  border-sol-yellow/50",
   advanced: "bg-sol-forest/15 text-sol-forest border-sol-forest/40",
   all: ""
};

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
function FilterPill({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
   return (
      <button onClick={onClick}
         className={[
            "px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 text-left w-full",
            active
               ? "bg-sol-green/15 text-sol-green border-sol-green/50"
               : "bg-sol-surface text-sol-subtle border-sol-border hover:border-sol-forest/50 hover:text-sol-text",
         ].join(" ")}>
         {label === "all" ? "All" : label.charAt(0).toUpperCase() + label.slice(1)}
      </button>
   );
}

function ProgressRing({ pct, size = 36 }: { pct: number, size?: number }) {
   const r = (size - 6) / 2;
   const circ = 2 * Math.PI * r;
   const dash = (pct / 100) * circ;
   return (
      <svg width={size} height={size} className="-rotate-90">
         <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={3}
            stroke="var(--color-sol-border)" fill="none" />
         <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={3}
            stroke={pct === 100 ? "var(--color-sol-green)" : "var(--color-sol-yellow)"}
            fill="none" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
   );
}

function CourseCard({ course, index }: { course: Course, index: number }) {
   return (
      <Link href={`/courses/${course.slug}`}
         className="card-base group flex flex-col hover:border-sol-green/50 hover:-translate-y-1 hover:shadow-sol-green animate-fade-up"
         style={{ animationDelay: `${index * 55}ms` }}>

         {/* Thumbnail banner */}
         <div className="relative h-36 rounded-t-2xl bg-linear-to-br from-sol-surface to-sol-bg
                      flex items-center justify-center overflow-hidden border-b border-sol-border">
            <span className="text-5xl opacity-25 group-hover:opacity-55 group-hover:scale-110 transition-all duration-300 select-none">
               {course.icon}
            </span>
            {course.progress > 0 && (
               <div className="absolute bottom-0 inset-x-0 h-1 bg-sol-border">
                  <div className="h-full bg-sol-green transition-all duration-500" style={{ width: `${course.progress}%` }} />
               </div>
            )}
            {course.progress === 100 && (
               <div className="absolute top-3 right-3 bg-sol-green/20 border border-sol-green/50
                          text-sol-green text-[10px] font-bold px-2 py-0.5 rounded-full">
                  ✓ Done
               </div>
            )}
         </div>

         <div className="flex flex-col flex-1 p-5 gap-3">
            <div className="flex items-center gap-2 flex-wrap">
               <span className={`sol-badge ${DIFF_CLS[course.difficulty]}`}>{course.difficulty}</span>
               <span className="sol-badge bg-sol-surface text-sol-muted border-sol-border">{course.topic}</span>
            </div>

            <div>
               <h3 className="font-bold text-base text-sol-text leading-tight mb-1.5
                         group-hover:text-sol-green transition-colors duration-150">
                  {course.title}
               </h3>
               <p className="text-sol-subtle text-xs leading-relaxed line-clamp-2">{course.desc}</p>
            </div>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-sol-border">
               <div className="flex items-center gap-3 text-xs text-sol-muted">
                  <span>⏱ {course.duration}h</span>
                  <span className="font-semibold text-sol-yellow">⚡ {course.xp} XP</span>
                  <span>👥 {(course.students / 1000).toFixed(1)}k</span>
               </div>
               {course.progress > 0 && course.progress < 100 && (
                  <div className="flex items-center gap-1.5">
                     <ProgressRing pct={course.progress} />
                     <span className="text-xs font-semibold text-sol-yellow">{course.progress}%</span>
                  </div>
               )}
            </div>
         </div>
      </Link>
   );
}

function PathCard({ path }: { path: Path }) {
   return (
      <div className={`card-base bg-linear-to-br ${path.color} border ${path.border}
                     p-5 hover:scale-[1.02] hover:shadow-sol-green transition-all duration-200 cursor-pointer`}>
         <div className="flex items-start justify-between mb-3">
            <span className="text-2xl">{path.icon}</span>
            <span className={`sol-badge text-[10px] ${path.tagCls}`}>{path.tag}</span>
         </div>
         <h3 className="font-bold text-sol-text mb-1">{path.title}</h3>
         <p className="text-sol-subtle text-xs">{path.courses} courses · {path.hours}h total</p>
         <div className="mt-4 text-xs font-semibold text-sol-green">Start path →</div>
      </div>
   );
}

// ── PAGE ─────────────────────────────────────────────────────────────────────
export default function Page() {
   const [search, setSearch] = useState("");
   const [diff, setDiff] = useState("all");
   const [topic, setTopic] = useState("all");
   const [dur, setDur] = useState("all");

   const filtered = useMemo(() => COURSES.filter(c => {
      const q = search.toLowerCase();
      if (q && !c.title.toLowerCase().includes(q) && !c.desc.toLowerCase().includes(q) && !c.topic.includes(q)) return false;
      if (diff !== "all" && c.difficulty !== diff) return false;
      if (topic !== "all" && c.topic !== topic) return false;
      if (dur === "0-4h" && c.duration > 4) return false;
      if (dur === "4-8h" && (c.duration <= 4 || c.duration > 8)) return false;
      if (dur === "8h+" && c.duration <= 8) return false;
      return true;
   }), [search, diff, topic, dur]);

   return (
      <>
         <div className="bg-sol-glow border-b border-sol-border">
            <div className="max-w-7xl mx-auto px-6 pt-14 pb-12">
               <div className="flex items-start justify-between gap-6 mb-8">
                  <div className="animate-fade-up max-w-xl">
                     <span className="sol-badge bg-sol-green/10 text-sol-green border-sol-green/35 mb-4">
                        ◎ Solana Learning Platform
                     </span>
                     <h1 className="text-4xl font-extrabold text-sol-text leading-tight mt-3 mb-3">
                        Master Web3<br />
                        <span className="bg-sol-gradient bg-clip-text text-transparent">
                           Development
                        </span>
                     </h1>
                     <p className="text-sol-subtle text-base leading-relaxed">
                        Hands-on courses to take you from zero to shipping real Solana programs.
                     </p>
                  </div>
               </div>

               {/* Search */}
               <div className="relative max-w-lg">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sol-muted">🔍</span>
                  <input type="text" placeholder="Search courses, topics, skills…"
                     value={search} onChange={e => setSearch(e.target.value)}
                     className="w-full bg-sol-card border border-sol-border rounded-xl pl-10 pr-4 py-3
                         text-sol-text text-sm placeholder:text-sol-muted
                         focus:outline-none focus:border-sol-green/60 transition-all duration-200" />
               </div>
            </div>
         </div>

         <div className="max-w-7xl mx-auto px-6 py-10">

            {/* ── Learning Paths ─────────────────────────────────────────────── */}
            <section className="mb-12">
               <div className="flex items-center gap-3 mb-4">
                  <span className="h-px flex-1 bg-sol-border" />
                  <h2 className="text-[11px] font-bold text-sol-muted uppercase tracking-widest whitespace-nowrap">
                     Curated Learning Paths
                  </h2>
                  <span className="h-px flex-1 bg-sol-border" />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {LEARNING_PATHS.map(p => <PathCard key={p.id} path={p} />)}
               </div>
            </section>

            {/* ── Filters + Grid ─────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row gap-8">

               <aside className="lg:w-52 shrink-0">
                  <div className="card-base p-5 sticky top-6">
                     <h3 className="text-[11px] font-bold text-sol-muted uppercase tracking-widest mb-4">Filters</h3>
                     {[
                        { label: "Difficulty", items: DIFFICULTIES, val: diff, set: setDiff },
                        { label: "Topic", items: TOPICS, val: topic, set: setTopic },
                        { label: "Duration", items: DURATIONS, val: dur, set: setDur },
                     ].map(g => (
                        <div key={g.label} className="mb-5 last:mb-0">
                           <p className="text-[11px] text-sol-muted font-bold uppercase tracking-wider mb-2">{g.label}</p>
                           <div className="flex flex-col gap-1.5">
                              {g.items.map(item => (
                                 <FilterPill key={item} label={item} active={g.val === item} onClick={() => g.set(item)} />
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>
               </aside>
               <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-sol-subtle text-sm">
                        <span className="text-sol-text font-semibold">{filtered.length}</span> courses found
                     </p>
                     <select className="bg-sol-card border border-sol-border rounded-lg px-3 py-1.5
                                 text-sol-subtle text-xs focus:outline-none focus:border-sol-green/40 transition-colors">
                        <option>Sort: Most Popular</option>
                        <option>Sort: Newest</option>
                        <option>Sort: Duration ↑</option>
                     </select>
                  </div>

                  {filtered.length === 0 ? (
                     <div className="card-base p-16 text-center">
                        <div className="text-4xl mb-3 opacity-30">🔍</div>
                        <p className="text-sol-subtle font-semibold mb-4">No courses match your filters</p>
                        <button onClick={() => { setSearch(""); setDiff("all"); setTopic("all"); setDur("all"); }}
                           className="sol-btn-ghost text-xs">
                           Clear all filters
                        </button>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map((c, i) => <CourseCard key={c.slug} course={c} index={i} />)}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </>
   );
}



