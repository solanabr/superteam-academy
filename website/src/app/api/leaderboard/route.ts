import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLearningProgressService } from "@/lib/learning-progress/prisma-impl";

export async function GET(request: NextRequest) {
    const service = createLearningProgressService(prisma);
    try {
        const leaderboard = await service.getLeaderboard({ limit: 50 });
        return NextResponse.json(leaderboard);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
