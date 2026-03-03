'use client'

import { StandardLayout } from '@/components/layout/StandardLayout'
import { PATHS, PathSVGs } from '@/libs/constants/home.constants'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

// ─── Ordered path slugs (same order as PATHS array) ──────────────────────────
const PATH_SLUGS = [
  'solana-foundations',
  'on-chain-programs',
  'defi-token-programs',
]

// ─── Outcomes per path (teaser — 3 items) ────────────────────────────────────
const PATH_TEASER: Record<string, string[]> = {
  'solana-foundations': [
    'Solana account model & runtime',
    'Program Derived Addresses (PDAs)',
    'Wallets, keypairs & transactions',
  ],
  'on-chain-programs': [
    'Rust for Solana development',
    'Anchor framework & CPIs',
    'Testing & mainnet deployment',
  ],
  'defi-token-programs': [
    'SPL tokens & Token-2022',
    'AMMs & liquidity pool mechanics',
    'DeFi protocol integration',
  ],
}

// ─── Level label colours ──────────────────────────────────────────────────────
const LEVEL_DOTS = [
  ['bg-[#52dda0]', 'bg-[#52dda0]', 'bg-[rgba(247,234,203,0.15)]'],
  ['bg-accent', 'bg-accent', 'bg-accent'],
  ['bg-[#a3d9b8]', 'bg-[#a3d9b8]', 'bg-[#a3d9b8]'],
]

