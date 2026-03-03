'use client'

import {
  ANALYTICS_KPIS,
  FUNNEL_DATA,
  LEADERBOARD_WEEK,
  LOCALE_DISTRIBUTION,
  TOP_COURSES_ANALYTICS,
  WEEKLY_ACTIVE_USERS,
} from '@/libs/constants/admin.constants'
import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp } from 'lucide-react'

// ─── Donut Chart (SVG) ────────────────────────────────────────────────────────

function DonutChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const COLORS = [
    'hsl(var(--green-primary))',
    'hsl(var(--amber))',
    'hsl(var(--green-mint))',
  ]
  const r = 45
  const cx = 60
  const cy = 60
  const circumference = 2 * Math.PI * r
  let offset = 0

  return (
    <div className='flex items-center gap-6'>
      <svg width={120} height={120} viewBox='0 0 120 120'>
        {data.map((d, i) => {
          const pct = d.value / total
          const stroke = circumference * pct
          const gap = circumference - stroke
          const thisDash = `${stroke} ${gap}`
          const thisDashOffset = -offset * circumference
          offset += pct
          return (
            <circle
              key={d.label}
              cx={cx}
              cy={cy}
              r={r}
              fill='none'
              stroke={COLORS[i % COLORS.length]}
              strokeWidth='18'
              strokeDasharray={thisDash}
              strokeDashoffset={-offset * circumference + stroke}
              transform='rotate(-90 60 60)'
            />
          )
        })}
        <circle cx={cx} cy={cy} r='28' fill='hsl(var(--cream))' />
        <text
          x={cx}
          y={cy + 4}
          textAnchor='middle'
          className='font-display'
          fontSize='10'
          fontWeight='800'
          fill='hsl(var(--charcoal))'
        >
          {total}%
        </text>
      </svg>
      <div className='flex flex-col gap-2'>
        {data.map((d, i) => (
          <div key={d.label} className='flex items-center gap-2'>
            <div
              className='w-2.5 h-2.5 rounded-sm shrink-0'
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className='font-ui text-xs text-text-secondary'>
              {d.label}
            </span>
            <span className='font-display text-sm font-black text-charcoal ml-1'>
              {d.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Funnel ────────────────────────────────────────────────────────────────────

function Funnel({
  data,
}: {
  data: { label: string; value: number; pct: number }[]
}) {
  return (
    <div className='flex flex-col gap-2.5'>
      {data.map((step, i) => (
        <div key={step.label}>
          <div className='flex items-center justify-between mb-1'>
            <div className='flex items-center gap-2'>
              <span
                className='w-5 h-5 rounded-md flex items-center justify-center font-ui text-[0.6rem] font-bold text-cream shrink-0'
                style={{ background: 'hsl(var(--green-primary))' }}
              >
                {i + 1}
              </span>
              <span className='font-ui text-xs text-charcoal'>
                {step.label}
              </span>
            </div>
            <div className='text-right'>
              <span className='font-display text-sm font-black text-charcoal'>
                {step.value.toLocaleString()}
              </span>
              <span className='font-ui text-[0.6rem] text-text-tertiary ml-1.5'>
                ({step.pct}%)
              </span>
            </div>
          </div>
          <div className='h-3 rounded-full bg-cream-dark overflow-hidden'>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${step.pct}%` }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className='h-full rounded-full'
              style={{
                background:
                  i === 0
                    ? 'hsl(var(--green-primary))'
                    : i === 1
                      ? 'hsl(var(--green-mint))'
                      : i === 2
                        ? 'hsl(var(--amber))'
                        : 'hsl(var(--amber-dark))',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Analytics Page ───────────────────────────────────────────────────────────

export function AdminAnalytics() {
  return (
    <div className='p-6 lg:p-8 max-w-[1400px] mx-auto'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='font-display text-2xl font-black text-charcoal'>
          Analytics
        </h1>
        <p className='font-ui text-sm text-text-tertiary mt-1'>
          Platform performance and learner behaviour — March 2024
        </p>
      </div>

      {/* KPI Grid */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        {ANALYTICS_KPIS.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className='p-5 rounded-2xl border'
            style={{
              background: 'hsl(var(--card-warm))',
              borderColor: 'hsl(var(--border-warm))',
            }}
          >
            <div className='flex items-center justify-between mb-3'>
              {kpi.positive ? (
                <TrendingUp size={16} className='text-green-primary' />
              ) : (
                <TrendingDown size={16} className='text-red-500' />
              )}
              <span
                className={`font-ui text-[0.65rem] font-bold ${kpi.positive ? 'text-green-primary' : 'text-red-500'}`}
              >
                {kpi.change}
              </span>
            </div>
            <div className='font-display text-2xl font-black text-charcoal'>
              {kpi.value}
            </div>
            <div className='font-ui text-[0.65rem] text-text-tertiary mt-1'>
              {kpi.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Row 2: Funnel + Locale Donut */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8'>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className='p-6 rounded-2xl border'
          style={{
            background: 'hsl(var(--card-warm))',
            borderColor: 'hsl(var(--border-warm))',
          }}
        >
          <h2 className='font-display text-base font-bold text-charcoal mb-5'>
            User Conversion Funnel
          </h2>
          <Funnel data={FUNNEL_DATA} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='p-6 rounded-2xl border'
          style={{
            background: 'hsl(var(--card-warm))',
            borderColor: 'hsl(var(--border-warm))',
          }}
        >
          <h2 className='font-display text-base font-bold text-charcoal mb-5'>
            Content Language Distribution
          </h2>
          <DonutChart data={LOCALE_DISTRIBUTION} />
          <p className='font-ui text-[0.65rem] text-text-tertiary mt-4'>
            % of lesson views consumed by language locale
          </p>
        </motion.div>
      </div>

      {/* Row 3: Top Courses + Leaderboard */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
        {/* Top Courses */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className='rounded-2xl border overflow-hidden'
          style={{ borderColor: 'hsl(var(--border-warm))' }}
        >
          <div
            className='px-5 py-4 border-b'
            style={{
              background: 'hsl(var(--card-warm))',
              borderColor: 'hsl(var(--border-warm))',
            }}
          >
            <h2 className='font-display text-base font-bold text-charcoal'>
              Top Courses by Completion
            </h2>
          </div>
          <div
            className='divide-y'
            style={{ borderColor: 'hsl(var(--border-warm))' }}
          >
            {TOP_COURSES_ANALYTICS.map((c, i) => (
              <div
                key={c.title}
                className='flex items-center gap-4 px-5 py-3.5 hover:bg-card-warm transition-colors'
              >
                <span className='font-display text-base font-black text-text-tertiary w-5 shrink-0'>
                  {i + 1}
                </span>
                <div className='flex-1 min-w-0'>
                  <div className='font-ui text-sm font-semibold text-charcoal truncate'>
                    {c.title}
                  </div>
                  <div className='h-1.5 bg-cream-dark rounded-full mt-1.5 overflow-hidden'>
                    <div
                      className='h-full rounded-full'
                      style={{
                        width: `${c.completionRate}%`,
                        background: 'hsl(var(--green-primary))',
                      }}
                    />
                  </div>
                </div>
                <div className='text-right shrink-0'>
                  <div className='font-display text-sm font-black text-green-primary'>
                    {c.completionRate}%
                  </div>
                  <div className='font-ui text-[0.6rem] text-text-tertiary'>
                    {c.enrollments.toLocaleString()} students
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weekly Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='rounded-2xl border overflow-hidden'
          style={{ borderColor: 'hsl(var(--border-warm))' }}
        >
          <div
            className='px-5 py-4 border-b'
            style={{
              background: 'hsl(var(--card-warm))',
              borderColor: 'hsl(var(--border-warm))',
            }}
          >
            <h2 className='font-display text-base font-bold text-charcoal'>
              Top XP Earners This Week
            </h2>
          </div>
          <div
            className='divide-y'
            style={{ borderColor: 'hsl(var(--border-warm))' }}
          >
            {LEADERBOARD_WEEK.map((u) => (
              <div
                key={u.rank}
                className='flex items-center gap-4 px-5 py-3.5 hover:bg-card-warm transition-colors'
              >
                <span
                  className={`font-display text-base font-black w-6 shrink-0 ${u.rank === 1 ? 'text-amber-dark' : u.rank === 2 ? 'text-charcoal-mid' : 'text-text-tertiary'}`}
                >
                  {u.rank === 1
                    ? '🥇'
                    : u.rank === 2
                      ? '🥈'
                      : u.rank === 3
                        ? '🥉'
                        : u.rank}
                </span>
                <span className='text-xl shrink-0'>{u.avatar}</span>
                <div className='flex-1 min-w-0'>
                  <div className='font-ui text-sm font-semibold text-charcoal'>
                    {u.name}
                  </div>
                  <div className='font-ui text-[0.6rem] text-text-tertiary'>
                    @{u.username}
                  </div>
                </div>
                <div className='font-display text-sm font-black text-amber-dark shrink-0'>
                  +{u.xp} XP
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* WAU Trend */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className='mt-5 p-6 rounded-2xl border'
        style={{
          background: 'hsl(var(--card-warm))',
          borderColor: 'hsl(var(--border-warm))',
        }}
      >
        <div className='flex items-center justify-between mb-4'>
          <h2 className='font-display text-base font-bold text-charcoal'>
            Weekly Active Users — Current Week
          </h2>
          <span className='font-ui text-[0.65rem] px-2 py-0.5 rounded-lg bg-green-primary/10 text-green-primary font-bold'>
            +12.4%
          </span>
        </div>
        <div className='flex items-end gap-3 h-28'>
          {WEEKLY_ACTIVE_USERS.map((d, i) => {
            const max = Math.max(...WEEKLY_ACTIVE_USERS.map((x) => x.value))
            return (
              <div
                key={d.label}
                className='flex flex-col items-center gap-1.5 flex-1'
              >
                <span className='font-ui text-[0.6rem] text-text-tertiary'>
                  {d.value}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.value / max) * 90}px` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
                  className='w-full rounded-t-lg'
                  style={{ background: 'hsl(var(--green-primary))' }}
                />
                <span className='font-ui text-[0.6rem] text-text-tertiary'>
                  {d.label}
                </span>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
