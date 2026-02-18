import { NextResponse } from "next/server";
import { checkPermission } from "@/lib/server/admin-auth";
import { getAllLearnerProfilesOnChain } from "@/lib/server/academy-chain-read";
import { getAllCourses } from "@/lib/server/admin-store";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const user = await checkPermission("analytics.read");
  if (!user) return unauthorized();
  const [profiles, courses] = await Promise.all([
    getAllLearnerProfilesOnChain(),
    Promise.resolve(getAllCourses()),
  ]);

  const totalLearners = profiles.length;
  const totalCourses = courses.length;
  const totalXp = profiles.reduce((sum, p) => sum + p.xpTotal, 0);
  const now = Date.now() / 1000;
  const activeToday = profiles.filter(
    (p) => now - p.lastActivityTs < 86400,
  ).length;
  const avgStreak =
    totalLearners > 0
      ? Math.round(
          profiles.reduce((sum, p) => sum + p.streakCurrent, 0) / totalLearners,
        )
      : 0;

  const xpBuckets = [
    { label: "0-100", min: 0, max: 100, count: 0 },
    { label: "101-500", min: 101, max: 500, count: 0 },
    { label: "501-1000", min: 501, max: 1000, count: 0 },
    { label: "1001-5000", min: 1001, max: 5000, count: 0 },
    { label: "5000+", min: 5001, max: Infinity, count: 0 },
  ];
  for (const p of profiles) {
    const bucket = xpBuckets.find(
      (b) => p.xpTotal >= b.min && p.xpTotal <= b.max,
    );
    if (bucket) bucket.count++;
  }

  const streakBuckets = [
    { label: "0", min: 0, max: 0, count: 0 },
    { label: "1-3", min: 1, max: 3, count: 0 },
    { label: "4-7", min: 4, max: 7, count: 0 },
    { label: "8-14", min: 8, max: 14, count: 0 },
    { label: "15-30", min: 15, max: 30, count: 0 },
    { label: "30+", min: 31, max: Infinity, count: 0 },
  ];
  for (const p of profiles) {
    const bucket = streakBuckets.find(
      (b) => p.streakCurrent >= b.min && p.streakCurrent <= b.max,
    );
    if (bucket) bucket.count++;
  }

  const difficultyDist = { Beginner: 0, Intermediate: 0, Advanced: 0 };
  for (const c of courses) {
    difficultyDist[c.difficulty]++;
  }

  const levelDist = new Map<number, number>();
  for (const p of profiles) {
    levelDist.set(p.level, (levelDist.get(p.level) ?? 0) + 1);
  }

  return NextResponse.json({
    totalLearners,
    totalCourses,
    totalXp,
    activeToday,
    avgStreak,
    xpBuckets: xpBuckets.map((b) => ({ label: b.label, count: b.count })),
    streakBuckets: streakBuckets.map((b) => ({
      label: b.label,
      count: b.count,
    })),
    difficultyDist,
    levelDist: Array.from(levelDist.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, count]) => ({ level, count })),
  });
}
