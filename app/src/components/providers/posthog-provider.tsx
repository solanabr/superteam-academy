// app/src/components/providers/posthog-provider.tsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider as CSPostHogProvider } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'


export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Инициализируем PostHog только ПОСЛЕ того, как страница отрисовалась (на клиенте)
    // setTimeout переносит выполнение в конец очереди событий браузера (idle)
    const initTimer = setTimeout(() => {
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY && !isInitialized) {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
                session_recording: { maskAllInputs: false, maskTextSelector: "password" },
                autocapture: false, // Отключаем авто-захват, чтобы он не тормозил загрузку
            });
            setIsInitialized(true);
        }
    }, 1000); // Ждем 1 секунду после загрузки страницы

    return () => clearTimeout(initTimer);
  }, [isInitialized]);

  // Не рендерим провайдер, пока PostHog не готов (чтобы не блокировать children)
  // На самом деле, лучше рендерить children всегда, а PostHog оборачивать опционально
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