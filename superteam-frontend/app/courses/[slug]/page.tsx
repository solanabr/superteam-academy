import { Footer } from "@/components/footer";
import { CourseDetail } from "@/components/courses/course-detail";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getCourseProgressSnapshot } from "@/lib/server/academy-progress-adapter";
import { courseService } from "@/lib/cms/course-service";
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
  } catch {
    // On-chain progress unavailable — show course without progress
    snapshot = null;
  }

  if (!snapshot) {
    // Fallback: show course from store without on-chain data
    const course = await courseService.getCourseBySlug(slug);
    if (!course) return notFound();
    snapshot = {
      course: { ...course, progress: 0 },
      enrolledOnChain: false,
      completedLessons: 0,
      enrollmentPda: "",
    };
  }

  return (
    <div className="min-h-screen bg-background">
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
