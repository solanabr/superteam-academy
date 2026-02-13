import { cn } from '@/lib/utils';
import { courseService } from '@/lib/services/course.service';
import { CourseCard } from '@/components/course/course-card';
import { Search, Filter, BookOpen, Layers, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

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

  const courses = await courseService.getCourses({ difficulty, category, search });
  const t = await getTranslations('Common');

  const difficulties = [
    { label: 'All', value: undefined },
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
  ];

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
          
          {/* Filters Bar */}
          <div className="mt-16 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="relative w-full lg:max-w-md group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                type="search"
                placeholder="Search courses..."
                className="pl-12 h-14 bg-white/5 border-white/10 focus:border-primary/50 rounded-2xl transition-all shadow-inner font-medium"
                defaultValue={search}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10">
              {difficulties.map((d) => (
                <Button
                  key={d.label}
                  variant={difficulty === d.value ? 'secondary' : 'ghost'}
                  size="sm"
                  asChild
                  className={cn(
                    "rounded-xl h-10 px-6 font-bold transition-all",
                    difficulty === d.value 
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(20,241,149,0.3)]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Link href={`/courses${d.value ? `?difficulty=${d.value}` : ''}` as any}>
                    {d.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog */}
      <section className="container py-20">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] bg-white/5 px-5 py-2.5 rounded-full border border-white/10">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>{courses.length} Courses Found</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sort:</span>
            <select className="bg-transparent text-sm font-bold text-foreground outline-none cursor-pointer hover:text-primary transition-colors appearance-none pr-4">
              <option className="bg-background">Newest</option>
              <option className="bg-background">Popular</option>
              <option className="bg-background">Difficulty</option>
            </select>
          </div>
        </div>

        {courses.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
