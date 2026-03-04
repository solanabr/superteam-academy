'use client'

import React from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', isLoading = false, children, ...props },
    ref
  ) => {
    const baseStyles =
      'rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 dark:focus-visible:ring-neon-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-terminal-bg'

    const variants = {
      primary:
        'border-2 border-solana-purple bg-solana-purple text-white shadow-sm hover:-translate-y-0.5 hover:bg-solana-purple/90 hover:shadow-[0_10px_20px_-14px_rgba(153,69,255,0.9)] dark:border-neon-cyan/45 dark:bg-gradient-to-r dark:from-solana-purple dark:via-solana-purple dark:to-neon-cyan dark:text-white dark:hover:to-neon-green',
      secondary:
        'border-2 border-gray-300 bg-white text-gray-900 shadow-sm hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-50 hover:shadow-[0_8px_16px_-14px_rgba(37,99,235,0.8)] dark:border-neon-cyan/65 dark:bg-terminal-surface dark:text-neon-cyan dark:hover:bg-terminal-surface/80 dark:hover:border-neon-cyan',
      ghost:
        'border border-transparent text-blue-700 hover:border-blue-200 hover:bg-blue-50 dark:text-neon-cyan dark:hover:border-neon-cyan/35 dark:hover:bg-terminal-surface/50',
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="animate-spin">⚙️</span> {children}
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
