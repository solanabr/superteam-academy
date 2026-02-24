import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { leaderboardService } from "@/services/leaderboard";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    const session = await auth();
    const userId = session?.user?.id;

    if (!isCron && !userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitKey = userId ? `user_sync_limit:${userId}` : null;

    // Rate limiting for manual refreshes (1 hour cooldown)
    if (!isCron && userId && limitKey) {
        const db = getAdminClient();
        if (!db) {
            return NextResponse.json({ error: "Database not configured" }, { status: 500 });
        }

        const { data: limitData } = await db
            .from("system_config")
            .select("value")
            .eq("key", limitKey)
            .single();

        if (limitData?.value) {
            const lastSync = new Date(limitData.value);
            const now = new Date();
            const diffMs = now.getTime() - lastSync.getTime();
            const oneHourMs = 60 * 60 * 1000;

            if (diffMs < oneHourMs) {
                const remainingMin = Math.ceil((oneHourMs - diffMs) / (60 * 1000));
                return NextResponse.json(
                    { error: `Sync on cooldown. Wait ${remainingMin} minutes.` },
                    { status: 429 }
                );
            }
        }
    }

    try {
        const result = await leaderboardService.syncLeaderboardWithOnchainData();

        // Update the cooldown timestamp ONLY if something was actually processed
        if (!isCron && userId && result.processed > 0) {
            const db = getAdminClient();
            if (db) {
                await db.from("system_config").upsert({
                    key: limitKey,
                    value: new Date().toISOString(),
                    description: `Last sync trigger for user ${userId}`,
                });
            }
        }

        return NextResponse.json({
            success: true,
            ...result,
            message: result.processed > 0
                ? `Successfully processed ${result.processed} new transactions.`
                : "Sync completed. No new transactions found."
        });
    } catch (err) {
        console.error("Leaderboard sync failed:", err);

        const message = err instanceof Error ? err.message : String(err);
        const isRateLimit = message.includes("429") || message.includes("Helius RPC Error");

        return NextResponse.json(
            {
                error: isRateLimit
                    ? "Helius rate limit reached. Please wait a moment and try again."
                    : "Leaderboard sync failed due to an internal error."
            },
            { status: isRateLimit ? 429 : 500 }
        );
    }
}
