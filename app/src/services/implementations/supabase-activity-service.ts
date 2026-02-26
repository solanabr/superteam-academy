import type { ActivityService } from "../activity-service";
import type { ActivityItem } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export const supabaseActivityService: ActivityService = {
  async getActivities(userId, limit = 20) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data ?? []).map(
      (row) =>
        ({
          id: row.id,
          type: row.type,
          title: row.title,
          description: row.description ?? "",
          xp: row.xp ?? 0,
          timestamp: row.created_at,
          courseId: row.course_id ?? undefined,
          lessonIndex: row.lesson_index ?? undefined,
        }) satisfies ActivityItem,
    );
  },

  async logActivity(userId, activity) {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("activities")
      .insert({
        user_id: userId,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        xp: activity.xp ?? 0,
        course_id: activity.courseId ?? null,
        lesson_index: activity.lessonIndex ?? null,
        created_at: activity.timestamp,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      type: data.type,
      title: data.title,
      description: data.description ?? "",
      xp: data.xp ?? 0,
      timestamp: data.created_at,
      courseId: data.course_id ?? undefined,
      lessonIndex: data.lesson_index ?? undefined,
    } satisfies ActivityItem;
  },
};
