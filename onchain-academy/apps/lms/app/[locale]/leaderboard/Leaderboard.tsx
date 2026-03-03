'use client'

import { StandardLayout } from '@/components/layout/StandardLayout'
import {
  courses,
  leaderboardUsers,
  timeFilters,
} from '@/libs/constants/leaderboard.constants'
import { Flame, Trophy, Zap } from 'lucide-react'
import { useState } from 'react'

export default function Leaderboard() {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all-time')
  const [selectedCourse, setSelectedCourse] = useState('All Courses')

  const filteredUsers = leaderboardUsers.filter((user) =>
    selectedCourse === 'All Courses' ? true : user.course === selectedCourse,
  )

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

          <div className='relative z-10'>
            <div className='flex items-center gap-3 mb-3'>
              <Trophy size={28} strokeWidth={1.5} className='text-amber' />
              <h1 className='font-display text-[2.1rem] font-black tracking-[-0.025em] leading-tight text-cream'>
                Global Rankings
              </h1>
            </div>
            <p className='font-ui text-[0.86rem] text-cream/58'>
              Compete with learners worldwide. Climb the ranks by earning XP.
            </p>
          </div>
        </div>
      </div>

      <div className='max-w-[1200px] mx-auto flex flex-col gap-6 py-12'>
        {/* FILTERS */}
        <div className='flex flex-col gap-4'>
          {/* Time Filter */}
          <div className='flex flex-col gap-2'>
            <span className='font-ui text-[0.75rem] font-semibold text-charcoal uppercase tracking-wider'>
              Time Period
            </span>
            <div className='flex gap-2 flex-wrap'>
              {timeFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedTimeFilter(filter.value)}
                  className={`font-ui text-[0.75rem] font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    selectedTimeFilter === filter.value
                      ? 'bg-green-primary text-cream'
                      : 'bg-card-warm border border-border-warm text-charcoal hover:border-green-primary'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Course Filter */}
          <div className='flex flex-col gap-2'>
            <span className='font-ui text-[0.75rem] font-semibold text-charcoal uppercase tracking-wider'>
              Course
            </span>
            <div className='flex gap-2 flex-wrap'>
              {courses.map((course) => (
                <button
                  key={course}
                  onClick={() => setSelectedCourse(course)}
                  className={`font-ui text-[0.75rem] font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    selectedCourse === course
                      ? 'bg-green-primary text-cream'
                      : 'bg-card-warm border border-border-warm text-charcoal hover:border-green-primary'
                  }`}
                >
                  {course}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LEADERBOARD */}
        <div className='card-warm rounded-2xl p-6 animate-[fade-up_0.5s_0.08s_ease_forwards] opacity-0'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='font-display text-[1.05rem] font-bold tracking-[-0.01em] text-charcoal'>
              Top Learners
            </h2>
            <span className='font-ui text-[0.65rem] text-text-tertiary'>
              {filteredUsers.length} users
            </span>
          </div>

          <div className='flex flex-col gap-2'>
            {filteredUsers.map((user, idx) => (
              <div
                key={user.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 border ${
                  user.isCurrentUser
                    ? 'card-warm-active border-green-primary bg-green-primary/5'
                    : 'card-warm-hover border-border-warm hover:border-green-primary hover:card-warm-active'
                }`}
              >
                {/* Rank */}
                <div
                  className='flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-display font-black text-[0.9rem]'
                  style={{
                    background:
                      idx === 0
                        ? 'linear-gradient(135deg, hsl(46 100% 62%), hsl(46 87% 56%))'
                        : idx === 1
                          ? 'linear-gradient(135deg, hsl(154 66% 59%), hsl(154 66% 49%))'
                          : idx === 2
                            ? 'linear-gradient(135deg, hsl(46 87% 56%), hsl(46 87% 46%))'
                            : 'hsl(var(--card-warm-hover))',
                    color:
                      idx < 3 ? 'hsl(var(--cream))' : 'hsl(var(--charcoal))',
                  }}
                >
                  {user.rank}
                </div>

                {/* Avatar & Name */}
                <div className='flex items-center gap-3 flex-1 min-w-0'>
                  <span className='text-[1.5rem] leading-none flex-shrink-0'>
                    {user.avatar}
                  </span>
                  <div className='flex-1 min-w-0'>
                    <div className='font-display text-[0.88rem] font-bold truncate text-charcoal'>
                      {user.name}
                      {user.isCurrentUser && (
                        <span className='font-ui text-[0.6rem] font-semibold ml-2 px-2 py-0.5 rounded-full bg-green-primary/10 text-green-primary'>
                          You
                        </span>
                      )}
                    </div>
                    <div className='font-ui text-[0.65rem] text-text-tertiary truncate'>
                      {user.course}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className='flex items-center gap-4 flex-shrink-0'>
                  {/* Level */}
                  <div className='flex flex-col items-center gap-0.5'>
                    <span className='font-display text-[0.9rem] font-black text-charcoal'>
                      {user.level}
                    </span>
                    <span className='font-ui text-[0.55rem] text-text-tertiary'>
                      Level
                    </span>
                  </div>

                  {/* Streak */}
                  <div className='flex flex-col items-center gap-0.5'>
                    <div className='flex items-center gap-1'>
                      <Flame size={12} strokeWidth={2} className='text-amber' />
                      <span className='font-display text-[0.9rem] font-black text-charcoal'>
                        {user.streak}
                      </span>
                    </div>
                    <span className='font-ui text-[0.55rem] text-text-tertiary'>
                      Streak
                    </span>
                  </div>

                  {/* XP */}
                  <div className='flex flex-col items-center gap-0.5'>
                    <div className='flex items-center gap-1'>
                      <Zap size={12} strokeWidth={2} className='text-amber' />
                      <span className='font-display text-[0.9rem] font-black text-charcoal'>
                        {(user.xp / 1000).toFixed(1)}k
                      </span>
                    </div>
                    <span className='font-ui text-[0.55rem] text-text-tertiary'>
                      XP
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StandardLayout>
  )
}
