
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

        const limit = parseInt(searchParams.get("limit") || "50", 10);

        const leaderboard = await learningProgressService.getLeaderboard({ limit, timeframe });
        return NextResponse.json(leaderboard);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
