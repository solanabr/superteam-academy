
import { NextRequest, NextResponse } from "next/server";
import { learningProgressService } from "@/lib/learning-progress/service";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const timeframeStr = searchParams.get("timeframe");
        const validTimeframes = ["daily", "weekly", "all-time"] as const;
        const timeframe = validTimeframes.includes(timeframeStr as any)
            ? timeframeStr as "daily" | "weekly" | "all-time"
            : "all-time";

        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const courseId = searchParams.get("courseId") || undefined;

        const { getCached } = await import("@/lib/cache");
        const leaderboard = await getCached(`leaderboard:${timeframe}:${courseId || 'all'}:${limit}:${page}`, async () => {
            return await learningProgressService.getLeaderboard({ limit, page, timeframe, courseId });
        }, { ttl: 20 });

        return NextResponse.json(leaderboard);
    } catch (e) {
        console.error("Leaderboard fetch error:", e);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
