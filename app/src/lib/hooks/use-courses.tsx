"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Course } from "@/types";

interface CoursesContextValue {
  courses: Course[];
  isLoading: boolean;
  getCourseBySlug: (slug: string) => Course | undefined;
  getCourseById: (id: string) => Course | undefined;
  getCoursesByTrack: (trackId: number) => Course[];
}

const CoursesContext = createContext<CoursesContextValue>({
  courses: [],
  isLoading: true,
  getCourseBySlug: () => undefined,
  getCourseById: () => undefined,
  getCoursesByTrack: () => [],
});

let cachedCourses: Course[] | null = null;

export function CoursesProvider({ children, initialCourses }: { children: ReactNode; initialCourses?: Course[] }) {
  const [courses, setCourses] = useState<Course[]>(initialCourses ?? cachedCourses ?? []);
  const [isLoading, setIsLoading] = useState(!initialCourses && !cachedCourses);

  useEffect(() => {
    if (initialCourses) {
      cachedCourses = initialCourses;
      return;
    }
    if (cachedCourses) return;

    fetch("/api/courses")
      .then((res) => res.json())
      .then((data: Course[]) => {
        cachedCourses = data;
        setCourses(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [initialCourses]);

  const getCourseBySlug = (slug: string) =>
    courses.find((c) => c.slug === slug);

  const getCourseById = (id: string) =>
    courses.find((c) => c.id === id);

  const getCoursesByTrack = (trackId: number) =>
    courses.filter((c) => c.trackId === trackId);

  return (
    <CoursesContext.Provider value={{ courses, isLoading, getCourseBySlug, getCourseById, getCoursesByTrack }}>
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  return useContext(CoursesContext);
}
