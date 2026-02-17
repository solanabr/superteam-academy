import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CourseDetailSkeleton } from "@/components/skeletons/course-detail-skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <CourseDetailSkeleton />
      </main>
      <Footer />
    </div>
  );
}
