import type { Metadata } from "next";
import { getCourseCards, getTracks } from "@/lib/courses";
import CoursesView from "./courses-view";

export const metadata: Metadata = {
  title: "Explore Courses",
  description: "Browse Solana courses, earn XP, and collect on-chain credentials at Superteam Academy.",
};

export default async function CoursesPage() {
  const [courses, tracks] = await Promise.all([getCourseCards(), getTracks()]);

  return <CoursesView courses={courses} tracks={tracks} />;
}
