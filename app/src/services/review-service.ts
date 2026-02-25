import type { CourseReview, ReviewSummary } from "@/types";

export interface ReviewService {
  getReviews(courseId: string): Promise<{
    reviews: CourseReview[];
    summary: ReviewSummary;
  }>;
  getUserReview(courseId: string, userId: string): Promise<CourseReview | null>;
}
