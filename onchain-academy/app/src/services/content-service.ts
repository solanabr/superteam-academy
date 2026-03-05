import { apiFetch } from "@/lib/api-client";
import type { CourseDetail, CourseSummary } from "@/types/domain";
import type { ContentService } from "./interfaces";

class BackendContentService implements ContentService {
  async getCourses(filters?: {
    search?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
    topic?: string;
    duration?: "short" | "medium" | "long";
  }): Promise<CourseSummary[]> {
    const query = new URLSearchParams();
    if (filters?.search) {
      query.set("search", filters.search);
    }
    if (filters?.difficulty) {
      query.set("difficulty", filters.difficulty);
    }
    if (filters?.topic) {
      query.set("topic", filters.topic);
    }
    if (filters?.duration) {
      query.set("duration", filters.duration);
    }

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiFetch<CourseSummary[]>(`/courses${suffix}`);
  }

  async getCourseBySlug(slug: string): Promise<CourseDetail | null> {
    try {
      return await apiFetch<CourseDetail>(`/courses/${slug}`);
    } catch {
      return null;
    }
  }
}

export const contentService: ContentService = new BackendContentService();
