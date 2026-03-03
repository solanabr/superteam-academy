'use client'

import { StandardLayout } from '@/components/layout/StandardLayout'
import {
  completedCourses,
  difficultyStyle,
  onChainCredentials,
  profileBadges,
  profileUser,
  rarityColors,
  skillRadarData,
} from '@/libs/constants/profile.constants'
import { motion } from 'framer-motion'
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Github,
  Globe,
  Shield,
  Star,
  Trophy,
  Twitter,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

// ─── Radar Chart (pure SVG) ────────────────────────────────────

function SkillRadarChart({
  data,
  size = 280,
}: {
  data: typeof skillRadarData
  size?: number
}) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.38
  const sides = data.length
  const angleStep = (Math.PI * 2) / sides
  const offset = -Math.PI / 2 // start from top

  const pointAt = (i: number, r: number) => ({
    x: cx + r * Math.cos(offset + i * angleStep),
    y: cy + r * Math.sin(offset + i * angleStep),
  })

  const gridLevels = [0.25, 0.5, 0.75, 1]

  // data polygon
  const dataPoints = data.map((d, i) => pointAt(i, (d.value / 100) * maxR))
  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') +
    'Z'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className='mx-auto'
    >
      {/* Grid polygons */}
      {gridLevels.map((level) => {
        const pts = Array.from({ length: sides }, (_, i) =>
          pointAt(i, maxR * level),
        )
        const path =
          pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') +
          'Z'
        return (
          <path
            key={level}
            d={path}
            fill='none'
            stroke='hsl(var(--border-warm))'
            strokeWidth={1}
            opacity={0.6}
          />
        )
      })}

      {/* Axis lines */}
      {data.map((_, i) => {
        const p = pointAt(i, maxR)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke='hsl(var(--border-warm))'
            strokeWidth={0.8}
            opacity={0.5}
          />
        )
      })}

      {/* Data polygon */}
      <motion.path
        d={dataPath}
        fill='hsl(var(--green-primary) / 0.15)'
        stroke='hsl(var(--green-primary))'
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3.5}
          fill='hsl(var(--green-primary))'
          stroke='hsl(var(--card-warm))'
          strokeWidth={2}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.08 }}
        />
      ))}

      {/* Labels */}
      {data.map((d, i) => {
        const lp = pointAt(i, maxR + 22)
        const anchor =
          Math.abs(lp.x - cx) < 2 ? 'middle' : lp.x > cx ? 'start' : 'end'
        return (
          <text
            key={d.label}
            x={lp.x}
            y={lp.y}
            textAnchor={anchor}
            dominantBaseline='central'
            className='font-ui'
            style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              fill: 'hsl(var(--charcoal) / 0.65)',
            }}
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Evolution Stage Visual ────────────────────────────────────

function EvolutionBar({ stage }: { stage: number }) {
  const stages = [
    { label: 'Egg', emoji: '🥚' },
    { label: 'Hatchling', emoji: '🐲' },
    { label: 'Dragon', emoji: '🐉' },
  ]
  return (
    <div className='flex items-center gap-1.5'>
      {stages.map((s, i) => (
        <div key={s.label} className='flex items-center gap-1'>
          <div
            className='flex items-center justify-center rounded-full transition-all'
            style={{
              width: 28,
              height: 28,
              fontSize: '0.85rem',
              background:
                i + 1 <= stage
                  ? 'hsl(var(--green-primary) / 0.12)'
                  : 'rgba(139,109,56,0.06)',
              border: `1.5px solid ${
                i + 1 <= stage
                  ? 'hsl(var(--green-primary) / 0.35)'
                  : 'hsl(var(--border-warm))'
              }`,
              opacity: i + 1 <= stage ? 1 : 0.4,
              filter: i + 1 <= stage ? 'none' : 'grayscale(1)',
            }}
          >
            {s.emoji}
          </div>
          {i < stages.length - 1 && (
            <div
              className='h-[2px] w-3 rounded-full'
              style={{
                background:
                  i + 1 < stage
                    ? 'hsl(var(--green-primary))'
                    : 'hsl(var(--border-warm))',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Profile Page ──────────────────────────────────────────────

interface ProfileProps {
  username: string
}

export const Profile = ({ username }: ProfileProps) => {
  const u = profileUser

  return (
    <StandardLayout>
      {/* ─── HERO BANNER ──────────────────────────────────────── */}
      <div className='relative overflow-hidden bg-green-secondary'>
        <div className='absolute inset-0 pattern-diagonal' />
        <div
          className='absolute -top-20 right-10 w-72 h-72 rounded-full pointer-events-none'
          style={{
            background: 'rgba(0,140,76,0.28)',
            filter: 'blur(64px)',
            animation: 'aurora 12s ease-in-out infinite',
          }}
        />
        <div
          className='absolute bottom-[-40px] left-[-20px] w-48 h-48 rounded-full pointer-events-none'
          style={{
            background: 'rgba(82,221,160,0.18)',
            filter: 'blur(48px)',
            animation: 'aurora 16s ease-in-out infinite reverse',
          }}
        />

        <div className='relative z-10 max-w-[1200px] mx-auto px-[5%] py-10 lg:py-14'>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='flex flex-col sm:flex-row gap-6 items-start'
          >
            {/* Avatar */}
            <div
              className='w-20 h-20 lg:w-24 lg:h-24 rounded-full flex-shrink-0 border-[3px] overflow-hidden'
              style={{
                borderColor: 'hsl(var(--green-mint) / 0.5)',
                background: 'hsl(var(--cream))',
              }}
            >
              <img
                src={u.avatar}
                alt={u.name}
                className='w-full h-full object-cover'
              />
            </div>

            {/* Info */}
            <div className='flex-1 min-w-0'>
              <div className='flex flex-wrap items-center gap-2 mb-1.5'>
                <h1 className='font-display text-[1.75rem] lg:text-[2.1rem] font-black tracking-[-0.025em] leading-tight text-cream'>
                  {u.name}
                </h1>
                <span className='font-ui text-[0.7rem] font-semibold px-2.5 py-0.5 rounded-full bg-green-mint/15 text-green-mint border border-green-mint/30'>
                  Level {u.level} · {u.tier}
                </span>
              </div>

              <p className='font-ui text-[0.8rem] text-cream/50 mb-2'>
                @{u.handle} · #{u.rank} globally
              </p>

              <p className='font-ui text-[0.86rem] text-cream/65 max-w-xl mb-3 leading-relaxed'>
                {u.bio}
              </p>

              {/* Social + Join Date */}
              <div className='flex flex-wrap items-center gap-3'>
                <a
                  href={u.socials.github}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-1.5 font-ui text-[0.7rem] text-cream/45 hover:text-cream/80 transition-colors'
                >
                  <Github size={14} strokeWidth={1.5} />
                  GitHub
                </a>
                <a
                  href={u.socials.twitter}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-1.5 font-ui text-[0.7rem] text-cream/45 hover:text-cream/80 transition-colors'
                >
                  <Twitter size={14} strokeWidth={1.5} />
                  Twitter
                </a>
                <a
                  href={u.socials.website}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-center gap-1.5 font-ui text-[0.7rem] text-cream/45 hover:text-cream/80 transition-colors'
                >
                  <Globe size={14} strokeWidth={1.5} />
                  Website
                </a>
                <span className='w-[1px] h-3.5 bg-cream/15' />
                <span className='flex items-center gap-1.5 font-ui text-[0.65rem] text-cream/40'>
                  <Calendar size={12} strokeWidth={1.5} />
                  Joined {u.joinDate}
                </span>
              </div>
            </div>

            {/* XP Bar (right side on desktop) */}
            <div className='sm:min-w-[200px] flex-shrink-0'>
              <div className='flex justify-between mb-1.5'>
                <span className='font-ui text-[0.65rem] uppercase tracking-wider text-cream/45'>
                  Level {u.level}
                </span>
                <span className='font-ui text-[0.65rem] font-bold text-amber'>
                  {u.xp.toLocaleString()} / {u.xpToNext.toLocaleString()} XP
                </span>
              </div>
              <div className='h-[7px] rounded-full overflow-hidden bg-cream/10'>
                <div
                  className='h-full rounded-full transition-all duration-1000 gradient-progress'
                  style={{
                    width: `${Math.round((u.xp / u.xpToNext) * 100)}%`,
                  }}
                />
              </div>
              <div className='flex justify-between mt-1.5'>
                <span className='font-ui text-[0.6rem] text-cream/35'>
                  {Math.round((u.xp / u.xpToNext) * 100)}% to Level{' '}
                  {u.level + 1}
                </span>
                <span className='font-ui text-[0.6rem] text-cream/35'>
                  {(u.xpToNext - u.xp).toLocaleString()} XP left
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────────── */}
      <div className='max-w-[1200px] mx-auto flex flex-col gap-5 py-12'>
        {/* MAIN GRID */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
          {/* ─── LEFT — 2/3 ──────────────────────────────────── */}
          <div className='lg:col-span-2 flex flex-col gap-5'>
            {/* On-Chain Credentials */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className='card-warm rounded-2xl p-6'
            >
              <div className='flex items-center justify-between mb-5'>
                <h2 className='font-display text-[1.1rem] font-bold text-charcoal flex items-center gap-2'>
                  <Shield
                    size={18}
                    strokeWidth={1.5}
                    className='text-green-primary'
                  />
                  On-Chain Credentials
                </h2>
                <span className='font-ui text-[0.6rem] font-bold tracking-wider uppercase text-text-tertiary'>
                  cNFTs
                </span>
              </div>

              <div className='flex flex-col gap-3'>
                {onChainCredentials.map((cred) => (
                  <Link href={`/en/certificates/${cred.id}`} key={cred.id}>
                    <div
                      className='group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md'
                      style={{
                        background: 'hsl(var(--card-warm-hover))',
                        borderColor: cred.verified
                          ? 'hsl(var(--green-primary) / 0.25)'
                          : 'hsl(var(--border-warm))',
                      }}
                    >
                      {/* Icon + evolution */}
                      <div className='flex items-center gap-3 flex-1 min-w-0'>
                        <div
                          className='w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-[1.5rem] group-hover:scale-105 transition-transform'
                          style={{
                            background: 'hsl(var(--green-secondary) / 0.15)',
                            border:
                              '1px solid hsl(var(--green-primary) / 0.15)',
                          }}
                        >
                          {cred.image}
                        </div>
                        <div className='min-w-0'>
                          <div className='flex items-center gap-2 mb-0.5'>
                            <span className='font-display text-[0.88rem] font-bold text-charcoal truncate group-hover:text-green-primary transition-colors'>
                              {cred.track}
                            </span>
                            {cred.verified && (
                              <CheckCircle2
                                size={14}
                                strokeWidth={2}
                                className='text-green-primary flex-shrink-0'
                              />
                            )}
                          </div>
                          <div className='flex items-center gap-2'>
                            <span
                              className='font-ui text-[0.58rem] font-bold tracking-wider uppercase px-2 py-0.5 rounded'
                              style={{
                                background:
                                  difficultyStyle[cred.level]?.bg ||
                                  'rgba(139,109,56,0.08)',
                                color:
                                  difficultyStyle[cred.level]?.text ||
                                  'inherit',
                                border: `1px solid ${difficultyStyle[cred.level]?.border || 'transparent'}`,
                              }}
                            >
                              {cred.level}
                            </span>
                            <span className='font-ui text-[0.6rem] text-text-tertiary'>
                              +{cred.xpEarned} XP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Evolution + Mint */}
                      <div className='flex flex-col items-start sm:items-end gap-2'>
                        <EvolutionBar stage={cred.evolutionStage} />
                        <div className='flex items-center gap-2'>
                          <span className='font-ui text-[0.58rem] text-text-tertiary font-mono'>
                            {cred.mintAddress.slice(0, 4)}...
                            {cred.mintAddress.slice(-4)}
                          </span>
                          <a
                            href={cred.solscanUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            onClick={(e) => e.stopPropagation()}
                            className='flex items-center gap-1 font-ui text-[0.58rem] font-semibold text-green-primary hover:underline'
                          >
                            Solscan
                            <ExternalLink size={10} strokeWidth={2} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Completed Courses */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className='card-warm rounded-2xl p-6'
            >
              <div className='flex items-center justify-between mb-5'>
                <h2 className='font-display text-[1.1rem] font-bold text-charcoal flex items-center gap-2'>
                  <Trophy size={18} strokeWidth={1.5} className='text-amber' />
                  Completed Courses
                </h2>
                <span className='font-ui text-[0.65rem] font-bold text-text-tertiary'>
                  {completedCourses.length} courses
                </span>
              </div>

              <div className='flex flex-col gap-2.5'>
                {completedCourses.map((course) => (
                  <div
                    key={course.id}
                    className='flex flex-col gap-2 p-4 rounded-xl cursor-pointer transition-all duration-200 card-warm-hover border border-border-warm hover:border-green-primary hover:card-warm-active'
                    onMouseEnter={(e) => {
                      e.currentTarget.classList.add('card-warm-active')
                      e.currentTarget.classList.remove('card-warm-hover')
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.classList.remove('card-warm-active')
                      e.currentTarget.classList.add('card-warm-hover')
                    }}
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1 min-w-0'>
                        <span
                          className='font-ui text-[0.58rem] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded inline-block mb-1'
                          style={{
                            background: difficultyStyle[course.difficulty]?.bg,
                            color: difficultyStyle[course.difficulty]?.text,
                            border: `1px solid ${difficultyStyle[course.difficulty]?.border}`,
                          }}
                        >
                          {course.difficulty}
                        </span>
                        <div className='font-display text-[0.88rem] font-bold leading-snug truncate text-charcoal'>
                          {course.title}
                        </div>
                      </div>
                      <div className='flex items-center gap-1 flex-shrink-0'>
                        <CheckCircle2
                          size={16}
                          strokeWidth={2}
                          className='text-green-primary'
                        />
                        <span className='font-display text-[0.85rem] font-black text-green-primary'>
                          100%
                        </span>
                      </div>
                    </div>

                    <div className='h-[4px] rounded-full overflow-hidden bg-charcoal/10'>
                      <div
                        className='h-full rounded-full gradient-progress'
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <span className='font-ui text-[0.65rem] flex items-center gap-1.5 text-text-tertiary'>
                        <BookOpen size={10} strokeWidth={1.5} />
                        {course.lessons} lessons · {course.duration}
                      </span>
                      <div className='flex items-center gap-3'>
                        <span className='font-ui text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full bg-green-primary/9 text-green-primary'>
                          +{course.xpEarned} XP
                        </span>
                        <span className='font-ui text-[0.6rem] text-text-tertiary'>
                          {course.completedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ─── RIGHT — 1/3 ─────────────────────────────────── */}
          <div className='flex flex-col gap-5'>
            {/* Skill Radar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className='card-warm rounded-2xl p-6'
            >
              <h2 className='font-display text-[1.1rem] font-bold text-charcoal mb-1 flex items-center gap-2'>
                <Zap size={18} strokeWidth={1.5} className='text-amber' />
                Skill Radar
              </h2>
              <p className='font-ui text-[0.65rem] text-text-tertiary mb-4'>
                Proficiency across core Solana development areas
              </p>

              <SkillRadarChart data={skillRadarData} />

              {/* Skill breakdown */}
              <div className='grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-border-warm'>
                {skillRadarData.map((s) => (
                  <div
                    key={s.label}
                    className='flex items-center justify-between'
                  >
                    <span className='font-ui text-[0.65rem] font-medium text-text-secondary'>
                      {s.label}
                    </span>
                    <div className='flex items-center gap-2'>
                      <div className='w-12 h-1.5 rounded-full overflow-hidden bg-charcoal/8'>
                        <div
                          className='h-full rounded-full'
                          style={{
                            width: `${s.value}%`,
                            background:
                              s.value >= 75
                                ? 'hsl(var(--green-primary))'
                                : s.value >= 50
                                  ? 'hsl(var(--green-mint))'
                                  : 'hsl(var(--amber))',
                          }}
                        />
                      </div>
                      <span className='font-ui text-[0.58rem] font-bold text-text-tertiary w-6 text-right'>
                        {s.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Achievement Badges */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              className='card-warm rounded-2xl p-6'
            >
              <div className='flex items-center justify-between mb-4'>
                <h2 className='font-display text-[1.1rem] font-bold text-charcoal flex items-center gap-2'>
                  <Award size={18} strokeWidth={1.5} className='text-amber' />
                  Achievements
                </h2>
                <span className='font-ui text-[0.6rem] font-bold text-text-tertiary'>
                  {profileBadges.filter((b) => b.earned).length} of{' '}
                  {profileBadges.length}
                </span>
              </div>

              <div className='grid grid-cols-2 gap-2'>
                {profileBadges.map((b) => {
                  const rarity = rarityColors[b.rarity]
                  return (
                    <div
                      key={b.id}
                      className='flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200'
                      style={
                        b.earned
                          ? {
                              background: rarity?.bg,
                              border: `1px solid ${rarity?.border}`,
                            }
                          : {
                              background: 'rgba(139,109,56,0.05)',
                              border: '1px solid hsl(var(--border-warm))',
                              opacity: 0.38,
                              filter: 'grayscale(1)',
                            }
                      }
                    >
                      <span className='text-[1.3rem] leading-none'>
                        {b.icon}
                      </span>
                      <span className='font-ui text-[0.6rem] font-semibold text-center leading-tight text-text-secondary'>
                        {b.name}
                      </span>
                      {b.earned && (
                        <>
                          <span
                            className='font-ui text-[0.48rem] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider'
                            style={{
                              background: rarity?.bg,
                              color: rarity?.text,
                            }}
                          >
                            {b.rarity}
                          </span>
                          <span className='font-ui text-[0.52rem] font-bold px-1.5 py-0.5 rounded-full bg-amber/18 text-amber-dark'>
                            +{b.xp} XP
                          </span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Progress bar */}
              <div className='flex items-center gap-2 mt-4 pt-3 border-t border-border-warm'>
                <span className='font-ui text-[0.65rem] text-text-tertiary'>
                  {profileBadges.filter((b) => b.earned).length} of{' '}
                  {profileBadges.length}
                </span>
                <div className='flex-1 h-1.5 rounded-full overflow-hidden bg-border-warm'>
                  <div
                    className='h-full rounded-full'
                    style={{
                      width: `${Math.round((profileBadges.filter((b) => b.earned).length / profileBadges.length) * 100)}%`,
                      background:
                        'linear-gradient(90deg, hsl(var(--amber)), hsl(var(--amber-dark)))',
                    }}
                  />
                </div>
                <span className='font-ui text-[0.65rem] font-bold text-amber-dark'>
                  {Math.round(
                    (profileBadges.filter((b) => b.earned).length /
                      profileBadges.length) *
                      100,
                  )}
                  %
                </span>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className='card-warm rounded-2xl p-6'
            >
              <h2 className='font-display text-[1.1rem] font-bold text-charcoal mb-4 flex items-center gap-2'>
                <Star size={18} strokeWidth={1.5} className='text-green-mint' />
                Quick Stats
              </h2>

              <div className='flex flex-col gap-3'>
                {[
                  {
                    label: 'Total XP Earned',
                    value: profileUser.xp.toLocaleString(),
                    icon: <Zap size={14} strokeWidth={1.5} />,
                    color: 'text-amber',
                  },
                  {
                    label: 'Courses Completed',
                    value: completedCourses.length.toString(),
                    icon: <BookOpen size={14} strokeWidth={1.5} />,
                    color: 'text-green-primary',
                  },
                  {
                    label: 'Credentials Earned',
                    value: onChainCredentials
                      .filter((c) => c.verified)
                      .length.toString(),
                    icon: <Shield size={14} strokeWidth={1.5} />,
                    color: 'text-green-mint',
                  },
                  {
                    label: 'Current Streak',
                    value: `${profileUser.streak} days`,
                    icon: (
                      <span className='text-[0.75rem] leading-none'>🔥</span>
                    ),
                    color: 'text-amber-dark',
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className='flex items-center justify-between py-2 border-b border-border-warm last:border-0'
                  >
                    <span className='font-ui text-[0.72rem] text-text-tertiary flex items-center gap-2'>
                      <span className={stat.color}>{stat.icon}</span>
                      {stat.label}
                    </span>
                    <span className='font-display text-[0.88rem] font-bold text-charcoal'>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </StandardLayout>
  )
}
