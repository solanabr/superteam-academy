
import { NextRequest, NextResponse } from "next/server";
import { learningProgressService } from "@/lib/learning-progress/service";

export async function GET(request: NextRequest) {
    try {
        const leaderboard = await learningProgressService.getLeaderboard({ limit: 50 });
        return NextResponse.json(leaderboard);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
