'use client'

import { useTranslations } from 'next-intl'

export function CtaBanner() {
  const t = useTranslations('home')
  return (
    <section
      id='cta'
      aria-label='Call to action'
      className='bg-primary py-12 sm:py-16 md:py-20 px-4 sm:px-[5%] relative overflow-hidden'
    >
      <div className='absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_50%_80%_at_80%_50%,rgba(47,107,63,0.5)_0%,transparent_60%)]' />
      <div className='max-w-[1200px] mx-auto relative z-[1] flex flex-col md:flex-row items-center md:items-center md:justify-between text-center md:text-left gap-8'>
        <div className='max-w-xl'>
          <div className='text-[11px] font-bold tracking-[0.1em] uppercase text-[rgba(247,234,203,0.6)] mb-3 font-[inherit]'>
            {t('cta.overline')}
          </div>
          <h2 className='font-display text-[clamp(1.5rem,5vw,2.6rem)] text-cream leading-tight mb-2.5'>
            {t('cta.title')
              .split('\n')
              .map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
          </h2>
          <p className='text-sm sm:text-[15px] text-[rgba(247,234,203,0.7)] font-[inherit]'>
            {t('cta.sub')}
          </p>
        </div>
        <div className='flex flex-col sm:flex-row gap-3 sm:gap-3.5 w-full sm:w-auto'>
          <button
            type='button'
            className='bg-accent text-charcoal py-3.5 px-8 rounded-lg text-[15px] font-extrabold cursor-pointer font-[inherit] border-none shadow-[0_4px_20px_rgba(255,210,63,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(255,210,63,0.5)] w-full sm:w-auto'
          >
            {t('cta.btn1')}
          </button>
          <button
            type='button'
            className='btn-outline-cream py-3.5 px-7 rounded-lg text-[15px] font-semibold cursor-pointer font-[inherit] w-full sm:w-auto'
          >
            {t('cta.btn2')}
          </button>
        </div>
      </div>
    </section>
  )
}
