import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/route-utils";
import { unlinkLinkedAccount, type LinkedAccountProvider } from "@/lib/auth-linking-store";

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as { provider?: string };

		if (!body.provider || typeof body.provider !== "string") {
			return NextResponse.json({ error: "Missing or invalid provider" }, { status: 400 });
		}

		if (
			body.provider !== "wallet" &&
			body.provider !== "google" &&
			body.provider !== "github"
		) {
			return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
		}

		const auth = await requireSession();
		if (!auth.ok) return auth.response;

		const removed = await unlinkLinkedAccount({
			userId: auth.session.user.id,
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
