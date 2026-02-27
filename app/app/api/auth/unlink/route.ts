import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { unlinkLinkedAccount, type LinkedAccountProvider } from "@/lib/auth-linking-store";

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as { provider?: string };

		if (!body.provider || typeof body.provider !== "string") {
			return NextResponse.json({ error: "Missing or invalid provider" }, { status: 400 });
		}

		if (body.provider !== "wallet" && body.provider !== "google" && body.provider !== "github") {
			return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
		}

		const requestHeaders = await headers();
		const session = await serverAuth.api.getSession({ headers: requestHeaders });
		if (!session) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const removed = await unlinkLinkedAccount({
			userId: session.user.id,
			provider: body.provider as LinkedAccountProvider,
		});

		if (!removed) {
			return NextResponse.json({ error: "Provider not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
