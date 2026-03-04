"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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
let cachedAt = 0;
const CACHE_TTL = 30_000;

export function CoursesProvider({
  children,
  initialCourses,
}: {
  children: ReactNode;
  initialCourses?: Course[];
}) {
  const [courses, setCourses] = useState<Course[]>(
    initialCourses ?? cachedCourses ?? [],
  );
  const [isLoading, setIsLoading] = useState(!initialCourses && !cachedCourses);

  useEffect(() => {
    if (initialCourses) {
      cachedCourses = initialCourses;
      cachedAt = Date.now();
      return;
    }
    if (cachedCourses && Date.now() - cachedAt < CACHE_TTL) return;

    fetch("/api/courses")
      .then((res) => res.json())
      .then((data: Course[]) => {
        cachedCourses = data;
        cachedAt = Date.now();
        setCourses(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [initialCourses]);

  const getCourseBySlug = (slug: string) =>
    courses.find((c) => c.slug === slug);

  const getCourseById = (id: string) => courses.find((c) => c.id === id);

  const getCoursesByTrack = (trackId: number) =>
    courses.filter((c) => c.trackId === trackId);

  return (
    <CoursesContext.Provider
      value={{
        courses,
        isLoading,
        getCourseBySlug,
        getCourseById,
        getCoursesByTrack,
      }}
    >
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  return useContext(CoursesContext);
}
