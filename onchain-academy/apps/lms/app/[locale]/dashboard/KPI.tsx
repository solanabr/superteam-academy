'use client'

import type { ReactNode } from 'react'

interface KPIProps {
  icon: ReactNode
  value: string
  label: string
  delta?: string
  ibgClass: string
  icClass: string
  delay?: number
}

export function KPI({
  icon,
  value,
  label,
  delta,
  ibgClass,
  icClass,
  delay = 0,
}: KPIProps) {
  return (
    <div
      className='card-warm rounded-2xl p-5 flex flex-col gap-3 animate-[fade-up_0.5s_ease_forwards] opacity-0'
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`w-10 h-10 rounded-[9px] flex items-center justify-center ${ibgClass} ${icClass}`}
      >
        {icon}
      </div>
      <div>
        <div className='font-display text-[1.85rem] font-black leading-none tracking-[-0.025em] text-charcoal'>
          {value}
        </div>
        <div className='flex items-center justify-between mt-1.5'>
          <span className='font-ui text-[0.7rem] text-text-tertiary'>
            {label}
          </span>
          {delta && (
            <span className='font-ui text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-green-primary/10 text-green-primary'>
              {delta}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
