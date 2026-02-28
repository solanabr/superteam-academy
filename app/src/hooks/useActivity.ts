"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/lib/supabase";

export interface ActivityItem {
  id: string;
  type: "lesson" | "xp";
  message: string;
  detail?: string;
  timestamp: string;
  xpEarned?: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function useActivity() {
  const { publicKey } = useWallet();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [thisWeek, setThisWeek] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!publicKey || !supabase) { setLoading(false); return; }
    const wallet = publicKey.toBase58();
    const { data } = await supabase
      .from("lesson_completions")
      .select("*")
      .eq("wallet_address", wallet)
      .order("completed_at", { ascending: false })
      .limit(20);

    if (!data) { setLoading(false); return; }

    const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    setThisWeek(data.filter((r) => new Date(r.completed_at) >= week).length);

    const feed: ActivityItem[] = [];
    for (const row of data) {
      feed.push({
        id: row.id + "_lesson",
        type: "lesson",
        message: `Completed: ${row.lesson_title ?? "Lesson"}`,
        detail: row.course_title ?? undefined,
        timestamp: timeAgo(row.completed_at),
      });
      if (row.xp_earned > 0) {
        feed.push({
          id: row.id + "_xp",
          type: "xp",
          message: `+${row.xp_earned} XP earned`,
          detail: row.lesson_title ?? undefined,
          timestamp: timeAgo(row.completed_at),
          xpEarned: row.xp_earned,
        });
      }
    }
    setItems(feed.slice(0, 10));
    setLoading(false);
  }, [publicKey]);

  useEffect(() => { load(); }, [load]);

  return { items, thisWeek, loading };
}
