import { getAllCourses } from "@/lib/data-service";
import { AdminDashboard } from "@/components/admin";

export const revalidate = 3600;

export default async function AdminPage() {
  const courses = await getAllCourses();
  return <AdminDashboard courses={courses} />;
}
