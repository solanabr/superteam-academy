import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as { provider?: string };

		if (!body.provider || typeof body.provider !== "string") {
			return NextResponse.json({ error: "Missing or invalid provider" }, { status: 400 });
		}

		const cookieStore = await cookies();
		const raw = cookieStore.get("linked_accounts")?.value;
		const accounts: LinkedAccountEntry[] = raw ? (JSON.parse(raw) as LinkedAccountEntry[]) : [];

		const filtered = accounts.filter((a) => a.provider !== body.provider);

		if (filtered.length === accounts.length) {
			return NextResponse.json({ error: "Provider not found" }, { status: 404 });
		}

		cookieStore.set("linked_accounts", JSON.stringify(filtered), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 30 * 24 * 60 * 60,
			path: "/",
		});

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

interface LinkedAccountEntry {
	provider: string;
	identifier: string;
	linkedAt: string;
}
