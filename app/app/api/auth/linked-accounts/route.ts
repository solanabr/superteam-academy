import { NextResponse } from "next/server";
import { requireSession } from "@/lib/route-utils";
import { getLinkedAccountsForUser } from "@/lib/auth-linking-store";

export async function GET() {
	try {
		const auth = await requireSession();
		if (!auth.ok) return auth.response;

		const accounts = await getLinkedAccountsForUser(auth.session.user.id);

		return NextResponse.json({ accounts });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
