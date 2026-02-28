import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['pt-BR', 'en', 'es'],
  defaultLocale: 'pt-BR',
  localeDetection: false,
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
    '/profile': {
      'pt-BR': '/perfil',
      'en': '/profile',
      'es': '/perfil',
    },
    '/profile/[address]': {
      'pt-BR': '/perfil/[address]',
      'en': '/profile/[address]',
      'es': '/perfil/[address]',
    },
    '/certificates': {
      'pt-BR': '/certificados',
      'en': '/certificates',
      'es': '/certificados',
    },
    '/certificates/[id]': {
      'pt-BR': '/certificados/[id]',
      'en': '/certificates/[id]',
      'es': '/certificados/[id]',
    },
    '/challenges': {
      'pt-BR': '/desafios',
      'en': '/challenges',
      'es': '/desafios',
    },
    '/challenges/[id]': {
      'pt-BR': '/desafios/[id]',
      'en': '/challenges/[id]',
      'es': '/desafios/[id]',
    },
    '/community': {
      'pt-BR': '/comunidade',
      'en': '/community',
      'es': '/comunidad',
    },
    '/onboarding': {
      'pt-BR': '/boas-vindas',
      'en': '/onboarding',
      'es': '/bienvenida',
    },
    '/teach': {
      'pt-BR': '/ensinar',
      'en': '/teach',
      'es': '/ensenar',
    },
    '/offline': {
      'pt-BR': '/offline',
      'en': '/offline',
      'es': '/sin-conexion',
    },
    '/teach/new': {
      'pt-BR': '/ensinar/novo',
      'en': '/teach/new',
      'es': '/ensenar/nuevo',
    },
  }
});
