import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * POST /api/auth/onboard
 *
 * Updates the user's profile with their chosen username and avatar.
 * Sets isOnboarded = true in the session so the dialog doesn't show again.
 *
 * Body: { username: string, avatar?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized. Sign in first." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { username, avatar } = body;

        // Validate username
        if (!username || typeof username !== "string") {
            return NextResponse.json(
                { error: "Username is required." },
                { status: 400 }
            );
        }

        const trimmed = username.trim();
        if (trimmed.length < 3 || trimmed.length > 24) {
            return NextResponse.json(
                { error: "Username must be 3–24 characters." },
                { status: 400 }
            );
        }

        if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
            return NextResponse.json(
                { error: "Username can only contain letters, numbers, and underscores." },
                { status: 400 }
            );
        }

        // Return the data for the client to update the session via `update()`
        return NextResponse.json({
            success: true,
            username: trimmed,
            avatar: avatar || session.user.image || null,
            isOnboarded: true,
        });
    } catch (error) {
        console.error("Onboard error:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
