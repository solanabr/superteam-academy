import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CourseCatalog } from "@/components/courses/course-catalog";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getAllCourseProgressSnapshots } from "@/lib/server/academy-progress-adapter";

export default async function CoursesPage() {
  const user = await requireAuthenticatedUser();
  let snapshots: Awaited<ReturnType<typeof getAllCourseProgressSnapshots>>;
  try {
    snapshots = await getAllCourseProgressSnapshots(user.walletAddress);
  } catch (error: any) {
    // Network error - show courses without progress (offline mode)
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("Network error") ||
      error?.message?.includes("ECONNREFUSED")
    ) {
      console.warn(
        "Network error loading course progress, showing courses without progress:",
        error.message,
      );
      snapshots = [];
    } else {
      throw error;
    }
  }
  const courseList = snapshots.map((item) => item.course);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground lg:text-4xl">
            Course Catalog
          </h1>
          <p className="mt-2 text-muted-foreground">
            Master blockchain development with hands-on interactive courses.
          </p>
        </div>
        <CourseCatalog courses={courseList} />
      </main>
      <Footer />
    </div>
  );
}
