'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Filter, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTransition } from 'react';

interface CourseFiltersProps {
  initialSearch?: string;
  initialDifficulty?: string;
  totalCourses: number;
}

export function CourseFilters({ initialSearch, initialDifficulty, totalCourses }: CourseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const difficulties = [
    { label: 'All', value: undefined },
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
  ];

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleDifficulty = (value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('difficulty', value);
    } else {
      params.delete('difficulty');
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <>
      {/* Filters Bar */}
      <div className="mt-16 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="relative w-full lg:max-w-md group">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="pl-12 h-14 bg-white/5 border-white/10 focus:border-primary/50 rounded-2xl transition-all shadow-inner font-medium"
            defaultValue={initialSearch}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10">
          {difficulties.map((d) => (
            <Button
              key={d.label}
              variant={initialDifficulty === d.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleDifficulty(d.value)}
              className={cn(
                "rounded-xl h-10 px-6 font-bold transition-all",
                initialDifficulty === d.value 
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(20,241,149,0.3)]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {d.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-20 mb-12">
        <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] bg-white/5 px-5 py-2.5 rounded-full border border-white/10">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span>{totalCourses} Courses Found</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sort:</span>
          <select 
            className="bg-transparent text-sm font-bold text-foreground outline-none cursor-pointer hover:text-primary transition-colors appearance-none pr-4"
            onChange={(e) => handleSort(e.target.value)}
            defaultValue={searchParams.get('sort') || 'newest'}
          >
            <option value="newest" className="bg-background">Newest</option>
            <option value="popular" className="bg-background">Popular</option>
            <option value="difficulty" className="bg-background">Difficulty</option>
          </select>
        </div>
      </div>
    </>
  );
}
