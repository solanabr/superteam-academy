
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { learningProgressService } from "@/lib/learning-progress/service";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get("wallet");

    if (!wallet) {
        return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    // We can use wallet directly if service supports it, or fetch user ID first
    // On-Chain impl takes wallet address as userId. Prisma impl takes internal User ID.
    // This is a discrepancy. "onchain-impl.ts" getCredentials takes "userId".
    // In Prisma impl, getCredentials takes "userId" (UUID).

    // Check if we are using ONCHAIN mode
    const USE_ONCHAIN = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true";

    if (USE_ONCHAIN) {
        // On-Chain service expects Wallet Address as ID
        const credentials = await learningProgressService.getCredentials(wallet);
        return NextResponse.json({ credentials });
    } else {
        const user = await prisma.user.findUnique({
            where: { walletAddress: wallet },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ credentials: [] });
        }

        // Prisma service expects User UUID
        const credentials = await learningProgressService.getCredentials(user.id);
        return NextResponse.json({ credentials });
    }
}
