import { getCourseCards } from "@/lib/courses";
import LeaderboardView from "./leaderboard-view";

export default async function LeaderboardPage() {
  const courses = await getCourseCards();

  return <LeaderboardView courses={courses} />;
}
