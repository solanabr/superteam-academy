'use client'

import React from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'w-full px-4 py-2 bg-white dark:bg-terminal-bg border-2 border-gray-300 dark:border-terminal-border rounded-lg',
        'text-gray-900 dark:text-foreground placeholder:text-gray-400 dark:placeholder:text-gray-500',
        'focus:outline-none focus:border-blue-600 dark:focus:border-neon-cyan focus:shadow-lg focus:shadow-blue-600/20 dark:focus:shadow-neon-cyan/20',
        'transition-all duration-200',
        className
      )}
      {...props}
    />
  )
)

Input.displayName = 'Input'
