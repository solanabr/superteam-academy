'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { AuthProvider as BackendAuthProvider } from '@/lib/hooks/useAuth'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <BackendAuthProvider>{children}</BackendAuthProvider>
    </SessionProvider>
  )
}
