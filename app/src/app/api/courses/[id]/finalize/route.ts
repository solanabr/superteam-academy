
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { learningProgressService as service } from "@/lib/learning-progress/service";

/** 
 * POST /api/courses/[id]/finalize
 * Body: { wallet: string; lessonCount: number }
 */
export async function GET() {
    return NextResponse.json({ message: "Finalize route is accessible" });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;
    let body: { wallet?: string; lessonCount?: number };

    console.log(`[api/finalize] Received request for courseId: ${courseId}`);

    try {
        body = await request.json();
        console.log(`[api/finalize] Request body: ${JSON.stringify(body)}`);
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { wallet, lessonCount } = body;

    if (!wallet || !courseId || typeof lessonCount !== "number") {
        console.error(`[api/finalize] Missing required fields: wallet=${wallet}, courseId=${courseId}, lessonCount=${lessonCount}`);
        return NextResponse.json(
            { error: "Missing wallet, courseId, or lessonCount" },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({
        where: { walletAddress: wallet },
        select: { id: true },
    });

    if (!user) {
        console.error(`[api/finalize] User not found for wallet: ${wallet}`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }


    try {
        const identifier = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true" ? wallet : user.id;

        // 1. Mark as completed in Prisma immediately (Server-side sync)
        console.log(`[api/finalize] Updating Prisma completion for user ${user.id}, course ${courseId}`);
        await prisma.enrollment.updateMany({
            where: { userId: user.id, courseId },
            data: { completedAt: new Date() }
        });

        // 2. Issuing Credential (Skip finalizeCourse to avoid dual/extra minting as requested)
        const { getCourseById } = await import("@/sanity/lib/queries");
        const course = await getCourseById(courseId);

        console.log(`[api/finalize] Sanity lookup for ${courseId}: ${course ? "Found (" + course.track + ")" : "NOT FOUND"}`);

        if (course && course.track) {
            const trackName = course.track.charAt(0).toUpperCase() + course.track.slice(1);

            console.log(`[api/finalize] Calling issueCredential for wallet ${wallet}, track ${course.track}`);

            const mintAddress = await service.issueCredential({
                userId: identifier,
                wallet: wallet,
                courseId: courseId,
                trackId: course.track,
                trackName: trackName,
                xpEarned: 500
            });

            console.log(`[api/finalize] Credential issued: ${mintAddress}`);

            return NextResponse.json({ ok: true, mintAddress });
        }
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message ?? "Failed to finalize course" },
            { status: 400 }
        );
    }

    return NextResponse.json({ ok: true });
}
