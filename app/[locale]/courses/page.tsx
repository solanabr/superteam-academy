import { courseService } from '@/lib/services/course.service';
import { CourseCard } from '@/components/course/course-card';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { CourseFilters } from '@/components/course/course-filters';

interface CoursesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CoursesPage({ params, searchParams }: CoursesPageProps) {
  const { locale } = await params;
  const p = await searchParams;
  const difficulty = typeof p.difficulty === 'string' ? p.difficulty as 'beginner' | 'intermediate' | 'advanced' : undefined;
  const category = typeof p.category === 'string' ? p.category : undefined;
  const search = typeof p.search === 'string' ? p.search : undefined;
  const sort = typeof p.sort === 'string' ? p.sort : 'newest';

  let courses = await courseService.getCourses({ difficulty, category, search });
  
  // Apply sorting
  if (sort === 'difficulty') {
    const diffOrder = { beginner: 0, intermediate: 1, advanced: 2 };
    courses = [...courses].sort((a, b) => 
      (diffOrder[a.difficulty as keyof typeof diffOrder] || 0) - 
      (diffOrder[b.difficulty as keyof typeof diffOrder] || 0)
    );
  } else if (sort === 'popular') {
    courses = [...courses].sort((a, b) => (b.xp_reward || 0) - (a.xp_reward || 0));
  } else {
    // Default: newest
    courses = [...courses].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const t = await getTranslations('Common');

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="relative overflow-hidden border-b border-white/5 bg-card/30 backdrop-blur-sm pt-20 pb-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(20,241,149,0.05)_0%,transparent_70%)]" />
        
        <div className="container relative z-10">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">
              EXPLORE THE <span className="gradient-text">CATALOG</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl font-medium">
              From zero to Solana hero. Explore our collection of interactive courses designed for every skill level.
            </p>
          </div>
          
          <CourseFilters 
            initialSearch={search} 
            initialDifficulty={difficulty} 
            totalCourses={courses.length} 
          />
        </div>
      </section>

      {/* Main Catalog */}
      <section className="container py-20">
        {courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-6">
            <div className="inline-flex p-6 rounded-3xl bg-white/5 border border-white/10">
              <BookOpen className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black">No courses found</h3>
              <p className="text-muted-foreground font-medium">Try adjusting your filters or search query.</p>
            </div>
            <Button variant="outline" className="rounded-xl" asChild>
              <Link href="/courses">Clear all filters</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
