import { HomePage } from '@/components/home/home-page';
import { getPublishedCourses } from '@/lib/data/courses';

export default async function LandingPage(): Promise<JSX.Element> {
  const courses = await getPublishedCourses();
  return <HomePage courses={courses} />;
}
