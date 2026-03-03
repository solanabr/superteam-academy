'use client'

import { FEATURES, FeatureSVGs } from '@/libs/constants/home.constants'
import { useTranslations } from 'next-intl'

export function Features() {
  const t = useTranslations('home')
  const items = t.raw('features.items') as Array<{
    title: string
    desc: string
    meta: string
  }>
  return (
    <section
      id='features'
      aria-label='Features'
      className='bg-secondary py-12 sm:py-16 md:py-24 px-4 sm:px-[5%] relative overflow-hidden'
    >
      <div className='absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_85%_30%,rgba(0,140,76,0.2)_0%,transparent_60%),repeating-linear-gradient(45deg,transparent,transparent_50px,rgba(247,234,203,0.02)_50px,rgba(247,234,203,0.02)_51px)]' />
      <div className='max-w-[1200px] mx-auto relative z-[1]'>
        <div className='text-center mb-10 sm:mb-14'>
          <div className='text-[11px] font-bold tracking-[0.1em] uppercase text-accent mb-2.5 font-[inherit]'>
            {t('features.sectionLabel')}
          </div>
          <h2 className='font-display text-[clamp(1.75rem,5vw,2.8rem)] text-cream leading-tight mb-3.5'>
            {t('features.sectionTitle')
              .split('\n')
              .map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
          </h2>
          <p className='text-base text-[rgba(247,234,203,0.75)] max-w-[500px] mx-auto leading-[1.7] font-[inherit]'>
            {t('features.sectionSub')}
          </p>
        </div>
        <div className='border border-[rgba(247,234,203,0.1)] rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5'>
          {FEATURES.map((f, i) => {
            const fi = items[i]
            return (
              <div
                key={i}
                className={`relative py-6 sm:py-9 px-5 sm:px-8 pb-6 sm:pb-8 cursor-default overflow-hidden transition-colors hover:bg-[rgba(247,234,203,0.04)] ${
                  i % 3 !== 2
                    ? 'lg:border-r border-[rgba(247,234,203,0.08)]'
                    : ''
                } ${i < 3 ? 'sm:border-b border-[rgba(247,234,203,0.08)]' : ''}`}
              >
                {f.accent && (
                  <div className='absolute top-0 left-8 right-8 h-0.5 rounded-b-sm bg-gradient-to-r from-accent to-transparent' />
                )}
                <div className='flex items-start justify-between mb-6'>
                  <div className='w-12 h-12 rounded-[10px] bg-[rgba(82,221,160,0.07)] border border-[rgba(82,221,160,0.18)] flex items-center justify-center shrink-0'>
                    {FeatureSVGs[f.key]}
                  </div>
                  <span
                    className={`font-display text-[13px] font-bold tracking-wide leading-none pt-1 ${f.accent ? 'text-accent' : 'text-[rgba(247,234,203,0.28)]'}`}
                  >
                    {f.num}
                  </span>
                </div>
                <h3 className='font-display text-[19px] text-cream mb-2.5 leading-tight tracking-tight'>
                  {fi.title}
                </h3>
                <p className='text-[13.5px] text-[rgba(247,234,203,0.78)] leading-[1.7] mb-6 font-[inherit]'>
                  {fi.desc}
                </p>
                <div className='inline-flex items-center gap-1.5 border-t border-[rgba(247,234,203,0.09)] pt-4 w-full'>
                  <div className='w-1.5 h-1.5 rounded-full bg-[#52dda0] shrink-0' />
                  <span className='text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(247,234,203,0.55)] font-[inherit]'>
                    {fi.meta}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
