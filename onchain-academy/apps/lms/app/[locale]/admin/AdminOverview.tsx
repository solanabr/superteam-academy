'use client'

import {
  ADMIN_COURSES,
  OVERVIEW_KPIS,
  RECENT_SIGNUPS,
  WEEKLY_ACTIVE_USERS,
  XP_PER_MONTH,
  type AdminUser,
} from '@/libs/constants/admin.constants'
import { truncateAddress } from '@/libs/string'
import { motion } from 'framer-motion'
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock,
  Users,
  Zap,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Activity,
  BookOpen,
  Zap,
  CheckCircle2,
  Clock,
}

// ─── Mini Bar Chart ──────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className='flex items-end gap-1.5 h-24'>
      {data.map((d, i) => (
        <div key={i} className='flex flex-col items-center gap-1 flex-1'>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / max) * 80}px` }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
            className='w-full rounded-t-md'
            style={{
              background: 'hsl(var(--green-primary))',
              minHeight: '4px',
            }}
          />
          <span className='font-ui text-[0.55rem] text-text-tertiary'>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Mini Line Chart (SVG) ───────────────────────────────────────────────────

function MiniLineChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value))
  const w = 260
  const h = 80
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - (d.value / max) * h,
  }))
  const pathD = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className='w-full h-20'
      preserveAspectRatio='none'
    >
      <defs>
        <linearGradient id='lineGrad' x1='0' y1='0' x2='0' y2='1'>
          <stop
            offset='0%'
            stopColor='hsl(var(--green-primary))'
            stopOpacity='0.25'
          />
          <stop
            offset='100%'
            stopColor='hsl(var(--green-primary))'
            stopOpacity='0'
          />
        </linearGradient>
      </defs>
      <path d={areaD} fill='url(#lineGrad)' />
      <path
        d={pathD}
        fill='none'
        stroke='hsl(var(--green-primary))'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r='3'
          fill='hsl(var(--green-primary))'
        />
      ))}
    </svg>
  )
}

// ─── Auth Provider badge ──────────────────────────────────────────────────────

function AuthBadge({ provider }: { provider: AdminUser['authProvider'] }) {
  const map = { wallet: '👻 Wallet', google: '🔵 Google', github: '⬛ GitHub' }
  return (
    <span className='font-ui text-[0.65rem] px-2 py-0.5 rounded bg-charcoal/8 text-text-secondary'>
      {map[provider]}
    </span>
  )
}

// ─── Overview Page ────────────────────────────────────────────────────────────

export function AdminOverview() {
  return (
    <div className='p-6 lg:p-8 max-w-[1400px] mx-auto'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='font-display text-2xl font-black text-charcoal'>
          Overview
        </h1>
        <p className='font-ui text-sm text-text-tertiary mt-1'>
          Platform health at a glance — last 7 days
        </p>
      </div>

      {/* KPI Grid */}
      <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8'>
        {OVERVIEW_KPIS.map((kpi, i) => {
          const Icon = ICON_MAP[kpi.icon] || Activity
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className='p-4 rounded-2xl border'
              style={{
                background: 'hsl(var(--card-warm))',
                borderColor: 'hsl(var(--border-warm))',
              }}
            >
              <div className='flex items-center justify-between mb-3'>
                <Icon
                  size={16}
                  strokeWidth={1.5}
                  className='text-text-tertiary'
                />
                <span
                  className={`font-ui text-[0.6rem] font-bold ${
                    kpi.positive ? 'text-green-primary' : 'text-red-500'
                  }`}
                >
                  {kpi.change}
                </span>
              </div>
              <div className='font-display text-xl font-black text-charcoal'>
                {kpi.value}
              </div>
              <div className='font-ui text-[0.65rem] text-text-tertiary mt-0.5'>
                {kpi.label}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8'>
        {/* Weekly Active Users */}
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
          <div className='flex items-center justify-between mb-4'>
            <h2 className='font-display text-base font-bold text-charcoal'>
              Weekly Active Users
            </h2>
            <span className='font-ui text-[0.65rem] font-bold px-2 py-0.5 rounded-lg bg-green-primary/10 text-green-primary'>
              +12.4%
            </span>
          </div>
          <MiniLineChart data={WEEKLY_ACTIVE_USERS} />
          <div className='flex justify-between mt-2'>
            {WEEKLY_ACTIVE_USERS.map((d) => (
              <span
                key={d.label}
                className='font-ui text-[0.55rem] text-text-tertiary'
              >
                {d.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* XP Distributed */}
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
          <div className='flex items-center justify-between mb-4'>
            <h2 className='font-display text-base font-bold text-charcoal'>
              XP Distributed / Month
            </h2>
            <span className='font-ui text-[0.65rem] font-bold px-2 py-0.5 rounded-lg bg-amber/10 text-amber-dark'>
              +18.7%
            </span>
          </div>
          <MiniBarChart
            data={XP_PER_MONTH.map((d) => ({
              ...d,
              label: d.label,
              value: d.value / 1000,
            }))}
          />
          <p className='font-ui text-[0.6rem] text-text-tertiary mt-2 text-right'>
            values in K XP
          </p>
        </motion.div>
      </div>

      {/* Bottom tables */}
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
            className='px-5 py-4 border-b flex items-center justify-between'
            style={{
              background: 'hsl(var(--card-warm))',
              borderColor: 'hsl(var(--border-warm))',
            }}
          >
            <h2 className='font-display text-base font-bold text-charcoal'>
              Top Courses
            </h2>
            <span className='font-ui text-[0.65rem] text-text-tertiary'>
              by enrollment
            </span>
          </div>
          <div
            className='divide-y'
            style={{ borderColor: 'hsl(var(--border-warm))' }}
          >
            {ADMIN_COURSES.filter((c) => c.status === 'published')
              .slice(0, 4)
              .map((course) => (
                <div
                  key={course.id}
                  className='flex items-center justify-between px-5 py-3 hover:bg-card-warm-hover transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    <span className='text-xl'>{course.thumbnail}</span>
                    <div>
                      <div className='font-ui text-sm font-semibold text-charcoal'>
                        {course.title.en}
                      </div>
                      <div className='font-ui text-[0.65rem] text-text-tertiary'>
                        {course.track} · {course.difficulty}
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='font-display text-sm font-black text-green-primary'>
                      {course.completionRate}%
                    </div>
                    <div className='font-ui text-[0.6rem] text-text-tertiary'>
                      {course.enrollments.toLocaleString()} enrolled
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Recent Sign-Ups */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='rounded-2xl border overflow-hidden'
          style={{ borderColor: 'hsl(var(--border-warm))' }}
        >
          <div
            className='px-5 py-4 border-b flex items-center justify-between'
            style={{
              background: 'hsl(var(--card-warm))',
              borderColor: 'hsl(var(--border-warm))',
            }}
          >
            <h2 className='font-display text-base font-bold text-charcoal'>
              Recent Sign-Ups
            </h2>
            <span className='font-ui text-[0.65rem] text-text-tertiary'>
              last 7 days
            </span>
          </div>
          <div
            className='divide-y'
            style={{ borderColor: 'hsl(var(--border-warm))' }}
          >
            {RECENT_SIGNUPS.map((user) => (
              <div
                key={user.id}
                className='flex items-center justify-between px-5 py-3 hover:bg-card-warm-hover transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 rounded-lg flex items-center justify-center text-base bg-green-primary/10'>
                    {user.avatar}
                  </div>
                  <div>
                    <div className='font-ui text-sm font-semibold text-charcoal'>
                      {user.name}
                    </div>
                    <div className='font-mono text-[0.6rem] text-text-tertiary'>
                      {truncateAddress(user.walletAddress, 4, 4)}
                    </div>
                  </div>
                </div>
                <div className='flex flex-col items-end gap-1'>
                  <AuthBadge provider={user.authProvider} />
                  <span className='font-ui text-[0.6rem] text-text-tertiary'>
                    {user.joinedAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
