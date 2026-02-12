import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { CourseDetailClient } from './course-detail-client';

type Props = { params: Promise<{ locale: string; slug: string }> };

const COURSE_META: Record<string, { title: string; difficulty: string; duration: string; xp: number }> = {
  'solana-fundamentals': {
    title: 'Solana Fundamentals',
    difficulty: 'beginner',
    duration: '4h',
    xp: 500,
  },
  'anchor-basics': {
    title: 'Anchor Basics',
    difficulty: 'intermediate',
    duration: '6h',
    xp: 800,
  },
  'defi-developer': {
    title: 'DeFi Developer Track',
    difficulty: 'advanced',
    duration: '12h',
    xp: 1500,
  },
};

const MODULES = [
  { id: '1', title: 'Module 1: Introduction', lessonCount: 3, startIndex: 0 },
  { id: '2', title: 'Module 2: Core Concepts', lessonCount: 4, startIndex: 3 },
  { id: '3', title: 'Module 3: Building dApps', lessonCount: 5, startIndex: 7 },
];

export default async function CourseDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('courses');

  const meta = COURSE_META[slug] ?? {
    title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    difficulty: 'beginner',
    duration: '6h',
    xp: 800,
  };

  const difficultyLabel = t(`difficulty.${meta.difficulty as 'beginner' | 'intermediate' | 'advanced'}`);

  return (
    <CourseDetailClient
      slug={slug}
      modules={MODULES}
      title={meta.title}
      difficultyLabel={difficultyLabel}
      duration={meta.duration}
      xpEarn={meta.xp}
    />
  );
}
