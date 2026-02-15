"use client";

import { useState } from "react";
import { CourseCard } from "@/components/course/course-card";
import { COURSES, TRACKS } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { BookOpen, Search } from "lucide-react";

export default function CoursesPage() {
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = COURSES.filter((course) => {
    if (selectedTrack !== null && course.trackId !== selectedTrack) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.creator.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Course Catalog
          </h1>
          <p className="text-muted-foreground mt-2">
            {COURSES.length} courses across {TRACKS.length} tracks. Pick your
            path and start earning XP.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Track filter pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={selectedTrack === null ? "default" : "outline"}
            onClick={() => setSelectedTrack(null)}
          >
            All Tracks
          </Button>
          {TRACKS.filter((t) => t.id > 0).map((track) => (
            <Button
              key={track.id}
              size="sm"
              variant={selectedTrack === track.id ? "default" : "outline"}
              onClick={() =>
                setSelectedTrack(selectedTrack === track.id ? null : track.id)
              }
            >
              {track.display}
            </Button>
          ))}
        </div>

        {/* Course Grid */}
        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No courses found</h3>
            <p className="text-muted-foreground mt-1">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
