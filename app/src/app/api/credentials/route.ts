
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { learningProgressService } from "@/lib/learning-progress/service";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get("wallet");

    if (!wallet) {
        return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    try {
        const { getCached } = await import("@/lib/cache");

        const credentials = await getCached(`user:${wallet}:credentials`, async () => {
            const USE_ONCHAIN = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true";

            // Parallelize RPC and DB lookups
            const [onChainResult, userResult] = await Promise.allSettled([
                USE_ONCHAIN ? learningProgressService.getCredentials(wallet) : Promise.resolve([]),
                prisma.user.findUnique({
                    where: { walletAddress: wallet },
                    select: { id: true }
                })
            ]);

            const onChainCredentials = onChainResult.status === "fulfilled" ? onChainResult.value : [];
            const user = userResult.status === "fulfilled" ? userResult.value : null;

            let prismaCredentials: any[] = [];
            if (user) {
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

            return merged;
        }, { ttl: 60 });

        return NextResponse.json({ credentials });
    } catch (error: any) {
        console.error("GET /api/credentials error:", error);
        return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
    }
}