// ─── Path card for the listing ────────────────────────────────────────────────
function PathListCard({
  path,
  slug,
  index,
}: {
  path: (typeof PATHS)[0]
  slug: string
  index: number
}) {
  const teaser = PATH_TEASER[slug] ?? []

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.1 }}
      className={`relative rounded-[22px] overflow-hidden border transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_20px_56px_rgba(27,35,29,0.12)] ${
        path.featured
          ? 'border-primary shadow-[0_8px_32px_rgba(0,140,76,0.12)]'
          : 'border-[rgba(27,35,29,0.1)]'
      }`}
    >
      {/* Featured accent line */}
      {path.featured && (
        <div className='absolute top-0 left-0 right-0 h-0.5 z-10 bg-gradient-to-r from-primary to-green-mint' />
      )}

      {/* Dark hero area */}
      <div
        className='relative overflow-hidden px-8 py-8 pb-7'
        style={{ background: 'hsl(var(--green-secondary))' }}
      >
        {/* Dot pattern overlay */}
        <div className='absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle,rgba(247,234,203,0.15)_1px,transparent_1px)] bg-[length:18px_18px]' />

        {/* Ambient glow */}
        <div
          className='absolute -top-24 -right-16 w-52 h-52 rounded-full blur-[60px] pointer-events-none'
          style={{
            background: path.featured
              ? 'rgba(0,140,76,0.22)'
              : 'rgba(82,221,160,0.07)',
          }}
        />

        {/* Top row: level dots + tag */}
        <div className='flex items-center justify-between mb-5 relative z-[1]'>
          <div className='flex items-center gap-1.5'>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`rounded-full transition-all ${
                  i < path.level ? 'w-2 h-2' : 'w-1.5 h-1.5 opacity-20'
                } ${i < path.level ? LEVEL_DOTS[path.level - 1][i] : 'bg-cream'}`}
              />
            ))}
            <span
              className='text-[10px] font-bold tracking-[0.08em] uppercase ml-1.5'
              style={{ color: 'rgba(247,234,203,0.45)' }}
            >
              Level {path.level}
            </span>
          </div>
          <span
            className='text-[9px] font-extrabold tracking-[0.1em] uppercase py-[3px] px-[9px] rounded'
            style={{ background: path.tagColor, color: path.tagText }}
          >
            {path.tag}
          </span>
        </div>

        {/* Icon */}
        <div
          className='w-12 h-12 rounded-[13px] flex items-center justify-center mb-4 relative z-[1]'
          style={{
            background: 'rgba(247,234,203,0.08)',
            border: '1px solid rgba(247,234,203,0.12)',
          }}
        >
          {PathSVGs[path.svgKey]}
        </div>

        {/* Title + desc */}
        <h2
          className='font-display text-[1.4rem] leading-tight tracking-tight mb-2 relative z-[1]'
          style={{ color: 'hsl(var(--cream))' }}
        >
          {path.title}
        </h2>
        <p
          className='text-[13px] leading-[1.65] relative z-[1] line-clamp-2'
          style={{ color: 'rgba(247,234,203,0.6)' }}
        >
          {path.desc}
        </p>

        {/* Stats */}
        <div
          className='flex gap-5 mt-5 pt-4 border-t relative z-[1]'
          style={{ borderColor: 'rgba(247,234,203,0.08)' }}
        >
          {[
            { icon: Clock, value: path.duration, label: 'Duration' },
            {
              icon: BookOpen,
              value: `${path.lessons} lessons`,
              label: 'Lessons',
            },
            { icon: Zap, value: path.xp, label: 'XP' },
          ].map((s) => (
            <div key={s.label}>
              <div
                className='flex items-center gap-1 text-sm font-bold leading-none'
                style={{ color: 'hsl(var(--cream))' }}
              >
                <s.icon
                  size={11}
                  strokeWidth={1.5}
                  style={{ color: 'hsl(var(--green-mint))' }}
                />
                {s.value}
              </div>
              <div
                className='text-[10px] uppercase tracking-[0.06em] mt-[3px]'
                style={{ color: 'rgba(247,234,203,0.35)' }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* White bottom area */}
      <div className='bg-white px-8 py-6'>
        {/* What you'll learn teaser */}
        <div className='text-[10px] font-bold tracking-[0.1em] uppercase text-[rgba(27,35,29,0.35)] mb-3'>
          What you&apos;ll learn
        </div>
        <ul className='flex flex-col gap-2 mb-6'>
          {teaser.map((item) => (
            <li key={item} className='flex items-start gap-2'>
              <CheckCircle2
                size={13}
                strokeWidth={2}
                className='shrink-0 mt-0.5 text-green-primary'
              />
              <span className='font-ui text-[0.75rem] text-[rgba(27,35,29,0.72)] leading-snug'>
                {item}
              </span>
            </li>
          ))}
        </ul>

        {/* Progress (if any) */}
        {path.progress > 0 && (
          <div className='mb-5'>
            <div className='flex justify-between text-[11px] mb-1.5'>
              <span className='text-[rgba(27,35,29,0.45)]'>Progress</span>
              <span className='font-bold text-primary'>{path.progress}%</span>
            </div>
            <div className='bg-[rgba(27,35,29,0.07)] rounded-full h-1.5 overflow-hidden'>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${path.progress}%` }}
                transition={{
                  delay: 0.4 + index * 0.1,
                  duration: 0.5,
                  ease: 'easeOut',
                }}
                className='h-full rounded-full bg-primary'
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/en/paths/${slug}`}
          className={`w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all group-hover:gap-3 ${
            path.featured
              ? 'bg-primary text-cream hover:opacity-90'
              : 'border-[1.5px] border-[rgba(27,35,29,0.18)] text-charcoal hover:border-primary hover:text-primary'
          }`}
        >
          {path.progress > 0 ? 'Continue Path' : 'Begin Path'}
          <ArrowRight size={14} strokeWidth={2} className='shrink-0' />
        </Link>
      </div>
    </motion.article>
  )
}

// ─── Compare table ────────────────────────────────────────────────────────────
function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className='border-b' style={{ borderColor: 'hsl(var(--border-warm))' }}>
      <td className='py-3 pr-4 font-ui text-xs text-text-tertiary whitespace-nowrap'>
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={i}
          className='py-3 text-center font-ui text-xs font-semibold text-charcoal'
        >
          {v}
        </td>
      ))}
    </tr>
  )
}

// ─── Main Paths Page ──────────────────────────────────────────────────────────

