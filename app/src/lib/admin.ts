import { supabase } from "@/lib/supabase";

export interface AdminStats {
  totalUsers: number;
  totalThreads: number;
  totalReplies: number;
}

export interface RecentSignup {
  id: string;
  wallet_address: string | null;
  username: string | null;
  display_name: string | null;
  created_at: string;
}

export interface RecentThread {
  id: string;
  title: string;
  created_at: string;
  views: number;
  is_answered: boolean;
  category_label: string | null;
}

export async function getAdminStats(): Promise<AdminStats> {
  if (!supabase) {
    return { totalUsers: 0, totalThreads: 0, totalReplies: 0 };
  }

  const [usersRes, threadsRes, repliesRes] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("forum_threads").select("*", { count: "exact", head: true }),
    supabase.from("forum_replies").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalUsers: usersRes.count ?? 0,
    totalThreads: threadsRes.count ?? 0,
    totalReplies: repliesRes.count ?? 0,
  };
}

export async function getRecentSignups(limit = 5): Promise<RecentSignup[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, wallet_address, username, display_name, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as RecentSignup[];
}

export async function getRecentThreads(limit = 5): Promise<RecentThread[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("forum_threads")
    .select(
      "id, title, created_at, views, is_answered, forum_categories(label)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => {
    const cat = row.forum_categories as { label?: string } | null;
    return {
      id: row.id as string,
      title: row.title as string,
      created_at: row.created_at as string,
      views: (row.views as number) ?? 0,
      is_answered: (row.is_answered as boolean) ?? false,
      category_label: cat?.label ?? null,
    };
  });
}
