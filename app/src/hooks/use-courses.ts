"use client";

import { courseService } from "@/lib/services/course-service";
import type { Course } from "@/types";
import { useEffect, useState } from "react";

export const useCourses = (query = "", difficulty?: Course["difficulty"]) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadCourses = async (): Promise<void> => {
      const data =
        query || difficulty
          ? await courseService.searchCourses(query, difficulty)
          : await courseService.getAllCourses();
      if (active) {
        setCourses(data);
        setLoading(false);
      }
    };
    void loadCourses();

    return () => {
      active = false;
    };
  }, [query, difficulty]);

  return { courses, loading };
};
