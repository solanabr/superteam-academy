'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { analytics } from '@/lib/services/analytics.service'

/**
 * Hook to automatically track page views in Next.js App Router
 */
export function useAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      analytics.trackPageView(pathname)
    }
  }, [pathname])

  return analytics
}
