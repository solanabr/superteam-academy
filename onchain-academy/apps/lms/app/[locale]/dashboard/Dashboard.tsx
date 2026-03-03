'use client'

import { StandardLayout } from '@/components/layout/StandardLayout'
import {
  badges,
  courses,
  diffStyle,
  feed,
  recommended,
  user,
} from '@/libs/constants/dashboard.constants'
import { BookOpen, Flame, Play, Trophy, Zap } from 'lucide-react'
import { H2 } from './H2'
import { KPI } from './KPI'

// ─────────────────────────────────────────────────────────────
//  WARM SURFACE SYSTEM — No more pure white
//
//  Pure white (#ffffff) on cream (#f7eacb) causes harsh
//  contrast that fatigues eyes during long study sessions.
//
//  Instead we use three tinted warm parchment levels:
//    CARD   #fdf6e8  — warm parchment primary surface
//    CARD2  #faf0d8  — deeper warm for inner rows / hover bg
//    CARD3  #f4e8c4  — richest warm for active / selected
//
//  All three sit ABOVE cream in brightness so cards still
//  lift visually, but with zero harsh white-on-yellow contrast.
//  The brown-tinted border (rgba(139,109,56,…)) replaces the
//  cold grey-black border, keeping everything in the warm family.
// ─────────────────────────────────────────────────────────────

// ─── Page ────────────────────────────────────────────────────