const Paths = () => {
  return (
    <StandardLayout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className='px-[5%] py-16 pattern-diagonal relative overflow-hidden'
        style={{ background: 'hsl(var(--green-secondary))' }}
      >
        <div
          className='absolute -top-24 right-0 w-[560px] h-[560px] rounded-full blur-[100px] pointer-events-none'
          style={{ background: 'rgba(82,221,160,0.06)' }}
        />
        <div className='max-w-[1200px] mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p
              className='font-ui text-[0.6875rem] font-bold tracking-widest uppercase mb-3'
              style={{ color: 'hsla(40,82%,88%,0.3)' }}
            >
              Learning Paths
            </p>
            <h1
              className='font-display text-4xl md:text-5xl font-black mb-4 tracking-[-0.02em]'
              style={{ color: 'hsl(var(--cream))' }}
            >
              Your roadmap to{' '}
              <span style={{ color: 'hsl(var(--green-mint))' }}>
                Solana mastery
              </span>
            </h1>
            <p
              className='font-ui text-lg max-w-xl leading-relaxed'
              style={{ color: 'hsla(40,82%,88%,0.6)' }}
            >
              Three structured paths — from blockchain basics to advanced DeFi —
              each ending with an on-chain credential NFT.
            </p>

            {/* Quick stats */}
            <div className='flex flex-wrap gap-4 mt-8'>
              {[
                { icon: Sparkles, label: '3 curated paths' },
                { icon: BookOpen, label: '67 total lessons' },
                { icon: Award, label: 'On-chain NFT credentials' },
                { icon: Zap, label: 'Up to 2,750 XP' },
              ].map((s) => (
                <div
                  key={s.label}
                  className='flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold'
                  style={{
                    borderColor: 'rgba(247,234,203,0.1)',
                    background: 'rgba(247,234,203,0.05)',
                    color: 'rgba(247,234,203,0.75)',
                  }}
                >
                  <s.icon
                    size={14}
                    strokeWidth={1.5}
                    style={{ color: 'hsl(var(--green-mint))' }}
                  />
                  {s.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Paths Grid ───────────────────────────────────────────────────── */}
      <section
        className='px-[5%] py-16'
        style={{ background: 'hsl(var(--cream-dark))' }}
      >
        <div className='max-w-[1200px] mx-auto'>
          <div className='flex items-center justify-between mb-10'>
            <h2 className='font-display text-2xl font-black text-charcoal'>
              All Learning Paths
            </h2>
            <span className='font-ui text-sm text-text-tertiary'>
              {PATHS.length} paths available
            </span>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {PATHS.map((path, i) => (
              <PathListCard
                key={path.title}
                path={path}
                slug={PATH_SLUGS[i]}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ─────────────────────────────────────────────── */}
      <section className='px-[5%] py-16 bg-background'>
        <div className='max-w-[1200px] mx-auto'>
          <div className='mb-10'>
            <h2 className='font-display text-2xl font-black text-charcoal mb-2'>
              Path Comparison
            </h2>
            <p className='font-ui text-sm text-text-tertiary'>
              Not sure which path to choose? Compare them side by side.
            </p>
          </div>

          <div
            className='rounded-2xl border overflow-hidden'
            style={{ borderColor: 'hsl(var(--border-warm))' }}
          >
            {/* Table header */}
            <div
              className='grid border-b'
              style={{
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                borderColor: 'hsl(var(--border-warm))',
                background: 'hsl(var(--card-warm))',
              }}
            >
              <div className='py-4 px-6 font-ui text-[0.65rem] font-bold uppercase tracking-wider text-text-tertiary' />
              {PATHS.map((p) => (
                <div
                  key={p.title}
                  className='py-4 px-4 border-l'
                  style={{ borderColor: 'hsl(var(--border-warm))' }}
                >
                  <div className='font-display text-sm font-black text-charcoal'>
                    {p.title}
                  </div>
                  <span
                    className='font-ui text-[0.6rem] font-bold px-2 py-0.5 rounded-full mt-1 inline-block'
                    style={{ background: p.tagColor, color: p.tagText }}
                  >
                    {p.tag}
                  </span>
                </div>
              ))}
            </div>

            {/* Table body */}
            <div className='px-6 bg-white'>
              <table className='w-full'>
                <tbody>
                  <CompareRow
                    label='Duration'
                    values={PATHS.map((p) => p.duration)}
                  />
                  <CompareRow
                    label='Lessons'
                    values={PATHS.map((p) => `${p.lessons} lessons`)}
                  />
                  <CompareRow
                    label='XP Reward'
                    values={PATHS.map((p) => p.xp)}
                  />
                  <CompareRow
                    label='Credential'
                    values={PATHS.map(() => 'NFT on Solana')}
                  />
                  <CompareRow
                    label='Prerequisite'
                    values={['None', 'Foundations', 'On-chain Programs']}
                  />
                </tbody>
              </table>
            </div>

            {/* Table footer CTA */}
            <div
              className='grid border-t p-4 gap-2'
              style={{
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                borderColor: 'hsl(var(--border-warm))',
                background: 'hsl(var(--card-warm))',
              }}
            >
              <div className='flex items-center'>
                <span className='font-ui text-[0.65rem] text-text-tertiary'>
                  Choose your path →
                </span>
              </div>
              {PATHS.map((p, i) => (
                <div
                  key={p.title}
                  className='border-l px-4'
                  style={{ borderColor: 'hsl(var(--border-warm))' }}
                >
                  <Link
                    href={`/en/paths/${PATH_SLUGS[i]}`}
                    className={`w-full py-2 rounded-xl font-ui text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      p.featured
                        ? 'bg-primary text-cream hover:opacity-90'
                        : 'border border-[rgba(27,35,29,0.15)] text-charcoal hover:border-primary hover:text-primary'
                    }`}
                  >
                    {p.progress > 0 ? 'Continue' : 'Begin'}
                    <ArrowRight size={12} strokeWidth={2} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ / Why Paths ──────────────────────────────────────────────── */}
      <section
        className='px-[5%] py-16'
        style={{ background: 'hsl(var(--cream-dark))' }}
      >
        <div className='max-w-[1200px] mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8 items-center'>
            <div>
              <p
                className='font-ui text-[0.6875rem] font-bold tracking-widest uppercase mb-3'
                style={{ color: 'hsl(var(--green-primary))' }}
              >
                Why structured paths?
              </p>
              <h2 className='font-display text-3xl font-black text-charcoal mb-4 leading-tight'>
                No more rabbit holes.{' '}
                <span className='text-green-primary'>Just progress.</span>
              </h2>
              <p className='font-ui text-base text-text-secondary leading-relaxed mb-6'>
                Unstructured learning wastes weeks. Our paths give you exactly
                what to learn, in what order, with hands-on code challenges that
                mirror real-world Solana development.
              </p>
              <Link
                href='/en/courses'
                className='inline-flex items-center gap-2 font-ui text-sm font-bold text-charcoal border border-[rgba(27,35,29,0.2)] px-5 py-2.5 rounded-xl hover:border-primary hover:text-primary transition-colors'
              >
                Browse all courses
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              {[
                {
                  icon: Award,
                  title: 'On-chain credentials',
                  desc: 'NFT certificates that live permanently on Solana.',
                },
                {
                  icon: Zap,
                  title: 'Earn XP as you learn',
                  desc: 'Gamified progress tracked on your public profile.',
                },
                {
                  icon: BookOpen,
                  title: 'Curated curriculum',
                  desc: 'Built by core Solana contributors and auditors.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Hands-on challenges',
                  desc: 'Weekly coding challenges tied to real ecosystem problems.',
                },
              ].map((card) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='p-5 rounded-2xl border'
                  style={{
                    background: 'hsl(var(--card-warm))',
                    borderColor: 'hsl(var(--border-warm))',
                  }}
                >
                  <card.icon
                    size={20}
                    className='text-green-primary mb-3'
                    strokeWidth={1.5}
                  />
                  <h3 className='font-display text-sm font-bold text-charcoal mb-1'>
                    {card.title}
                  </h3>
                  <p className='font-ui text-[0.7rem] text-text-secondary leading-relaxed'>
                    {card.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </StandardLayout>
  )
}

export default Paths
