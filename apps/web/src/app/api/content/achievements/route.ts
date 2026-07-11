import { NextResponse } from "next/server";
import { getAllAchievements } from "@/lib/content/queries";

/**
 * Public achievement catalog — the client-side face of `getAllAchievements`
 * (dashboard + profile achievement galleries). Bundle-only definitions
 * (name/icon/award rule/xp) — the same world-readable shape Sanity's public
 * dataset served pre-flip. Statically cached, revalidated hourly.
 */
export const revalidate = 3600;

export async function GET() {
  try {
    const achievements = await getAllAchievements();
    return NextResponse.json({ achievements });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}
