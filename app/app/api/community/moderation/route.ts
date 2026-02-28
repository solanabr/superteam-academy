import { NextResponse } from "next/server";
import { listModerationQueue, resolveModerationItem } from "@/lib/community-moderation";
import { requireAdmin } from "@/lib/route-utils";

export async function GET(request: Request) {
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

	const { searchParams } = new URL(request.url);
	const status = searchParams.get("status");
	const normalizedStatus =
		status === "all" || status === "resolved" || status === "open" ? status : "open";

	return NextResponse.json({
		queue: listModerationQueue(normalizedStatus),
	});
}

export async function POST(request: Request) {
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

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
