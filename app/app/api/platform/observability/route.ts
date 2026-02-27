import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/sanity-users";
import { getMetricsSnapshot } from "@/lib/runtime-observability";

export async function GET() {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	return NextResponse.json({
		metrics: getMetricsSnapshot(),
	});
}
