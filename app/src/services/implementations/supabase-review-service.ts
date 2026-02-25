import type { ReviewService } from "../review-service";
import type { CourseReview, ReviewSummary } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface ProfileInfo {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

async function fetchProfiles(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  userIds: string[],
): Promise<Map<string, ProfileInfo>> {
  const map = new Map<string, ProfileInfo>();
  if (userIds.length === 0) return map;

  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", userIds);

  for (const row of data ?? []) {
    map.set(row.id, {
      username: row.username ?? "anonymous",
      displayName: row.display_name ?? "Anonymous",
      avatarUrl: row.avatar_url ?? null,
    });
  }
  return map;
}

function mapRow(
  row: Record<string, unknown>,
  profileMap: Map<string, ProfileInfo>,
): CourseReview {
  const userId = row.user_id as string;
  const profile = profileMap.get(userId);
  return {
    id: row.id as string,
    userId,
    courseId: row.course_id as string,
    rating: row.rating as number,
    content: (row.content as string) ?? "",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    author: {
      username: profile?.username ?? "anonymous",
      displayName: profile?.displayName ?? "Anonymous",
      avatarUrl: profile?.avatarUrl ?? null,
    },
  };
}

export const supabaseReviewService: ReviewService = {
  async getReviews(courseId) {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("course_reviews")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Reviews] Fetch error:", error.message);
      return { reviews: [], summary: { count: 0, avgRating: 0 } };
    }

    const rows = data ?? [];
    const userIds = [...new Set(rows.map((r) => r.user_id as string))];
    const profileMap = await fetchProfiles(supabase, userIds);

    const reviews = rows.map((row) => mapRow(row, profileMap));

    const count = reviews.length;
    const avgRating =
      count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

    const summary: ReviewSummary = {
      count,
      avgRating: Math.round(avgRating * 10) / 10,
    };

    return { reviews, summary };
  },

  async getUserReview(courseId, userId) {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("course_reviews")
      .select("*")
      .eq("course_id", courseId)
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;

    const profileMap = await fetchProfiles(supabase, [userId]);
    return mapRow(data, profileMap);
  },
};
