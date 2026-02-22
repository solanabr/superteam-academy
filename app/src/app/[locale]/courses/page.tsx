import { getCourseCards, getTracks } from "@/lib/courses";
import CoursesView from "./courses-view";

export default async function CoursesPage() {
  const [courses, tracks] = await Promise.all([getCourseCards(), getTracks()]);

  return <CoursesView courses={courses} tracks={tracks} />;
}
