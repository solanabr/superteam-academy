import { describe, it, expect } from 'vitest';
import { localePath } from '@/lib/paths';

describe('localePath', () => {
  const locales = ['pt-BR', 'en', 'es'] as const;

  describe('courses path', () => {
    it('translates /courses for pt-BR', () => {
      expect(localePath('pt-BR', '/courses')).toBe('/pt-BR/cursos');
    });
    it('translates /courses for en', () => {
      expect(localePath('en', '/courses')).toBe('/en/courses');
    });
    it('translates /courses for es', () => {
      expect(localePath('es', '/courses')).toBe('/es/cursos');
    });
  });

  describe('dashboard path', () => {
    it('translates /dashboard for pt-BR', () => {
      expect(localePath('pt-BR', '/dashboard')).toBe('/pt-BR/painel');
    });
    it('translates /dashboard for en', () => {
      expect(localePath('en', '/dashboard')).toBe('/en/dashboard');
    });
    it('translates /dashboard for es', () => {
      expect(localePath('es', '/dashboard')).toBe('/es/panel');
    });
  });

  describe('leaderboard path', () => {
    it('translates for all locales', () => {
      expect(localePath('pt-BR', '/leaderboard')).toBe('/pt-BR/classificacao');
      expect(localePath('en', '/leaderboard')).toBe('/en/leaderboard');
      expect(localePath('es', '/leaderboard')).toBe('/es/clasificacion');
    });
  });

  describe('settings path', () => {
    it('translates for all locales', () => {
      expect(localePath('pt-BR', '/settings')).toBe('/pt-BR/configuracoes');
      expect(localePath('en', '/settings')).toBe('/en/settings');
      expect(localePath('es', '/settings')).toBe('/es/configuracion');
    });
  });

  describe('profile path', () => {
    it('translates for all locales', () => {
      expect(localePath('pt-BR', '/profile')).toBe('/pt-BR/perfil');
      expect(localePath('en', '/profile')).toBe('/en/profile');
      expect(localePath('es', '/profile')).toBe('/es/perfil');
    });
  });

  describe('certificates path', () => {
    it('translates for all locales', () => {
      expect(localePath('pt-BR', '/certificates')).toBe('/pt-BR/certificados');
      expect(localePath('en', '/certificates')).toBe('/en/certificates');
      expect(localePath('es', '/certificates')).toBe('/es/certificados');
    });
  });

  describe('challenges path', () => {
    it('translates for all locales', () => {
      expect(localePath('pt-BR', '/challenges')).toBe('/pt-BR/desafios');
      expect(localePath('en', '/challenges')).toBe('/en/challenges');
      expect(localePath('es', '/challenges')).toBe('/es/desafios');
    });
  });

  describe('community path', () => {
    it('translates for all locales', () => {
      expect(localePath('pt-BR', '/community')).toBe('/pt-BR/comunidade');
      expect(localePath('en', '/community')).toBe('/en/community');
      expect(localePath('es', '/community')).toBe('/es/comunidad');
    });
  });

  describe('nested paths', () => {
    it('preserves suffix after known path', () => {
      expect(localePath('en', '/courses/solana-101')).toBe('/en/courses/solana-101');
      expect(localePath('pt-BR', '/courses/solana-101')).toBe('/pt-BR/cursos/solana-101');
    });

    it('preserves deeper nesting', () => {
      expect(localePath('es', '/challenges/123')).toBe('/es/desafios/123');
    });
  });

  describe('unknown paths', () => {
    it('falls back to /{locale}{path} for unknown paths', () => {
      expect(localePath('en', '/unknown')).toBe('/en/unknown');
      expect(localePath('pt-BR', '/random-page')).toBe('/pt-BR/random-page');
    });
  });

  describe('admin path (no translation)', () => {
    it('stays /admin for all locales', () => {
      expect(localePath('pt-BR', '/admin')).toBe('/pt-BR/admin');
      expect(localePath('en', '/admin')).toBe('/en/admin');
      expect(localePath('es', '/admin')).toBe('/es/admin');
    });
  });
});
