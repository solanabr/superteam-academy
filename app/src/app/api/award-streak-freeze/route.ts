import { NextResponse } from "next/server";

/**
 * POST /api/award-streak-freeze
 *
 * The award_streak_freeze instruction was removed in the program rewrite.
 * This endpoint is kept as a stub to return a clear error.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "award_streak_freeze is no longer available in this program version",
    },
    { status: 410 },
  );
}
