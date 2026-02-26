import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 300; // 5 minutes cache

export async function GET() {
    try {
        const [totalUsers, totalXpRes, totalGraduates] = await Promise.all([
            prisma.user.count(),
            prisma.xpEvent.aggregate({
                _sum: {
                    amount: true
                }
            }),
            prisma.enrollment.count({ where: { NOT: { completedAt: null } } }),
        ]);

        return NextResponse.json({
            totalUsers,
            totalXp: (totalXpRes._sum as any).amount ?? 0,
            totalGraduates,
        });
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
