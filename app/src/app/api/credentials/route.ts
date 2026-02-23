
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

    let onChainCredentials: any[] = [];
    if (USE_ONCHAIN) {
        // On-Chain service handles Helius DAS (expects wallet)
        onChainCredentials = await learningProgressService.getCredentials(wallet);
    }

    // Fetch from Prisma for consistency (always handles DB credentials)
    let prismaCredentials: any[] = [];
    const user = await prisma.user.findUnique({
        where: { walletAddress: wallet },
        select: { id: true },
    });

    if (user) {
        // If we are in ONCHAIN mode, the learningProgressService is OnChain.
        // We need to fetch from DB specifically.
        prismaCredentials = await prisma.credential.findMany({
            where: { userId: user.id },
            include: { user: { select: { walletAddress: true, profile: true } } }
        });
    }

    // Merge and deduplicate by ID/Mint Address
    const merged = [...onChainCredentials];
    prismaCredentials.forEach(pc => {
        if (!merged.find(mc => mc.id === pc.id || mc.mintAddress === pc.mintAddress)) {
            merged.push(pc);
        }
    });

    return NextResponse.json({ credentials: merged });
}
