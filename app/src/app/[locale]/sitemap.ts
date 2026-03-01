import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://academy.superteam.fun';

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['en', 'pt', 'es'];
  const staticRoutes = [
    '',
    '/courses',
    '/dashboard',
    '/leaderboard',
    '/settings',
    '/community',
    '/challenges',
    '/onboarding',
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'daily',
        priority: route === '' ? 1.0 : 0.8,
      });
    }
  }

  return entries;
}
