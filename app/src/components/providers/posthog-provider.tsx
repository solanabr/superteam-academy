// app/src/components/providers/posthog-provider.tsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider as CSPostHogProvider } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useUser } from '@/hooks/useUser'

// Инициализация только на клиенте
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    // Включаем запись сессий (heatmaps)
    session_recording: {
        maskAllInputs: false,
        maskTextSelector: "password"
    }
  })
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <CSPostHogProvider client={posthog}><PostHogPageView />{children}</CSPostHogProvider>
}

// Компонент для отслеживания переходов по страницам и идентификации юзера
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userDb } = useUser();

  // Отслеживаем смену URL
  useEffect(() => {
    if (pathname && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', { '$current_url': url })
    }
  }, [pathname, searchParams])

  // Идентифицируем пользователя, если он залогинился
  useEffect(() => {
      if (userDb?.walletAddress && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
          posthog.identify(userDb.walletAddress, {
              username: userDb.username,
              role: userDb.role,
              xp: userDb.xp
          });
      }
  }, [userDb]);

  return null;
}