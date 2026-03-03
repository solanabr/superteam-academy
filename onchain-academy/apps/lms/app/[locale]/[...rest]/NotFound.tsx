'use client'

import {
  ArrowLeft,
  BookOpen,
  Compass,
  Home,
  LayoutDashboard,
} from 'lucide-react'
import Link from 'next/link'
import { StandardLayout } from '../../../components/layout/StandardLayout'

export const NotFound = () => {
  return (
    <StandardLayout>
      {/* HERO BANNER */}
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
          className='absolute bottom-[-30px] left-[-10px] w-40 h-40 rounded-full pointer-events-none'
          style={{
            background: 'rgba(82,221,160,0.18)',
            filter: 'blur(48px)',
            animation: 'aurora 16s ease-in-out infinite reverse',
          }}
        />

        <div className='relative z-10 max-w-[1200px] mx-auto px-[5%] py-14 lg:py-20'>
          <div className='animate-[fade-up_0.5s_ease_forwards] opacity-0'>
            <p
              className='font-ui text-[0.6875rem] font-bold tracking-widest uppercase mb-3'
              style={{ color: 'hsla(40,82%,88%,0.3)' }}
            >
              Error 404
            </p>
            <h1 className='font-display text-4xl md:text-5xl font-black mb-4 text-cream tracking-[-0.02em]'>
              Whoops, wrong{' '}
              <span style={{ color: 'hsl(var(--green-mint))' }}>address</span>{' '}
              🧭
            </h1>
            <p
              className='font-ui text-lg max-w-xl'
              style={{ color: 'hsla(40,82%,88%,0.65)' }}
            >
              This page doesn&rsquo;t exist — but hey, even the best explorers
              take a wrong turn sometimes.
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className='max-w-[1200px] mx-auto flex flex-col gap-6 py-12'>
        {/* Big friendly illustration card */}
        <div className='card-warm rounded-2xl p-10 lg:p-14 animate-[fade-up_0.5s_0.08s_ease_forwards] opacity-0'>
          <div className='flex flex-col items-center text-center gap-6'>
            {/* Animated emoji cluster */}
            <div className='flex items-center gap-3'>
              <span
                className='text-[2.5rem] inline-block'
                style={{ animation: 'float-slow 4s ease-in-out infinite' }}
              >
                🗺️
              </span>
              <span
                className='text-[3.5rem] inline-block'
                style={{
                  animation: 'float-slow 5s ease-in-out infinite 0.5s',
                }}
              >
                🧑‍💻
              </span>
              <span
                className='text-[2.5rem] inline-block'
                style={{
                  animation: 'float-slow 4.5s ease-in-out infinite 1s',
                }}
              >
                🔭
              </span>
            </div>

            <div className='flex flex-col gap-2 max-w-md'>
              <h2 className='font-display text-[1.5rem] font-bold text-charcoal'>
                Let&rsquo;s get you back on track!
              </h2>
              <p className='font-ui text-[0.88rem] text-text-secondary leading-relaxed'>
                The URL might be misspelled, or this page may have graduated to
                a new location. Pick a destination below and keep learning.
              </p>
            </div>
          </div>
        </div>

        {/* Quick nav cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-[fade-up_0.5s_0.16s_ease_forwards] opacity-0'>
          {[
            {
              href: '/',
              icon: <Home size={20} strokeWidth={1.5} />,
              label: 'Home',
              desc: 'Back to the start',
              color: 'text-green-primary',
              bg: 'bg-green-primary/10',
            },
            {
              href: '/en/dashboard',
              icon: <LayoutDashboard size={20} strokeWidth={1.5} />,
              label: 'Dashboard',
              desc: 'Your learning hub',
              color: 'text-amber',
              bg: 'bg-amber/10',
            },
            {
              href: '/en/courses',
              icon: <BookOpen size={20} strokeWidth={1.5} />,
              label: 'Courses',
              desc: 'Browse all courses',
              color: 'text-green-mint',
              bg: 'bg-green-mint/10',
            },
            {
              href: '/en/leaderboard',
              icon: <Compass size={20} strokeWidth={1.5} />,
              label: 'Leaderboard',
              desc: 'See top builders',
              color: 'text-amber-dark',
              bg: 'bg-amber/10',
            },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className='card-warm rounded-2xl p-5 flex flex-col gap-3 border border-border-warm hover:border-green-primary transition-all duration-200 group cursor-pointer hover:card-warm-active'
              onMouseEnter={(e) => {
                e.currentTarget.classList.add('card-warm-active')
              }}
              onMouseLeave={(e) => {
                e.currentTarget.classList.remove('card-warm-active')
              }}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}
              >
                {item.icon}
              </div>
              <div>
                <div className='font-display text-[0.95rem] font-bold text-charcoal group-hover:text-green-primary transition-colors'>
                  {item.label}
                </div>
                <div className='font-ui text-[0.72rem] text-text-tertiary mt-0.5'>
                  {item.desc}
                </div>
              </div>
              <div className='font-ui text-[0.65rem] font-semibold text-green-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1'>
                <ArrowLeft size={11} strokeWidth={2} className='rotate-180' />
                Go there
              </div>
            </Link>
          ))}
        </div>
      </div>
    </StandardLayout>
  )
}
