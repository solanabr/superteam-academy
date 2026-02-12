import { courseService } from '@/lib/services/course.service';
import { CourseCard } from '@/components/course/course-card';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CoursesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const difficulty = typeof params.difficulty === 'string' ? params.difficulty as 'beginner' | 'intermediate' | 'advanced' : undefined;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const search = typeof params.search === 'string' ? params.search : undefined;

  const courses = await courseService.getCourses({ difficulty, category, search });

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">All Courses</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explore our comprehensive catalog of Solana development courses
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses..."
              className="pl-10"
              defaultValue={search}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant={!difficulty ? 'default' : 'outline'} size="sm">
            All
          </Button>
          <Button variant={difficulty === 'beginner' ? 'default' : 'outline'} size="sm">
            Beginner
          </Button>
          <Button variant={difficulty === 'intermediate' ? 'default' : 'outline'} size="sm">
            Intermediate
          </Button>
          <Button variant={difficulty === 'advanced' ? 'default' : 'outline'} size="sm">
            Advanced
          </Button>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.length > 0 ? (
          courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))
        ) : (
          <div className="col-span-full rounded-lg border border-dashed border-border p-12 text-center">
            <Filter className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No courses found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
