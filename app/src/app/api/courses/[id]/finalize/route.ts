
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { learningProgressService as service } from "@/lib/learning-progress/service";

/** 
 * POST /api/courses/[id]/finalize
 * Body: { wallet: string; lessonCount: number }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;
    let body: { wallet?: string; lessonCount?: number };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { wallet, lessonCount } = body;

    if (!wallet || !courseId || typeof lessonCount !== "number") {
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
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }


    try {
        const identifier = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true" ? wallet : user.id;
        await service.finalizeCourse(identifier, courseId, lessonCount);

        // Fetch course data to issue credential
        const { getCourseBySlug } = await import("@/sanity/lib/queries");
        const course = await getCourseBySlug(courseId);

        if (course && course.track) {
            // Capitalize track name
            const trackName = course.track.charAt(0).toUpperCase() + course.track.slice(1);

            await service.issueCredential({
                userId: identifier,
                trackId: course.track,
                trackName: trackName,
                xpEarned: 500 // Logic should eventually align with course XP
            });
        }
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message ?? "Failed to finalize course" },
            { status: 400 }
        );
    }

    return NextResponse.json({ ok: true });
}
