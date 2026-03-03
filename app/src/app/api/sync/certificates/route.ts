import { NextRequest, NextResponse } from "next/server";
import { invalidatePattern } from "@/lib/cache";

/** POST /api/sync/certificates - surgically invalidate certificate-related cache entries for a wallet. */
export async function POST(request: NextRequest) {
    try {
        const { wallet } = await request.json();
        if (!wallet) return NextResponse.json({ error: "Wallet address required" }, { status: 400 });

        // Target only certificate/credential listings
        await invalidatePattern(`user:${wallet}:credentials:*`);

        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
