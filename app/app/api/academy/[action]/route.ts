import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";
const API_TOKEN = process.env.BACKEND_API_TOKEN ?? "";

const ALLOWED_ACTIONS = new Set([
    "create-course",
    "update-config",
    "update-course",
    "complete-lesson",
    "finalize-course",
    "issue-credential",
    "upgrade-credential",
    "register-minter",
    "revoke-minter",
    "reward-xp",
    "create-achievement-type",
    "award-achievement",
    "deactivate-achievement-type",
]);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ action: string }> }
) {
    const { action } = await params;

    if (!ALLOWED_ACTIONS.has(action)) {
        return NextResponse.json(
            { ok: false, error: `Unknown action: ${action}` },
            { status: 400 }
        );
    }

    if (!API_TOKEN) {
        return NextResponse.json(
            { ok: false, error: "Server misconfigured: missing API token" },
            { status: 500 }
        );
    }

    try {
        const body = await request.json().catch(() => ({}));

        const upstream = await fetch(
            `${BACKEND_URL.replace(/\/$/, "")}/academy/${action}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": API_TOKEN,
                },
                body: JSON.stringify(body),
            }
        );

        const data = await upstream.json().catch(() => ({}));

        if (!upstream.ok) {
            return NextResponse.json(
                { ok: false, error: data.error ?? upstream.statusText },
                { status: upstream.status }
            );
        }

        return NextResponse.json({ ok: true, data });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Internal server error";
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}
