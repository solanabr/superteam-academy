import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BookOpen } from 'lucide-react';

type Props = { params: Promise<{ locale: string }> };

export default async function CourseCatalogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('courses');

  const courses = [
    { slug: 'solana-fundamentals', title: 'Solana Fundamentals', difficulty: 'beginner', duration: '4h', xp: 500 },
    { slug: 'anchor-basics', title: 'Anchor Basics', difficulty: 'intermediate', duration: '6h', xp: 800 },
    { slug: 'defi-developer', title: 'DeFi Developer Track', difficulty: 'advanced', duration: '12h', xp: 1500 },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder={t('search')}
          className="max-w-xs flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
        />
        <select className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
          <option>{t('filterByDifficulty')}</option>
        </select>
        <select className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm">
          <option>{t('filterByTopic')}</option>
        </select>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <Link key={c.slug} href={`/courses/${c.slug}`}>
            <article className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-semibold">{c.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(`difficulty.${c.difficulty}`)} · {c.duration} · {c.xp} XP
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                {t('enroll')} →
              </span>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
