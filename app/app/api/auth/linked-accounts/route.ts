import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
	try {
		const cookieStore = await cookies();
		const raw = cookieStore.get("linked_accounts")?.value;
		const accounts: LinkedAccountEntry[] = raw ? (JSON.parse(raw) as LinkedAccountEntry[]) : [];

		return NextResponse.json({ accounts });
	} catch {
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

interface LinkedAccountEntry {
	provider: string;
	identifier: string;
	linkedAt: string;
}
