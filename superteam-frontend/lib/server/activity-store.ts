import "server-only";

import { PublicKey } from "@solana/web3.js";
import { fetchActivityFromChain } from "./academy-program";

const XP_PER_LESSON = 50;

export type RecentActivityItem = {
  type: "lesson" | "course";
  text: string;
  course: string;
  time: string;
  xp: number;
  ts: number;
};

const activityCountsByWallet = new Map<string, Map<string, number>>();
const recentActivityByWallet = new Map<string, RecentActivityItem[]>();
const totalCompletedByWallet = new Map<string, number>();
const MAX_RECENT = 20;

function toDateKey(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

function formatTimeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return `${Math.floor(sec / 604800)}w ago`;
}

export function recordLessonComplete(
  wallet: string,
  courseTitle: string,
  lessonTitle?: string,
): void {
  const today = toDateKey(new Date());
  let counts = activityCountsByWallet.get(wallet);
  if (!counts) {
    counts = new Map();
    activityCountsByWallet.set(wallet, counts);
  }
  counts.set(today, (counts.get(today) ?? 0) + 1);

  const items = recentActivityByWallet.get(wallet) ?? [];
  items.unshift({
    type: "lesson",
    text: lessonTitle ? `Completed '${lessonTitle}'` : "Completed a lesson",
    course: courseTitle,
    time: formatTimeAgo(Date.now()),
    xp: XP_PER_LESSON,
    ts: Date.now(),
  });
  recentActivityByWallet.set(wallet, items.slice(0, MAX_RECENT));
}

export function recordCourseFinalized(
  wallet: string,
  courseTitle: string,
): void {
  const prev = totalCompletedByWallet.get(wallet) ?? 0;
  totalCompletedByWallet.set(wallet, prev + 1);

  const items = recentActivityByWallet.get(wallet) ?? [];
  items.unshift({
    type: "course",
    text: `Completed course: ${courseTitle}`,
    course: courseTitle,
    time: formatTimeAgo(Date.now()),
    xp: 0,
    ts: Date.now(),
  });
  recentActivityByWallet.set(wallet, items.slice(0, MAX_RECENT));
}

export async function getActivityDays(
  wallet: string,
  daysBack = 365,
): Promise<Array<{ date: string; intensity: number; count: number }>> {
  const onChainDays = await fetchActivityFromChain(
    new PublicKey(wallet),
    daysBack,
  );
  const onChainMap = new Map<string, { intensity: number; count: number }>();
  for (const day of onChainDays) {
    onChainMap.set(day.date, { intensity: day.intensity, count: day.count });
  }

  const memoryCounts = activityCountsByWallet.get(wallet);
  const result: Array<{ date: string; intensity: number; count: number }> = [];
  const today = new Date();
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = toDateKey(d);
    const chain = onChainMap.get(dateKey);
    const memoryCount = memoryCounts?.get(dateKey) ?? 0;
    const count = Math.max(chain?.count ?? 0, memoryCount);
    const intensity = Math.max(chain?.intensity ?? 0, memoryCount > 0 ? 1 : 0);
    result.push({ date: dateKey, intensity, count });
  }
  return result;
}

export function getRecentActivity(wallet: string): RecentActivityItem[] {
  const items = recentActivityByWallet.get(wallet) ?? [];
  return items.map((item) => ({
    ...item,
    time: formatTimeAgo(item.ts),
  }));
}

export function getTotalCompleted(wallet: string): number {
  return totalCompletedByWallet.get(wallet) ?? 0;
}
