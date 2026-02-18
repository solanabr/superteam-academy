
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { learningProgressService as service } from "@/lib/learning-progress/service";

/** 
 * POST /api/courses/[id]/claim-bonus
 * Body: { wallet: string; xpAmount: number }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: courseId } = await params;
    let body: { wallet?: string; xpAmount?: number };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { wallet, xpAmount } = body;

    if (!wallet || !courseId || typeof xpAmount !== "number") {
        return NextResponse.json(
            { error: "Missing wallet, courseId, or xpAmount" },
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
        await service.claimCompletionBonus(user.id, courseId, xpAmount);
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message ?? "Failed to claim bonus" },
            { status: 400 }
        );
    }

    return NextResponse.json({ ok: true });
}
