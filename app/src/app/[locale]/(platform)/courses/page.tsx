'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { SearchBar } from '@/components/courses/search-bar';
import { FilterSidebar } from '@/components/courses/filter-sidebar';
import { CourseGrid } from '@/components/courses/course-grid';
import { useCourseList } from '@/lib/hooks/use-course';
import { useCourseStore } from '@/lib/stores/course-store';
import { useUserStore } from '@/lib/stores/user-store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countActive(filters: { track: string | null; difficulty: string | null; duration: string | null; searchQuery: string; sortBy: string }): number {
  let count = 0;
  if (filters.track) count++;
  if (filters.difficulty) count++;
  if (filters.duration) count++;
  if (filters.searchQuery.trim()) count++;
  if (filters.sortBy !== 'newest') count++;
  return count;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CoursesPage() {
  const t = useTranslations('courses');

  const {
    filteredCourses,
    filters,
    setFilter,
    resetFilters,
    isLoading,
  } = useCourseList();

  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const enrollments = useUserStore((s) => s.enrollments);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const activeFilterCount = countActive(filters);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          {t('catalog_title')}
        </h1>
        <p className="text-muted-foreground text-sm lg:text-base">
          {t('catalog_description')}
        </p>
      </div>

      {/* Search bar + mobile filter toggle */}
      <div className="flex items-center gap-3">
        <SearchBar
          value={filters.searchQuery}
          onChange={(q) => setFilter('searchQuery', q)}
          className="flex-1"
        />

        {/* Mobile filter trigger */}
        <Button
          variant="outline"
          size="default"
          onClick={() => setMobileFiltersOpen(true)}
          className="relative lg:hidden"
          aria-label={t('filter_filters')}
        >
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">{t('filter_filters')}</span>
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 size-5 items-center justify-center p-0 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Main layout: sidebar + grid */}
      <div className="flex gap-8">
        {/* Desktop filter sidebar */}
        <FilterSidebar
          filters={filters}
          onFilterChange={setFilter}
          onReset={resetFilters}
          className="hidden w-56 shrink-0 lg:flex"
        />

        {/* Course grid */}
        <CourseGrid
          courses={filteredCourses}
          enrollments={enrollments}
          isLoading={isLoading}
          className="flex-1"
        />
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('filter_filters')}</SheetTitle>
            <SheetDescription className="sr-only">
              {t('catalog_description')}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <FilterSidebar
              filters={filters}
              onFilterChange={(key, value) => {
                setFilter(key, value);
              }}
              onReset={() => {
                resetFilters();
                setMobileFiltersOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
