import { Footer } from "@/components/footer";
import { CourseCatalog } from "@/components/courses/course-catalog";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getAllCourseProgressSnapshots } from "@/lib/server/academy-progress-adapter";
import { courseService } from "@/lib/cms/course-service";
import type { CourseCardData } from "@/lib/course-catalog";

const PAGE_SIZE = 6;

function toCard(course: {
  slug: string;
  title: string;
  description: string;
  instructor: string;
  instructorAvatar: string;
  difficulty: string;
  duration: string;
  lessons: number;
  rating: number;
  enrolled: number;
  tags: string[];
  progress: number;
  xp: number;
  thumbnail: string;
}): CourseCardData {
  return {
    slug: course.slug,
    title: course.title,
    description: course.description,
    instructor: course.instructor,
    instructorAvatar: course.instructorAvatar,
    difficulty: course.difficulty as CourseCardData["difficulty"],
    duration: course.duration,
    lessons: course.lessons,
    rating: course.rating,
    enrolled: course.enrolled,
    tags: course.tags,
    progress: course.progress,
    xp: course.xp,
    thumbnail: course.thumbnail,
  };
}

export default async function CoursesPage() {
  const user = await requireAuthenticatedUser();

  const allCourses = await courseService.getAllCourses();
  const firstPage = allCourses.slice(0, PAGE_SIZE);

  let initialCards: CourseCardData[];
  try {
    const snapshots = await getAllCourseProgressSnapshots(
      user.walletAddress,
      firstPage.map((c) => c.slug),
    );
    initialCards = snapshots.map((s) => toCard(s.course));
  } catch {
    initialCards = firstPage.map((c) => toCard({ ...c, progress: 0 }));
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground lg:text-4xl">
            Course Catalog
          </h1>
          <p className="mt-2 text-muted-foreground">
            Master blockchain development with hands-on interactive courses.
          </p>
        </div>
        <CourseCatalog
          initialCourses={initialCards}
          totalCourses={allCourses.length}
        />
      </main>
      <Footer />
    </div>
  );
}
