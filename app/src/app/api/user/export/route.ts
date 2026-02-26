import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
    // Simple check for wallet in query for now, or use auth header if implemented
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
        return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
    }

    try {
        const userData = await prisma.user.findUnique({
            where: { walletAddress: wallet },
            include: {
                enrollments: true,
                credentials: true,
                xpEvents: true,
            },
        }) as any;

        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const exportData = {
            user: {
                wallet: userData.walletAddress,
                email: userData.email,
                role: userData.role,
                preferences: userData.preferences,
                profile: userData.profile,
            },
            enrollments: userData.enrollments,
            credentials: userData.credentials,
            xpHistory: userData.xpEvents,
            exportedAt: new Date().toISOString(),
        };

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="superteam-academy-data-${wallet}.json"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
