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
    '/courses/[slug]': {
      'pt-BR': '/cursos/[slug]',
      'en': '/courses/[slug]',
      'es': '/cursos/[slug]',
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
    '/lessons/[id]': {
      'pt-BR': '/aulas/[id]',
      'en': '/lessons/[id]',
      'es': '/lecciones/[id]',
    },
    '/settings': {
      'pt-BR': '/configuracoes',
      'en': '/settings',
      'es': '/configuracion',
    },
    '/profile/[address]': {
      'pt-BR': '/perfil/[address]',
      'en': '/profile/[address]',
      'es': '/perfil/[address]',
    },
    '/certificates/[id]': {
      'pt-BR': '/certificados/[id]',
      'en': '/certificates/[id]',
      'es': '/certificados/[id]',
    },
    '/challenges/[id]': {
      'pt-BR': '/desafios/[id]',
      'en': '/challenges/[id]',
      'es': '/desafios/[id]',
    },
  }
});
