import { notFound } from 'next/navigation';
import { CourseDetailPageClient } from '@/components/courses/course-detail-page-client';
import { getPublishedCourseBySlug } from '@/lib/data/courses';

export default async function CourseDetailPage({
  params
}: {
  params: { slug: string };
}): Promise<JSX.Element> {
  const course = await getPublishedCourseBySlug(params.slug);

  if (!course) {
    notFound();
  }

  return <CourseDetailPageClient course={course} />;
}
