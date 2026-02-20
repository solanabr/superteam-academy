import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { isUserAdmin, getAllUsers } from "@/lib/sanity-users";

export async function GET(request: NextRequest) {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const { searchParams } = request.nextUrl;
	const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
	const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);

	const users = await getAllUsers(limit, offset);
	return NextResponse.json({ users, limit, offset });
}
