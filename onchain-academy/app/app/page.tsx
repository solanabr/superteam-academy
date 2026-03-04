'use client';

/**
 * app/page.tsx
 * Superteam Academy — multiblock.space-inspired landing page
 */

import { useEffect, useRef, useState, CSSProperties } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion, useInView, useMotionValue, useSpring, Variants } from 'framer-motion';
import {
  ArrowRight, Code2, Trophy, Shield, Globe2, Zap,
  BookOpen, Users, ChevronRight, Star, CheckCircle2,
  Cpu, Layers, Sparkles, GraduationCap,
} from 'lucide-react';
import { getCourseService, getAnalyticsService } from '@/lib/services';
import { Course } from '@/lib/types/domain';
import { formatDuration } from '@/lib/utils';

// ── Motion variants ───────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: (i = 0) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.6, delay: i * 0.09, ease: [0.23, 1, 0.32, 1] },
  }),
};
const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref   = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv     = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 55, damping: 18 });
  const [val, setVal] = useState('0');
  useEffect(() => { if (inView) mv.set(target); }, [inView, mv, target]);
  useEffect(() => spring.on('change', (v) => setVal(Math.round(v).toLocaleString())), [spring]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ── Dot-grid + glow background ────────────────────────────────────────────────
function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* dot grid — fades from top, invisible at bottom */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.11) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)',
        }}
      />
      {/* purple glow – top center */}
      <div className="absolute -top-56 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.24) 0%, transparent 70%)', filter: 'blur(70px)' }} />
      {/* solana green – right */}
      <div className="absolute top-1/3 -right-72 h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(20,241,149,0.11) 0%, transparent 70%)', filter: 'blur(90px)' }} />
      {/* indigo – left bottom */}
      <div className="absolute -bottom-24 -left-48 h-[500px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.13) 0%, transparent 70%)', filter: 'blur(100px)' }} />
    </div>
  );
}

// ── CSS @property animated gradient border ────────────────────────────────────
const SPIN_CSS = `
  @property --angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes spin-border {
    to { --angle: 360deg; }
  }
`;

function GradientBorderCard({
  children, className = '', animate = false,
  colorA = '#7c3aed', colorB = '#14f195', colorC = '#6366f1',
}: {
  children: React.ReactNode; className?: string; animate?: boolean;
  colorA?: string; colorB?: string; colorC?: string;
}) {
  const id = `gbc-${colorA.replace('#', '')}`;
  const gradStyle: CSSProperties = animate
    ? { background: `conic-gradient(from var(--angle,0deg), ${colorA}, ${colorB}, ${colorC}, ${colorA})`, animation: 'spin-border 4s linear infinite' }
    : { background: `linear-gradient(135deg, ${colorA}55, ${colorB}25, ${colorC}35)` };

  return (
    <div className={`relative rounded-2xl p-px ${className}`}>
      <style>{SPIN_CSS}</style>
      <div className="absolute inset-0 rounded-2xl" style={gradStyle} />
      <div className="relative h-full rounded-2xl bg-[#0d0d18] backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

// ── Static glass card ─────────────────────────────────────────────────────────
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-white/[0.13] hover:bg-white/[0.05] ${className}`}>
      {children}
    </div>
  );
}

// ── Eyebrow pill with animated border ─────────────────────────────────────────
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <GradientBorderCard animate colorA="#7c3aed" colorB="#14f195" colorC="#06b6d4">
      <div className="flex items-center gap-2 px-4 py-1.5 text-[13px] text-slate-300">
        {children}
      </div>
    </GradientBorderCard>
  );
}

// ── Difficulty badge ──────────────────────────────────────────────────────────
function Difficulty({ level }: { level: string }) {
  const map: Record<string, string> = {
    beginner:     'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    intermediate: 'text-amber-400   bg-amber-400/10   border-amber-400/20',
    advanced:     'text-rose-400    bg-rose-400/10    border-rose-400/20',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${map[level?.toLowerCase()] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20'}`}>
      {level}
    </span>
  );
}

