import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
   locales: ['en', 'es', 'pt'],
   defaultLocale: 'en',
   localePrefix: {
      mode: 'as-needed'
   },
   pathnames: {
      '/': '/',
      '/courses': '/courses'
   }
});