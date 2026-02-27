import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { getLinkedAccountsForUser } from "@/lib/auth-linking-store";

export async function GET() {
	try {
		const requestHeaders = await headers();
		const session = await serverAuth.api.getSession({ headers: requestHeaders });
		if (!session) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const accounts = await getLinkedAccountsForUser(session.user.id);

		return NextResponse.json({ accounts });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
