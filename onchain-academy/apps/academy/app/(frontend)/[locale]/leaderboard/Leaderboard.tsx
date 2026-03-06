'use client'

import { StandardLayout } from '@/components/layout/StandardLayout'
import { xpAPI } from '@/libs/api'
import { courses, timeFilters } from '@/libs/constants/leaderboard.constants'
import { useAuthStore } from '@/stores'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Flame, Trophy, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'

export default function Leaderboard() {
  const t = useTranslations('leaderboard')
  const { user } = useAuthStore()
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('monthly')
  const [selectedCourse, setSelectedCourse] = useState('All Courses')

  // Fetch leaderboard data with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['leaderboard', selectedTimeFilter],
    queryFn: ({ pageParam = 0 }) =>
      xpAPI.getLeaderboard({
        timePeriod: selectedTimeFilter as 'weekly' | 'monthly' | 'all-time',
        limit: 20,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      return allPages.length * 20
    },
    initialPageParam: 0,
  })

  // Infinite scroll with intersection observer
  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Transform React Query data for display
  const allEntries = data?.pages.flatMap((page) => page.entries) ?? []

  // Map to UI structure with current user highlighting
  const filteredUsers = allEntries.map((entry) => ({
    id: entry.user.id,
    rank: entry.rank,
    name: entry.user.displayName,
    avatar: entry.user.avatar || '👤', // Default avatar if none provided
    course: 'All Courses', // TODO: Add course filtering in future
    level: entry.level,
    streak: entry.streak.current,
    xp: entry.totalXP,
    isCurrentUser: user?.id ? Number(user.id) === entry.user.id : false,
  }))

  return (
    <StandardLayout>
      {/* BANNER */}
      <div className='relative overflow-hidden p-7 lg:p-8 bg-green-secondary'>
        {/* <div className='relative overflow-hidden p-7 lg:p-8 animate-[fade-up_0.4s_ease_forwards] opacity-0 bg-green-secondary'> */}
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
                {/* Banner: page title */}
                {t('banner.title')}
              </h1>
            </div>
            <p className='font-ui text-[0.86rem] text-cream/58'>
              {/* Banner: subtitle */}
              {t('banner.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className='max-w-[1200px] mx-auto flex flex-col gap-6 py-12'>
        {/* FILTERS */}
        <div className='flex flex-col gap-4'>
          {/* Time filter */}
          <div className='flex flex-col gap-2'>
            <span className='font-ui text-[0.75rem] font-semibold text-charcoal uppercase tracking-wider'>
              {t('filters.timePeriod')}
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
                  {t(`filters.time.${filter.value}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Course filter */}
          <div className='flex flex-col gap-2'>
            <span className='font-ui text-[0.75rem] font-semibold text-charcoal uppercase tracking-wider'>
              {t('filters.course')}
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
                  {t(`filters.courses.${course}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LEADERBOARD */}
        <div className='card-warm rounded-2xl p-6 animate-[fade-up_0.5s_0.08s_ease_forwards] opacity-0'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='font-display text-[1.05rem] font-bold tracking-[-0.01em] text-charcoal'>
              {t('section.topLearners')}
            </h2>
            <span className='font-ui text-[0.65rem] text-text-tertiary'>
              {t('section.userCount', { count: filteredUsers.length })}
            </span>
          </div>

          <div className='flex flex-col gap-2'>
            {/* Error state */}
            {error && (
              <div className='card-warm rounded-xl p-6 text-center'>
                <p className='text-charcoal mb-4'>
                  Unable to load leaderboard. Please try again.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className='px-4 py-2 bg-green-primary text-cream rounded-lg hover:bg-green-primary/90 transition-colors'
                >
                  Retry
                </button>
              </div>
            )}

            {/* Initial loading skeleton */}
            {isLoading && !error && (
              <>
                {[...Array(5)].map((_, idx) => (
                  <div
                    key={`skeleton-${idx}`}
                    className='flex items-center gap-4 p-4 rounded-xl border border-border-warm animate-pulse'
                  >
                    {/* Rank skeleton */}
                    <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-border-warm' />

                    {/* Avatar & Name skeleton */}
                    <div className='flex items-center gap-3 flex-1 min-w-0'>
                      <div className='w-6 h-6 rounded-full bg-border-warm flex-shrink-0' />
                      <div className='flex-1 min-w-0 space-y-2'>
                        <div className='h-4 bg-border-warm rounded w-32' />
                        <div className='h-3 bg-border-warm rounded w-24' />
                      </div>
                    </div>

                    {/* Stats skeleton */}
                    <div className='flex items-center gap-4 flex-shrink-0'>
                      <div className='flex flex-col items-center gap-1'>
                        <div className='h-4 w-8 bg-border-warm rounded' />
                        <div className='h-3 w-10 bg-border-warm rounded' />
                      </div>
                      <div className='flex flex-col items-center gap-1'>
                        <div className='h-4 w-8 bg-border-warm rounded' />
                        <div className='h-3 w-10 bg-border-warm rounded' />
                      </div>
                      <div className='flex flex-col items-center gap-1'>
                        <div className='h-4 w-8 bg-border-warm rounded' />
                        <div className='h-3 w-10 bg-border-warm rounded' />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Actual leaderboard entries */}
            {!isLoading &&
              !error &&
              filteredUsers.length > 0 &&
              filteredUsers.map((user, idx) => (
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
                            {t('section.you')}
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
                    {/* Level stat */}
                    <div className='flex flex-col items-center gap-0.5'>
                      <span className='font-display text-[0.9rem] font-black text-charcoal'>
                        {user.level}
                      </span>
                      <span className='font-ui text-[0.55rem] text-text-tertiary'>
                        {t('section.level')}
                      </span>
                    </div>

                    {/* Streak stat */}
                    <div className='flex flex-col items-center gap-0.5'>
                      <div className='flex items-center gap-1'>
                        <Flame
                          size={12}
                          strokeWidth={2}
                          className='text-amber'
                        />
                        <span className='font-display text-[0.9rem] font-black text-charcoal'>
                          {user.streak}
                        </span>
                      </div>
                      <span className='font-ui text-[0.55rem] text-text-tertiary'>
                        {t('section.streak')}
                      </span>
                    </div>

                    {/* XP stat */}
                    <div className='flex flex-col items-center gap-0.5'>
                      <div className='flex items-center gap-1'>
                        <Zap size={12} strokeWidth={2} className='text-amber' />
                        <span className='font-display text-[0.9rem] font-black text-charcoal'>
                          {(user.xp / 1000).toFixed(1)}k
                        </span>
                      </div>
                      <span className='font-ui text-[0.55rem] text-text-tertiary'>
                        {t('section.xp')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

            {/* Empty state */}
            {!isLoading && !error && filteredUsers.length === 0 && (
              <div className='card-warm rounded-xl p-6 text-center'>
                <p className='text-text-tertiary'>
                  No leaderboard data available yet.
                </p>
              </div>
            )}

            {/* Sentinel element for infinite scroll */}
            {hasNextPage && <div ref={ref} className='h-10' />}

            {/* Pagination loading indicator */}
            {isFetchingNextPage && (
              <div className='flex justify-center py-4'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-primary' />
              </div>
            )}
          </div>
        </div>
      </div>
    </StandardLayout>
  )
}
