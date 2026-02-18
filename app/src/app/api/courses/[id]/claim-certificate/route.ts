import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLearningProgressService } from "@/lib/learning-progress/prisma-impl";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;
    let body: { wallet?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { wallet } = body;
    if (!wallet) {
        return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { walletAddress: wallet },
        select: { id: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const service = createLearningProgressService(prisma);

    try {
        // 1. Verify 100% completion
        const enrollment = await service.getEnrollmentProgress(user.id, courseId);
        if (!enrollment || enrollment.completedCount < enrollment.totalLessons) {
            return NextResponse.json({ error: "Course not complete" }, { status: 400 });
        }

        // 2. Issue Credential (if not exists or update level)
        // We assume a 'track' maps to a course for now, or we define it.
        // For this MVP, let's look up the course to get a track/category if needed.
        // Ideally we pass this in or lookup from course metadata.
        // Let's use courseId as trackId for now or lookup a default.
        // Fetch course metadata stub:

        // In a real app we'd fetch the course doc. For now, we stub track info.
        const trackId = "solana-development"; // Default for these lessons
        const trackName = "Solana Development";

        await service.issueCredential({
            userId: user.id,
            trackId,
            trackName,
            xpEarned: 0, // XP already awarded during lessons
            // mintAddress: ... // Future: invoke Solana mint logic here
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message ?? "Failed to claim certificate" },
            { status: 400 }
        );
    }
}
