'use client'

import { useSession } from '@/libs/auth-client'
import { useAuthStore, type AuthUser } from '@/stores/authStore'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/courses',
  '/paths',
  '/leaderboard',
  '/certificates',
]

// Routes that require admin role
const ADMIN_ROUTES = ['/admin']

function isPublicRoute(pathname: string): boolean {
  // Strip locale prefix (e.g. /en/courses → /courses)
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(-[a-z]{2})?/i, '') || '/'
  return PUBLIC_ROUTES.some(
    (route) => withoutLocale === route || withoutLocale.startsWith(`${route}/`),
  )
}

function isAdminRoute(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(-[a-z]{2})?/i, '') || '/'
  return ADMIN_ROUTES.some(
    (route) => withoutLocale === route || withoutLocale.startsWith(`${route}/`),
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession()
  const { setUser, setLoading, isAuthenticated, needsOnboarding, isAdmin } =
    useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  // Sync Better Auth session → Zustand store
  useEffect(() => {
    if (isPending) {
      setLoading(true)
      return
    }

    if (session?.user) {
      const user: AuthUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        walletAddress: session.user.walletAddress,
        role: session.user.role || 'learner',
        onboardingComplete: session.user.onboardingComplete ?? false,
        username: session.user.username,
        bio: session.user.bio,
        twitter: session.user.twitter,
        github: session.user.github,
        linkedin: session.user.linkedin,
        telegram: session.user.telegram,
      }
      setUser(user)
    } else {
      setUser(null)
    }
  }, [session, isPending, setUser, setLoading])

  // Route protection
  useEffect(() => {
    if (isPending) return // Still loading, don't redirect yet

    const isPublic = isPublicRoute(pathname)

    // Not authenticated and trying to access protected route
    if (!session?.user && !isPublic) {
      const locale = pathname.match(/^\/([a-z]{2}(-[a-z]{2})?)/i)?.[1] || 'en'
      router.replace(`/${locale}/login`)
      return
    }

    // Authenticated but needs onboarding (except if already on set-up page)
    if (
      session?.user &&
      !session.user.onboardingComplete &&
      !pathname.includes('/profile/set-up') &&
      !pathname.includes('/login') &&
      !isPublic
    ) {
      const locale = pathname.match(/^\/([a-z]{2}(-[a-z]{2})?)/i)?.[1] || 'en'
      router.replace(`/${locale}/profile/set-up`)
      return
    }

    // Non-admin accessing admin route
    if (
      session?.user &&
      isAdminRoute(pathname) &&
      session.user.role !== 'admin'
    ) {
      const locale = pathname.match(/^\/([a-z]{2}(-[a-z]{2})?)/i)?.[1] || 'en'
      router.replace(`/${locale}/dashboard`)
      return
    }
  }, [session, isPending, pathname, router])

  return <>{children}</>
}
