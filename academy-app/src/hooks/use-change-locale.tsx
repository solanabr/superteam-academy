'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '~/i18n/navigation'
import { routing } from '~/i18n/routing'

const DEFAULT_LOCALE = routing.defaultLocale  // 'en'

export function useChangeLocale() {
   const router = useRouter()
   const pathname = usePathname()      // locale-stripped path, e.g. /dashboard
   const currentLocale = useLocale()   // e.g. 'es'

   const setLocale = (newLocale: string) => {
      // next-intl's locale-aware router.push() handles prefixing automatically.
      // usePathname() from ~/i18n/navigation already strips the locale prefix,
      // so we can pass the clean path directly.
      router.push(pathname, { locale: newLocale })
   }

   return { locale: currentLocale, setLocale }
}