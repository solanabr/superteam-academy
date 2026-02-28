import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ForumCategory {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  color: string;
  order_index: number;
  thread_count?: number;
}

export interface ForumThread {
  id: string;
  category_id: string;
  author_id: string | null;
  author_wallet: string;
  author_display_name?: string | null;
  title: string;
  body: string;
  is_answered: boolean;
  is_pinned: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  reply_count?: number;
  category?: ForumCategory;
}

export interface ForumReply {
  id: string;
  thread_id: string;
  author_id: string | null;
  author_wallet: string;
  author_display_name?: string | null;
  body: string;
  is_accepted: boolean;
  created_at: string;
}

export interface ForumStats {
  thread_count: number;
  reply_count: number;
  member_count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<ForumCategory[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("forum_categories")
    .select("*, forum_threads(count)")
    .order("order_index", { ascending: true });
  if (error || !data) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    slug: row.slug as string,
    label: row.label as string,
    description: row.description as string | null,
    color: (row.color as string) ?? "#666666",
    order_index: row.order_index as number,
    thread_count: Array.isArray(row.forum_threads)
      ? (row.forum_threads[0] as { count: number })?.count ?? 0
      : 0,
  }));
}

export async function getThreads(
  categorySlug?: string,
  limit = 20,
  offset = 0
): Promise<ForumThread[]> {
  if (!supabase) return [];

  let query = supabase
    .from("forum_threads")
    .select(
      `
      *,
      category:forum_categories(*),
      forum_replies(count)
    `
    )
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (categorySlug) {
    query = query.eq("forum_categories.slug", categorySlug);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data
    .filter((row: Record<string, unknown>) => {
      if (!categorySlug) return true;
      const cat = row.category as Record<string, unknown> | null;
      return cat?.slug === categorySlug;
    })
    .map((row: Record<string, unknown>) => ({
      id: row.id as string,
      category_id: row.category_id as string,
      author_id: row.author_id as string | null,
      author_wallet: row.author_wallet as string,
      author_display_name: row.author_display_name as string | null,
      title: row.title as string,
      body: row.body as string,
      is_answered: (row.is_answered as boolean) ?? false,
      is_pinned: (row.is_pinned as boolean) ?? false,
      views: (row.views as number) ?? 0,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      reply_count: Array.isArray(row.forum_replies)
        ? (row.forum_replies[0] as { count: number })?.count ?? 0
        : 0,
      category: row.category as ForumCategory | undefined,
    }));
}

export async function getThread(id: string): Promise<ForumThread | null> {
  if (!supabase) return null;

  // Increment views via manual read+update (no rpc required)
  supabase
    .from("forum_threads")
    .select("views")
    .eq("id", id)
    .single()
    .then(({ data }) => {
      if (data && supabase) {
        supabase
          .from("forum_threads")
          .update({ views: ((data as Record<string, unknown>).views as number ?? 0) + 1 })
          .eq("id", id)
          .then(() => undefined);
      }
    });

  const { data, error } = await supabase
    .from("forum_threads")
    .select(
      `
      *,
      category:forum_categories(*),
      forum_replies(count)
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    category_id: row.category_id as string,
    author_id: row.author_id as string | null,
    author_wallet: row.author_wallet as string,
    author_display_name: row.author_display_name as string | null,
    title: row.title as string,
    body: row.body as string,
    is_answered: (row.is_answered as boolean) ?? false,
    is_pinned: (row.is_pinned as boolean) ?? false,
    views: (row.views as number) ?? 0,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    reply_count: Array.isArray(row.forum_replies)
      ? (row.forum_replies[0] as { count: number })?.count ?? 0
      : 0,
    category: row.category as ForumCategory | undefined,
  };
}

export async function getReplies(threadId: string): Promise<ForumReply[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("forum_replies")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    thread_id: row.thread_id as string,
    author_id: row.author_id as string | null,
    author_wallet: row.author_wallet as string,
    author_display_name: row.author_display_name as string | null,
    body: row.body as string,
    is_accepted: (row.is_accepted as boolean) ?? false,
    created_at: row.created_at as string,
  }));
}

export async function createThread(data: {
  categoryId: string;
  authorWallet: string;
  authorDisplayName?: string;
  title: string;
  body: string;
}): Promise<string | null> {
  if (!supabase) return null;
  const { data: row, error } = await supabase
    .from("forum_threads")
    .insert({
      category_id: data.categoryId,
      author_wallet: data.authorWallet,
      author_display_name: data.authorDisplayName || null,
      title: data.title,
      body: data.body,
    })
    .select("id")
    .single();
  if (error || !row) return null;
  return (row as Record<string, unknown>).id as string;
}

export async function createReply(data: {
  threadId: string;
  authorWallet: string;
  authorDisplayName?: string;
  body: string;
}): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("forum_replies").insert({
    thread_id: data.threadId,
    author_wallet: data.authorWallet,
    author_display_name: data.authorDisplayName || null,
    body: data.body,
  });
  return !error;
}

export async function toggleVote(
  threadId: string,
  voterWallet: string
): Promise<number> {
  if (!supabase) return 0;

  // Check if vote exists
  const { data: existing } = await supabase
    .from("forum_votes")
    .select("id")
    .eq("thread_id", threadId)
    .eq("voter_wallet", voterWallet)
    .single();

  if (existing) {
    // Remove vote
    await supabase
      .from("forum_votes")
      .delete()
      .eq("thread_id", threadId)
      .eq("voter_wallet", voterWallet);
  } else {
    // Add vote
    await supabase.from("forum_votes").insert({
      thread_id: threadId,
      voter_wallet: voterWallet,
    });
  }

  // Return new count
  const { count } = await supabase
    .from("forum_votes")
    .select("*", { count: "exact", head: true })
    .eq("thread_id", threadId);

  return count ?? 0;
}

export async function getVoteCount(threadId: string): Promise<number> {
  if (!supabase) return 0;
  const { count } = await supabase
    .from("forum_votes")
    .select("*", { count: "exact", head: true })
    .eq("thread_id", threadId);
  return count ?? 0;
}

export async function getForumStats(): Promise<ForumStats> {
  if (!supabase) return { thread_count: 0, reply_count: 0, member_count: 0 };

  const [{ count: threads }, { count: replies }, { count: members }] =
    await Promise.all([
      supabase
        .from("forum_threads")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("forum_replies")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true }),
    ]);

  return {
    thread_count: threads ?? 0,
    reply_count: replies ?? 0,
    member_count: members ?? 0,
  };
}
