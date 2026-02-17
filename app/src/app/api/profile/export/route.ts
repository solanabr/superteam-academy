import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { profileService } from "@/services/profile";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const userId = session.user.id;
  const [profile, stats, completedCourses] = await Promise.all([
    profileService.getProfileById(userId),
    profileService.getProfileStats(userId),
    profileService.getCompletedCourses(userId),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile,
    stats,
    completedCourses,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="superteam-academy-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
