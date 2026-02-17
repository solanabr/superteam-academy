import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CourseDetail } from "@/components/courses/course-detail";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getCourseProgressSnapshot } from "@/lib/server/academy-progress-adapter";
import { notFound } from "next/navigation";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const { slug } = await params;
  let snapshot;
  try {
    snapshot = await getCourseProgressSnapshot(user.walletAddress, slug);
  } catch (error: any) {
    // Network error - show course without progress
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("Network error") ||
      error?.message?.includes("ECONNREFUSED")
    ) {
      console.warn("Network error loading course progress:", error.message);
      snapshot = null;
    } else {
      throw error;
    }
  }
  if (!snapshot) return notFound();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <CourseDetail
          course={snapshot.course}
          enrolledOnChain={snapshot.enrolledOnChain}
        />
      </main>
      <Footer />
    </div>
  );
}
