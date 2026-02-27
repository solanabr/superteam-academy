import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/sanity-users";
import { listModerationQueue, resolveModerationItem } from "@/lib/community-moderation";

export async function GET(request: Request) {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const { searchParams } = new URL(request.url);
	const status = searchParams.get("status");
	const normalizedStatus =
		status === "all" || status === "resolved" || status === "open" ? status : "open";

	return NextResponse.json({
		queue: listModerationQueue(normalizedStatus),
	});
}

export async function POST(request: Request) {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const body = (await request.json()) as {
		id?: string;
		resolution?: "approve" | "reject";
		note?: string;
	};

	if (!body.id || !body.resolution) {
		return NextResponse.json({ error: "Missing id or resolution" }, { status: 400 });
	}

	const resolved = resolveModerationItem({
		id: body.id,
		resolution: body.resolution,
		note: body.note,
	});

	if (!resolved) {
		return NextResponse.json({ error: "Moderation item not found" }, { status: 404 });
	}

	return NextResponse.json({ item: resolved });
}
