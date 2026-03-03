'use client'

import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface H2Props {
  children: ReactNode
  action?: string
}

export function H2({ children, action }: H2Props) {
  return (
    <div className='flex items-center justify-between mb-4'>
      <h2 className='font-display text-[1.05rem] font-bold tracking-[-0.01em] text-charcoal'>
        {children}
      </h2>
      {action && (
        <button className='font-ui text-[0.75rem] font-medium flex items-center gap-0.5 hover:opacity-70 transition-opacity text-green-primary'>
          {action} <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}
