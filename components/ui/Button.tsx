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
    const baseStyles = 'font-semibold rounded-lg transition-all duration-200 disabled:opacity-50'

    const variants = {
      primary:
        'bg-solana-purple hover:bg-solana-purple/80 text-white border-2 border-solana-purple dark:bg-solana-purple dark:hover:bg-solana-purple/80',
      secondary:
        'bg-gray-200 hover:bg-gray-300 text-gray-900 border-2 border-gray-300 dark:bg-terminal-surface dark:hover:bg-terminal-surface/80 dark:text-neon-cyan dark:border-neon-cyan',
      ghost: 'hover:bg-gray-100 dark:hover:bg-terminal-surface/50 text-gray-700 dark:text-neon-cyan border-2 border-transparent',
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
