import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://superteam-academy.vercel.app';

const LOCALES = ['pt-BR', 'en', 'es'] as const;

const STATIC_ROUTES = [
  '',
  '/courses',
  '/challenges',
  '/leaderboard',
  '/community',
];

const COURSE_SLUGS = [
  'intro-solana',
  'anchor-basics',
  'defi-solana',
  'nft-solana',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const route of STATIC_ROUTES) {
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'daily',
        priority: route === '' ? 1.0 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [l, `${BASE_URL}/${l}${route}`])
          ),
        },
      });
    }

    for (const slug of COURSE_SLUGS) {
      entries.push({
        url: `${BASE_URL}/${locale}/courses/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [l, `${BASE_URL}/${l}/courses/${slug}`])
          ),
        },
      });
    }
  }

  return entries;
}
