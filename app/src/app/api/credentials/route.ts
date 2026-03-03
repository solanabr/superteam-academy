
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get("wallet");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    if (!wallet) {
        return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
    }

    try {
        const { getCached } = await import("@/lib/cache");

        const result = await getCached(`user:${wallet}:credentials:page:${page}:limit:${limit}`, async () => {
            // DB-First: Prisma has all credentials (synced by Inngest after minting)
            const user = await prisma.user.findUnique({
                where: { walletAddress: wallet },
                select: { id: true }
            });

            if (!user) return [];

            return prisma.credential.findMany({
                where: { userId: user.id },
                include: { user: { select: { walletAddress: true, profile: true } } },
                orderBy: { earnedAt: "desc" },
                take: limit,
                skip: skip
            });
        }, { ttl: 60 });

        return NextResponse.json({
            credentials: result,
            pagination: {
                page,
                limit,
                hasMore: result.length === limit
            }
        });
    } catch (error: any) {
        console.error("GET /api/credentials error:", error);
        return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
    }
}
