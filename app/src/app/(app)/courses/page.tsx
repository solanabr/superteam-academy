import { getCourses, getTracks } from "../../../lib/cms/sanity";
import type { Course, Track } from "../../../lib/cms/schemas";
import { CoursesContent } from "./CoursesContent";

export const revalidate = 60;

export const metadata = {
  title: "Courses | Caminho.",
  description: "Browse Solana development courses - from beginner to advanced.",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [courses, tracks, params]: [Course[], Track[], { q?: string }] = await Promise.all([
    getCourses(),
    getTracks(),
    searchParams,
  ]);

  return <CoursesContent courses={courses} tracks={tracks} initialQuery={params.q} />;
}