export default function Dashboard() {
  const xpPct = Math.round((user.xp / user.xpToNext) * 100)

  // Generate calendar data for current month
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Create calendar grid
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  // Streak data mapping (simplified - in real app would come from backend)
  const streakDates = new Set([
    1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24,
    25, 26, 27, 28,
  ])
  const todayDate = today.getDate()

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const monthName = monthNames[currentMonth]

  return (
    <StandardLayout>
      {/* BANNER */}
      <div className='relative overflow-hidden p-7 lg:p-8 animate-[fade-up_0.4s_ease_forwards] opacity-0 bg-green-secondary'>
        <div className='max-w-[1200px] mx-auto'>
          <div className='absolute inset-0 pattern-dot-grid opacity-40 pointer-events-none' />
          <div
            className='absolute -top-20 right-6 w-64 h-64 rounded-full pointer-events-none'
            style={{
              background: 'rgba(0,140,76,0.28)',
              filter: 'blur(56px)',
              animation: 'aurora 12s ease-in-out infinite',
            }}
          />

          <div className='relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5'>
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <span className='font-ui text-[0.58rem] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full bg-amber/20 text-amber border border-amber/35'>
                  🔥 {user.streak}-Day Streak
                </span>
                <span className='font-ui text-[0.58rem] font-bold tracking-[0.1em] uppercase px-2.5 py-1 rounded-full bg-green-mint/15 text-green-mint border border-green-mint/30'>
                  Level {user.level} · {user.tier}
                </span>
              </div>
              <h1 className='font-display text-[1.75rem] lg:text-[2.1rem] font-black tracking-[-0.025em] leading-tight text-cream'>
                Welcome back, {user.name.split(' ')[0]} 👋
              </h1>
              <p className='font-ui text-[0.86rem] mt-1.5 text-cream/58'>
                #{user.rank} globally · Keep building on Solana
              </p>
            </div>

            <div className='sm:min-w-[220px]'>
              <div className='flex justify-between mb-1.5'>
                <span className='font-ui text-[0.65rem] uppercase tracking-wider text-cream/45'>
                  Level {user.level}
                </span>
                <span className='font-ui text-[0.65rem] font-bold text-amber'>
                  {user.xp.toLocaleString()} / {user.xpToNext.toLocaleString()}{' '}
                  XP
                </span>
              </div>
              <div className='h-[7px] rounded-full overflow-hidden bg-cream/10'>
                <div
                  className='h-full rounded-full transition-all duration-1000 gradient-progress'
                  style={{ width: `${xpPct}%` }}
                />
              </div>
              <div className='flex justify-between mt-1.5'>
                <span className='font-ui text-[0.6rem] text-cream/35'>
                  {xpPct}% to Level {user.level + 1}
                </span>
                <span className='font-ui text-[0.6rem] text-cream/35'>
                  {(user.xpToNext - user.xp).toLocaleString()} XP left
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-[1200px] mx-auto flex flex-col gap-5 py-12'>
        {/* KPI ROW */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <KPI
            icon={<Zap size={18} strokeWidth={1.5} />}
            value={user.xp.toLocaleString()}
            label='Total XP'
            delta='+350 today'
            ibgClass='bg-amber/15'
            icClass='text-amber-dark'
            delay={60}
          />
          <KPI
            icon={<Trophy size={18} strokeWidth={1.5} />}
            value={`#${user.rank}`}
            label='Global Rank'
            delta='↑ 8 spots'
            ibgClass='bg-green-primary/14'
            icClass='text-green-dark'
            delay={110}
          />
          <KPI
            icon={<Flame size={18} strokeWidth={1.5} />}
            value={`${user.streak}d`}
            label='Streak'
            delta='Personal best!'
            ibgClass='bg-amber/15'
            icClass='text-amber-dark'
            delay={160}
          />
          <KPI
            icon={<BookOpen size={18} strokeWidth={1.5} />}
            value='47'
            label='Lessons Done'
            delta='+3 this week'
            ibgClass='bg-green-primary/11'
            icClass='text-green-primary'
            delay={210}
          />
        </div>

        {/* MAIN GRID */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
          {/* LEFT — 2/3 */}
          <div className='lg:col-span-2 flex flex-col gap-5'>
            {/* Active courses */}
            <div className='card-warm rounded-2xl p-6 animate-[fade-up_0.5s_0.08s_ease_forwards] opacity-0'>
              <H2 action='View all'>Active Courses</H2>
              <div className='flex flex-col gap-2.5'>
                {courses.map((c) => {
                  const d = diffStyle[c.diff]
                  return (
                    <div
                      key={c.id}
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
                            className={`font-ui text-[0.58rem] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded inline-block mb-1 ${d.bgClass} ${d.textClass} border ${d.borderClass}`}
                          >
                            {c.diff}
                          </span>
                          <div className='font-display text-[0.88rem] font-bold leading-snug truncate text-charcoal'>
                            {c.title}
                          </div>
                        </div>
                        <span
                          className={`font-display text-[1.4rem] font-black leading-none flex-shrink-0 ${c.colorClass}`}
                        >
                          {c.progress}%
                        </span>
                      </div>

                      <div className='h-[4px] rounded-full overflow-hidden bg-charcoal/10'>
                        <div
                          className='h-full rounded-full transition-all duration-1000'
                          style={{
                            width: `${c.progress}%`,
                            background:
                              c.colorClass === 'text-green-primary'
                                ? 'linear-gradient(90deg, hsl(var(--green-primary)), hsl(var(--green-primary))99)'
                                : c.colorClass === 'text-green-mint'
                                  ? 'linear-gradient(90deg, hsl(var(--green-mint)), hsl(var(--green-mint))99)'
                                  : 'linear-gradient(90deg, hsl(var(--amber)), hsl(var(--amber))99)',
                          }}
                        />
                      </div>

                      <div className='flex items-center justify-between'>
                        <span className='font-ui text-[0.7rem] flex items-center gap-1 text-text-tertiary'>
                          <Play size={9} strokeWidth={2} />
                          Next:{' '}
                          <span className='text-text-secondary font-medium'>
                            {c.nextLesson}
                          </span>
                        </span>
                        <span className='font-ui text-[0.65rem] text-text-tertiary'>
                          {c.cur}/{c.total}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recommended */}
            <div className='card-warm rounded-2xl p-6 animate-[fade-up_0.5s_0.16s_ease_forwards] opacity-0'>
              <H2 action='Explore all'>Recommended for You</H2>
              <div className='flex flex-col gap-2'>
                {recommended.map((r) => (
                  <div
                    key={r.id}
                    className='flex items-center gap-3.5 p-3.5 rounded-xl cursor-pointer transition-all duration-200 card-warm-hover border border-border-warm hover:border-green-primary hover:card-warm-active'
                    onMouseEnter={(e) => {
                      e.currentTarget.classList.add('card-warm-active')
                      e.currentTarget.classList.remove('card-warm-hover')
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.classList.remove('card-warm-active')
                      e.currentTarget.classList.add('card-warm-hover')
                    }}
                  >
                    <div className='w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center pattern-dot-grid bg-green-secondary'>
                      <BookOpen
                        size={15}
                        strokeWidth={1.5}
                        className='text-cream/35'
                      />
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='font-display text-[0.83rem] font-bold truncate text-charcoal'>
                        {r.title}
                      </div>
                      <div className='flex items-center gap-3 mt-0.5'>
                        <span className='font-ui text-[0.65rem] flex items-center gap-1 text-text-tertiary'>
                          <BookOpen size={9} strokeWidth={1.5} /> {r.lessons}{' '}
                          lessons
                        </span>
                        <span className='font-ui text-[0.65rem] flex items-center gap-1 text-text-tertiary'>
                          <Zap size={9} strokeWidth={1.5} /> {r.xp} XP
                        </span>
                      </div>
                    </div>

                    <div className='flex-shrink-0 flex flex-col items-end gap-1.5'>
                      <span className='font-ui text-[0.58rem] font-bold px-2 py-0.5 rounded-full bg-green-primary/10 text-green-primary'>
                        {r.match}% match
                      </span>
                      <span className='font-ui text-[0.68rem] font-semibold px-3 py-1 rounded-lg bg-green-primary text-cream'>
                        Enroll →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — 1/3 */}
          <div className='flex flex-col gap-5'>
            {/* Streak */}
            <div className='card-warm rounded-2xl p-6 animate-[fade-up_0.5s_0.12s_ease_forwards] opacity-0'>
              <H2>Streak Tracker</H2>

              <div className='flex items-center gap-2.5 mb-4'>
                <Flame size={22} strokeWidth={1.5} className='text-amber' />
                <span className='font-display text-[2.1rem] font-black leading-none text-charcoal'>
                  {user.streak}
                </span>
                <span className='font-ui text-[0.72rem] leading-tight text-text-tertiary'>
                  day
                  <br />
                  streak
                </span>
              </div>

              <div className='mb-4'>
                <h3 className='font-ui text-[0.75rem] font-semibold text-charcoal mb-3'>
                  {monthName} {currentYear}
                </h3>

                <div className='grid grid-cols-7 gap-1 mb-2'>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    (d) => (
                      <div
                        key={d}
                        className='text-center font-ui text-[0.5rem] font-semibold text-text-tertiary'
                      >
                        {d}
                      </div>
                    ),
                  )}
                </div>

                <div className='grid grid-cols-7 gap-1'>
                  {calendarDays.map((day, idx) => (
                    <div
                      key={idx}
                      className='aspect-square rounded-[5px] flex items-center justify-center font-ui text-[0.65rem] font-semibold'
                      style={
                        day === null
                          ? { background: 'transparent' }
                          : day === todayDate
                            ? {
                                background: 'hsl(var(--green-primary) / 0.11)',
                                border: '1.5px solid hsl(var(--green-primary))',
                                color: 'hsl(var(--green-primary))',
                              }
                            : streakDates.has(day)
                              ? {
                                  background: 'hsl(var(--green-primary))',
                                  color: 'hsl(var(--cream))',
                                }
                              : {
                                  background: 'rgba(139,109,56,0.08)',
                                  color: 'hsl(var(--charcoal))',
                                }
                      }
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>

              <div className='flex items-center gap-3 pt-3 border-t border-border-warm'>
                {[
                  { bgClass: 'bg-green-primary', label: 'Completed' },
                  {
                    bgClass: 'bg-green-primary/10',
                    label: 'Today',
                    borderClass: 'border-green-primary/100',
                  },
                  { bgClass: 'bg-border-warm', label: 'Missed' },
                ].map((it) => (
                  <div key={it.label} className='flex items-center gap-1.5'>
                    <div
                      className={`w-2.5 h-2.5 rounded-[3px] ${it.bgClass} ${it.borderClass ? `border ${it.borderClass}` : ''}`}
                    />
                    <span className='font-ui text-[0.6rem] text-text-tertiary'>
                      {it.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className='card-warm rounded-2xl p-6 animate-[fade-up_0.5s_0.18s_ease_forwards] opacity-0'>
              <H2 action='View all'>Achievements</H2>

              <div className='grid grid-cols-3 gap-2'>
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className='flex flex-col items-center gap-1.5 p-2.5 rounded-xl'
                    style={
                      b.earned
                        ? {
                            background: 'rgba(255,210,63,0.1)',
                            border: '1px solid rgba(255,210,63,0.2)',
                          }
                        : {
                            background: 'rgba(139,109,56,0.06)',
                            border: '1px solid hsl(var(--border-warm))',
                            opacity: 0.38,
                            filter: 'grayscale(1)',
                          }
                    }
                  >
                    <span className='text-[1.15rem] leading-none'>
                      {b.icon}
                    </span>
                    <span className='font-ui text-[0.56rem] font-semibold text-center leading-tight text-text-secondary'>
                      {b.name}
                    </span>
                    {b.earned && (
                      <span className='font-ui text-[0.52rem] font-bold px-1.5 py-0.5 rounded-full bg-amber/18 text-amber-dark'>
                        +{b.xp}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className='flex items-center gap-2 mt-3 pt-3 border-t border-border-warm'>
                <span className='font-ui text-[0.65rem] text-text-tertiary'>
                  4 of 6
                </span>
                <div className='flex-1 h-1.5 rounded-full overflow-hidden bg-border-warm'>
                  <div
                    className='h-full rounded-full'
                    style={{
                      width: '66%',
                      background:
                        'linear-gradient(90deg, hsl(var(--amber)), hsl(var(--amber-dark)))',
                    }}
                  />
                </div>
                <span className='font-ui text-[0.65rem] font-bold text-amber-dark'>
                  66%
                </span>
              </div>
            </div>

            {/* Activity */}
            <div className='card-warm rounded-2xl p-6 animate-[fade-up_0.5s_0.24s_ease_forwards] opacity-0'>
              <H2>Recent Activity</H2>

              <div className='flex flex-col'>
                {feed.map((item, i) => (
                  <div
                    key={item.id}
                    className='flex items-start gap-3 py-2.5'
                    style={{
                      borderBottom:
                        i < feed.length - 1
                          ? '1px solid hsl(var(--border-warm))'
                          : 'none',
                    }}
                  >
                    <div
                      className={`w-[3px] self-stretch rounded-full flex-shrink-0 ${item.colorClass}`}
                    />
                    <div className='flex-1 min-w-0'>
                      <p className='font-ui text-[0.76rem] leading-snug text-text-secondary'>
                        {item.text}
                      </p>
                      <div className='flex items-center gap-2 mt-0.5'>
                        <span className='font-ui text-[0.6rem] text-text-tertiary'>
                          {item.time}
                        </span>
                        <span className='font-ui text-[0.56rem] font-bold px-1.5 py-0.5 rounded-full bg-green-primary/9 text-green-primary'>
                          +{item.xp} XP
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StandardLayout>
  )
}
