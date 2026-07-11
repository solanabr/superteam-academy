import { NextResponse } from "next/server";
import { getAllCourseTags } from "@/lib/content/queries";

/**
 * Public course tags (profile skill radar) — the client-side face of
 * `getAllCourseTags`. No params, so the route response is statically cached and
 * revalidated hourly, mirroring the old `catalogFetch` window; the inner
 * deployment read is tagged "courses" so an admin sync purge propagates.
 */
export const revalidate = 3600;

export async function GET() {
  try {
    const tags = await getAllCourseTags();
    return NextResponse.json({ tags });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
