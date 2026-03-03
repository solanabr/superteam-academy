'use client'

import { PATHS } from '@/libs/constants/home.constants'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { PathCard } from '../../../components/PathCard'

export function LearningPaths() {
  const t = useTranslations('home')
  const cards = t.raw('paths.cards') as Array<{
    tag: string
    title: string
    desc: string
    modules: string[]
  }>
  return (
    <section
      id='paths'
      aria-label='Learning paths'
      className='bg-cream py-12 sm:py-16 md:py-24 px-4 sm:px-[5%]'
    >
      <div className='max-w-[1200px] mx-auto'>
        <div className='flex flex-col sm:flex-row justify-between sm:items-end mb-10 sm:mb-14 gap-4'>
          <div className='max-w-xl'>
            <div className='text-[11px] font-bold tracking-[0.1em] uppercase text-primary mb-2.5 font-[inherit]'>
              {t('paths.sectionLabel')}
            </div>
            <h2 className='font-display text-[clamp(1.75rem,5vw,2.8rem)] text-charcoal leading-tight mb-3'>
              {t('paths.sectionTitle')
                .split('\n')
                .map((line, i) => (
                  <span key={i}>
                    {line}
                    {i === 0 && <br />}
                  </span>
                ))}
            </h2>
            <p className='text-sm sm:text-base text-[rgba(27,35,29,0.6)] max-w-[480px] leading-[1.7] font-[inherit]'>
              {t('paths.sectionSub')}
            </p>
          </div>
          <Link
            href='/en/paths'
            className='btn-primary py-3 px-7 rounded-lg text-sm font-semibold font-[inherit] border-none whitespace-nowrap w-full sm:w-auto flex items-center justify-center'
          >
            {t('paths.exploreAll')}
          </Link>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
          {PATHS.map((p, i) => (
            <PathCard
              key={i}
              path={{
                ...p,
                tag: cards[i].tag,
                title: cards[i].title,
                desc: cards[i].desc,
                modules: p.modules.map((m, j) => ({
                  ...m,
                  label: cards[i].modules[j],
                })),
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
