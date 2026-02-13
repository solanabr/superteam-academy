import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { getPublishedCourses } from '@/lib/data/courses';

export default async function DashboardPage(): Promise<JSX.Element> {
  const courses = await getPublishedCourses();
  return <DashboardClient courses={courses} />;
}
