'use client'

import { PARTNERS } from '@/libs/constants/home.constants'
import { useTranslations } from 'next-intl'

export function SocialProofBar() {
  const t = useTranslations('home')
  return (
    <div className='bg-cream-dark px-4 sm:px-[5%] overflow-hidden'>
      <div className='max-w-[1200px] mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 py-3 sm:py-4'>
        <div className='hidden sm:block text-[11px] font-bold uppercase tracking-[0.08em] text-[rgba(27,35,29,0.4)] whitespace-nowrap font-[inherit] shrink-0'>
          {t('partners')}
        </div>
        <div className='hidden sm:block w-px h-7 bg-[rgba(27,35,29,0.15)] shrink-0' />
        <div className='overflow-hidden flex-1 min-w-0'>
          <div className='landing-animate-marquee flex gap-4 w-max'>
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className='flex items-center gap-2 bg-[rgba(27,35,29,0.06)] border border-[rgba(27,35,29,0.1)] rounded-lg py-1.5 px-3.5 whitespace-nowrap'
              >
                <div className='w-[22px] h-[22px] rounded-[5px] bg-secondary flex items-center justify-center text-[9px] font-black text-cream font-[inherit]'>
                  {p.abbr}
                </div>
                <span className='text-[13px] font-semibold text-[rgba(27,35,29,0.6)] font-[inherit]'>
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
