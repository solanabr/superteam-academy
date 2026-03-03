'use client'

import { STATS } from '@/libs/constants/home.constants'
import { Check, Flame } from 'lucide-react'
import { useTranslations } from 'next-intl'

const PARTICLE_CONFIG = [
  { left: '15%', bottom: '20%', delay: '0s', dx: '8px', size: 3 },
  { left: '25%', bottom: '35%', delay: '1.5s', dx: '-6px', size: 2 },
  { left: '40%', bottom: '15%', delay: '0.8s', dx: '12px', size: 2 },
  { left: '55%', bottom: '25%', delay: '2.2s', dx: '-10px', size: 3 },
  { left: '70%', bottom: '40%', delay: '0.4s', dx: '6px', size: 2 },
  { left: '80%', bottom: '18%', delay: '1.8s', dx: '-8px', size: 2 },
  { left: '88%', bottom: '55%', delay: '3s', dx: '4px', size: 3 },
]

export function Hero() {
  const t = useTranslations('home')
  const heroModules = t.raw('hero.modules') as string[]
  return (
    <section className='landing-hero-bg min-h-screen pt-[68px] relative overflow-hidden flex items-center pb-8 md:pb-0'>
      <div className='absolute inset-0 pointer-events-none overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_55%_45%,rgba(0,80,35,0.7)_0%,rgba(13,31,18,0)_70%)]' />
        <div className='landing-aurora-1 absolute -top-[10%] right-[5%] w-[65%] h-[80%] rounded-full blur-[48px] bg-[radial-gradient(ellipse_at_center,rgba(0,140,76,0.35)_0%,rgba(0,100,55,0.15)_45%,transparent_70%)]' />
        <div className='landing-aurora-2 absolute top-[20%] -left-[5%] w-[50%] h-[60%] rounded-full blur-[60px] bg-[radial-gradient(ellipse_at_center,rgba(82,221,160,0.18)_0%,rgba(0,140,76,0.08)_50%,transparent_70%)]' />
        <div className='landing-aurora-3 absolute -bottom-[5%] right-[20%] w-[40%] h-[50%] rounded-full blur-[56px] bg-[radial-gradient(ellipse_at_center,rgba(255,210,63,0.1)_0%,rgba(255,180,0,0.04)_50%,transparent_70%)]' />
      </div>
      <div className='landing-grid-lines absolute inset-0 pointer-events-none' />
      <div className='absolute inset-0 pointer-events-none overflow-hidden'>
        <div className='landing-beam-1 absolute top-0 left-[48%] w-px h-full bg-[linear-gradient(180deg,transparent,rgba(82,221,160,0.25)_30%,rgba(0,140,76,0.12)_70%,transparent)]' />
        <div className='landing-beam-2 absolute top-0 left-[62%] w-px h-full bg-[linear-gradient(180deg,transparent,rgba(247,234,203,0.12)_40%,rgba(247,234,203,0.05)_70%,transparent)]' />
        <div className='landing-beam-1 absolute top-0 left-[30%] w-px h-full bg-[linear-gradient(180deg,transparent_10%,rgba(0,140,76,0.1)_50%,transparent)] [animation-delay:3s]' />
      </div>
      <div className='landing-scan absolute left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(82,221,160,0.3)_30%,rgba(82,221,160,0.6)_50%,rgba(82,221,160,0.3)_70%,transparent)] pointer-events-none z-[1]' />
      {PARTICLE_CONFIG.map((p, i) => (
        <div
          key={i}
          className='landing-particle'
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            background:
              i % 3 === 0
                ? '#52dda0'
                : i % 3 === 1
                  ? 'hsl(var(--accent))'
                  : 'hsl(var(--cream))',
            animationDelay: p.delay,
            ['--dx' as string]: p.dx,
          }}
        />
      ))}
      <div className='landing-noise-overlay' />
      <div className='max-w-[1200px] mx-auto py-10 sm:py-16 md:py-20 px-4 sm:px-[5%] relative z-[2] w-full'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center'>
          <div className='order-2 md:order-1'>
            <div className='landing-animate-fade-up inline-flex items-center gap-2 bg-[rgba(255,210,63,0.1)] border border-[rgba(255,210,63,0.25)] text-accent py-1.5 px-3.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-[0.08em] uppercase mb-5 sm:mb-7 font-[inherit]'>
              <span className='landing-animate-pulse-dot w-1.5 h-1.5 rounded-full bg-accent inline-block' />
              {t('hero.badge')}
            </div>
            <h1 className='font-display landing-animate-fade-up-d1 text-[clamp(2rem,8vw,4.4rem)] sm:text-[clamp(2.8rem,5vw,4.4rem)] leading-[1.08] text-cream mb-4 sm:mb-6 font-black'>
              {t('hero.h1a')}{' '}
              <span className='text-[#52dda0] relative'>
                {t('hero.h1b')}
                <svg
                  className='absolute -bottom-1.5 left-0 w-full h-1.5'
                  viewBox='0 0 200 6'
                  fill='none'
                >
                  <path
                    d='M0 5 Q50 0 100 3 Q150 6 200 2'
                    stroke='#52dda0'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    fill='none'
                    opacity='0.6'
                  />
                </svg>
              </span>{' '}
              {t('hero.h1c')}
            </h1>
            <p className='landing-animate-fade-up-d2 text-[15px] sm:text-[17px] leading-[1.72] text-[rgba(247,234,203,0.65)] mb-6 sm:mb-9 font-[inherit]'>
              {t('hero.sub')}
            </p>
            <div className='landing-animate-fade-up-d3 flex flex-wrap gap-3 mb-8 sm:mb-12'>
              <button
                type='button'
                className='btn-primary py-3.5 px-8 rounded-lg text-[15px] font-bold cursor-pointer font-[inherit] border-none'
              >
                {t('hero.cta1')}
              </button>
              <button
                type='button'
                className='btn-outline-cream py-3.5 px-7 rounded-lg text-[15px] font-semibold cursor-pointer font-[inherit]'
              >
                {t('hero.cta2')}
              </button>
            </div>
            <div className='landing-animate-fade-up-d4 grid grid-cols-2 md:flex gap-4 md:gap-0 pt-6 sm:pt-8 border-t border-[rgba(247,234,203,0.08)]'>
              {STATS.map((s, i) => (
                <div
                  key={i}
                  className={`md:flex-1 ${i < STATS.length - 1 ? 'md:pr-6 md:border-r border-[rgba(247,234,203,0.08)]' : ''} ${i > 0 ? 'md:pl-6' : ''}`}
                >
                  <div className='font-display text-xl sm:text-[26px] text-cream leading-none mb-0.5'>
                    {s.value}
                  </div>
                  <div className='text-[9px] sm:text-[10px] text-[rgba(247,234,203,0.38)] uppercase tracking-[0.07em] font-[inherit]'>
                    {t(`stats.${i}`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className='relative min-h-[380px] md:h-[540px] order-1 md:order-2'>
            <div className='absolute top-[5%] left-[5%] right-[5%] bottom-[5%] rounded-full blur-[40px] pointer-events-none bg-[radial-gradient(ellipse_at_50%_50%,rgba(0,140,76,0.35)_0%,transparent_70%)] landing-aurora-1' />
            <div className='landing-card-border absolute top-0 left-0 right-0 md:top-[4%] md:left-[2%] md:right-[2%] rounded-2xl overflow-hidden bg-[rgba(13,31,18,0.85)] border border-[rgba(0,140,76,0.25)] backdrop-blur-[20px] mx-2 md:mx-0'>
              <div className='bg-[rgba(0,140,76,0.12)] border-b border-[rgba(0,140,76,0.18)] py-2.5 px-3 sm:py-3 sm:px-5 flex items-center justify-between gap-2'>
                <div className='flex gap-1.5 sm:gap-[7px] items-center shrink-0'>
                  {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
                    <div
                      key={i}
                      className='w-2 h-2 sm:w-[11px] sm:h-[11px] rounded-full opacity-80'
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className='text-[9px] sm:text-[11px] font-semibold text-[rgba(247,234,203,0.4)] font-[inherit] tracking-wide truncate min-w-0'>
                  superteam-academy / programs
                </div>
                <div className='flex gap-1.5'>
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className='w-3.5 h-0.5 rounded-sm bg-[rgba(247,234,203,0.15)]'
                    />
                  ))}
                </div>
              </div>
              <div className='py-4 px-4 sm:py-5 sm:px-6 pb-5 sm:pb-6'>
                <div className='flex items-center justify-between gap-2 mb-3 sm:mb-4'>
                  <span className='text-[8px] sm:text-[9px] font-extrabold tracking-[0.1em] uppercase text-[#52dda0] bg-[rgba(82,221,160,0.12)] border border-[rgba(82,221,160,0.2)] py-[2px] sm:py-[3px] px-2 sm:px-[9px] rounded font-[inherit] shrink-0'>
                    {t('hero.trending')}
                  </span>
                  <span className='text-[10px] sm:text-[11px] text-[rgba(247,234,203,0.35)] font-[inherit]'>
                    12 hrs · 22 lessons
                  </span>
                </div>
                <h3 className='font-display text-[17px] sm:text-[21px] text-cream mb-1.5 sm:mb-2 leading-tight tracking-tight'>
                  {t('hero.cardTitle')}
                </h3>
                <p className='text-[12.5px] text-[rgba(247,234,203,0.5)] leading-[1.6] mb-5 font-[inherit]'>
                  {t('hero.cardDesc')}
                </p>
                <div className='mb-5'>
                  <div className='flex justify-between text-[11px] mb-2 font-[inherit]'>
                    <span className='text-[rgba(247,234,203,0.4)]'>
                      {t('hero.progress')}
                    </span>
                    <span className='text-[#52dda0] font-bold'>61%</span>
                  </div>
                  <div className='bg-[rgba(247,234,203,0.07)] rounded-full h-1.5 overflow-hidden'>
                    <div className='w-[61%] h-full rounded-full bg-gradient-to-r from-[#008c4c] to-[#52dda0]' />
                  </div>
                </div>
                <div className='flex flex-col gap-0'>
                  {[
                    { done: true },
                    { done: true },
                    { active: true },
                    { done: false },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 py-2 border-b ${i < 3 ? 'border-[rgba(247,234,203,0.05)]' : 'border-none'}`}
                    >
                      <div
                        className={`w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center ${
                          m.done
                            ? 'bg-primary border-none'
                            : m.active
                              ? 'bg-transparent border-[1.5px] border-primary'
                              : 'bg-transparent border-[1.5px] border-[rgba(247,234,203,0.12)]'
                        }`}
                      >
                        {m.done && (
                          <Check
                            size={8}
                            className='text-cream shrink-0'
                            strokeWidth={2.5}
                          />
                        )}
                        {m.active && (
                          <div className='w-1.5 h-1.5 rounded-full bg-primary' />
                        )}
                      </div>
                      <span
                        className={`text-xs font-[inherit] flex-1 ${
                          m.done
                            ? 'text-[rgba(247,234,203,0.7)]'
                            : m.active
                              ? 'text-cream font-semibold'
                              : 'text-[rgba(247,234,203,0.25)]'
                        }`}
                      >
                        {heroModules[i]}
                      </span>
                      {m.active && (
                        <span className='text-[9px] font-bold text-primary tracking-[0.06em] uppercase font-[inherit]'>
                          {t('hero.activeLabel')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className='hidden sm:block landing-animate-float-fast absolute bottom-[10%] -right-[4%] bg-gradient-to-br from-accent to-[#f0c22e] text-charcoal py-[11px] px-4 rounded-[14px] font-[inherit] shadow-[0_8px_32px_rgba(255,210,63,0.45),0_2px_8px_rgba(0,0,0,0.3)] z-[4]'>
              <div className='text-lg font-black'>+350 XP</div>
              <div className='text-[10px] font-bold tracking-[0.06em] uppercase opacity-70'>
                {t('hero.xpEarned')}
              </div>
            </div>
            <div className='hidden sm:flex landing-animate-float-slow absolute bottom-[30%] -left-[6%] bg-[rgba(13,31,18,0.9)] border border-[rgba(82,221,160,0.25)] backdrop-blur-[12px] py-2.5 px-3.5 rounded-xl items-center gap-2 font-[inherit] shadow-[0_8px_24px_rgba(0,0,0,0.4)] z-[4] whitespace-nowrap'>
              <div className='w-[30px] h-[30px] rounded-lg bg-[rgba(255,210,63,0.12)] border border-[rgba(255,210,63,0.2)] flex items-center justify-center'>
                <Flame
                  size={14}
                  className='text-accent shrink-0'
                  strokeWidth={2}
                />
              </div>
              <div>
                <div className='text-[13px] font-bold text-cream leading-none'>
                  {t('hero.streak')}
                </div>
                <div className='text-[10px] text-[rgba(247,234,203,0.4)] mt-0.5'>
                  {t('hero.streakSub')}
                </div>
              </div>
            </div>
            <div className='hidden sm:flex absolute top-0 right-[10%] bg-[rgba(13,31,18,0.85)] border border-[rgba(82,221,160,0.2)] backdrop-blur-[10px] py-[7px] px-3 rounded-lg items-center gap-[7px] font-[inherit] z-[4]'>
              <div className='landing-animate-pulse-dot w-1.5 h-1.5 rounded-full bg-[#52dda0] shrink-0' />
              <span className='text-[11px] font-semibold text-[rgba(247,234,203,0.7)]'>
                1,204 {t('hero.liveCount')}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className='absolute bottom-0 left-0 right-0 h-[120px] pointer-events-none bg-gradient-to-b from-transparent from-0% via-[var(--hero-bg)] via-60% to-cream-dark' />
      <svg
        className='absolute -bottom-px left-0 right-0 w-full h-[60px]'
        viewBox='0 0 1440 60'
        preserveAspectRatio='none'
        style={{ fill: 'hsl(var(--cream-dark))' }}
      >
        <path d='M0 60 L0 40 Q180 10 360 28 Q540 46 720 28 Q900 10 1080 26 Q1260 42 1440 20 L1440 60 Z' />
      </svg>
    </section>
  )
}
