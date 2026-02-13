'use client'

import { useAnalytics } from '@/hooks/use-analytics'
import React from 'react'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // Initialize analytics tracking
  useAnalytics()
  
  return <>{children}</>
}
