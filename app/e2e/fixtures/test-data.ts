/**
 * Shared test data constants for E2E tests.
 *
 * These are static values used across test suites.
 * They do NOT rely on a running backend — tests assert against
 * rendered DOM and static page content.
 */

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

export const MOCK_WALLET_ADDRESS = '7nYBm5dA4rS9FL5DAdYfRF5cV3bTEqZksRqETgJPRg3K';
export const MOCK_WALLET_SHORT = '7nYB...Rg3K';

// ---------------------------------------------------------------------------
// Course
// ---------------------------------------------------------------------------

export const MOCK_COURSE_ID = 'solana-101';
export const MOCK_COURSE_TITLE = 'Solana 101';

// ---------------------------------------------------------------------------
// Credential
// ---------------------------------------------------------------------------

export const MOCK_ASSET_ID = 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ';

// ---------------------------------------------------------------------------
// Locales
// ---------------------------------------------------------------------------

export const LOCALES = ['en', 'pt', 'es'] as const;
export type TestLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: TestLocale = 'en';

// ---------------------------------------------------------------------------
// Routes (locale-prefixed helpers)
// ---------------------------------------------------------------------------

function withLocale(path: string, locale: TestLocale = DEFAULT_LOCALE): string {
  return `/${locale}${path}`;
}

export const ROUTES = {
  landing: (locale?: TestLocale) => withLocale('', locale),
  courses: (locale?: TestLocale) => withLocale('/courses', locale),
  courseDetail: (id: string = MOCK_COURSE_ID, locale?: TestLocale) =>
    withLocale(`/courses/${id}`, locale),
  lesson: (courseId: string = MOCK_COURSE_ID, idx: number = 0, locale?: TestLocale) =>
    withLocale(`/courses/${courseId}/lessons/${idx}`, locale),
  challenge: (courseId: string = MOCK_COURSE_ID, locale?: TestLocale) =>
    withLocale(`/courses/${courseId}/challenge`, locale),
  dashboard: (locale?: TestLocale) => withLocale('/dashboard', locale),
  leaderboard: (locale?: TestLocale) => withLocale('/leaderboard', locale),
  settings: (locale?: TestLocale) => withLocale('/settings', locale),
  profile: (wallet: string = MOCK_WALLET_ADDRESS, locale?: TestLocale) =>
    withLocale(`/profile/${wallet}`, locale),
  credential: (assetId: string = MOCK_ASSET_ID, locale?: TestLocale) =>
    withLocale(`/credentials/${assetId}`, locale),
  admin: (locale?: TestLocale) => withLocale('/admin', locale),
  community: (locale?: TestLocale) => withLocale('/community', locale),
} as const;

// ---------------------------------------------------------------------------
// i18n — expected translations per locale for assertion
// ---------------------------------------------------------------------------

export const I18N = {
  en: {
    heroTitle: 'Master Solana Development',
    heroCta: 'Start Learning',
    navCourses: 'Courses',
    navLeaderboard: 'Leaderboard',
    navCommunity: 'Community',
    catalogTitle: 'Course Catalog',
    settingsTitle: 'Settings',
    leaderboardTitle: 'Leaderboard',
    connectWallet: 'Connect Wallet',
  },
  pt: {
    heroTitle: 'Domine o Desenvolvimento Solana',
    heroCta: 'Começar a Aprender',
    navCourses: 'Cursos',
    navLeaderboard: 'Ranking',
    navCommunity: 'Comunidade',
    catalogTitle: 'Catálogo de Cursos',
    settingsTitle: 'Configurações',
    leaderboardTitle: 'Ranking',
    connectWallet: 'Conectar Carteira',
  },
  es: {
    heroTitle: 'Domina el Desarrollo en Solana',
    heroCta: 'Empezar a Aprender',
    navCourses: 'Cursos',
    navLeaderboard: 'Clasificación',
    navCommunity: 'Comunidad',
    catalogTitle: 'Catálogo de Cursos',
    settingsTitle: 'Configuración',
    leaderboardTitle: 'Clasificación',
    connectWallet: 'Conectar Billetera',
  },
} as const;

// ---------------------------------------------------------------------------
// Viewport presets
// ---------------------------------------------------------------------------

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
} as const;
