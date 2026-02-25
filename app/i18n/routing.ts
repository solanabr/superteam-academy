import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['pt-BR', 'en', 'es'],
  defaultLocale: 'pt-BR',
  pathnames: {
    '/': '/',
    '/courses': {
      'pt-BR': '/cursos',
      'en': '/courses',
      'es': '/cursos',
    },
    '/dashboard': {
      'pt-BR': '/painel',
      'en': '/dashboard',
      'es': '/panel',
    },
    '/leaderboard': {
      'pt-BR': '/classificacao',
      'en': '/leaderboard',
      'es': '/clasificacion',
    },
  }
});
