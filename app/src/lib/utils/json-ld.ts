import type { CourseWithMeta } from '@/lib/stores/course-store';

const DIFFICULTY_LABELS: Record<number, string> = {
  0: 'Beginner',
  1: 'Intermediate',
  2: 'Advanced',
};

export function getOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Superteam Academy',
    url: 'https://superteam-academy.rectorspace.com',
    description:
      'Learn Solana development with interactive courses, soulbound XP tokens, and on-chain credentials.',
    sameAs: ['https://github.com/solanabr/superteam-academy'],
  };
}

export function getCourseJsonLd(course: CourseWithMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Superteam Academy',
    },
    educationalLevel: DIFFICULTY_LABELS[course.difficulty] ?? 'Beginner',
    inLanguage: ['en', 'pt-BR', 'es'],
    isAccessibleForFree: true,
    timeRequired: `PT${course.estimatedHours}H`,
    numberOfLessons: course.lessonCount,
  };
}

export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
