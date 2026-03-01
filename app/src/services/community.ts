import { getAdminClient } from "@/lib/supabase/admin";
import type { CommunityPost, CommunityService, GetPostsParams, PostLiker } from "./interfaces";

const SELECT_FIELDS = "id, title, content, course_id, upvotes, created_at, user_id, parent_id, type, tags, profiles!community_posts_user_id_fkey(display_name, username, avatar_url)";

function mapPost(row: Record<string, unknown>, likedPostIds: Set<string> = new Set()): CommunityPost {
  const profile = row.profiles as Record<string, unknown> | null;
  return {
    id: row.id as string,
    author: (profile?.display_name as string) ?? "Anonymous",
    authorUsername: (profile?.username as string) ?? null,
    authorAvatarUrl: (profile?.avatar_url as string) ?? null,
    title: (row.title as string) ?? "",
    content: (row.content as string) ?? "",
    courseId: (row.course_id as string) ?? null,
    type: (row.type as CommunityPost["type"]) ?? "post",
    tags: (row.tags as string[]) ?? [],
    upvotes: (row.upvotes as number) ?? 0,
    replies: (row.reply_count as number) ?? 0,
    liked: likedPostIds.has(row.id as string),
    createdAt: row.created_at as string,
  };
}

class SupabaseCommunityService implements CommunityService {
  private get db() {
    const client = getAdminClient();
    if (!client) throw new Error("Supabase not configured");
    return client;
  }

  async getPosts(params: GetPostsParams): Promise<{ posts: CommunityPost[]; total: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const sort = params.sort ?? "newest";
    const ascending = sort === "oldest";
    const orderCol = sort === "popular" ? "upvotes" : "created_at";

    let query = this.db
      .from("community_posts")
      .select(SELECT_FIELDS, { count: "exact" })
      .is("parent_id", null)
      .order(orderCol, { ascending: sort === "popular" ? false : ascending })
      .range(from, to);

    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%,tags.cs.{"${params.search}"}`);
    }
    if (params.courseId) {
      query = query.eq("course_id", params.courseId);
    }
    if (params.type) {
      query = query.eq("type", params.type);
    }
    if (params.tag) {
      query = query.contains("tags", [params.tag]);
    }

    const { data, count } = await query;
    if (!data) return { posts: [], total: 0 };

    const postIds = data.map((p: Record<string, unknown>) => p.id as string);

    // Count replies per post
    const { data: replyCounts } = await this.db
      .from("community_posts")
      .select("parent_id")
      .in("parent_id", postIds);
    const replyMap = new Map<string, number>();
    for (const r of replyCounts ?? []) {
      replyMap.set(r.parent_id, (replyMap.get(r.parent_id) ?? 0) + 1);
    }

    // Liked state
    let likedPostIds = new Set<string>();
    if (params.userId && postIds.length > 0) {
      const { data: likes } = await this.db
        .from("post_likes")
        .select("post_id")
        .eq("user_id", params.userId)
        .in("post_id", postIds);
      likedPostIds = new Set((likes ?? []).map((l: { post_id: string }) => l.post_id));
    }

    const posts = data.map((p: Record<string, unknown>) => ({
      ...mapPost(p, likedPostIds),
      replies: replyMap.get(p.id as string) ?? 0,
    }));

    return { posts, total: count ?? 0 };
  }

  async getPost(id: string, userId?: string): Promise<CommunityPost | null> {
    const { data } = await this.db
      .from("community_posts")
      .select(SELECT_FIELDS)
      .eq("id", id)
      .single();
    if (!data) return null;

    let likedPostIds = new Set<string>();
    if (userId) {
      const { data: likes } = await this.db
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .eq("post_id", id);
      likedPostIds = new Set((likes ?? []).map((l: { post_id: string }) => l.post_id));
    }

    const { count } = await this.db
      .from("community_posts")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", id);

    return { ...mapPost(data as Record<string, unknown>, likedPostIds), replies: count ?? 0 };
  }

  async getReplies(postId: string, userId?: string): Promise<CommunityPost[]> {
    const { data } = await this.db
      .from("community_posts")
      .select(SELECT_FIELDS)
      .eq("parent_id", postId)
      .order("created_at", { ascending: true });
    if (!data) return [];

    const replyIds = data.map((p: Record<string, unknown>) => p.id as string);
    let likedPostIds = new Set<string>();
    if (userId && replyIds.length > 0) {
      const { data: likes } = await this.db
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", replyIds);
      likedPostIds = new Set((likes ?? []).map((l: { post_id: string }) => l.post_id));
    }

    return data.map((p: Record<string, unknown>) => mapPost(p, likedPostIds));
  }

  async createPost(userId: string, data: { title: string; content: string; courseId?: string; parentId?: string; type?: string; tags?: string[] }): Promise<void> {
    const { error } = await this.db.from("community_posts").insert({
      user_id: userId,
      title: data.title,
      content: data.content,
      course_id: data.courseId || null,
      parent_id: data.parentId || null,
      type: data.type || "post",
      tags: data.tags && data.tags.length > 0 ? data.tags : [],
    });
    if (error) {
      console.error("[community] createPost error:", error.message, error.details, error.hint);
      throw new Error(error.message);
    }
  }

  async toggleLike(userId: string, postId: string): Promise<{ liked: boolean; upvotes: number }> {
    const { data: existing } = await this.db
      .from("post_likes")
      .select("user_id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .maybeSingle();

    if (existing) {
      await this.db.from("post_likes").delete().eq("user_id", userId).eq("post_id", postId);
      const { data: post } = await this.db.from("community_posts").select("upvotes").eq("id", postId).single();
      const current = (post?.upvotes as number) ?? 1;
      const newVal = Math.max(0, current - 1);
      await this.db.from("community_posts").update({ upvotes: newVal }).eq("id", postId);
      return { liked: false, upvotes: newVal };
    } else {
      await this.db.from("post_likes").insert({ user_id: userId, post_id: postId });
      const { data: post } = await this.db.from("community_posts").select("upvotes").eq("id", postId).single();
      const current = (post?.upvotes as number) ?? 0;
      const newVal = current + 1;
      await this.db.from("community_posts").update({ upvotes: newVal }).eq("id", postId);
      return { liked: true, upvotes: newVal };
    }
  }

  async getLikers(postId: string): Promise<PostLiker[]> {
    const { data } = await this.db
      .from("post_likes")
      .select("user_id, profiles!post_likes_user_id_fkey(display_name, username, avatar_url)")
      .eq("post_id", postId)
      .limit(50);
    if (!data) return [];
    return data.map((row: Record<string, unknown>) => {
      const profile = row.profiles as Record<string, unknown> | null;
      return {
        userId: row.user_id as string,
        displayName: (profile?.display_name as string) ?? "Anonymous",
        username: (profile?.username as string) ?? null,
        avatarUrl: (profile?.avatar_url as string) ?? null,
      };
    });
  }

  async getDistinctTags(): Promise<string[]> {
    const { data } = await this.db
      .from("community_posts")
      .select("tags")
      .not("tags", "eq", "{}");
    if (!data) return [];
    const tagSet = new Set<string>();
    for (const row of data) {
      for (const tag of (row.tags as string[]) ?? []) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }
}

export const communityService: CommunityService = new SupabaseCommunityService();
