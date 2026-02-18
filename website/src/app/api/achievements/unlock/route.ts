import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** 
 * POST /api/achievements/unlock
 * Signals that an achievement's condition has been met (e.g., found easter egg).
 * This doesn't grant XP immediately. The user must still "claim" it on the achievements page.
 */
export async function POST(request: NextRequest) {
    try {
        const { wallet, achievementId } = await request.json();

        if (!wallet || !achievementId) {
            return NextResponse.json({ error: "Missing wallet or achievementId" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { walletAddress: wallet },
            select: { id: true, preferences: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get current preferences or default to empty object
        const prefs = (user.preferences as any) || {};
        const unlocked = Array.isArray(prefs.unlockedAchievements)
            ? prefs.unlockedAchievements
            : [];

        if (!unlocked.includes(achievementId)) {
            unlocked.push(achievementId);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    preferences: {
                        ...prefs,
                        unlockedAchievements: unlocked
                    }
                }
            });
        }

        return NextResponse.json({ ok: true, unlocked: true });
    } catch (error: any) {
        console.error("Unlock error:", error);
        return NextResponse.json({ error: "Failed to unlock" }, { status: 500 });
    }
}
