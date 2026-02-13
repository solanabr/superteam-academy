import { LeaderboardClient } from '@/components/leaderboard/leaderboard-client';
import { getPublishedCourses } from '@/lib/data/courses';

export default async function LeaderboardPage(): Promise<JSX.Element> {
  const courses = await getPublishedCourses();
  return <LeaderboardClient courses={courses} />;
}
