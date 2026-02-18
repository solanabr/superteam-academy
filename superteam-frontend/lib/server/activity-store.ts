import "server-only";

import { PublicKey } from "@solana/web3.js";
import { fetchChainActivity } from "./academy-program";
import {
  DAILY_STREAK_BONUS,
  FIRST_COMPLETION_OF_DAY_BONUS,
} from "./academy-course-catalog";
import { getDb } from "./mongodb";

export type RecentActivityItem = {
  type: "lesson" | "course";
  text: string;
  course: string;
  time: string;
  xp: number;
  ts: number;
};

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

export async function computeBonusXp(
  wallet: string,
  currentStreak: number,
): Promise<{
  streakBonus: number;
  firstOfDayBonus: number;
  totalBonus: number;
}> {
  const today = toDateKey(new Date());
  const db = await getDb();
  const existing = await db
    .collection("activity")
    .countDocuments({ wallet, dateKey: today });
  // First-of-day means no prior activity recorded today
  const isFirstOfDay = existing === 0;
  const firstOfDayBonus = isFirstOfDay ? FIRST_COMPLETION_OF_DAY_BONUS : 0;
  const streakBonus = currentStreak >= 2 ? DAILY_STREAK_BONUS : 0;
  const effectiveStreakBonus = isFirstOfDay ? streakBonus : 0;
  return {
    streakBonus: effectiveStreakBonus,
    firstOfDayBonus,
    totalBonus: effectiveStreakBonus + firstOfDayBonus,
  };
}

export async function recordLessonComplete(
  wallet: string,
  courseTitle: string,
  xpAmount: number,
  lessonTitle?: string,
): Promise<void> {
  const now = Date.now();
  const dateKey = toDateKey(new Date());
  const db = await getDb();
  await db.collection("activity").insertOne({
    wallet,
    type: "lesson",
    text: lessonTitle ? `Completed '${lessonTitle}'` : "Completed a lesson",
    course: courseTitle,
    xp: xpAmount,
    ts: now,
    dateKey,
  });
}

export async function recordCourseFinalized(
  wallet: string,
  courseTitle: string,
  xpAmount: number,
): Promise<void> {
  const now = Date.now();
  const dateKey = toDateKey(new Date());
  const db = await getDb();
  await Promise.all([
    db.collection("activity").insertOne({
      wallet,
      type: "course",
      text: `Completed course: ${courseTitle}`,
      course: courseTitle,
      xp: xpAmount,
      ts: now,
      dateKey,
    }),
    db
      .collection("activity_totals")
      .updateOne({ wallet }, { $inc: { totalCompleted: 1 } }, { upsert: true }),
  ]);
}

export async function getActivityData(
  wallet: string,
  daysBack = 365,
): Promise<{
  days: Array<{ date: string; intensity: number; count: number }>;
  recentActivity: RecentActivityItem[];
}> {
  const db = await getDb();

  const [chainData, dbCounts, dbRecent] = await Promise.all([
    fetchChainActivity(new PublicKey(wallet), daysBack, MAX_RECENT),
    db
      .collection("activity")
      .aggregate<{ _id: string; count: number }>([
        { $match: { wallet } },
        { $group: { _id: "$dateKey", count: { $sum: 1 } } },
      ])
      .toArray(),
    db
      .collection("activity")
      .find({ wallet })
      .sort({ ts: -1 })
      .limit(MAX_RECENT)
      .toArray(),
  ]);

  // --- Heatmap days ---
  const onChainMap = new Map<string, { intensity: number; count: number }>();
  for (const day of chainData.days) {
    onChainMap.set(day.date, { intensity: day.intensity, count: day.count });
  }
  const dbCountMap = new Map<string, number>();
  for (const row of dbCounts) {
    dbCountMap.set(row._id, row.count);
  }

  const days: Array<{ date: string; intensity: number; count: number }> = [];
  const today = new Date();
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = toDateKey(d);
    const chain = onChainMap.get(dateKey);
    const dbCount = dbCountMap.get(dateKey) ?? 0;
    const count = Math.max(chain?.count ?? 0, dbCount);
    const intensity = Math.max(chain?.intensity ?? 0, dbCount > 0 ? 1 : 0);
    days.push({ date: dateKey, intensity, count });
  }

  // --- Recent activity ---
  const dbItems: RecentActivityItem[] = dbRecent.map((doc) => ({
    type: doc.type as "lesson" | "course",
    text: doc.text as string,
    course: doc.course as string,
    time: formatTimeAgo(doc.ts as number),
    xp: doc.xp as number,
    ts: doc.ts as number,
  }));

  const merged = [...dbItems];
  for (const ci of chainData.recent) {
    const isDuplicate = merged.some(
      (mi) => Math.abs(mi.ts - ci.ts) < 2000 && mi.type === ci.type,
    );
    if (!isDuplicate) {
      merged.push({
        ...ci,
        time: formatTimeAgo(ci.ts),
      });
    }
  }
  merged.sort((a, b) => b.ts - a.ts);
  const recentActivity = merged.slice(0, MAX_RECENT).map((item) => ({
    ...item,
    time: formatTimeAgo(item.ts),
  }));

  return { days, recentActivity };
}

/** @deprecated Use getActivityData instead */
export async function getActivityDays(
  wallet: string,
  daysBack = 365,
): Promise<Array<{ date: string; intensity: number; count: number }>> {
  const { days } = await getActivityData(wallet, daysBack);
  return days;
}

/** @deprecated Use getActivityData instead */
export async function getRecentActivity(
  wallet: string,
): Promise<RecentActivityItem[]> {
  const { recentActivity } = await getActivityData(wallet);
  return recentActivity;
}

export async function getTotalCompleted(wallet: string): Promise<number> {
  const db = await getDb();
  const doc = await db.collection("activity_totals").findOne({ wallet });
  return (doc?.totalCompleted as number) ?? 0;
}

export function computeStreakFromDays(
  days: Array<{ date: string; count: number }>,
): number {
  const today = toDateKey(new Date());
  const yesterday = toDateKey(new Date(Date.now() - 86_400_000));

  let streak = 0;
  let started = false;
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i];
    if (!started) {
      if (day.count > 0 && (day.date === today || day.date === yesterday)) {
        started = true;
        streak = 1;
      } else if (day.date < yesterday) {
        break;
      }
    } else {
      if (day.count > 0) {
        streak++;
      } else {
        break;
      }
    }
  }
  return streak;
}

export async function getCurrentStreak(wallet: string): Promise<number> {
  const { days } = await getActivityData(wallet);
  return computeStreakFromDays(days);
}
