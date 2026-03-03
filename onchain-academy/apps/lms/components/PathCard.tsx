'use client'

import type { PathItem } from '@/app/components/home/home.types'
import { PathSVGs } from '@/libs/constants/home.constants'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { ProgressModule } from '../app/components/home/ProgressModule'

interface PathCardProps {
  path: PathItem
}

export function PathCard({ path }: PathCardProps) {
  const t = useTranslations('home')
  const [hovered, setHovered] = useState(false)

  const onEnter = useCallback(() => setHovered(true), [])
  const onLeave = useCallback(() => setHovered(false), [])

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`relative overflow-hidden rounded-[20px] transition-all duration-300 bg-cream ${
        path.featured
          ? 'border-[1.5px] border-primary'
          : 'border border-[rgba(27,35,29,0.12)]'
      } ${hovered ? '-translate-y-1.5 shadow-[0_24px_64px_rgba(27,35,29,0.14)]' : path.featured ? 'shadow-[0_8px_32px_rgba(0,140,76,0.1)]' : 'shadow-none'}`}
    >
      {path.featured && (
        <div className='absolute top-0 left-0 right-0 h-0.5 z-[2] bg-gradient-to-r from-primary to-green-mint' />
      )}

      <div className='relative overflow-hidden bg-secondary py-6 px-5 sm:py-8 sm:px-8 pb-6 sm:pb-7'>
        <div className='absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(247,234,203,0.08)_1px,transparent_1px)] bg-[length:18px_18px]' />
        <div
          className={`absolute -top-[40%] -right-[10%] w-[200px] h-[200px] rounded-full blur-[50px] pointer-events-none ${
            path.featured
              ? 'bg-[rgba(0,140,76,0.25)]'
              : 'bg-[rgba(247,234,203,0.04)]'
          }`}
        />

        <div className='flex items-center justify-between mb-5 relative z-[1]'>
          <div className='flex gap-1.5 items-center'>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`rounded-full transition-all ${
                  n <= path.level
                    ? path.level === 1
                      ? 'bg-[#52dda0] w-2 h-2'
                      : path.level === 2
                        ? 'bg-accent w-2 h-2'
                        : 'bg-[#a3d9b8] w-2 h-2'
                    : 'bg-[rgba(247,234,203,0.15)] w-1.5 h-1.5'
                }`}
              />
            ))}
            <span className='text-[10px] font-bold tracking-[0.08em] uppercase text-[rgba(247,234,203,0.4)] font-[inherit] ml-1'>
              {t('paths.level')} {path.level}
            </span>
          </div>
          <span
            className='text-[9px] font-extrabold tracking-[0.1em] uppercase py-[3px] px-[9px] rounded font-[inherit]'
            style={{ background: path.tagColor, color: path.tagText }}
          >
            {path.tag}
          </span>
        </div>

        <div className='w-14 h-14 rounded-[14px] bg-[rgba(247,234,203,0.07)] border border-[rgba(247,234,203,0.12)] flex items-center justify-center mb-4 relative z-[1]'>
          {PathSVGs[path.svgKey]}
        </div>

        <h3 className='font-display text-[22px] text-cream mb-2 leading-tight tracking-tight relative z-[1]'>
          {path.title}
        </h3>
        <p className='text-[13px] text-[rgba(247,234,203,0.65)] leading-[1.65] font-[inherit] relative z-[1]'>
          {path.desc}
        </p>

        <div className='flex gap-5 mt-5 pt-4 border-t border-[rgba(247,234,203,0.08)] relative z-[1]'>
          {[
            { label: t('paths.duration'), value: path.duration },
            { label: t('paths.lessons'), value: path.lessons },
            { label: t('paths.xpReward'), value: path.xp },
          ].map((s) => (
            <div key={s.label}>
              <div className='text-sm font-bold text-cream font-[inherit] leading-none'>
                {s.value}
              </div>
              <div className='text-[10px] text-[rgba(247,234,203,0.4)] uppercase tracking-[0.06em] font-[inherit] mt-[3px]'>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='py-5 px-5 sm:py-6 sm:px-8 pb-6 sm:pb-7 bg-white'>
        <div className='text-[10px] font-bold tracking-[0.1em] uppercase text-[rgba(27,35,29,0.35)] mb-3 font-[inherit]'>
          {t('paths.curriculum')}
        </div>
        <div className='mb-6'>
          {path.modules.map((m, i) => (
            <ProgressModule key={i} {...m} />
          ))}
        </div>
        {path.progress > 0 && (
          <div className='mb-5'>
            <div className='flex justify-between text-[11px] mb-[7px] font-[inherit]'>
              <span className='text-[rgba(27,35,29,0.45)] font-medium'>
                {t('paths.pathProgress')}
              </span>
              <span className='font-bold text-primary'>{path.progress}%</span>
            </div>
            <div className='bg-[rgba(27,35,29,0.07)] rounded-full h-1.5 overflow-hidden'>
              <div
                className='progress-bar'
                style={{ width: `${path.progress}%` }}
              />
            </div>
          </div>
        )}
        <Link
          href={`/en/paths/${path.slug ?? '#'}`}
          className={`w-full py-[11px] rounded-lg text-[13px] font-bold cursor-pointer font-[inherit] flex items-center justify-center gap-2 transition-all ${
            path.featured
              ? 'btn-primary border-none'
              : 'bg-transparent border-[1.5px] border-[rgba(27,35,29,0.2)] text-charcoal hover:border-primary hover:text-primary'
          }`}
        >
          {path.progress > 0 ? t('paths.cont') : t('paths.begin')}
          <ArrowRight size={14} className='shrink-0' strokeWidth={2} />
        </Link>
      </div>
    </div>
  )
}
