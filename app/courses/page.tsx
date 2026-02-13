import { CoursesPageClient } from '@/components/courses/courses-page-client';
import { getPublishedCourses } from '@/lib/data/courses';

export default async function CoursesPage(): Promise<JSX.Element> {
  const courses = await getPublishedCourses();
  return <CoursesPageClient courses={courses} />;
}