// ── Feature bento data ────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Code2, title: 'Live Code Challenges', tag: 'Interactive', accent: '#7c3aed',
    desc: 'Write real Solana programs in-browser. Tests run instantly. No local setup, ever.',
    wide: true,
    preview: (
      <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-slate-400">
        <span className="text-[#14f195]">fn</span>{' '}
        <span className="text-violet-400">initialize_course</span>{'(ctx: Context<Initialize>) -> Result<()> {'}<br/>
        {'  let course = &mut ctx.accounts.'}<span className="text-amber-400">course</span>{';\n  course.'}<span className="text-sky-400">authority</span>{' = ctx.accounts.payer.key();\n  '}<span className="text-[#14f195]">Ok</span>{'(())\n}'}
      </div>
    ),
  },
  { icon: Shield,  title: 'On-Chain Credentials', tag: 'Web3-native', accent: '#14f195', desc: 'NFT certificates minted on Solana — verifiable, permanent, provably yours.', wide: false, preview: null },
  { icon: Trophy,  title: 'XP & Leaderboard',     tag: 'Gamified',    accent: '#f59e0b', desc: 'Every lesson earns XP. Climb the global leaderboard. Unlock rare achievements.', wide: false, preview: null },
  { icon: Globe2,  title: '3 Languages',           tag: 'LatAm',       accent: '#06b6d4', desc: 'English, Português, Español. Built for Latin American developers first.', wide: false, preview: null },
  { icon: Cpu,     title: 'Open Source',            tag: 'Community',   accent: '#6366f1', desc: 'Every line is public. Contribute courses, fixes, features. Fork it freely.', wide: false, preview: null },
  {
    icon: Layers, title: 'Structured Learning Tracks', tag: 'Curated', accent: '#ec4899',
    desc: 'Four tracks from Fundamentals → DeFi → Security → Full Stack dApps.',
    wide: true,
    preview: (
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[['◆','Fundamentals','#7c3aed'],['◈','DeFi','#14f195'],['◉','Security','#f59e0b'],['◇','Full Stack','#06b6d4']].map(([icon, label, color]) => (
          <div key={String(label)} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
            <span className="mb-1.5 block text-lg" style={{ color: String(color) }}>{icon}</span>
            <p className="text-[9px] leading-tight text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    ),
  },
];

const STATS = [
  { label: 'Developers', value: 12000, suffix: '+', Icon: Users },
  { label: 'Lessons',    value: 48,    suffix: '',   Icon: BookOpen },
  { label: 'XP Earned',  value: 2400000, suffix: '+', Icon: Zap },
  { label: 'Countries',  value: 18,    suffix: '',   Icon: Globe2 },
];

const TESTIMONIALS = [
  { name: 'Carlos Silva',  role: 'Solana Developer @ Phantom',   initials: 'CS', color: '#a78bfa', quote: 'Superteam Academy was the catalyst for my career in Web3. The on-chain credential opened doors immediately.' },
  { name: 'Isabela Rocha', role: 'Founder, SolanaPayBR',          initials: 'IR', color: '#14f195', quote: 'Zero to shipping a production dApp in 3 months. The interactive code challenges are genuinely elite-tier.' },
  { name: 'Diego Martins', role: 'Security Researcher',            initials: 'DM', color: '#38bdf8', quote: 'The security auditing track is top-tier. I use techniques from it in professional audits daily.' },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { connected } = useWallet();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    getAnalyticsService().pageView('/', 'Home');
    getCourseService().getAllCourses().then((all: any) => setCourses(all.slice(0, 3)));
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-[#09090f] text-white antialiased font-sans"
    >
      <Background />

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-20 pt-32 text-center">
        {/* Pill badge */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="mb-8 inline-block">
          <Pill>
            <Sparkles className="h-3 w-3 text-violet-400" />
            <span>The Solana learning platform for LatAm</span>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14f195] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#14f195]" />
            </span>
          </Pill>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="mx-auto max-w-[820px] text-[clamp(2.8rem,8vw,5.4rem)] font-bold leading-[1.05] tracking-[-0.03em]"
        >
          Master Solana.{' '}
          <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #14f195 55%, #38bdf8 100%)' }}>
            Earn On-Chain.
          </span>
          <br className="hidden sm:block" />
          Get Hired.
        </motion.h1>

        {/* Sub */}
        <motion.p
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="mx-auto mt-6 max-w-[540px] text-[17px] leading-relaxed text-slate-400"
        >
          Interactive courses, live coding challenges, and verifiable NFT credentials —
          {' '}<span className="text-slate-200">built for the Solana ecosystem in Latin America.</span>
        </motion.p>

        {/* CTA row */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={3}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href={connected ? '/dashboard' : '/courses'}>
            <button
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #14f195)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(124,58,237,0.65)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              {connected ? 'Go to Dashboard' : 'Start Learning — Free'}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </Link>
          <Link href="/courses">
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-slate-300 backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07]">
              Browse Courses <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </motion.div>

        {/* Trust row */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={4}
          className="mt-11 flex flex-wrap items-center justify-center gap-5 text-[12px] text-slate-600"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {['no credit card', 'open source', 'on-chain credentials', '3 languages'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-[#14f195]" /> {t}
            </span>
          ))}
        </motion.div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────────────────── */}
      <section className="relative border-y border-white/[0.06] py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 md:grid-cols-4">
          {STATS.map(({ label, value, suffix, Icon }, i) => (
            <motion.div key={label} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.5}
              className="flex flex-col items-center gap-1 text-center">
              <Icon className="h-4 w-4 text-violet-400" />
              <span className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-mono)' }}>
                <AnimatedNumber target={value} suffix={suffix} />
              </span>
              <span className="text-[11px] uppercase tracking-widest text-slate-600">{label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── BENTO FEATURES ────────────────────────────────────────────────── */}
      <section className="relative px-4 py-28">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-14 text-center">
            <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-violet-400" style={{ fontFamily: 'var(--font-mono)' }}>
              — what you get
            </p>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Everything to{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #a78bfa, #14f195)' }}>
                go from zero to hired
              </span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {FEATURES.map(({ icon: Icon, title, desc, wide, accent, tag, preview }, i) => (
              <motion.div key={title} variants={fadeUp} custom={i} className={wide ? 'md:col-span-2' : ''}>
                {wide ? (
                  <GradientBorderCard animate colorA={accent} colorB="#7c3aed" colorC="#06b6d4" className="h-full">
                    <div className="h-full p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border"
                          style={{ borderColor: `${accent}40`, background: `${accent}18` }}>
                          <Icon className="h-5 w-5" style={{ color: accent }} />
                        </div>
                        <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
                          style={{ borderColor: `${accent}30`, color: accent, background: `${accent}12` }}>
                          {tag}
                        </span>
                      </div>
                      <h3 className="mt-4 text-[17px] font-semibold text-white">{title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{desc}</p>
                      {preview}
                    </div>
                  </GradientBorderCard>
                ) : (
                  <GlassCard className="h-full p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border"
                      style={{ borderColor: `${accent}35`, background: `${accent}15` }}>
                      <Icon className="h-5 w-5" style={{ color: accent }} />
                    </div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <h3 className="text-[15px] font-semibold text-white">{title}</h3>
                      <span className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                        style={{ borderColor: `${accent}30`, color: accent, background: `${accent}12` }}>
                        {tag}
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-slate-500">{desc}</p>
                  </GlassCard>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── LEARNING TRACKS ───────────────────────────────────────────────── */}
      <section className="relative px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-12 text-center">
            <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[#14f195]" style={{ fontFamily: 'var(--font-mono)' }}>
              — structured paths
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Choose your track</h2>
          </motion.div>

          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { name: 'Solana Fundamentals', courses: 2, hours: '14h', color: '#7c3aed', symbol: '◆' },
              { name: 'DeFi Developer',       courses: 3, hours: '30h', color: '#14f195', symbol: '◈' },
              { name: 'Security Auditor',      courses: 3, hours: '27h', color: '#f59e0b', symbol: '◉' },
              { name: 'Full Stack Solana',     courses: 3, hours: '33h', color: '#06b6d4', symbol: '◇' },
            ].map(({ name, courses, hours, color, symbol }, i) => (
              <motion.div key={name} variants={fadeUp} custom={i}>
                <Link href="/courses">
                  <div
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1"
                    style={{ borderColor: `${color}22`, background: `${color}08` }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px ${color}28`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                  >
                    <span className="mb-3 block text-2xl" style={{ color }}>{symbol}</span>
                    <h3 className="mb-3 text-[14px] font-semibold leading-snug text-white">{name}</h3>
                    <div className="flex items-center gap-3 text-[11px]" style={{ fontFamily: 'var(--font-mono)', color }}>
                      <span>{courses} courses</span>
                      <span className="opacity-40">·</span>
                      <span>{hours}</span>
                    </div>
                    <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" style={{ color }} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURED COURSES ──────────────────────────────────────────────── */}
      {courses.length > 0 && (
        <section className="relative px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>— start here</p>
                <h2 className="text-3xl font-bold tracking-tight">Featured Courses</h2>
              </div>
              <Link href="/courses" className="hidden items-center gap-1 text-sm text-slate-500 transition-colors hover:text-white md:flex">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid gap-4 md:grid-cols-3">
              {courses.map((course, i) => (
                <motion.div key={course.id} variants={fadeUp} custom={i}>
                  <Link href={`/courses/${course.slug}`}>
                    <GlassCard className="group h-full cursor-pointer p-5 transition-all duration-300 hover:-translate-y-1">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
                          <GraduationCap className="h-4 w-4 text-violet-400" />
                        </div>
                        <Difficulty level={course.difficulty} />
                      </div>
                      <h3 className="mb-1.5 text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-violet-300">
                        {course.title}
                      </h3>
                      <p className="mb-4 line-clamp-2 text-[12px] leading-relaxed text-slate-500">{course.description}</p>
                      <div className="flex items-center gap-4 border-t border-white/[0.05] pt-3.5 text-[11px] text-slate-600"
                        style={{ fontFamily: 'var(--font-mono)' }}>
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.totalLessons} lessons</span>
                        <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-violet-400" />{(course as any).totalXp} XP</span>
                        <span className="ml-auto">{formatDuration(((course as any).estimatedHours || 0) * 60)}</span>
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="relative px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-12 text-center">
            <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>— social proof</p>
            <h2 className="text-3xl font-bold tracking-tight">Builders who shipped</h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, quote, initials, color }, i) => (
              <motion.div key={name} variants={fadeUp} custom={i}>
                <GlassCard className="h-full p-6">
                  <div className="mb-4 flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-current" style={{ color }} />
                    ))}
                  </div>
                  <p className="mb-5 text-[14px] leading-relaxed text-slate-300">&ldquo;{quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-black"
                      style={{ background: `linear-gradient(135deg, ${color}, #7c3aed)` }}>
                      {initials}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-white">{name}</p>
                      <p className="text-[11px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>{role}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="relative px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-14 text-center">
            <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>— how it works</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Three steps to your first credential</h2>
          </motion.div>

          <div className="relative">
            {/* connecting line */}
            <div className="absolute left-[16.66%] right-[16.66%] top-5 hidden h-px md:block"
              style={{ background: 'linear-gradient(90deg, transparent, #7c3aed55, #14f19555, transparent)' }} />
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-8 md:grid-cols-3">
              {[
                { n: '01', label: 'Connect wallet',       sub: 'Phantom, Solflare, or Backpack. Your progress lives on Solana.', color: '#7c3aed' },
                { n: '02', label: 'Complete challenges',   sub: 'Interactive lessons, live coding, and instant XP rewards.',      color: '#14f195' },
                { n: '03', label: 'Claim your credential', sub: 'Mint your NFT certificate. Share it. Get hired.',                color: '#06b6d4' },
              ].map(({ n, label, sub, color }, i) => (
                <motion.div key={n} variants={fadeUp} custom={i} className="flex flex-col items-center text-center">
                  <div className="relative mb-5 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold"
                    style={{ borderColor: `${color}50`, background: `${color}15`, color, fontFamily: 'var(--font-mono)' }}>
                    {n}
                  </div>
                  <h3 className="mb-2 text-[15px] font-semibold text-white">{label}</h3>
                  <p className="text-[13px] leading-relaxed text-slate-500">{sub}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="relative px-4 pb-32 pt-16">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div className="relative mx-auto max-w-2xl">
          <GradientBorderCard animate colorA="#7c3aed" colorB="#14f195" colorC="#06b6d4">
            <div className="px-8 py-14 text-center">
              <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-violet-400" style={{ fontFamily: 'var(--font-mono)' }}>
                — ready to build?
              </p>
              <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
                Join{' '}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa, #14f195)' }}>
                  12,000+
                </span>{' '}
                developers
              </h2>
              <p className="mx-auto mb-10 max-w-sm text-[15px] leading-relaxed text-slate-400">
                Start for free. No credit card. No excuses.<br />Your on-chain credential is waiting.
              </p>
              <Link href="/courses">
                <button
                  className="group inline-flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold text-black transition-all duration-300"
                  style={{ background: 'linear-gradient(135deg, #9945FF, #14f195)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(124,58,237,0.6)';
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                  }}
                >
                  Start Learning — Free
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </GradientBorderCard>
        </div>
      </section>
    </div>
  );
}
