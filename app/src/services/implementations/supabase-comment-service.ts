import type { CommentService } from "../comment-service";
import type { Comment } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface ProfileInfo {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

function mapRow(
  row: Record<string, unknown>,
  profileMap: Map<string, ProfileInfo>,
): Comment {
  const userId = row.user_id as string;
  const profile = profileMap.get(userId);
  return {
    id: row.id as string,
    userId,
    courseId: row.course_id as string,
    lessonIndex: row.lesson_index as number,
    parentId: (row.parent_id as string) ?? undefined,
    content: row.content as string,
    isHelpful: (row.is_helpful as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    author: {
      username: profile?.username ?? "anonymous",
      displayName: profile?.displayName ?? "Anonymous",
      avatarUrl: profile?.avatarUrl ?? null,
    },
    helpfulCount: (row.helpful_count as number) ?? 0,
    replies: [],
  };
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

export const supabaseCommentService: CommentService = {
  async getComments(courseId, lessonIndex) {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("course_id", courseId)
      .eq("lesson_index", lessonIndex)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Comments] Fetch error:", error.message);
      return [];
    }

    const commentRows = data ?? [];
    const userIds = [...new Set(commentRows.map((r) => r.user_id as string))];
    const profileMap = await fetchProfiles(supabase, userIds);

    const rows = commentRows.map((row) =>
      mapRow({ ...row, helpful_count: 0 }, profileMap),
    );

    // Build thread tree
    const rootComments: Comment[] = [];
    const byId = new Map<string, Comment>();
    for (const c of rows) {
      byId.set(c.id, c);
    }
    for (const c of rows) {
      if (c.parentId && byId.has(c.parentId)) {
        byId.get(c.parentId)!.replies.push(c);
      } else {
        rootComments.push(c);
      }
    }

    return rootComments;
  },

  async createComment(userId, courseId, lessonIndex, content, parentId) {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("comments")
      .insert({
        user_id: userId,
        course_id: courseId,
        lesson_index: lessonIndex,
        parent_id: parentId ?? null,
        content,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const profileMap = await fetchProfiles(supabase, [userId]);
    return mapRow({ ...data, helpful_count: 0 }, profileMap);
  },

  async updateComment(userId, commentId, content) {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("comments")
      .update({ content })
      .eq("id", commentId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const profileMap = await fetchProfiles(supabase, [userId]);
    return mapRow({ ...data, helpful_count: 0 }, profileMap);
  },

  async deleteComment(userId, commentId) {
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  },

  async markHelpful(helpedUserId, commentId, helperId) {
    const supabase = createSupabaseBrowserClient();

    // Insert help record
    const { error } = await supabase.from("community_help").insert({
      helper_id: helperId,
      helped_user_id: helpedUserId,
      comment_id: commentId,
    });

    if (error) {
      if (error.code === "23505") return; // Already marked
      throw new Error(error.message);
    }

    // Mark comment as helpful
    await supabase
      .from("comments")
      .update({ is_helpful: true })
      .eq("id", commentId);
  },
};
