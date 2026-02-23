import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { learningProgressService as service } from "@/lib/learning-progress/service";

/** 
 * POST /api/graduation
 * Body: { wallet: string; courseId: string; lessonCount: number }
 */
export async function POST(request: NextRequest) {
    console.log("[api/graduation] Incoming request received");

    let body: { wallet?: string; courseId?: string; lessonCount?: number };
    try {
        body = await request.json();
        console.log(`[api/graduation] Request body: ${JSON.stringify(body)}`);
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { wallet, courseId, lessonCount } = body;

    if (!wallet || !courseId || typeof lessonCount !== "number") {
        console.error(`[api/graduation] Validation failed: wallet=${wallet}, courseId=${courseId}, lessonCount=${lessonCount}`);
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({
        where: { walletAddress: wallet },
        select: { id: true, role: true },
    });

    if (!user) {
        console.error(`[api/graduation] User not found for wallet: ${wallet}`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
        console.log(`[api/graduation] Starting graduation for user ${user.id} (Wallet: ${wallet}), Course: ${courseId}`);

        const identifier = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true" ? wallet : user.id;

        // 0. Sync completion status in Prisma
        await prisma.enrollment.updateMany({
            where: { userId: user.id, courseId },
            data: { completedAt: new Date() }
        });
        console.log("[api/graduation] Prisma updated");

        // 1. Finalize on-chain (updates enrollment PDA state and distributes XP)
        if (process.env.NEXT_PUBLIC_USE_ONCHAIN === "true") {
            console.log("[api/graduation] STEP 1: Finalizing course on-chain...");
            try {
                await service.finalizeCourse(wallet, courseId, lessonCount);
                console.log("[api/graduation] STEP 1: Success");
            } catch (err: any) {
                console.error("[api/graduation] STEP 1 FAILED:", err.message);
                throw new Error(`On-chain finalization failed: ${err.message}`);
            }

            // 2. Issue Credential (NFT Minting)
            console.log("[api/graduation] STEP 2: Minting NFT Credential...");
            try {
                const { getCourseById } = await import("@/sanity/lib/queries");
                const course = await getCourseById(courseId);

                if (!course || !course.track) {
                    console.warn(`[api/graduation] Course track missing for ID: ${courseId}. Skipping NFT.`);
                    return NextResponse.json({ ok: true, message: "Graduated, but track metadata missing for NFT" });
                }

                const trackName = course.track.charAt(0).toUpperCase() + course.track.slice(1);
                const mintAddress = await service.issueCredential({
                    userId: identifier,
                    wallet: wallet,
                    courseId: courseId,
                    trackId: course.track,
                    trackName: trackName,
                    xpEarned: 500 // Base XP for course completion
                });

                if (mintAddress === "SKIPPED_NO_COLLECTION") {
                    console.log("[api/graduation] STEP 2: Skipped (no collection address)");
                    return NextResponse.json({ ok: true, message: "Graduated, but NFT minting skipped due to configuration" });
                }

                console.log(`[api/graduation] STEP 2: Success! NFT: ${mintAddress}`);
                return NextResponse.json({ ok: true, mintAddress });
            } catch (err: any) {
                console.error("[api/graduation] STEP 2 FAILED (non-fatal):", err.message);
                // We return ok: true because the user HAS graduated (Step 1 succeeded)
                return NextResponse.json({
                    ok: true,
                    warning: `Graduated, but NFT minting failed: ${err.message}`
                });
            }
        }

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error(`[api/graduation] FATAL ERROR: ${e.message}`, e.stack);
        return NextResponse.json(
            { error: e?.message ?? "Failed to graduate" },
            { status: 500 }
        );
    }
}
