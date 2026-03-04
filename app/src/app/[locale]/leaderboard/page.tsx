import type { Metadata } from "next";
import { getCourseCards } from "@/lib/courses";
import LeaderboardView from "./leaderboard-view";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See top learners ranked by XP, streaks, and achievements on Superteam Academy.",
};

export default async function LeaderboardPage() {
  const courses = await getCourseCards();

  return <LeaderboardView courses={courses} />;
}
