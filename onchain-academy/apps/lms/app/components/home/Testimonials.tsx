'use client'

import { TESTIMONIALS } from '@/libs/constants/home.constants'
import { useTranslations } from 'next-intl'

export function Testimonials() {
  const t = useTranslations('home')
  const items = t.raw('testimonials.items') as Array<{ quote: string }>
  return (
    <section
      id='testimonials'
      aria-label='Testimonials'
      className='bg-cream-dark py-12 sm:py-16 md:py-24 px-4 sm:px-[5%]'
    >
      <div className='max-w-[1200px] mx-auto'>
        <div className='flex flex-col sm:flex-row justify-between sm:items-end mb-10 sm:mb-12 gap-4'>
          <div className='max-w-xl'>
            <div className='text-[11px] font-bold tracking-[0.1em] uppercase text-primary mb-2.5 font-[inherit]'>
              {t('testimonials.sectionLabel')}
            </div>
            <h2 className='font-display text-[clamp(1.75rem,5vw,2.8rem)] text-charcoal leading-tight'>
              {t('testimonials.sectionTitle')
                .split('\n')
                .map((line, i) => (
                  <span key={i}>
                    {line}
                    {i === 0 && <br />}
                  </span>
                ))}
            </h2>
          </div>
          <div className='text-left sm:text-right shrink-0'>
            <div className='font-display text-[42px] text-charcoal'>
              4.9<span className='text-xl text-[rgba(27,35,29,0.45)]'>/5</span>
            </div>
            <div className='flex gap-1 justify-end mb-1'>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className='text-accent text-lg'>
                  ★
                </span>
              ))}
            </div>
            <div className='text-xs text-[rgba(27,35,29,0.5)] font-[inherit]'>
              {t('testimonials.ratingBase')}
            </div>
          </div>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5'>
          {TESTIMONIALS.map((tItem, i) => (
            <div
              key={i}
              className={`landing-card-hover rounded-2xl p-7 ${
                tItem.highlight
                  ? 'bg-secondary border border-primary'
                  : 'bg-cream border border-[rgba(27,35,29,0.12)]'
              }`}
            >
              <div className='flex gap-0.5 mb-4'>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className='text-accent text-sm'>
                    ★
                  </span>
                ))}
              </div>
              <p
                className={`text-[15px] leading-[1.7] mb-6 font-[inherit] ${
                  tItem.highlight
                    ? 'text-[rgba(247,234,203,0.85)]'
                    : 'text-charcoal'
                }`}
              >
                &quot;{items[i].quote}&quot;
              </p>
              <div className='flex items-center gap-3'>
                <div
                  className='w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-cream font-[inherit] shrink-0'
                  style={{ background: tItem.avatarBg }}
                >
                  {tItem.initials}
                </div>
                <div>
                  <div
                    className={`text-sm font-semibold font-[inherit] ${tItem.highlight ? 'text-cream' : 'text-charcoal'}`}
                  >
                    {tItem.name}
                  </div>
                  <div
                    className={`text-xs font-[inherit] ${tItem.highlight ? 'text-[rgba(247,234,203,0.5)]' : 'text-[rgba(27,35,29,0.5)]'}`}
                  >
                    {tItem.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
