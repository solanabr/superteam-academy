import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/route-utils";
import { getMetricsSnapshot } from "@/lib/runtime-observability";

export async function GET() {
	const auth = await requireAdmin();
	if (!auth.ok) return auth.response;

	return NextResponse.json({
		metrics: getMetricsSnapshot(),
	});
}
