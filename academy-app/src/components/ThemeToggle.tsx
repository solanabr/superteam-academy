'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
   const { theme, setTheme } = useTheme()
   const [mounted, setMounted] = useState(false)

   // Avoid hydration mismatch
   useEffect(() => setMounted(true), [])
   if (!mounted) return null

   return (
      <button
         onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
         className="rounded-full bg-foreground px-1 text-gray-800 dark:text-gray-100 transition-colors"
         aria-label="Toggle dark mode"
      >
         {theme === 'dark' ? '☀️' : '🌙'}
      </button>
   )
}