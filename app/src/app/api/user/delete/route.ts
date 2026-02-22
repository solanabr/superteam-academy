import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

export async function DELETE(request: NextRequest) {
    try {
        const { walletAddress, privyId } = await request.json();

        if (!walletAddress || !privyId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Delete from our database (Prisma handles cascades for progress, enrollments, etc.)
        await prisma.user.delete({
            where: { walletAddress },
        });

        // 2. Delete from Privy
        // Using direct fetch to avoid extra dependency if @privy-io/node is missing
        if (PRIVY_APP_ID && PRIVY_APP_SECRET) {
            const auth = Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString("base64");

            const privyRes = await fetch(`https://auth.privy.io/api/v1/users/${privyId}`, {
                method: "DELETE",
                headers: {
                    "privy-app-id": PRIVY_APP_ID,
                    "Authorization": `Basic ${auth}`,
                    "Content-Type": "application/json",
                },
            });

            if (!privyRes.ok) {
                const errorData = await privyRes.json();
                console.error("Privy deletion failed:", errorData);
                // We proceed anyway because the local account is gone, 
                // but we log it.
            }
        } else {
            console.warn("PRIVY_APP_ID or PRIVY_APP_SECRET missing. Privy account not deleted.");
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("DELETE /api/user/delete error:", e?.message ?? e);
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }
}
