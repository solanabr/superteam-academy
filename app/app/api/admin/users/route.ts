import { type NextRequest, NextResponse } from "next/server";
import { getAllUsers } from "@/lib/sanity-users";
import { requireAdmin } from "@/lib/route-utils";

export async function GET(request: NextRequest) {
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

	const { searchParams } = request.nextUrl;
	const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
	const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);

	const users = await getAllUsers(limit, offset);
	return NextResponse.json({ users, limit, offset });
}
