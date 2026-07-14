import { NextResponse } from "next/server";
import { getAllLessonSkills } from "@/lib/content/queries";

/**
 * Public per-lesson skill tags (profile Skills radar, per-lesson attribution
 * — #466 C3). No params, so the route response is statically cached and
 * revalidated hourly, mirroring `/api/content/tags`; the inner deployment
 * read is tagged "courses" so an admin sync purge propagates.
 */
export const revalidate = 3600;

export async function GET() {
  try {
    const skills = await getAllLessonSkills();
    return NextResponse.json({ skills });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch lesson skills" },
      { status: 500 }
    );
  }
}
