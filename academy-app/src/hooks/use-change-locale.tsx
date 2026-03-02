'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

export function useChangeLocale() {
   const router = useRouter()
   const pathname = usePathname()
   const currentLocale = useLocale()

   const setLocale = (newLocale: string) => {
      // Replace the locale segment in the path
      console.log(pathname)
      let newPath;
      if (currentLocale === 'en') 
         newPath = `/${newLocale}${pathname}`
      else newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
      console.log(newPath)
      router.push(newPath)
   }

   return { locale: currentLocale, setLocale }
}